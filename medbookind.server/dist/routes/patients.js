import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getPracticeContext } from '../lib/practiceContext.js';
import { DEFAULT_PATIENT_CONFIG, mergeConfig } from '../lib/defaultConfigs.js';
const router = Router();
const STAFF_ROLES = new Set(['Admin', 'Staff', 'Doctor']);
function validatePincode(postal, pattern) {
    try {
        return new RegExp(pattern).test(postal.trim());
    }
    catch {
        return /^\d{6}$/.test(postal.trim());
    }
}
router.post('/register', requireAuth, async (req, res) => {
    if (!STAFF_ROLES.has(req.userRole ?? '')) {
        res.status(403).json({ message: 'Not allowed' });
        return;
    }
    const ctx = await getPracticeContext(req.userId);
    if (!ctx.practiceId) {
        res.status(400).json({ message: 'Complete practice onboarding first' });
        return;
    }
    const d = req.body ?? {};
    const firstName = String(d.firstName ?? '').trim();
    const lastName = String(d.lastName ?? '').trim();
    const email = String(d.email ?? '').trim().toLowerCase();
    const phone = String(d.phone ?? d.phoneNumber ?? '').trim();
    if (!firstName || !lastName || !email) {
        res.status(400).json({ message: 'First name, last name, and email are required' });
        return;
    }
    const pool = getPool();
    const settingsRow = await pool.query(`SELECT patient_config FROM practice_settings WHERE practice_id = $1`, [ctx.practiceId]);
    const patientConfig = mergeConfig(DEFAULT_PATIENT_CONFIG, settingsRow.rows[0]?.patient_config);
    const rules = patientConfig.validationRules;
    if (rules.requirePhone && !phone) {
        res.status(400).json({ message: 'Phone is required' });
        return;
    }
    if (rules.requireAddress) {
        if (!d.address?.trim() || !d.city?.trim() || !d.state?.trim() || !d.postalCode?.trim()) {
            res.status(400).json({ message: 'Complete address is required' });
            return;
        }
        const pinPattern = String(rules.pincodePattern ?? '^\\d{6}$');
        if (!validatePincode(String(d.postalCode), pinPattern)) {
            res.status(400).json({ message: 'Invalid postal / PIN code' });
            return;
        }
    }
    if (rules.requireEmergencyContact) {
        if (!d.emergencyName?.trim() || !d.emergencyPhone?.trim()) {
            res.status(400).json({ message: 'Emergency contact is required' });
            return;
        }
    }
    if (rules.requireInsurance) {
        if (!d.insuranceProvider?.trim()) {
            res.status(400).json({ message: 'Insurance details are required' });
            return;
        }
    }
    const exists = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
    if (exists.rows.length > 0) {
        res.status(409).json({ message: 'Email already registered' });
        return;
    }
    const userId = randomUUID();
    const tempPassword = randomUUID().slice(0, 12);
    const password_hash = await bcrypt.hash(tempPassword, 10);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_onboarded, practice_id, location_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'Patient', true, $7, $8)`, [userId, email, password_hash, firstName, lastName, phone || null, ctx.practiceId, d.locationId ?? ctx.locationId]);
        await client.query(`INSERT INTO patient_profiles (
        user_id, practice_id, middle_name, gender, date_of_birth,
        address_line1, city, state, postal_code,
        emergency_name, emergency_phone, emergency_relation,
        insurance_provider, insurance_policy_number, insurance_group_number, extra
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)`, [
            userId,
            ctx.practiceId,
            d.middleName ?? null,
            d.gender ?? null,
            d.dateOfBirth || null,
            d.address ?? null,
            d.city ?? null,
            d.state ?? null,
            d.postalCode ?? null,
            d.emergencyName ?? null,
            d.emergencyPhone ?? null,
            d.emergencyRelation ?? null,
            d.insuranceProvider ?? null,
            d.insurancePolicyNumber ?? null,
            d.insuranceGroupNumber ?? null,
            JSON.stringify({ allergies: d.allergies ?? null, notes: d.notes ?? null }),
        ]);
        let appointment = null;
        if (d.appointmentDate && d.appointmentTime) {
            const scheduledAt = new Date(`${d.appointmentDate}T${d.appointmentTime}`);
            const apptId = randomUUID();
            await client.query(`INSERT INTO appointments (
          id, practice_id, patient_id, doctor_id, location_id, scheduled_at, appointment_type, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled')`, [
                apptId,
                ctx.practiceId,
                userId,
                d.doctorId || null,
                d.locationId ?? ctx.locationId,
                scheduledAt.toISOString(),
                d.appointmentType ?? 'Consultation',
            ]);
            appointment = { id: apptId, scheduledAt: scheduledAt.toISOString() };
        }
        await client.query('COMMIT');
        res.status(201).json({
            message: 'Patient registered successfully',
            patient: { id: userId, email, firstName, lastName, phone },
            appointment,
            temporaryPassword: tempPassword,
        });
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
});
router.get('/:patientId/profile', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
            pp.middle_name, pp.gender, pp.date_of_birth, pp.address_line1, pp.city, pp.state, pp.postal_code,
            pp.emergency_name, pp.emergency_phone, pp.emergency_relation,
            pp.insurance_provider, pp.insurance_policy_number, pp.insurance_group_number, pp.extra
     FROM users u
     LEFT JOIN patient_profiles pp ON pp.user_id = u.id
     WHERE u.id = $1 AND u.role = 'Patient'`, [req.params.patientId]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'Patient not found' });
        return;
    }
    const row = r.rows[0];
    res.json({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        middleName: row.middle_name,
        gender: row.gender,
        dateOfBirth: row.date_of_birth,
        address: row.address_line1,
        city: row.city,
        state: row.state,
        postalCode: row.postal_code,
        emergencyName: row.emergency_name,
        emergencyPhone: row.emergency_phone,
        emergencyRelation: row.emergency_relation,
        insuranceProvider: row.insurance_provider,
        insurancePolicyNumber: row.insurance_policy_number,
        insuranceGroupNumber: row.insurance_group_number,
        extra: row.extra,
    });
});
export default router;
