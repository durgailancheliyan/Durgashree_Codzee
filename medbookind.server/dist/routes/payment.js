import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getPlanConfig, SUBSCRIPTION_PLANS } from '../config/subscriptionPlans.js';
import { getRazorpayClient, getRazorpayKeyId, verifyPaymentSignature } from '../lib/razorpay.js';
const router = Router();
function emptyToNull(value) {
    const s = String(value ?? '').trim();
    return s.length > 0 ? s : null;
}
function asAsync(handler) {
    return (req, res, next) => {
        handler(req, res).catch((err) => {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Payment request failed';
            if (!res.headersSent) {
                res.status(500).json({ message });
            }
        });
    };
}
router.get('/plans', (_req, res) => {
    res.json(Object.values(SUBSCRIPTION_PLANS));
});
router.post('/create-order', requireAuth, asAsync(async (req, res) => {
    const planName = String(req.body?.planName ?? req.body?.SubscriptionPlan ?? '').trim();
    const plan = getPlanConfig(planName);
    if (!plan) {
        res.status(400).json({ message: 'Invalid subscription plan' });
        return;
    }
    const pool = getPool();
    const u = await pool.query(`SELECT id, email, first_name, last_name, phone, practice_id FROM users WHERE id = $1`, [req.userId]);
    if (u.rows.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (!u.rows[0].practice_id) {
        res.status(400).json({ message: 'Complete practice setup before payment' });
        return;
    }
    const razorpay = getRazorpayClient();
    const receipt = `medbook_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
    const order = await razorpay.orders.create({
        amount: plan.amountPaise,
        currency: plan.currency,
        receipt,
        notes: {
            userId: req.userId,
            planName: plan.name,
            practiceId: String(u.rows[0].practice_id),
        },
    });
    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: getRazorpayKeyId(),
        planName: plan.name,
        displayPrice: plan.displayPrice,
        prefill: {
            name: `${u.rows[0].first_name ?? ''} ${u.rows[0].last_name ?? ''}`.trim(),
            email: u.rows[0].email,
            contact: u.rows[0].phone ?? '',
        },
    });
}));
router.post('/verify', requireAuth, asAsync(async (req, res) => {
    const orderId = String(req.body?.razorpay_order_id ?? '').trim();
    const paymentId = String(req.body?.razorpay_payment_id ?? '').trim();
    const signature = String(req.body?.razorpay_signature ?? '').trim();
    const planName = String(req.body?.planName ?? req.body?.SubscriptionPlan ?? '').trim();
    const adminLocationId = emptyToNull(req.body?.adminPrimaryLocationId ?? req.body?.AdminPrimaryLocationId);
    if (!orderId || !paymentId || !signature) {
        res.status(400).json({ message: 'Missing payment verification fields' });
        return;
    }
    const plan = getPlanConfig(planName);
    if (!plan) {
        res.status(400).json({ message: 'Invalid subscription plan' });
        return;
    }
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
        res.status(400).json({ message: 'Payment verification failed' });
        return;
    }
    const pool = getPool();
    const existing = await pool.query(`SELECT id FROM subscriptions WHERE razorpay_order_id = $1`, [orderId]);
    if (existing.rows.length > 0) {
        await pool.query(`UPDATE users SET is_onboarded = true WHERE id = $1`, [req.userId]);
        res.json({ ok: true, alreadyProcessed: true });
        return;
    }
    const u = await pool.query(`SELECT id, practice_id FROM users WHERE id = $1`, [req.userId]);
    if (u.rows.length === 0 || !u.rows[0].practice_id) {
        res.status(400).json({ message: 'User or practice not found' });
        return;
    }
    await pool.query(`INSERT INTO subscriptions (
       user_id, practice_id, plan_name, admin_primary_location_id,
       razorpay_order_id, razorpay_payment_id, amount_paise, currency, payment_status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'paid')`, [
        req.userId,
        u.rows[0].practice_id,
        plan.name,
        adminLocationId,
        orderId,
        paymentId,
        plan.amountPaise,
        plan.currency,
    ]);
    await pool.query(`UPDATE users SET is_onboarded = true WHERE id = $1`, [req.userId]);
    res.json({ ok: true, planName: plan.name, paymentId });
}));
export default router;
