import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface AdminDashboardData {
  kpis: {
    patients: number;
    appointments: number;
    appointmentsToday?: number;
    revenueInr: number;
    locations: number;
    totalUsers: number;
  };
  systemOverview: {
    practiceName: string;
    practiceType: string;
    practiceConfigured: boolean;
    roles: Record<string, number>;
  };
  userManagement: {
    total: number;
    byRole: Record<string, number>;
    recent: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isOnboarded: boolean;
    }>;
  };
  reports: Array<{
    id: string;
    title: string;
    path: string;
    description: string;
  }>;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const res = await api.get<AdminDashboardData>('/dashboard');
  return res.data;
}
