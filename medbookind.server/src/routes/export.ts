import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { getPracticeContext } from '../lib/practiceContext.js';
import { hasPermission, getPermissions, getAccessLevel } from '../lib/rbac.js';
import { APPOINTMENT_SELECT, mapAppointmentRow } from '../lib/appointmentMapper.js';

const router = Router();

function canExport(role: string | undefined): boolean {
  return hasPermission(role, 'export_all') || hasPermission(role, 'export_ops');
}

function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

router.get('/appointments', requireAuth, async (req: AuthedRequest, res) => {
  if (!canExport(req.userRole)) {
    res.status(403).json({ message: 'Export not allowed for your role' });
    return;
  }

  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.status(400).json({ message: 'Practice not configured' });
    return;
  }

  const { from, to, doctorId, patientSearch, format } = req.query as Record<string, string | undefined>;
  const conditions = ['a.practice_id = $1'];
  const params: unknown[] = [ctx.practiceId];
  let n = 2;

  if (req.userRole === 'Doctor') {
    conditions.push(`a.doctor_id = $${n++}`);
    params.push(req.userId);
  } else if (doctorId) {
    conditions.push(`a.doctor_id = $${n++}`);
    params.push(doctorId);
  }

  if (from) {
    conditions.push(`a.scheduled_at >= $${n++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`a.scheduled_at <= $${n++}`);
    params.push(to);
  }
  if (patientSearch?.trim()) {
    conditions.push(`(p.first_name ILIKE $${n} OR p.last_name ILIKE $${n} OR p.email ILIKE $${n})`);
    params.push(`%${patientSearch.trim()}%`);
    n++;
  }

  const pool = getPool();
  const rows = (
    await pool.query(
      `SELECT ${APPOINTMENT_SELECT}
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.scheduled_at DESC`,
      params
    )
  ).rows.map(mapAppointmentRow);

  if (format === 'csv') {
    const header = ['Date', 'Time', 'Patient', 'Doctor', 'Type', 'Status', 'Fee INR'];
    const lines = rows.map((r) =>
      [
        r.dateLabel,
        r.timeLabel,
        r.patientName,
        r.doctorName,
        r.appointmentType,
        r.status,
        (r.feePaise / 100).toFixed(2),
      ]
        .map(escapeCsv)
        .join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv');
    res.send([header.join(','), ...lines].join('\n'));
    return;
  }

  res.json({ rows, count: rows.length });
});

router.get('/patients', requireAuth, async (req: AuthedRequest, res) => {
  if (!canExport(req.userRole) && req.userRole !== 'Admin' && req.userRole !== 'Staff') {
    res.status(403).json({ message: 'Export not allowed' });
    return;
  }

  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.status(400).json({ message: 'Practice not configured' });
    return;
  }

  const { patientSearch, format } = req.query as Record<string, string | undefined>;
  const pool = getPool();
  let query = `SELECT u.email, u.first_name, u.last_name, u.phone, u.created_at,
                      pp.city, pp.state, pp.insurance_provider
               FROM users u
               LEFT JOIN patient_profiles pp ON pp.user_id = u.id
               WHERE u.practice_id = $1 AND u.role = 'Patient'`;
  const params: unknown[] = [ctx.practiceId];

  if (patientSearch?.trim()) {
    query += ` AND (u.first_name ILIKE $2 OR u.last_name ILIKE $2 OR u.email ILIKE $2)`;
    params.push(`%${patientSearch.trim()}%`);
  }
  query += ' ORDER BY u.last_name';

  const rows = (await pool.query(query, params)).rows;

  if (format === 'csv') {
    const header = ['First Name', 'Last Name', 'Email', 'Phone', 'City', 'Insurance'];
    const lines = rows.map((r) =>
      [r.first_name, r.last_name, r.email, r.phone, r.city, r.insurance_provider]
        .map(escapeCsv)
        .join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
    res.send([header.join(','), ...lines].join('\n'));
    return;
  }

  res.json(rows);
});

router.get('/billing-summary', requireAuth, async (req: AuthedRequest, res) => {
  if (!hasPermission(req.userRole, 'billing') && req.userRole !== 'Admin') {
    res.status(403).json({ message: 'Billing export requires Admin' });
    return;
  }

  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.status(400).json({ message: 'Practice not configured' });
    return;
  }

  const pool = getPool();
  const subs = await pool.query(
    `SELECT plan_name, payment_status, amount_paise, currency, created_at
     FROM subscriptions WHERE practice_id = $1 ORDER BY created_at DESC`,
    [ctx.practiceId]
  );

  const apptRev = await pool.query(
    `SELECT COALESCE(SUM(fee_paise), 0)::bigint AS total, COUNT(*)::int AS count
     FROM appointments WHERE practice_id = $1 AND status = 'completed'`,
    [ctx.practiceId]
  );

  const subscriptionTotal = subs.rows
    .filter((r) => r.payment_status === 'paid')
    .reduce((s, r) => s + Number(r.amount_paise ?? 0), 0);

  res.json({
    subscriptionRevenueInr: Math.round(subscriptionTotal / 100),
    appointmentRevenueInr: Math.round(Number(apptRev.rows[0]?.total ?? 0) / 100),
    totalRevenueInr: Math.round((subscriptionTotal + Number(apptRev.rows[0]?.total ?? 0)) / 100),
    paidSubscriptions: subs.rows.filter((r) => r.payment_status === 'paid').length,
    completedAppointments: apptRev.rows[0]?.count ?? 0,
    lineItems: subs.rows.map((r) => ({
      planName: r.plan_name,
      status: r.payment_status,
      amountInr: Math.round(Number(r.amount_paise ?? 0) / 100),
      date: r.created_at,
    })),
  });
});

router.get('/permissions', requireAuth, async (req: AuthedRequest, res) => {
  res.json({
    role: req.userRole,
    accessLevel: getAccessLevel(req.userRole),
    permissions: getPermissions(req.userRole),
  });
});

export default router;
