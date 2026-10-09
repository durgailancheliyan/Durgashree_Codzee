import { LocationResponse, PracticeRoleResponse, UserRequest, UserResponse } from '@/interfaces';
import axios from 'axios';

const API_URL = '/api/user';

function getCurrentUserId(): string {
  const raw = localStorage.getItem('user') || localStorage.getItem('auth_user');
  if (!raw) throw new Error('Not signed in');
  const parsed = JSON.parse(raw) as { id?: string };
  if (!parsed?.id) throw new Error('Not signed in');
  return parsed.id;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type RoleOption = { id: string; name: string; kind: 'system' | 'practice' };

export const UsersService = {
  async getRoleOptions(): Promise<RoleOption[]> {
    const userId = getCurrentUserId();
    const response = await api.get<RoleOption[]>(`/${userId}/role-options`);
    return response.data;
  },

  async getPracticeRoles(): Promise<PracticeRoleResponse[]> {
    const userId = getCurrentUserId();
    const response = await api.get<PracticeRoleResponse[]>(`/${userId}/roles`);
    return response.data;
  },

  async getPracticeLocations(): Promise<LocationResponse[]> {
    const userId = getCurrentUserId();
    const response = await api.get<LocationResponse[]>(`/${userId}/locations`);
    return response.data;
  },

  async getUsers(): Promise<UserResponse[]> {
    const userId = getCurrentUserId();
    const response = await api.get<UserResponse[]>(`/${userId}`);
    return response.data;
  },

  async createUser(userData: UserRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>(`/users`, userData);
    return response.data;
  },

  async updateUser(userId: string, userData: UserRequest): Promise<UserResponse> {
    const response = await api.put<UserResponse>(`/update/${userId}`, userData);
    return response.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },
};
