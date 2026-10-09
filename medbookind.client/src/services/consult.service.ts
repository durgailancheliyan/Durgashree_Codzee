import axios from 'axios';
import type { AppointmentItem } from './dashboard.service';

const api = axios.create({ baseURL: '/api/consultations' });
api.interceptors.request.use((c) => {
  const token = localStorage.getItem('token');
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});

export interface ConsultationRecord {
  id: string;
  appointmentId: string | null;
  patientId: string;
  patientName: string;
  doctorName: string | null;
  status: string;
  chiefComplaint: string | null;
  notes: string | null;
  followUpAt: string | null;
  followUpNotes: string | null;
}

export interface ConsultManagerData {
  queue: AppointmentItem[];
  appointments: AppointmentItem[];
  consultations: ConsultationRecord[];
  locations: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; firstName: string; lastName: string }>;
  patients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    insuranceProvider?: string;
  }>;
}

export async function fetchConsultManager(): Promise<ConsultManagerData> {
  const res = await api.get<ConsultManagerData>('/manager');
  return res.data;
}

export async function ensureConsultation(payload: {
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  chiefComplaint?: string;
}) {
  const res = await api.post<ConsultationRecord>('/', payload);
  return res.data;
}

export async function updateConsultation(
  id: string,
  payload: Partial<{
    status: string;
    notes: string;
    chiefComplaint: string;
    followUpAt: string;
    followUpNotes: string;
    appointmentId: string;
  }>
) {
  const res = await api.patch<ConsultationRecord>(`/${id}`, payload);
  return res.data;
}
