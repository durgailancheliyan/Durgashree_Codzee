import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
const router = Router();
const SYSTEM_ROLES = ['Admin', 'Doctor', 'Staff', 'Patient'];
function mapUserResponse(row) {
    return {
        id: row.id,
        email: row.email,
        firstName: row.first_name ?? '',
        lastName: row.last_name ?? '',
        phone: row.phone ?? undefined,
        role: row.role ?? undefined,
        locationId: row.location_id ?? undefined,
    };
}
async function getPracticeIdForUser(pool, userId) {
    const r = await pool.query(`SELECT practice_id FROM users WHERE id = $1`, [userId]);
    return r.rows[0]?.practice_id ?? null;
}
router.get('/:userId/role-options', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const pool = getPool();
    const practiceId = await getPracticeIdForUser(pool, userId);
    const system = SYSTEM_ROLES.map((name) => ({ id: name, name, kind: 'system' }));
    if (!practiceId) {
        res.json(system);
        return;
    }
    const r = await pool.query(`SELECT id::text AS id, name FROM practice_roles WHERE practice_id = $1 ORDER BY name`, [practiceId]);
    const practice = r.rows.map((row) => ({
        id: row.id,
        name: row.name,
        kind: 'practice',
    }));
    res.json([...system, ...practice]);
});
router.get('/:userId/roles', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const pool = getPool();
    const practiceId = await getPracticeIdForUser(pool, userId);
    if (!practiceId) {
        res.json([]);
        return;
    }
    const r = await pool.query(`SELECT id, name, practice_id AS "practiceId" FROM practice_roles WHERE practice_id = $1 ORDER BY name`, [practiceId]);
    res.json(r.rows);
});
router.get('/:userId/locations', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const pool = getPool();
    const practiceId = await getPracticeIdForUser(pool, userId);
    if (!practiceId) {
        res.json([]);
        return;
    }
    const r = await pool.query(`SELECT id, name, address, city, state, postal_code AS "postalCode", phone, practice_id AS "practiceId"
     FROM locations WHERE practice_id = $1 ORDER BY name`, [practiceId]);
    res.json(r.rows);
});
router.get('/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const pool = getPool();
    const practiceId = await getPracticeIdForUser(pool, userId);
    if (!practiceId) {
        res.json([]);
        return;
    }
    const r = await pool.query(`SELECT id, email, first_name, last_name, phone, role, location_id
     FROM users WHERE practice_id = $1 AND id <> $2 ORDER BY email`, [practiceId, userId]);
    res.json(r.rows.map(mapUserResponse));
});
router.post('/users', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const email = String(d.email ?? '').toLowerCase().trim();
    const password = String(d.password ?? 'TempPass123!');
    const firstName = String(d.firstName ?? '');
    const lastName = String(d.lastName ?? '');
    const role = String(d.role ?? 'Staff');
    const phone = String(d.phone ?? '');
    const locationId = d.locationId || null;
    if (!email || !firstName || !lastName) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }
    const pool = getPool();
    const practiceId = await getPracticeIdForUser(pool, req.userId);
    if (!practiceId) {
        res.status(400).json({ message: 'Complete practice onboarding before adding users' });
        return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const r = await pool.query(`INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_onboarded, practice_id, location_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
     RETURNING id, email, first_name, last_name, phone, role, location_id`, [id, email, password_hash, firstName, lastName, phone || null, role, practiceId, locationId]);
    res.status(201).json(mapUserResponse(r.rows[0]));
});
router.put('/update/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const d = req.body ?? {};
    const pool = getPool();
    const locId = d.locationId === '' ? null : d.locationId ?? null;
    const r = await pool.query(`UPDATE users SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone = COALESCE($3, phone),
      role = COALESCE($4, role),
      location_id = COALESCE($5, location_id)
     WHERE id = $6
     RETURNING id, email, first_name, last_name, phone, role, location_id`, [d.firstName ?? null, d.lastName ?? null, d.phone ?? null, d.role ?? null, locId, userId]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json(mapUserResponse(r.rows[0]));
});
router.delete('/users/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const pool = getPool();
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    res.status(204).send();
});
export default router;
