import axios from 'axios';

const api = axios.create({ baseURL: '/api/patients', headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface RegisterPatientPayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  dateOfBirth?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  allergies?: string;
  notes?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  doctorId?: string;
  locationId?: string;
}

export async function registerPatient(payload: RegisterPatientPayload) {
  try {
  const res = await api.post('/register', payload);
  return res.data as {
    message: string;
    patient: { id: string; email: string; firstName: string; lastName: string };
    appointment?: { id: string; scheduledAt: string };
    temporaryPassword?: string;
  };
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      throw new Error((e.response?.data as { message?: string })?.message ?? 'Registration failed');
    }
    throw e;
  }
}
