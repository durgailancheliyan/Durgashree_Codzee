import {
  UserRequest,
  PracticeRequest,
  OnboardingStatus,
  LocationRequest,
  PracticeRoleRequest,
  OnboardingResponse,
} from '@/interfaces';
import axios from 'axios';

const API_URL = '/api/Onboarding';

function getCurrentUserId(): string {
  const raw = localStorage.getItem('user') || localStorage.getItem('auth_user');
  if (!raw) {
    throw new Error('You are not signed in. Please log in again.');
  }
  try {
    const parsed = JSON.parse(raw) as { id?: string };
    if (!parsed?.id) {
      throw new Error('You are not signed in. Please log in again.');
    }
    return parsed.id;
  } catch {
    throw new Error('Invalid session. Please log in again.');
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function apiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string })?.message;
    return new Error(msg || fallback);
  }
  return new Error(error instanceof Error ? error.message : fallback);
}

class OnboardingService {
  async getOnboardingData(userId: string): Promise<OnboardingResponse> {
    try {
      const response = await api.get<OnboardingResponse>(`/${userId}/data`);
      return response.data;
    } catch (error: unknown) {
      throw apiError(error, 'Failed to get onboarding data');
    }
  }

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const userId = getCurrentUserId();
      const response = await api.get<OnboardingStatus>(`/${userId}/status`);
      return response.data;
    } catch (error: unknown) {
      throw apiError(error, 'Failed to get onboarding status');
    }
  }

  async savePracticeSection(data: PracticeRequest): Promise<PracticeRequest & { id: string }> {
    try {
      const userId = getCurrentUserId();
      let response;

      if (data.logo && typeof data.logo !== 'string') {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'logo' && value) {
            formData.append('logo', value as File);
          } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        response = await api.post(`/practice/${userId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const { logo: _logo, ...jsonData } = data;
        response = await api.post(`/practice/${userId}`, jsonData);
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 200 && error.response.data) {
        return error.response.data;
      }
      throw apiError(error, 'Failed to create practice');
    }
  }

  async saveLocationsSection(data: LocationRequest[]): Promise<unknown> {
    const userId = getCurrentUserId();
    const response = await api.post(`/location/${userId}/bulk`, data);
    return response.data;
  }

  async savePracticeRolesSection(data: PracticeRoleRequest[]): Promise<unknown> {
    const response = await api.post(`/practicerole/bulk`, data);
    return response.data;
  }

  async saveUsersSection(data: UserRequest[]): Promise<unknown> {
    const userId = getCurrentUserId();
    const response = await api.post(`/user/${userId}/bulk`, data);
    return response.data;
  }

  async saveSubscriptionSection(data: {
    SubscriptionPlan: string;
    AdminPrimaryLocationId?: string;
  }): Promise<unknown> {
    const response = await api.post('/subscription', data);
    return response.data;
  }
}

export const onboardingService = new OnboardingService();
