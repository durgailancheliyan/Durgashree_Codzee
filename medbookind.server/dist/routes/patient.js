import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { APPOINTMENT_SELECT, mapAppointmentRow } from '../lib/appointmentMapper.js';
import { getPracticeContext } from '../lib/practiceContext.js';
const router = Router();
function profileCompletion(user) {
    let score = 0;
    if (user.first_name?.trim())
        score += 20;
    if (user.last_name?.trim())
        score += 20;
    if (user.email?.trim())
        score += 15;
    if (user.phone?.trim())
        score += 15;
    if (user.email_verified)
        score += 15;
    if (user.phone_verified)
        score += 15;
    return Math.min(100, score);
}
router.get('/dashboard', requireAuth, async (req, res) => {
    if (req.userRole !== 'Patient') {
        res.status(403).json({ message: 'Patient access required' });
        return;
    }
    const pool = getPool();
    const patientId = req.userId;
    const userRow = (await pool.query(`SELECT id, email, first_name, last_name, phone, email_verified, phone_verified, practice_id
       FROM users WHERE id = $1`, [patientId])).rows[0];
    const upcoming = (await pool.query(`SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.patient_id = $1 AND a.scheduled_at >= NOW()
         AND a.status NOT IN ('cancelled', 'completed')
       ORDER BY a.scheduled_at ASC
       LIMIT 10`, [patientId])).rows;
    const history = (await pool.query(`SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.patient_id = $1
         AND (a.scheduled_at < NOW() OR a.status = 'completed')
       ORDER BY a.scheduled_at DESC
       LIMIT 10`, [patientId])).rows;
    const medicalProgress = (await pool.query(`SELECT tr.id, tr.title, tr.description, tr.record_type AS "recordType",
              tr.recorded_at AS "recordedAt",
              d.first_name AS "doctorFirstName", d.last_name AS "doctorLastName"
       FROM treatment_records tr
       LEFT JOIN users d ON d.id = tr.doctor_id
       WHERE tr.patient_id = $1
       ORDER BY tr.recorded_at DESC
       LIMIT 10`, [patientId])).rows;
    res.json({
        profile: {
            id: userRow?.id,
            email: userRow?.email,
            firstName: userRow?.first_name,
            lastName: userRow?.last_name,
            phone: userRow?.phone,
            emailVerified: userRow?.email_verified ?? false,
            phoneVerified: userRow?.phone_verified ?? false,
            completionPercent: userRow ? profileCompletion(userRow) : 0,
        },
        kpis: {
            upcomingCount: upcoming.length,
            historyCount: history.length,
            recordsCount: medicalProgress.length,
            profileCompletion: userRow ? profileCompletion(userRow) : 0,
        },
        upcomingBookings: upcoming.map(mapAppointmentRow),
        appointmentHistory: history.map(mapAppointmentRow),
        medicalProgress,
        links: {
            bookAppointment: '/patient/book-appointment',
            profile: '/patient/patient-profile',
            settings: '/patient/settings',
        },
    });
});
router.post('/book-appointment', requireAuth, async (req, res) => {
    if (req.userRole !== 'Patient') {
        res.status(403).json({ message: 'Patient access required' });
        return;
    }
    const ctx = await getPracticeContext(req.userId);
    if (!ctx.practiceId) {
        res.status(400).json({ message: 'Not linked to a practice. Contact your clinic.' });
        return;
    }
    const { scheduledAt, appointmentType, doctorId } = req.body;
    if (!scheduledAt) {
        res.status(400).json({ message: 'scheduledAt is required' });
        return;
    }
    const pool = getPool();
    const row = (await pool.query(`INSERT INTO appointments (
        practice_id, patient_id, doctor_id, scheduled_at, appointment_type, status
      ) VALUES ($1, $2, $3, $4, $5, 'scheduled')
      RETURNING id`, [ctx.practiceId, req.userId, doctorId ?? null, scheduledAt, appointmentType ?? 'Consultation'])).rows[0];
    const full = (await pool.query(`SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.id = $1`, [row.id])).rows[0];
    res.status(201).json(mapAppointmentRow(full));
});
export default router;
