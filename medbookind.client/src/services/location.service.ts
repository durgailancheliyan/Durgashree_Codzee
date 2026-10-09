import axios from 'axios';
import { LocationRequest } from '../interfaces/index';

// Replace this with your logic to get the JWT token (e.g., from localStorage)
const userString = localStorage.getItem('user');
const user = userString ? JSON.parse(userString) : null;
const getToken = () => localStorage.getItem('token');

const axiosInstance = axios.create({
  baseURL: '/api/location',
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const locationService = {
  async getLocation(id: string) {
    const res = await axiosInstance.get(`${id}`);
    return res.data;
  },

  async updateLocation(locationId: string, data: LocationRequest) {
    const res = await axiosInstance.put(`${locationId}`, data);
    return res.data;
  },

  async getLocationStaff(locationId: string) {
    const res = await axiosInstance.get(`${locationId}/staff`);
    return res.data as Array<{ id: string; firstName: string; lastName: string; role: string; locationId?: string }>;
  },

  async updateLocationStaff(locationId: string, userIds: string[]) {
    const res = await axiosInstance.put(`${locationId}/staff`, { userIds });
    return res.data;
  },

  async createLocation(data: LocationRequest) {
    const res = await axiosInstance.post("", data);
    return res.data;
  },

  async getAllLocations() {
    const res = await axiosInstance.get("");
    return res.data;
  },

  async deleteLocation(id: string) {
    const res = await axiosInstance.delete(`${id}`);
    return res.data;
  },

  async getLocationsByUserId(userId: string) {
    const res = await axiosInstance.get(`by-user/${userId}`);
    return res.data;
  },
};
