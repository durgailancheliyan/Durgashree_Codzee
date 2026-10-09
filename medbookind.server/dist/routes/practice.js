import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
const DEFAULT_HOURS = [
    { day: 1, label: 'Mon', open: '09:00', close: '18:00', closed: false },
    { day: 2, label: 'Tue', open: '09:00', close: '18:00', closed: false },
    { day: 3, label: 'Wed', open: '09:00', close: '18:00', closed: false },
    { day: 4, label: 'Thu', open: '09:00', close: '18:00', closed: false },
    { day: 5, label: 'Fri', open: '09:00', close: '18:00', closed: false },
    { day: 6, label: 'Sat', open: '09:00', close: '13:00', closed: false },
    { day: 0, label: 'Sun', open: '09:00', close: '13:00', closed: true },
];
function mapPractice(row) {
    const hours = row.business_hours;
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
        businessHours: Array.isArray(hours) && hours.length > 0 ? hours : DEFAULT_HOURS,
    };
}
function logoFromFile(file) {
    if (!file || !file.buffer?.length)
        return undefined;
    if (file.size > 2 * 1024 * 1024)
        return undefined;
    const mime = file.mimetype || 'image/png';
    return `data:${mime};base64,${file.buffer.toString('base64')}`;
}
router.get('/by-user/:userId', requireAuth, async (req, res) => {
    const pool = getPool();
    const u = await pool.query(`SELECT practice_id FROM users WHERE id = $1`, [req.params.userId]);
    const practiceId = u.rows[0]?.practice_id;
    if (!practiceId) {
        res.status(404).json({ message: 'Practice not found' });
        return;
    }
    const r = await pool.query(`SELECT * FROM practices WHERE id = $1`, [practiceId]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Practice not found' });
        return;
    }
    res.json(mapPractice(r.rows[0]));
});
router.get('/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT * FROM practices WHERE id = $1`, [req.params.id]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Practice not found' });
        return;
    }
    res.json(mapPractice(r.rows[0]));
});
router.get('/', requireAuth, async (_req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT * FROM practices ORDER BY created_at DESC`);
    res.json(r.rows.map(mapPractice));
});
router.post('/', requireAuth, upload.single('logo'), async (req, res) => {
    const id = randomUUID();
    const body = req.body ?? {};
    const logoUrl = logoFromFile(req.file) ?? null;
    let businessHours = DEFAULT_HOURS;
    if (body.businessHours) {
        try {
            businessHours = JSON.parse(body.businessHours);
        }
        catch {
            /* keep default */
        }
    }
    const pool = getPool();
    const r = await pool.query(`INSERT INTO practices (id, owner_user_id, name, type, description, address, email, phone, website, logo_url, business_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
     RETURNING *`, [
        id,
        req.userId ?? null,
        body.name ?? '',
        body.type ?? '',
        body.description ?? '',
        body.address ?? '',
        body.email ?? '',
        body.phone ?? '',
        body.website ?? '',
        logoUrl,
        JSON.stringify(businessHours),
    ]);
    res.status(201).json(mapPractice(r.rows[0]));
});
router.put('/:id', requireAuth, upload.single('logo'), async (req, res) => {
    const { id } = req.params;
    const body = req.body ?? {};
    const pool = getPool();
    const logoUrl = logoFromFile(req.file);
    let businessHours = null;
    if (body.businessHours) {
        try {
            businessHours = JSON.parse(body.businessHours);
        }
        catch {
            businessHours = null;
        }
    }
    const r = await pool.query(`UPDATE practices SET
      name = COALESCE($1, name),
      type = COALESCE($2, type),
      description = COALESCE($3, description),
      address = COALESCE($4, address),
      email = COALESCE($5, email),
      phone = COALESCE($6, phone),
      website = COALESCE($7, website),
      logo_url = COALESCE($8, logo_url),
      business_hours = COALESCE($9::jsonb, business_hours)
     WHERE id = $10
     RETURNING *`, [
        body.name ?? null,
        body.type ?? null,
        body.description ?? null,
        body.address ?? null,
        body.email ?? null,
        body.phone ?? null,
        body.website ?? null,
        logoUrl ?? null,
        businessHours ? JSON.stringify(businessHours) : null,
        id,
    ]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Practice not found' });
        return;
    }
    res.json(mapPractice(r.rows[0]));
});
router.delete('/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    await pool.query(`DELETE FROM practices WHERE id = $1`, [req.params.id]);
    res.status(204).send();
});
export default router;
