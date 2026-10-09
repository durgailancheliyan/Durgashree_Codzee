import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/dashboard', requireAuth, async (req, res) => {
    if (req.userRole !== 'Admin') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }
    const pool = getPool();
    const practiceId = (await pool.query(`SELECT practice_id FROM users WHERE id = $1`, [req.userId])).rows[0]?.practice_id;
    const usersQuery = practiceId
        ? `SELECT role, COUNT(*)::int AS count FROM users WHERE practice_id = $1 GROUP BY role`
        : `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`;
    const usersAll = await pool.query(usersQuery, practiceId ? [practiceId] : []);
    const roleCounts = {};
    for (const row of usersAll.rows) {
        roleCounts[row.role] = row.count;
    }
    const patients = roleCounts.Patient ?? 0;
    const doctors = roleCounts.Doctor ?? 0;
    const staff = roleCounts.Staff ?? 0;
    const admins = roleCounts.Admin ?? 0;
    const totalUsers = Object.values(roleCounts).reduce((a, b) => a + b, 0);
    let revenuePaise = 0;
    let appointmentCount = 0;
    let todayAppointments = 0;
    if (practiceId) {
        const rev = await pool.query(`SELECT COALESCE(SUM(amount_paise), 0)::bigint AS total
       FROM subscriptions WHERE practice_id = $1 AND payment_status = 'paid'`, [practiceId]);
        revenuePaise = Number(rev.rows[0]?.total ?? 0);
        const apptRev = await pool.query(`SELECT COALESCE(SUM(fee_paise), 0)::bigint AS total
       FROM appointments WHERE practice_id = $1 AND status = 'completed'`, [practiceId]);
        revenuePaise += Number(apptRev.rows[0]?.total ?? 0);
        const appts = await pool.query(`SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE scheduled_at::date = CURRENT_DATE)::int AS today
       FROM appointments WHERE practice_id = $1 AND status NOT IN ('cancelled')`, [practiceId]);
        appointmentCount = appts.rows[0]?.total ?? 0;
        todayAppointments = appts.rows[0]?.today ?? 0;
    }
    const locations = practiceId
        ? (await pool.query(`SELECT COUNT(*)::int AS c FROM locations WHERE practice_id = $1`, [practiceId]))
            .rows[0]?.c ?? 0
        : 0;
    const practice = practiceId
        ? (await pool.query(`SELECT name, type FROM practices WHERE id = $1`, [practiceId])).rows[0]
        : null;
    const recentUsers = practiceId
        ? (await pool.query(`SELECT id, email, first_name AS "firstName", last_name AS "lastName", role, is_onboarded AS "isOnboarded"
           FROM users WHERE practice_id = $1 ORDER BY email LIMIT 8`, [practiceId])).rows
        : (await pool.query(`SELECT id, email, first_name AS "firstName", last_name AS "lastName", role, is_onboarded AS "isOnboarded"
           FROM users ORDER BY email LIMIT 8`)).rows;
    res.json({
        kpis: {
            patients,
            appointments: appointmentCount,
            appointmentsToday: todayAppointments,
            revenueInr: Math.round(revenuePaise / 100),
            locations,
            totalUsers,
        },
        systemOverview: {
            practiceName: practice?.name ?? 'Not configured',
            practiceType: practice?.type ?? '—',
            practiceConfigured: !!practiceId,
            roles: { Admin: admins, Doctor: doctors, Staff: staff, Patient: patients },
        },
        userManagement: {
            total: totalUsers,
            byRole: roleCounts,
            recent: recentUsers,
        },
        reports: [
            { id: 'billing', title: 'Reports & export', path: '/admin/reports', description: 'CSV, PDF, billing summaries' },
            { id: 'users', title: 'User management', path: '/admin/settings', description: 'Practice users and roles' },
            { id: 'appointments', title: 'Appointments', path: '/admin/appointments', description: 'Schedule overview' },
            { id: 'departments', title: 'Departments', path: '/admin/departments', description: 'Department performance' },
        ],
    });
});
export default router;
