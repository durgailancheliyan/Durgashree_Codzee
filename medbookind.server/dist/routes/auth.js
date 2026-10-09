import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getPool } from '../db.js';
import { signToken, verifyToken } from '../jwt.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { generateOtp, normalizeEmail, normalizePhone, saveOtp, verifyOtp, isRecentlyVerified, clearOtp, shouldExposeOtpInResponse, } from '../lib/otp.js';
import { sendEmailOtp, sendSmsOtp } from '../lib/notifications.js';
const router = Router();
const REQUIRE_EMAIL_VERIFY = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
function mapUser(row) {
    return {
        id: row.id,
        email: row.email,
        firstName: row.first_name ?? '',
        lastName: row.last_name ?? '',
        phone: row.phone ?? '',
        role: row.role,
        isOnboarded: row.is_onboarded,
        practiceId: row.practice_id ?? null,
        emailVerified: row.email_verified ?? false,
        phoneVerified: row.phone_verified ?? false,
    };
}
function parseChannel(body) {
    const ch = String(body.channel ?? 'email').toLowerCase();
    return ch === 'phone' ? 'phone' : 'email';
}
function parsePurpose(body, fallback) {
    const p = String(body.purpose ?? fallback);
    const allowed = [
        'password_reset',
        'register_email',
        'register_phone',
        'verify_email',
        'verify_phone',
    ];
    return allowed.includes(p) ? p : fallback;
}
async function findUserByIdentifier(channel, identifier) {
    const pool = getPool();
    if (channel === 'email') {
        const r = await pool.query(`SELECT id, email, phone FROM users WHERE email = $1`, [normalizeEmail(identifier)]);
        return r.rows[0];
    }
    const phone = normalizePhone(identifier);
    const r = await pool.query(`SELECT id, email, phone FROM users WHERE phone = $1 OR phone = $2`, [phone, phone.replace(/^\+/, '')]);
    return r.rows[0];
}
/** POST /auth/send-otp — email or phone OTP */
router.post('/send-otp', async (req, res) => {
    const body = req.body ?? {};
    const channel = parseChannel(body);
    const purpose = parsePurpose(body, channel === 'email' ? 'verify_email' : 'verify_phone');
    const identifier = channel === 'email'
        ? normalizeEmail(String(body.email ?? body.identifier ?? ''))
        : normalizePhone(String(body.phone ?? body.identifier ?? ''));
    if (!identifier || (channel === 'email' && !identifier.includes('@'))) {
        res.status(400).json({ message: channel === 'email' ? 'Valid email required' : 'Valid phone required' });
        return;
    }
    if (purpose === 'password_reset') {
        const user = await findUserByIdentifier(channel, identifier);
        if (!user) {
            res.json({ message: 'If an account exists, a verification code has been sent.' });
            return;
        }
    }
    const otp = generateOtp();
    await saveOtp(channel, identifier, purpose, otp);
    try {
        if (channel === 'email') {
            await sendEmailOtp(identifier, otp, purpose);
        }
        else {
            await sendSmsOtp(identifier, otp, purpose);
        }
    }
    catch (err) {
        console.error('OTP delivery failed:', err);
        res.status(502).json({ message: 'Failed to send verification code. Try again later.' });
        return;
    }
    const payload = {
        message: `Verification code sent to your ${channel === 'email' ? 'email' : 'phone'}.`,
        channel,
        purpose,
    };
    if (shouldExposeOtpInResponse()) {
        payload.otp = otp;
        payload.devNote = 'OTP shown only in development. Configure SMTP/Twilio for production.';
    }
    res.json(payload);
});
/** POST /auth/verify-otp — confirm code (registration / verification) */
router.post('/verify-otp', async (req, res) => {
    const body = req.body ?? {};
    const channel = parseChannel(body);
    const purpose = parsePurpose(body, channel === 'email' ? 'verify_email' : 'verify_phone');
    const otp = String(body.otp ?? body.token ?? '').trim();
    const identifier = channel === 'email'
        ? normalizeEmail(String(body.email ?? body.identifier ?? ''))
        : normalizePhone(String(body.phone ?? body.identifier ?? ''));
    if (!identifier || otp.length !== 6) {
        res.status(400).json({ message: 'Identifier and 6-digit OTP required' });
        return;
    }
    const ok = await verifyOtp(channel, identifier, purpose, otp, true);
    if (!ok) {
        res.status(400).json({ message: 'Invalid or expired verification code' });
        return;
    }
    const pool = getPool();
    if (purpose === 'verify_email' || purpose === 'register_email') {
        await pool.query(`UPDATE users SET email_verified = true WHERE email = $1`, [identifier]);
    }
    if (purpose === 'verify_phone' || purpose === 'register_phone') {
        await pool.query(`UPDATE users SET phone_verified = true WHERE phone = $1 OR phone = $2`, [identifier, identifier.replace(/^\+/, '')]);
    }
    res.json({ message: 'Verified successfully', verified: true, channel, purpose });
});
/** Legacy + channel-aware password reset request */
router.post('/reset-password-request', async (req, res) => {
    const body = req.body ?? {};
    const channel = parseChannel(body);
    const email = normalizeEmail(String(body.email ?? ''));
    const phone = body.phone ? normalizePhone(String(body.phone)) : '';
    const identifier = channel === 'phone' ? phone : email;
    if (!identifier) {
        res.status(400).json({ message: channel === 'email' ? 'Email required' : 'Phone required' });
        return;
    }
    const user = await findUserByIdentifier(channel, identifier);
    if (!user) {
        res.json({ message: 'If an account exists, a verification code has been sent.' });
        return;
    }
    const otp = generateOtp();
    const storeId = channel === 'email' ? user.email : normalizePhone(user.phone ?? identifier);
    await saveOtp(channel, storeId, 'password_reset', otp);
    try {
        if (channel === 'email') {
            await sendEmailOtp(user.email, otp, 'password_reset');
        }
        else {
            const smsTo = normalizePhone(user.phone ?? phone);
            await sendSmsOtp(smsTo, otp, 'password_reset');
        }
    }
    catch (err) {
        console.error(err);
        res.status(502).json({ message: 'Failed to send verification code' });
        return;
    }
    const payload = {
        message: 'If an account exists, a verification code has been sent.',
        channel,
        identifier: storeId,
    };
    if (shouldExposeOtpInResponse())
        payload.otp = otp;
    res.json(payload);
});
router.post('/reset-password', async (req, res) => {
    const body = req.body ?? {};
    const channel = parseChannel(body);
    const otp = String(body.token ?? body.otp ?? '').trim();
    const newPassword = String(body.newPassword ?? '');
    const email = normalizeEmail(String(body.email ?? ''));
    const phone = body.phone ? normalizePhone(String(body.phone)) : '';
    const identifier = channel === 'phone' ? phone : email;
    if (!identifier || !otp || !newPassword) {
        res.status(400).json({ message: 'Identifier, OTP, and new password are required' });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({ message: 'Password must be at least 8 characters' });
        return;
    }
    const storeId = channel === 'email'
        ? email
        : phone;
    const ok = await verifyOtp(channel, storeId, 'password_reset', otp, false);
    if (!ok) {
        res.status(400).json({ message: 'Invalid or expired verification code' });
        return;
    }
    const user = await findUserByIdentifier(channel, identifier);
    if (!user) {
        res.status(400).json({ message: 'Account not found' });
        return;
    }
    const password_hash = await bcrypt.hash(newPassword, 10);
    const pool = getPool();
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [password_hash, user.id]);
    await clearOtp(channel, storeId, 'password_reset');
    res.json({ message: 'Password updated successfully' });
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
        res.status(400).json({ message: 'Email and password required' });
        return;
    }
    const pool = getPool();
    const r = await pool.query(`SELECT id, email, password_hash, first_name, last_name, role, is_onboarded, practice_id, email_verified, phone_verified
     FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (r.rows.length === 0) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
    }
    const u = r.rows[0];
    const passOk = await bcrypt.compare(password, u.password_hash);
    if (!passOk) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
    }
    const token = signToken({ sub: u.id, email: u.email, role: u.role });
    res.json({ token, user: mapUser(u) });
});
router.post('/register', async (req, res) => {
    const body = req.body ?? {};
    const email = normalizeEmail(String(body.email ?? ''));
    const password = String(body.password ?? '');
    const firstName = String(body.firstName ?? '');
    const lastName = String(body.lastName ?? '');
    const allowedRoles = ['Admin', 'Doctor', 'Staff', 'Patient'];
    const role = String(body.role ?? 'Admin');
    if (!allowedRoles.includes(role)) {
        res.status(400).json({ message: 'Invalid role. Choose Admin, Doctor, Staff, or Patient.' });
        return;
    }
    const phoneRaw = String(body.Phone ?? body.phone ?? '');
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    const emailOtp = String(body.emailOtp ?? '').trim();
    const phoneOtp = String(body.phoneOtp ?? '').trim();
    if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }
    if (password.length < 8) {
        res.status(400).json({ message: 'Password must be at least 8 characters' });
        return;
    }
    async function channelVerified(channel, identifier, purpose, otpCode) {
        if (!identifier)
            return false;
        if (await isRecentlyVerified(channel, identifier, purpose))
            return true;
        if (otpCode.length === 6 && (await verifyOtp(channel, identifier, purpose, otpCode, true))) {
            return true;
        }
        return false;
    }
    const emailOk = await channelVerified('email', email, 'register_email', emailOtp);
    const phoneOk = phone ? await channelVerified('phone', phone, 'register_phone', phoneOtp) : false;
    const hasVerification = emailOk || phoneOk;
    if (REQUIRE_EMAIL_VERIFY && !emailOk) {
        res.status(400).json({ message: 'Email verification is required.' });
        return;
    }
    if (!hasVerification) {
        res.status(400).json({
            message: 'Verify your email or phone: send a code, enter all 6 digits, then click Verify (or submit the code on register).',
        });
        return;
    }
    const pool = getPool();
    const exists = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
    if (exists.rows.length > 0) {
        res.status(409).json({ message: 'Email already registered' });
        return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const skipOnboarding = role !== 'Admin';
    const r = await pool.query(`INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_onboarded, email_verified, phone_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, email, first_name, last_name, role, is_onboarded, practice_id, email_verified, phone_verified`, [id, email, password_hash, firstName, lastName, phone, role, skipOnboarding, emailOk, phoneOk]);
    const u = r.rows[0];
    const token = signToken({ sub: u.id, email: u.email, role: u.role });
    res.status(201).json({ token, user: mapUser(u) });
});
router.get('/me', requireAuth, async (req, res) => {
    const pool = getPool();
    const r = await pool.query(`SELECT id, email, first_name, last_name, phone, role, is_onboarded, practice_id, email_verified, phone_verified
     FROM users WHERE id = $1`, [req.userId]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json(mapUser(r.rows[0]));
});
router.patch('/me', requireAuth, async (req, res) => {
    const d = req.body ?? {};
    const firstName = d.firstName != null ? String(d.firstName).trim() : null;
    const lastName = d.lastName != null ? String(d.lastName).trim() : null;
    const phone = d.phone != null ? String(d.phone).trim() : null;
    if (firstName === '' || lastName === '') {
        res.status(400).json({ message: 'First and last name are required' });
        return;
    }
    const pool = getPool();
    const r = await pool.query(`UPDATE users SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone = COALESCE($3, phone)
     WHERE id = $4
     RETURNING id, email, first_name, last_name, phone, role, is_onboarded, practice_id, email_verified, phone_verified`, [firstName, lastName, phone, req.userId]);
    if (r.rows.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json(mapUser(r.rows[0]));
});
router.post('/validate-token', (req, res) => {
    const bodyToken = req.body?.token;
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : bodyToken;
    if (!token) {
        res.status(401).json({ valid: false });
        return;
    }
    try {
        verifyToken(token);
        res.json({ valid: true });
    }
    catch {
        res.status(401).json({ valid: false });
    }
});
export default router;
