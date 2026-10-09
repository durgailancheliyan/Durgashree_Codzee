import { formatDoctorName, formatPatientName } from './practiceContext.js';
export function mapAppointmentRow(row) {
    const scheduledAt = row.scheduled_at;
    const d = new Date(scheduledAt);
    return {
        id: row.id,
        practiceId: row.practice_id,
        patientId: row.patient_id,
        doctorId: row.doctor_id ?? null,
        locationId: row.location_id ?? null,
        scheduledAt: d.toISOString(),
        timeLabel: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        dateLabel: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        durationMinutes: row.duration_minutes,
        appointmentType: row.appointment_type,
        status: row.status,
        notes: row.notes ?? null,
        feePaise: row.fee_paise,
        patientName: formatPatientName({
            patient_first_name: row.patient_first_name,
            patient_last_name: row.patient_last_name,
            patient_email: row.patient_email,
        }),
        doctorName: row.doctor_id
            ? formatDoctorName({
                doctor_first_name: row.doctor_first_name,
                doctor_last_name: row.doctor_last_name,
                doctor_email: row.doctor_email,
            })
            : 'Unassigned',
    };
}
export const APPOINTMENT_SELECT = `
  a.id, a.practice_id, a.patient_id, a.doctor_id, a.location_id,
  a.scheduled_at, a.duration_minutes, a.appointment_type, a.status, a.notes, a.fee_paise,
  p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.email AS patient_email,
  d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.email AS doctor_email
`;
