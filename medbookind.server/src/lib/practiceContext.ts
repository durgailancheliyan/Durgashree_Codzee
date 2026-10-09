import { getPool } from '../db.js';

export interface PracticeContext {
  practiceId: string | null;
  locationId: string | null;
  role: string;
}

export async function getPracticeContext(userId: string): Promise<PracticeContext> {
  const pool = getPool();
  const row = (
    await pool.query(
      `SELECT practice_id, location_id, role FROM users WHERE id = $1`,
      [userId]
    )
  ).rows[0];
  return {
    practiceId: row?.practice_id ?? null,
    locationId: row?.location_id ?? null,
    role: row?.role ?? '',
  };
}

export function formatPatientName(row: {
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  patient_email?: string | null;
}): string {
  const name = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' ').trim();
  return name || row.patient_email || 'Patient';
}

export function formatDoctorName(row: {
  doctor_first_name?: string | null;
  doctor_last_name?: string | null;
  doctor_email?: string | null;
}): string {
  const name = [row.doctor_first_name, row.doctor_last_name].filter(Boolean).join(' ').trim();
  return name || row.doctor_email || 'Doctor';
}
