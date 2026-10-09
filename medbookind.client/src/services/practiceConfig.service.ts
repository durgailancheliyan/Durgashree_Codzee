import axios from 'axios';

const api = axios.create({ baseURL: '/api/practice-config', headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface PatientConfigData {
  customFields: Array<{ key: string; label: string; enabled: boolean; required: boolean; type: string }>;
  validationRules: Record<string, boolean | string | number>;
  formControl: Record<string, boolean>;
}

export interface PaymentConfigData {
  paymentMethods: Array<{ id: string; label: string; enabled: boolean }>;
  fees: Array<{ id: string; name: string; amountInr: number }>;
  discounts: Array<{ id: string; name: string; type: string; value: number }>;
}

export interface AppointmentConfigData {
  timeSlots: {
    startTime: string;
    endTime: string;
    intervalMinutes: number;
    workingDays: number[];
  };
  bookingRules: Record<string, boolean | number>;
  cancellationPolicy: Record<string, boolean | number>;
  notifications: Record<string, boolean | number>;
}

export async function fetchPracticeConfigs(practiceId: string) {
  const res = await api.get(`/${practiceId}`);
  return res.data as {
    practiceId: string;
    patientConfig: PatientConfigData;
    paymentConfig: PaymentConfigData;
    appointmentConfig: AppointmentConfigData;
  };
}

export async function savePatientConfig(practiceId: string, config: PatientConfigData) {
  const res = await api.put(`/${practiceId}/patient`, config);
  return res.data;
}

export async function savePaymentConfig(practiceId: string, config: PaymentConfigData) {
  const res = await api.put(`/${practiceId}/payment`, config);
  return res.data;
}

export async function saveAppointmentConfig(practiceId: string, config: AppointmentConfigData) {
  const res = await api.put(`/${practiceId}/appointment`, config);
  return res.data;
}
