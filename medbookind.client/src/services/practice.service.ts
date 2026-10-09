import axios from 'axios';
import { PracticeRequest } from '../interfaces/index';

const getToken = () => localStorage.getItem('token');

const axiosInstance = axios.create({
  baseURL: '/api/practice', // Change to your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in the Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const API_URL = '/api/practice';

export const practiceService = {
  async getPractice(id: string) {
    const res = await axiosInstance.get(`${id}`);
    return res.data;
  },

  async updatePractice(id: string, data: PracticeRequest & { businessHours?: string }) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'logo' && value) {
        formData.append('logo', value as File);
      } else if (key === 'businessHours' && value) {
        formData.append('businessHours', value as string);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });
    const res = await axiosInstance.put(`${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async createPractice(data: PracticeRequest) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'logo' && value) {
        formData.append('logo', value as File);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });
    const res = await axiosInstance.post("",formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getAllPractices() {
    const res = await axiosInstance.get("");
    return res.data;
  },

  async deletePractice(id: string) {
    const res = await axiosInstance.delete(`${id}`);
    return res.data;
  },

  async getPracticeByUserId(userId: string) {
    const res = await axiosInstance.get(`by-user/${userId}`);
    return res.data;
  },
};
