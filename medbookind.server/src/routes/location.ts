import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';

const router = Router();

function mapLoc(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    phone: row.phone,
    practiceId: row.practice_id,
    addressConfig: row.address_config ?? {},
  };
}

router.get('/by-user/:userId', requireAuth, async (req, res) => {
  const pool = getPool();
  const u = await pool.query(`SELECT practice_id FROM users WHERE id = $1`, [req.params.userId]);
  if (u.rows.length === 0 || !u.rows[0].practice_id) {
    res.json([]);
    return;
  }
  const r = await pool.query(`SELECT * FROM locations WHERE practice_id = $1`, [u.rows[0].practice_id]);
  res.json(r.rows.map(mapLoc));
});

router.get('/:id', requireAuth, async (req, res) => {
  const pool = getPool();
  const r = await pool.query(`SELECT * FROM locations WHERE id = $1`, [req.params.id]);
  if (r.rows.length === 0) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  res.json(mapLoc(r.rows[0]));
});

router.get('/', requireAuth, async (_req, res) => {
  const pool = getPool();
  const r = await pool.query(`SELECT * FROM locations ORDER BY created_at DESC`);
  res.json(r.rows.map(mapLoc));
});

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const d = req.body ?? {};
  const id = randomUUID();
  const pool = getPool();
  const r = await pool.query(
    `INSERT INTO locations (id, practice_id, name, address, city, state, postal_code, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      id,
      d.practiceId,
      d.name ?? '',
      d.address ?? '',
      d.city ?? '',
      d.state ?? '',
      d.postalCode ?? '',
      d.phone ?? '',
    ]
  );
  res.status(201).json(mapLoc(r.rows[0]));
});

router.put('/:id', requireAuth, async (req, res) => {
  const d = req.body ?? {};
  const pool = getPool();
  const r = await pool.query(
    `UPDATE locations SET
      name = COALESCE($1, name),
      address = COALESCE($2, address),
      city = COALESCE($3, city),
      state = COALESCE($4, state),
      postal_code = COALESCE($5, postal_code),
      phone = COALESCE($6, phone),
      practice_id = COALESCE($7, practice_id),
      address_config = COALESCE($8::jsonb, address_config)
     WHERE id = $9
     RETURNING *`,
    [
      d.name ?? null,
      d.address ?? null,
      d.city ?? null,
      d.state ?? null,
      d.postalCode ?? null,
      d.phone ?? null,
      d.practiceId ?? null,
      d.addressConfig ? JSON.stringify(d.addressConfig) : null,
      req.params.id,
    ]
  );
  if (r.rows.length === 0) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  res.json(mapLoc(r.rows[0]));
});

router.get('/:id/staff', requireAuth, async (req, res) => {
  const pool = getPool();
  const loc = await pool.query(`SELECT practice_id FROM locations WHERE id = $1`, [req.params.id]);
  if (loc.rows.length === 0) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const staff = await pool.query(
    `SELECT id, first_name AS "firstName", last_name AS "lastName", email, role, location_id AS "locationId"
     FROM users WHERE practice_id = $1 AND role IN ('Staff', 'Doctor', 'Admin')
     ORDER BY first_name`,
    [loc.rows[0].practice_id]
  );
  res.json(staff.rows);
});

router.put('/:id/staff', requireAuth, async (req, res) => {
  const { userIds } = req.body as { userIds?: string[] };
  if (!Array.isArray(userIds)) {
    res.status(400).json({ message: 'userIds array required' });
    return;
  }
  const pool = getPool();
  const loc = await pool.query(`SELECT practice_id FROM locations WHERE id = $1`, [req.params.id]);
  if (loc.rows.length === 0) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  const practiceId = loc.rows[0].practice_id;
  await pool.query(
    `UPDATE users SET location_id = NULL WHERE practice_id = $1 AND location_id = $2`,
    [practiceId, req.params.id]
  );
  for (const uid of userIds) {
    await pool.query(
      `UPDATE users SET location_id = $1 WHERE id = $2 AND practice_id = $3`,
      [req.params.id, uid, practiceId]
    );
  }
  res.json({ message: 'Staff mapping updated', locationId: req.params.id, userIds });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const pool = getPool();
  await pool.query(`DELETE FROM locations WHERE id = $1`, [req.params.id]);
  res.status(204).send();
});

export default router;
