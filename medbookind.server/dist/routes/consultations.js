import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getPracticeContext } from '../lib/practiceContext.js';
import { APPOINTMENT_SELECT, mapAppointmentRow } from '../lib/appointmentMapper.js';
const router = Router();
function mapConsultation(row) {
    return {
        id: row.id,
        practiceId: row.practice_id,
        appointmentId: row.appointment_id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        status: row.status,
        chiefComplaint: row.chief_complaint,
        notes: row.notes,
        followUpAt: row.follow_up_at ? new Date(row.follow_up_at).toISOString() : null,
        followUpNotes: row.follow_up_notes,
        patientName: [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' '),
        doctorName: row.doctor_first_name
            ? `Dr. ${row.doctor_first_name} ${row.doctor_last_name ?? ''}`
            : null,
    };
}
router.get('/manager', requireAuth, async (req, res) => {
    const ctx = await getPracticeContext(req.userId);
    if (!ctx.practiceId) {
        res.json({ queue: [], appointments: [], consultations: [], locations: [], doctors: [] });
        return;
    }
    const pool = getPool();
    const practiceId = ctx.practiceId;
    const appts = (await pool.query(`SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.practice_id = $1
         AND a.scheduled_at::date >= CURRENT_DATE - INTERVAL '7 days'
         AND a.status NOT IN ('cancelled')
       ORDER BY a.scheduled_at DESC
       LIMIT 100`, [practiceId])).rows.map(mapAppointmentRow);
    const consults = (await pool.query(`SELECT c.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
              d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
       FROM consultations c
       JOIN users p ON p.id = c.patient_id
       LEFT JOIN users d ON d.id = c.doctor_id
       WHERE c.practice_id = $1
       ORDER BY c.updated_at DESC
       LIMIT 100`, [practiceId])).rows.map(mapConsultation);
    const consultByAppt = new Map(consults.filter((c) => c.appointmentId).map((c) => [c.appointmentId, c]));
    const queue = appts.filter((a) => ['scheduled', 'checked_in', 'in_progress'].includes(a.status) &&
        (!consultByAppt.get(a.id) || consultByAppt.get(a.id)?.status !== 'completed'));
    const locations = (await pool.query(`SELECT id, name, address, city, state, postal_code AS "postalCode", phone
       FROM locations WHERE practice_id = $1`, [practiceId])).rows;
    const doctors = (await pool.query(`SELECT id, first_name AS "firstName", last_name AS "lastName", email
       FROM users WHERE practice_id = $1 AND role = 'Doctor'`, [practiceId])).rows;
    const patients = (await pool.query(`SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
              pp.date_of_birth AS "dateOfBirth", pp.gender,
              pp.insurance_provider AS "insuranceProvider"
       FROM users u
       LEFT JOIN patient_profiles pp ON pp.user_id = u.id
       WHERE u.practice_id = $1 AND u.role = 'Patient'`, [practiceId])).rows;
    res.json({
        queue,
        appointments: appts,
        consultations: consults,
        locations,
        doctors,
        patients,
    });
});
router.post('/', requireAuth, async (req, res) => {
    const ctx = await getPracticeContext(req.userId);
    if (!ctx.practiceId) {
        res.status(400).json({ message: 'Practice not configured' });
        return;
    }
    const { appointmentId, patientId, doctorId, chiefComplaint } = req.body ?? {};
    if (!patientId && !appointmentId) {
        res.status(400).json({ message: 'patientId or appointmentId required' });
        return;
    }
    const pool = getPool();
    let pid = patientId;
    let did = doctorId;
    let aid = appointmentId ?? null;
    if (appointmentId) {
        const ap = await pool.query(`SELECT patient_id, doctor_id FROM appointments WHERE id = $1`, [
            appointmentId,
        ]);
        if (ap.rows.length === 0) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        pid = ap.rows[0].patient_id;
        did = did ?? ap.rows[0].doctor_id;
    }
    const existing = aid
        ? await pool.query(`SELECT id FROM consultations WHERE appointment_id = $1`, [aid])
        : { rows: [] };
    if (existing.rows.length > 0) {
        const c = (await pool.query(`SELECT c.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
         FROM consultations c
         JOIN users p ON p.id = c.patient_id
         LEFT JOIN users d ON d.id = c.doctor_id
         WHERE c.id = $1`, [existing.rows[0].id])).rows[0];
        res.json(mapConsultation(c));
        return;
    }
    const id = randomUUID();
    await pool.query(`INSERT INTO consultations (id, practice_id, appointment_id, patient_id, doctor_id, status, chief_complaint)
     VALUES ($1, $2, $3, $4, $5, 'queued', $6)`, [id, ctx.practiceId, aid, pid, did ?? null, chiefComplaint ?? null]);
    const row = (await pool.query(`SELECT c.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
              d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
       FROM consultations c
       JOIN users p ON p.id = c.patient_id
       LEFT JOIN users d ON d.id = c.doctor_id
       WHERE c.id = $1`, [id])).rows[0];
    res.status(201).json(mapConsultation(row));
});
router.patch('/:id', requireAuth, async (req, res) => {
    const ctx = await getPracticeContext(req.userId);
    const d = req.body ?? {};
    const pool = getPool();
    const r = await pool.query(`UPDATE consultations SET
      status = COALESCE($1, status),
      notes = COALESCE($2, notes),
      chief_complaint = COALESCE($3, chief_complaint),
      follow_up_at = COALESCE($4, follow_up_at),
      follow_up_notes = COALESCE($5, follow_up_notes),
      updated_at = NOW()
     WHERE id = $6 AND practice_id = $7
     RETURNING id`, [
        d.status ?? null,
        d.notes ?? null,
        d.chiefComplaint ?? null,
        d.followUpAt ?? null,
        d.followUpNotes ?? null,
        req.params.id,
        ctx.practiceId,
    ]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Consultation not found' });
        return;
    }
    if (d.status === 'completed' && d.appointmentId) {
        await pool.query(`UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE id = $1`, [d.appointmentId]);
    }
    const row = (await pool.query(`SELECT c.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
              d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
       FROM consultations c
       JOIN users p ON p.id = c.patient_id
       LEFT JOIN users d ON d.id = c.doctor_id
       WHERE c.id = $1`, [req.params.id])).rows[0];
    res.json(mapConsultation(row));
});
export default router;
