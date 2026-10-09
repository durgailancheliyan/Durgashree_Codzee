import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getPracticeContext } from '../lib/practiceContext.js';
import { DEFAULT_APPOINTMENT_CONFIG, DEFAULT_PATIENT_CONFIG, DEFAULT_PAYMENT_CONFIG, mergeConfig, } from '../lib/defaultConfigs.js';
const router = Router();
async function resolvePracticeId(req, paramId) {
    if (paramId && paramId !== 'me')
        return paramId;
    const ctx = await getPracticeContext(req.userId);
    return ctx.practiceId;
}
async function getOrCreateSettings(practiceId) {
    const pool = getPool();
    const existing = await pool.query(`SELECT patient_config, payment_config, appointment_config FROM practice_settings WHERE practice_id = $1`, [practiceId]);
    if (existing.rows.length > 0)
        return existing.rows[0];
    await pool.query(`INSERT INTO practice_settings (practice_id, patient_config, payment_config, appointment_config)
     VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)`, [
        practiceId,
        JSON.stringify(DEFAULT_PATIENT_CONFIG),
        JSON.stringify(DEFAULT_PAYMENT_CONFIG),
        JSON.stringify(DEFAULT_APPOINTMENT_CONFIG),
    ]);
    return {
        patient_config: DEFAULT_PATIENT_CONFIG,
        payment_config: DEFAULT_PAYMENT_CONFIG,
        appointment_config: DEFAULT_APPOINTMENT_CONFIG,
    };
}
router.get('/:practiceId', requireAuth, async (req, res) => {
    const practiceId = await resolvePracticeId(req, req.params.practiceId);
    if (!practiceId) {
        res.status(400).json({ message: 'Practice not configured' });
        return;
    }
    const row = await getOrCreateSettings(practiceId);
    res.json({
        practiceId,
        patientConfig: mergeConfig(DEFAULT_PATIENT_CONFIG, row.patient_config),
        paymentConfig: mergeConfig(DEFAULT_PAYMENT_CONFIG, row.payment_config),
        appointmentConfig: mergeConfig(DEFAULT_APPOINTMENT_CONFIG, row.appointment_config),
    });
});
router.put('/:practiceId/patient', requireAuth, async (req, res) => {
    const practiceId = await resolvePracticeId(req, req.params.practiceId);
    if (!practiceId) {
        res.status(400).json({ message: 'Practice not configured' });
        return;
    }
    await getOrCreateSettings(practiceId);
    const pool = getPool();
    await pool.query(`UPDATE practice_settings SET patient_config = $1::jsonb, updated_at = NOW() WHERE practice_id = $2`, [JSON.stringify(req.body), practiceId]);
    res.json({ message: 'Patient configuration saved', patientConfig: req.body });
});
router.put('/:practiceId/payment', requireAuth, async (req, res) => {
    const practiceId = await resolvePracticeId(req, req.params.practiceId);
    if (!practiceId) {
        res.status(400).json({ message: 'Practice not configured' });
        return;
    }
    await getOrCreateSettings(practiceId);
    const pool = getPool();
    await pool.query(`UPDATE practice_settings SET payment_config = $1::jsonb, updated_at = NOW() WHERE practice_id = $2`, [JSON.stringify(req.body), practiceId]);
    res.json({ message: 'Payment configuration saved', paymentConfig: req.body });
});
router.put('/:practiceId/appointment', requireAuth, async (req, res) => {
    const practiceId = await resolvePracticeId(req, req.params.practiceId);
    if (!practiceId) {
        res.status(400).json({ message: 'Practice not configured' });
        return;
    }
    await getOrCreateSettings(practiceId);
    const pool = getPool();
    await pool.query(`UPDATE practice_settings SET appointment_config = $1::jsonb, updated_at = NOW() WHERE practice_id = $2`, [JSON.stringify(req.body), practiceId]);
    res.json({ message: 'Appointment configuration saved', appointmentConfig: req.body });
});
export default router;
