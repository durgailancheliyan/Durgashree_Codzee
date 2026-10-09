import axios from 'axios';

const api = axios.create({ baseURL: '/api/export' });
api.interceptors.request.use((c) => {
  const token = localStorage.getItem('token');
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});

export interface ExportFilters {
  from?: string;
  to?: string;
  doctorId?: string;
  patientSearch?: string;
}

export interface BillingSummary {
  subscriptionRevenueInr: number;
  appointmentRevenueInr: number;
  totalRevenueInr: number;
  paidSubscriptions: number;
  completedAppointments: number;
  lineItems: Array<{ planName: string; status: string; amountInr: number; date: string }>;
}

export async function downloadAppointmentsCsv(filters: ExportFilters): Promise<void> {
  const res = await api.get('/appointments', {
    params: { ...filters, format: 'csv' },
    responseType: 'blob',
  });
  triggerDownload(res.data as Blob, 'appointments.csv');
}

export async function downloadPatientsCsv(patientSearch?: string): Promise<void> {
  const res = await api.get('/patients', {
    params: { format: 'csv', patientSearch },
    responseType: 'blob',
  });
  triggerDownload(res.data as Blob, 'patients.csv');
}

export async function fetchAppointmentsForExport(filters: ExportFilters) {
  const res = await api.get('/appointments', { params: filters });
  return res.data as { rows: Array<Record<string, unknown>>; count: number };
}

export async function fetchBillingSummary(): Promise<BillingSummary> {
  const res = await api.get<BillingSummary>('/billing-summary');
  return res.data;
}

export async function fetchMyPermissions() {
  const res = await api.get<{ role: string; accessLevel: string; permissions: string[] }>(
    '/permissions'
  );
  return res.data;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
