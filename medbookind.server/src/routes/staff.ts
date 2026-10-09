import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { APPOINTMENT_SELECT, mapAppointmentRow } from '../lib/appointmentMapper.js';
import { getPracticeContext } from '../lib/practiceContext.js';

const router = Router();

router.get('/dashboard', requireAuth, async (req: AuthedRequest, res) => {
  if (req.userRole !== 'Staff' && req.userRole !== 'Admin') {
    res.status(403).json({ message: 'Staff access required' });
    return;
  }

  const pool = getPool();
  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.json({
      kpis: { todayAppointments: 0, checkedIn: 0, newPatientsWeek: 0, pendingScheduled: 0 },
      todayAppointments: [],
      patients: [],
      reports: [],
    });
    return;
  }

  const practiceId = ctx.practiceId;

  const todayRows = (
    await pool.query(
      `SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.practice_id = $1 AND a.scheduled_at::date = CURRENT_DATE
         AND a.status NOT IN ('cancelled')
       ORDER BY a.scheduled_at ASC`,
      [practiceId]
    )
  ).rows;

  const checkedIn = todayRows.filter((r) => r.status === 'checked_in' || r.status === 'in_progress').length;
  const pendingScheduled = todayRows.filter((r) => r.status === 'scheduled').length;

  const newPatientsWeek = (
    await pool.query(
      `SELECT COUNT(*)::int AS c FROM users
       WHERE practice_id = $1 AND role = 'Patient'
         AND created_at >= date_trunc('week', CURRENT_DATE)`,
      [practiceId]
    )
  ).rows[0]?.c ?? 0;

  const patients = (
    await pool.query(
      `SELECT id, email, first_name AS "firstName", last_name AS "lastName", phone
       FROM users WHERE practice_id = $1 AND role = 'Patient'
       ORDER BY first_name, last_name LIMIT 20`,
      [practiceId]
    )
  ).rows;

  const doctors = (
    await pool.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", email
       FROM users WHERE practice_id = $1 AND role = 'Doctor'`,
      [practiceId]
    )
  ).rows;

  res.json({
    kpis: {
      todayAppointments: todayRows.length,
      checkedIn,
      newPatientsWeek,
      pendingScheduled,
    },
    todayAppointments: todayRows.map(mapAppointmentRow),
    patients,
    doctors,
    reports: [
      { id: 'appointments', title: 'Appointments', path: '/staff/appointments', description: 'Full schedule' },
      { id: 'consult', title: 'Consult manager', path: '/staff/consult-manager', description: 'Active consultations' },
      { id: 'settings', title: 'Settings', path: '/staff/settings', description: 'Practice settings' },
    ],
    links: {
      appointments: '/staff/appointments',
      consultManager: '/staff/consult-manager',
      settings: '/staff/settings',
    },
  });
});

export default router;
