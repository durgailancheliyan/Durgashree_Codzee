import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import type { Pool } from 'pg';
import { getPool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function practiceRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    address: row.address,
    email: row.email,
    phone: row.phone,
    website: row.website,
    logoUrl: row.logo_url,
  };
}

function emptyToNull(value: unknown): string | null {
  const s = String(value ?? '').trim();
  return s.length > 0 ? s : null;
}

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function asAsync(
  handler: (req: AuthedRequest, res: import('express').Response) => Promise<void>
) {
  return (req: AuthedRequest, res: import('express').Response, next: import('express').NextFunction) => {
    handler(req, res).catch((err) => {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Request failed';
      if (!res.headersSent) {
        res.status(500).json({ message });
      }
    });
  };
}

async function resolvePracticeId(
  pool: Pool,
  userId: string,
  bodyPracticeId?: unknown
): Promise<string> {
  const fromBody = emptyToNull(bodyPracticeId);
  if (fromBody && isValidUuid(fromBody)) {
    return fromBody;
  }
  const u = await pool.query(`SELECT practice_id FROM users WHERE id = $1`, [userId]);
  const practiceId = u.rows[0]?.practice_id as string | undefined;
  if (!practiceId) {
    throw new Error('Practice must be created first');
  }
  return practiceId;
}

async function normalizeUserRole(
  pool: Pool,
  practiceId: string,
  roleValue: unknown
): Promise<string> {
  const value = String(roleValue ?? '').trim();
  if (!value) return 'Staff';
  if (isValidUuid(value)) {
    const r = await pool.query(
      `SELECT id FROM practice_roles WHERE id = $1 AND practice_id = $2`,
      [value, practiceId]
    );
    if (r.rows.length === 0) {
      throw new Error('Invalid role selected');
    }
    return value;
  }
  return value;
}

router.get('/:userId/data', requireAuth, asAsync(async (req, res) => {
  const { userId } = req.params;
  const pool = getPool();
  const u = await pool.query(`SELECT practice_id FROM users WHERE id = $1`, [userId]);
  if (u.rows.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const pid = u.rows[0].practice_id;
  if (!pid) {
    res.json({
      practice: null,
      locations: [],
      additionalUsers: [],
      practiceRoles: [],
    });
    return;
  }

  const p = await pool.query(`SELECT * FROM practices WHERE id = $1`, [pid]);
  const loc = await pool.query(`SELECT * FROM locations WHERE practice_id = $1`, [pid]);
  const roles = await pool.query(
    `SELECT id, name, practice_id AS "practiceId" FROM practice_roles WHERE practice_id = $1`,
    [pid]
  );
  const users = await pool.query(
    `SELECT id, email, first_name AS "firstName", last_name AS "lastName", phone, role,
            location_id AS "locationId"
     FROM users WHERE practice_id = $1 AND id <> $2`,
    [pid, userId]
  );

  res.json({
    practice: p.rows[0] ? practiceRow(p.rows[0]) : null,
    locations: loc.rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      city: r.city,
      state: r.state,
      postalCode: r.postal_code,
      phone: r.phone,
      practiceId: r.practice_id,
    })),
    additionalUsers: users.rows,
    practiceRoles: roles.rows,
  });
}));

router.get('/:userId/status', requireAuth, asAsync(async (req, res) => {
  const pool = getPool();
  const r = await pool.query(`SELECT id, is_onboarded FROM users WHERE id = $1`, [req.params.userId]);
  if (r.rows.length === 0) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({
    isOnboarded: r.rows[0].is_onboarded,
    userId: r.rows[0].id,
  });
}));

