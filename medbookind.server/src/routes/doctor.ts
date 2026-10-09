import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { APPOINTMENT_SELECT, mapAppointmentRow } from '../lib/appointmentMapper.js';
import { getPracticeContext } from '../lib/practiceContext.js';

const router = Router();

router.get('/dashboard', requireAuth, async (req: AuthedRequest, res) => {
  if (req.userRole !== 'Doctor') {
    res.status(403).json({ message: 'Doctor access required' });
    return;
  }

  const pool = getPool();
  const ctx = await getPracticeContext(req.userId!);
  const doctorId = req.userId!;

  const todayRows = ctx.practiceId
    ? (
        await pool.query(
          `SELECT ${APPOINTMENT_SELECT}
           FROM appointments a
           JOIN users p ON p.id = a.patient_id
           LEFT JOIN users d ON d.id = a.doctor_id
           WHERE a.practice_id = $1 AND a.doctor_id = $2
             AND a.scheduled_at::date = CURRENT_DATE
             AND a.status NOT IN ('cancelled')
           ORDER BY a.scheduled_at ASC`,
          [ctx.practiceId, doctorId]
        )
      ).rows
    : [];

  const queueRows = ctx.practiceId
    ? (
        await pool.query(
          `SELECT ${APPOINTMENT_SELECT}
           FROM appointments a
           JOIN users p ON p.id = a.patient_id
           LEFT JOIN users d ON d.id = a.doctor_id
           WHERE a.practice_id = $1 AND a.doctor_id = $2
             AND a.status IN ('checked_in', 'in_progress')
           ORDER BY a.scheduled_at ASC`,
          [ctx.practiceId, doctorId]
        )
      ).rows
    : [];

  const weekRows = ctx.practiceId
    ? (
        await pool.query(
          `SELECT ${APPOINTMENT_SELECT}
           FROM appointments a
           JOIN users p ON p.id = a.patient_id
           LEFT JOIN users d ON d.id = a.doctor_id
           WHERE a.practice_id = $1 AND a.doctor_id = $2
             AND a.scheduled_at >= CURRENT_DATE
             AND a.scheduled_at < CURRENT_DATE + INTERVAL '7 days'
             AND a.status NOT IN ('cancelled')
           ORDER BY a.scheduled_at ASC`,
          [ctx.practiceId, doctorId]
        )
      ).rows
    : [];

  const treatmentHistory = ctx.practiceId
    ? (
        await pool.query(
          `SELECT tr.id, tr.title, tr.description, tr.record_type AS "recordType",
                  tr.recorded_at AS "recordedAt",
                  p.first_name AS "patientFirstName", p.last_name AS "patientLastName"
           FROM treatment_records tr
           JOIN users p ON p.id = tr.patient_id
           WHERE tr.practice_id = $1 AND (tr.doctor_id = $2 OR tr.doctor_id IS NULL)
           ORDER BY tr.recorded_at DESC
           LIMIT 12`,
          [ctx.practiceId, doctorId]
        )
      ).rows
    : [];

  const weekConsults = ctx.practiceId
    ? (
        await pool.query(
          `SELECT COUNT(*)::int AS c FROM appointments
           WHERE practice_id = $1 AND doctor_id = $2
             AND scheduled_at >= date_trunc('week', CURRENT_DATE)
             AND status IN ('completed', 'checked_in', 'in_progress', 'scheduled')`,
          [ctx.practiceId, doctorId]
        )
      ).rows[0]?.c ?? 0
    : 0;

  const totalPatients = ctx.practiceId
    ? (
        await pool.query(
          `SELECT COUNT(DISTINCT patient_id)::int AS c FROM appointments
           WHERE practice_id = $1 AND doctor_id = $2`,
          [ctx.practiceId, doctorId]
        )
      ).rows[0]?.c ?? 0
    : 0;

  res.json({
    kpis: {
      todayAppointments: todayRows.length,
      queueCount: queueRows.length,
      weekConsultations: weekConsults,
      totalPatients,
      pendingNotes: treatmentHistory.filter((r) => r.recordType === 'note').length,
    },
    todayAppointments: todayRows.map(mapAppointmentRow),
    patientQueue: queueRows.map(mapAppointmentRow),
    scheduleView: weekRows.map(mapAppointmentRow),
    treatmentHistory,
    links: {
      schedule: '/doctor/doctor-schedule',
      patients: '/doctor/patients',
    },
  });
});

export default router;
