import axios from 'axios';

function createApi(baseURL: string) {
  const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return api;
}

const doctorApi = createApi('/api/doctor');
const staffApi = createApi('/api/staff');
const patientApi = createApi('/api/patient');
const appointmentsApi = createApi('/api/appointments');

export interface AppointmentItem {
  id: string;
  patientId: string;
  doctorId: string | null;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  timeLabel: string;
  dateLabel: string;
  appointmentType: string;
  status: string;
  notes: string | null;
}

export interface DoctorDashboardData {
  kpis: {
    todayAppointments: number;
    queueCount: number;
    weekConsultations: number;
    totalPatients: number;
    pendingNotes: number;
  };
  todayAppointments: AppointmentItem[];
  patientQueue: AppointmentItem[];
  scheduleView: AppointmentItem[];
  treatmentHistory: Array<{
    id: string;
    title: string;
    description?: string;
    recordType: string;
    recordedAt: string;
    patientFirstName?: string;
    patientLastName?: string;
  }>;
  links: { schedule: string; patients: string };
}

export interface StaffDashboardData {
  kpis: {
    todayAppointments: number;
    checkedIn: number;
    newPatientsWeek: number;
    pendingScheduled: number;
  };
  todayAppointments: AppointmentItem[];
  patients: Array<{ id: string; firstName: string; lastName: string; email: string; phone?: string }>;
  doctors: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  reports: Array<{ id: string; title: string; path: string; description: string }>;
  links: Record<string, string>;
}

export interface PatientDashboardData {
  profile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    completionPercent: number;
  };
  kpis: {
    upcomingCount: number;
    historyCount: number;
    recordsCount: number;
    profileCompletion: number;
  };
  upcomingBookings: AppointmentItem[];
  appointmentHistory: AppointmentItem[];
  medicalProgress: Array<{
    id: string;
    title: string;
    description?: string;
    recordType: string;
    recordedAt: string;
    doctorFirstName?: string;
    doctorLastName?: string;
  }>;
  links: { bookAppointment: string; profile: string; settings: string };
}

export async function fetchDoctorDashboard(): Promise<DoctorDashboardData> {
  const res = await doctorApi.get<DoctorDashboardData>('/dashboard');
  return res.data;
}

export async function fetchStaffDashboard(): Promise<StaffDashboardData> {
  const res = await staffApi.get<StaffDashboardData>('/dashboard');
  return res.data;
}

export async function fetchPatientDashboard(): Promise<PatientDashboardData> {
  const res = await patientApi.get<PatientDashboardData>('/dashboard');
  return res.data;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string
): Promise<AppointmentItem> {
  const res = await appointmentsApi.patch<AppointmentItem>(`/${appointmentId}/status`, { status });
  return res.data;
}

export async function createAppointment(payload: {
  patientId: string;
  doctorId?: string;
  scheduledAt: string;
  appointmentType?: string;
}): Promise<AppointmentItem> {
  const res = await appointmentsApi.post<AppointmentItem>('/', payload);
  return res.data;
}
