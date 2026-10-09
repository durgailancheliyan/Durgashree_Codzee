import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/:practiceId/getdata', requireAuth, async (req, res) => {
    const { practiceId } = req.params;
    const pool = getPool();
    const cats = await pool.query(`SELECT id, name, practice_id AS "practiceId" FROM tx_category WHERE practice_id = $1`, [
        practiceId,
    ]);
    const plans = await pool.query(`SELECT id, name, practice_id AS "practiceId", category_id AS "categoryId", description, fee, duration, active
     FROM tx_plan WHERE practice_id = $1`, [practiceId]);
    const addons = await pool.query(`SELECT id, name, practice_id AS "practiceId", fee, description, required, multiple FROM tx_addon WHERE practice_id = $1`, [practiceId]);
    res.json({
        txCategory: cats.rows,
        txPlans: plans.rows,
        txAddons: addons.rows,
    });
});
router.get('/addons/:practiceId', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT id, name, practice_id AS "practiceId", fee, description, required, multiple FROM tx_addon WHERE practice_id = $1`, [req.params.practiceId]);
    res.json(r.rows);
});
router.get('/addon/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT * FROM tx_addon WHERE id = $1`, [req.params.id]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    const row = r.rows[0];
    res.json({
        id: row.id,
        name: row.name,
        practiceId: row.practice_id,
        fee: Number(row.fee),
        description: row.description,
        required: row.required,
        multiple: row.multiple,
    });
});
router.post('/addon', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const id = d.id ?? randomUUID();
    const pool = getPool();
    const r = await pool.query(`INSERT INTO tx_addon (id, practice_id, name, fee, description, required, multiple)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [id, d.practiceId, d.name ?? '', d.fee ?? 0, d.description ?? '', d.required ?? false, d.multiple ?? false]);
    res.status(201).json({
        id: r.rows[0].id,
        name: r.rows[0].name,
        practiceId: r.rows[0].practice_id,
        fee: Number(r.rows[0].fee),
        description: r.rows[0].description,
        required: r.rows[0].required,
        multiple: r.rows[0].multiple,
    });
});
router.put('/addon', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const pool = getPool();
    const r = await pool.query(`UPDATE tx_addon SET name = $1, fee = $2, description = $3, required = $4, multiple = $5 WHERE id = $6 RETURNING *`, [d.name, d.fee, d.description, d.required, d.multiple, d.id]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    const row = r.rows[0];
    res.json({
        id: row.id,
        name: row.name,
        practiceId: row.practice_id,
        fee: Number(row.fee),
        description: row.description,
        required: row.required,
        multiple: row.multiple,
    });
});
router.delete('/addon/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    await pool.query(`DELETE FROM tx_addon WHERE id = $1`, [req.params.id]);
    res.json(true);
});
router.get('/categories/:practiceId', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT id, name, practice_id AS "practiceId" FROM tx_category WHERE practice_id = $1`, [
        req.params.practiceId,
    ]);
    res.json(r.rows);
});
router.get('/category/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT * FROM tx_category WHERE id = $1`, [req.params.id]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    const row = r.rows[0];
    res.json({ id: row.id, name: row.name, practiceId: row.practice_id });
});
router.post('/category', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const id = d.id ?? randomUUID();
    const pool = getPool();
    const r = await pool.query(`INSERT INTO tx_category (id, practice_id, name) VALUES ($1, $2, $3) RETURNING *`, [id, d.practiceId, d.name ?? '']);
    res.status(201).json({ id: r.rows[0].id, name: r.rows[0].name, practiceId: r.rows[0].practice_id });
});
router.put('/category', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const pool = getPool();
    const r = await pool.query(`UPDATE tx_category SET name = $1 WHERE id = $2 RETURNING *`, [d.name, d.id]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    res.json({ id: r.rows[0].id, name: r.rows[0].name, practiceId: r.rows[0].practice_id });
});
router.delete('/category/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    await pool.query(`DELETE FROM tx_plan WHERE category_id = $1`, [req.params.id]);
    await pool.query(`DELETE FROM tx_category WHERE id = $1`, [req.params.id]);
    res.json(true);
});
router.get('/plans/:practiceId', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT id, name, practice_id AS "practiceId", category_id AS "categoryId", description, fee, duration, active
     FROM tx_plan WHERE practice_id = $1`, [req.params.practiceId]);
    res.json(r.rows.map((row) => ({ ...row, fee: Number(row.fee) })));
});
router.get('/plan/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT * FROM tx_plan WHERE id = $1`, [req.params.id]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    const row = r.rows[0];
    res.json({
        id: row.id,
        name: row.name,
        practiceId: row.practice_id,
        categoryId: row.category_id,
        description: row.description,
        fee: Number(row.fee),
        duration: row.duration,
        active: row.active,
    });
});
router.post('/plan', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const id = d.id ?? randomUUID();
    const pool = getPool();
    const r = await pool.query(`INSERT INTO tx_plan (id, practice_id, category_id, name, description, fee, duration, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [
        id,
        d.practiceId,
        d.categoryId,
        d.name ?? '',
        d.description ?? '',
        d.fee ?? 0,
        d.duration ?? 0,
        d.active ?? true,
    ]);
    res.status(201).json({
        id: r.rows[0].id,
        name: r.rows[0].name,
        practiceId: r.rows[0].practice_id,
        categoryId: r.rows[0].category_id,
        description: r.rows[0].description,
        fee: Number(r.rows[0].fee),
        duration: r.rows[0].duration,
        active: r.rows[0].active,
    });
});
router.put('/plan', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const pool = getPool();
    const r = await pool.query(`UPDATE tx_plan SET name = $1, description = $2, fee = $3, duration = $4, active = $5, category_id = $6 WHERE id = $7 RETURNING *`, [d.name, d.description, d.fee, d.duration, d.active, d.categoryId, d.id]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    const row = r.rows[0];
    res.json({
        id: row.id,
        name: row.name,
        practiceId: row.practice_id,
        categoryId: row.category_id,
        description: row.description,
        fee: Number(row.fee),
        duration: row.duration,
        active: row.active,
    });
});
router.delete('/plan/:id', requireAuth, async (req, res) => {
    const pool = getPool();
    await pool.query(`DELETE FROM tx_plan WHERE id = $1`, [req.params.id]);
    res.json(true);
});
export default router;
