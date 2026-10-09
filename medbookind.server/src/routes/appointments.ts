import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { APPOINTMENT_SELECT, mapAppointmentRow } from '../lib/appointmentMapper.js';
import { getPracticeContext } from '../lib/practiceContext.js';

const router = Router();
const STAFF_ROLES = new Set(['Admin', 'Staff', 'Doctor']);

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.json([]);
    return;
  }

  const pool = getPool();
  const { from, to, status, scope } = req.query as Record<string, string | undefined>;
  const conditions = ['a.practice_id = $1'];
  const params: unknown[] = [ctx.practiceId];
  let n = 2;

  if (req.userRole === 'Doctor') {
    conditions.push(`a.doctor_id = $${n++}`);
    params.push(req.userId);
  } else if (req.userRole === 'Patient') {
    conditions.push(`a.patient_id = $${n++}`);
    params.push(req.userId);
  }

  if (from) {
    conditions.push(`a.scheduled_at >= $${n++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`a.scheduled_at < $${n++}`);
    params.push(to);
  }
  if (status) {
    conditions.push(`a.status = $${n++}`);
    params.push(status);
  }
  if (scope === 'today') {
    conditions.push(`a.scheduled_at::date = CURRENT_DATE`);
  }

  const rows = (
    await pool.query(
      `SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.scheduled_at ASC
       LIMIT 100`,
      params
    )
  ).rows;

  res.json(rows.map(mapAppointmentRow));
});

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  if (!STAFF_ROLES.has(req.userRole ?? '')) {
    res.status(403).json({ message: 'Not allowed' });
    return;
  }
  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.status(400).json({ message: 'Practice not configured' });
    return;
  }

  const { patientId, doctorId, scheduledAt, appointmentType, durationMinutes, notes, feePaise } =
    req.body as Record<string, unknown>;

  if (!patientId || !scheduledAt) {
    res.status(400).json({ message: 'patientId and scheduledAt are required' });
    return;
  }

  const pool = getPool();
  const patient = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND practice_id = $2 AND role = 'Patient'`,
    [patientId, ctx.practiceId]
  );
  if (patient.rows.length === 0) {
    res.status(400).json({ message: 'Invalid patient' });
    return;
  }

  const row = (
    await pool.query(
      `INSERT INTO appointments (
        practice_id, patient_id, doctor_id, location_id, scheduled_at,
        duration_minutes, appointment_type, notes, fee_paise
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        ctx.practiceId,
        patientId,
        doctorId ?? null,
        ctx.locationId,
        scheduledAt,
        durationMinutes ?? 30,
        appointmentType ?? 'Consultation',
        notes ?? null,
        feePaise ?? 0,
      ]
    )
  ).rows[0];

  const full = (
    await pool.query(
      `SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.id = $1`,
      [row.id]
    )
  ).rows[0];

  res.status(201).json(mapAppointmentRow(full));
});

router.patch('/:id/status', requireAuth, async (req: AuthedRequest, res) => {
  if (!STAFF_ROLES.has(req.userRole ?? '')) {
    res.status(403).json({ message: 'Not allowed' });
    return;
  }
  const ctx = await getPracticeContext(req.userId!);
  const { status } = req.body as { status?: string };
  const allowed = ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ message: 'Invalid status' });
    return;
  }

  const pool = getPool();
  const updated = (
    await pool.query(
      `UPDATE appointments SET status = $1, updated_at = NOW()
       WHERE id = $2 AND practice_id = $3
       RETURNING id`,
      [status, req.params.id, ctx.practiceId]
    )
  ).rows[0];

  if (!updated) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  const full = (
    await pool.query(
      `SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.id = $1`,
      [req.params.id]
    )
  ).rows[0];

  res.json(mapAppointmentRow(full));
});

export default router;
