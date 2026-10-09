import { getPool } from '../db.js';
export async function getPracticeContext(userId) {
    const pool = getPool();
    const row = (await pool.query(`SELECT practice_id, location_id, role FROM users WHERE id = $1`, [userId])).rows[0];
    return {
        practiceId: row?.practice_id ?? null,
        locationId: row?.location_id ?? null,
        role: row?.role ?? '',
    };
}
export function formatPatientName(row) {
    const name = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(' ').trim();
    return name || row.patient_email || 'Patient';
}
export function formatDoctorName(row) {
    const name = [row.doctor_first_name, row.doctor_last_name].filter(Boolean).join(' ').trim();
    return name || row.doctor_email || 'Doctor';
}
