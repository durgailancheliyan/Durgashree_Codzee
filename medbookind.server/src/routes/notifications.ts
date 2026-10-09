import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { getPracticeContext } from '../lib/practiceContext.js';
import { hasPermission } from '../lib/rbac.js';

const router = Router();

async function syncAppointmentReminders(practiceId: string, userId: string) {
  const pool = getPool();
  const upcoming = await pool.query(
    `SELECT a.id, a.scheduled_at, p.first_name, p.last_name
     FROM appointments a
     JOIN users p ON p.id = a.patient_id
     WHERE a.practice_id = $1
       AND a.scheduled_at > NOW()
       AND a.scheduled_at < NOW() + INTERVAL '48 hours'
       AND a.status NOT IN ('cancelled', 'completed')`,
    [practiceId]
  );

  for (const row of upcoming.rows) {
    const title = `Appointment reminder: ${row.first_name} ${row.last_name}`;
    const exists = await pool.query(
      `SELECT 1 FROM notifications
       WHERE practice_id = $1 AND type = 'reminder' AND title = $2
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [practiceId, title]
    );
    if (exists.rows.length > 0) continue;

    await pool.query(
      `INSERT INTO notifications (practice_id, user_id, type, title, body, link_path)
       VALUES ($1, NULL, 'reminder', $2, $3, '/admin/consult-manager')`,
      [
        practiceId,
        title,
        `Scheduled at ${new Date(row.scheduled_at as string).toLocaleString('en-IN')}`,
      ]
    );
  }

  const unreadAlerts = await pool.query(
    `SELECT COUNT(*)::int AS c FROM appointments
     WHERE practice_id = $1 AND status = 'checked_in'`,
    [practiceId]
  );
  if ((unreadAlerts.rows[0]?.c ?? 0) > 0) {
    const alertTitle = `${unreadAlerts.rows[0].c} patient(s) in queue`;
    const dup = await pool.query(
      `SELECT 1 FROM notifications WHERE practice_id = $1 AND type = 'alert' AND title = $2
       AND created_at > NOW() - INTERVAL '2 hours'`,
      [practiceId, alertTitle]
    );
    if (dup.rows.length === 0) {
      await pool.query(
        `INSERT INTO notifications (practice_id, type, title, body, link_path)
         VALUES ($1, 'alert', $2, 'Patients waiting for consultation', '/admin/consult-manager')`,
        [practiceId, alertTitle]
      );
    }
  }
}

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.json([]);
    return;
  }

  await syncAppointmentReminders(ctx.practiceId, req.userId!);

  const pool = getPool();
  const rows = (
    await pool.query(
      `SELECT id, type, title, body, link_path AS "linkPath", read_at AS "readAt",
              created_at AS "createdAt"
       FROM notifications
       WHERE practice_id = $1 AND (user_id IS NULL OR user_id = $2)
       ORDER BY created_at DESC
       LIMIT 50`,
      [ctx.practiceId, req.userId]
    )
  ).rows;

  res.json(rows);
});

router.patch('/read-all', requireAuth, async (req: AuthedRequest, res) => {
  const ctx = await getPracticeContext(req.userId!);
  const pool = getPool();
  await pool.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE practice_id = $1 AND (user_id IS NULL OR user_id = $2) AND read_at IS NULL`,
    [ctx.practiceId, req.userId]
  );
  res.json({ ok: true });
});

router.patch('/:id/read', requireAuth, async (req: AuthedRequest, res) => {
  const ctx = await getPracticeContext(req.userId!);
  const pool = getPool();
  await pool.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1 AND practice_id = $2`,
    [req.params.id, ctx.practiceId]
  );
  res.json({ ok: true });
});

router.post('/announcement', requireAuth, async (req: AuthedRequest, res) => {
  if (!hasPermission(req.userRole, 'announcements') && req.userRole !== 'Admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  const ctx = await getPracticeContext(req.userId!);
  if (!ctx.practiceId) {
    res.status(400).json({ message: 'Practice not configured' });
    return;
  }

  const { title, body } = req.body ?? {};
  if (!title?.trim()) {
    res.status(400).json({ message: 'Title required' });
    return;
  }

  const pool = getPool();
  const id = randomUUID();
  await pool.query(
    `INSERT INTO notifications (id, practice_id, user_id, type, title, body, link_path)
     VALUES ($1, $2, NULL, 'announcement', $3, $4, NULL)`,
    [id, ctx.practiceId, title.trim(), body ?? '']
  );

  res.status(201).json({ id, title, type: 'announcement' });
});

export default router;
