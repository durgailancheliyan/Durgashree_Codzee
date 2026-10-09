import { formatDoctorName, formatPatientName } from './practiceContext.js';

export function mapAppointmentRow(row: Record<string, unknown>) {
  const scheduledAt = row.scheduled_at as Date | string;
  const d = new Date(scheduledAt);
  return {
    id: row.id as string,
    practiceId: row.practice_id as string,
    patientId: row.patient_id as string,
    doctorId: (row.doctor_id as string) ?? null,
    locationId: (row.location_id as string) ?? null,
    scheduledAt: d.toISOString(),
    timeLabel: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    dateLabel: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    durationMinutes: row.duration_minutes as number,
    appointmentType: row.appointment_type as string,
    status: row.status as string,
    notes: (row.notes as string) ?? null,
    feePaise: row.fee_paise as number,
    patientName: formatPatientName({
      patient_first_name: row.patient_first_name as string,
      patient_last_name: row.patient_last_name as string,
      patient_email: row.patient_email as string,
    }),
    doctorName: row.doctor_id
      ? formatDoctorName({
          doctor_first_name: row.doctor_first_name as string,
          doctor_last_name: row.doctor_last_name as string,
          doctor_email: row.doctor_email as string,
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
