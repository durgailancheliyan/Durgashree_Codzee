import bcrypt from 'bcryptjs';
import { getPool } from '../db.js';

export type OtpChannel = 'email' | 'phone';
export type OtpPurpose =
  | 'password_reset'
  | 'register_email'
  | 'register_phone'
  | 'verify_email'
  | 'verify_phone';

const OTP_TTL_MINUTES: Record<OtpPurpose, number> = {
  password_reset: 15,
  register_email: 30,
  register_phone: 30,
  verify_email: 30,
  verify_phone: 30,
};

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (phone.trim().startsWith('+')) return phone.trim();
  return `+${digits}`;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function shouldExposeOtpInResponse(): boolean {
  const env = process.env.NODE_ENV ?? 'development';
  return env !== 'production' || process.env.OTP_DEV_EXPOSE === 'true';
}

export async function saveOtp(
  channel: OtpChannel,
  identifier: string,
  purpose: OtpPurpose,
  otp: string
): Promise<void> {
  const otpHash = await bcrypt.hash(otp, 8);
  const ttl = OTP_TTL_MINUTES[purpose];
  const pool = getPool();
  await pool.query(
    `INSERT INTO verification_otps (channel, identifier, purpose, otp_hash, expires_at, verified_at)
     VALUES ($1, $2, $3, $4, NOW() + ($5 || ' minutes')::INTERVAL, NULL)
     ON CONFLICT (channel, identifier, purpose)
     DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at, verified_at = NULL`,
    [channel, identifier, purpose, otpHash, String(ttl)]
  );
}

export async function verifyOtp(
  channel: OtpChannel,
  identifier: string,
  purpose: OtpPurpose,
  otp: string,
  markVerified: boolean
): Promise<boolean> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT otp_hash FROM verification_otps
     WHERE channel = $1 AND identifier = $2 AND purpose = $3 AND expires_at > NOW()`,
    [channel, identifier, purpose]
  );
  if (r.rows.length === 0) return false;
  const ok = await bcrypt.compare(otp, r.rows[0].otp_hash);
  if (!ok) return false;
  if (markVerified) {
    await pool.query(
      `UPDATE verification_otps SET verified_at = NOW()
       WHERE channel = $1 AND identifier = $2 AND purpose = $3`,
      [channel, identifier, purpose]
    );
  }
  return true;
}

export async function isRecentlyVerified(
  channel: OtpChannel,
  identifier: string,
  purpose: OtpPurpose,
  withinMinutes = 30
): Promise<boolean> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT 1 FROM verification_otps
     WHERE channel = $1 AND identifier = $2 AND purpose = $3
       AND verified_at IS NOT NULL
       AND verified_at > NOW() - ($4 || ' minutes')::INTERVAL`,
    [channel, identifier, purpose, String(withinMinutes)]
  );
  return r.rows.length > 0;
}

export async function clearOtp(
  channel: OtpChannel,
  identifier: string,
  purpose: OtpPurpose
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM verification_otps WHERE channel = $1 AND identifier = $2 AND purpose = $3`,
    [channel, identifier, purpose]
  );
}