router.post(
  '/practice/:userId',
  requireAuth,
  upload.single('logo'),
  asAsync(async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    if (req.params.userId !== userId) {
      res.status(403).json({ message: 'You can only update your own practice' });
      return;
    }

    const body = req.body ?? {};
    const pool = getPool();

    const existing = await pool.query(`SELECT practice_id FROM users WHERE id = $1`, [userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let existingPracticeId = existing.rows[0]?.practice_id as string | undefined;

    if (existingPracticeId) {
      const check = await pool.query(`SELECT id FROM practices WHERE id = $1`, [existingPracticeId]);
      if (check.rows.length === 0) {
        await pool.query(`UPDATE users SET practice_id = NULL WHERE id = $1`, [userId]);
        existingPracticeId = undefined;
      }
    }

    const logoUrl = req.file
      ? `data:image/png;base64,${req.file.buffer.toString('base64').slice(0, 120)}...`
      : null;

    const fields = [
      body.name ?? '',
      body.type ?? '',
      body.description ?? '',
      body.address ?? '',
      body.email ?? '',
      body.phone ?? '',
      body.website ?? '',
    ];

    if (existingPracticeId) {
      const r = await pool.query(
        `UPDATE practices SET
          name = $1, type = $2, description = $3, address = $4, email = $5, phone = $6, website = $7,
          logo_url = COALESCE($8, logo_url)
         WHERE id = $9
         RETURNING *`,
        [...fields, logoUrl, existingPracticeId]
      );
      res.status(200).json(practiceRow(r.rows[0]));
      return;
    }

    const id = randomUUID();
    const r = await pool.query(
      `INSERT INTO practices (id, owner_user_id, name, type, description, address, email, phone, website, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, userId, ...fields, logoUrl]
    );
    await pool.query(`UPDATE users SET practice_id = $1 WHERE id = $2`, [id, userId]);
    res.status(201).json(practiceRow(r.rows[0]));
  })
);

router.post('/location/:userId/bulk', requireAuth, asAsync(async (req, res) => {
  const { userId } = req.params;
  const items: unknown[] = Array.isArray(req.body) ? req.body : [];
  const pool = getPool();
  const practiceId = await resolvePracticeId(pool, userId);
  const saved = [];

  for (const raw of items) {
    const d = raw as Record<string, string>;
    const id =
      d.id && String(d.id).length > 10 && isValidUuid(String(d.id)) ? d.id : randomUUID();
    const r = await pool.query(
      `INSERT INTO locations (id, practice_id, name, address, city, state, postal_code, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         address = EXCLUDED.address,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         postal_code = EXCLUDED.postal_code,
         phone = EXCLUDED.phone
       RETURNING id, name, address, city, state, postal_code AS "postalCode", phone, practice_id AS "practiceId"`,
      [
        id,
        practiceId,
        d.name ?? '',
        d.address ?? '',
        d.city ?? '',
        d.state ?? '',
        d.postalCode ?? '',
        d.phone ?? '',
      ]
    );
    saved.push(r.rows[0]);
  }
  res.json(saved);
}));

router.post('/practicerole/bulk', requireAuth, asAsync(async (req: AuthedRequest, res) => {
  const items: unknown[] = Array.isArray(req.body) ? req.body : [];
  const pool = getPool();
  const first = items[0] as Record<string, string> | undefined;
  const practiceId = await resolvePracticeId(pool, req.userId!, first?.practiceId);
  const saved = [];

  for (const raw of items) {
    const d = raw as Record<string, string>;
    const id =
      d.id && String(d.id).length > 10 && isValidUuid(String(d.id)) ? d.id : randomUUID();
    const r = await pool.query(
      `INSERT INTO practice_roles (id, practice_id, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, practice_id AS "practiceId"`,
      [id, practiceId, d.name ?? '']
    );
    saved.push(r.rows[0]);
  }
  res.json(saved);
}));

router.post('/user/:userId/bulk', requireAuth, asAsync(async (req, res) => {
  const { userId } = req.params;
  const items: unknown[] = Array.isArray(req.body) ? req.body : [];
  const pool = getPool();
  const practiceId = await resolvePracticeId(pool, userId);
  const bcrypt = await import('bcryptjs');
  const saved = [];

  for (const raw of items) {
    const d = raw as Record<string, string>;
    const id =
      d.id && String(d.id).length > 10 && isValidUuid(String(d.id)) ? d.id : randomUUID();
    const password_hash = await bcrypt.hash('TempPass123!', 10);
    const email = String(d.email ?? '').toLowerCase().trim();
    const role = await normalizeUserRole(pool, practiceId, d.role);
    const locationId = emptyToNull(d.locationId);

    const r = await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_onboarded, practice_id, location_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
       ON CONFLICT (email) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         practice_id = EXCLUDED.practice_id,
         location_id = EXCLUDED.location_id
       RETURNING id, email, first_name AS "firstName", last_name AS "lastName", phone, role, location_id AS "locationId"`,
      [
        id,
        email,
        password_hash,
        d.firstName ?? '',
        d.lastName ?? '',
        d.phone ?? null,
        role,
        practiceId,
        locationId,
      ]
    );
    saved.push(r.rows[0]);
  }
  res.json(saved);
}));

router.post('/subscription', requireAuth, asAsync(async (req: AuthedRequest, res) => {
  const paymentId = String(req.body?.razorpay_payment_id ?? req.body?.paymentId ?? '').trim();
  if (!paymentId) {
    res.status(400).json({
      message: 'Payment required. Complete checkout via Razorpay before finishing onboarding.',
    });
    return;
  }
  const pool = getPool();
  const paid = await pool.query(
    `SELECT 1 FROM subscriptions WHERE razorpay_payment_id = $1 AND user_id = $2 AND payment_status = 'paid'`,
    [paymentId, req.userId]
  );
  if (paid.rows.length === 0) {
    res.status(400).json({ message: 'No verified payment found for this subscription' });
    return;
  }
  await pool.query(`UPDATE users SET is_onboarded = true WHERE id = $1`, [req.userId]);
  res.json({ ok: true });
}));

export default router;
