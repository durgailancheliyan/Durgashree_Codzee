import axios from 'axios';
import {
  TxAddonsConfigDto,
  TxCategoryConfigDto,
  TxPlansConfigDto,
  TxConfigsDto,
} from '@/interfaces/index';

const API_URL = '/api/TreamentConfig';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
const token = localStorage.getItem('token');
// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

const txConfigService = {
  // Combined config fetch
  getTxConfigs: async (practiceId: string): Promise<TxConfigsDto> =>{
    if(!practiceId) {
        throw new Error('Practice ID is required')
    }
    const response = await api.get<TxConfigsDto>(`/${practiceId}/getdata`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  },

  // ---------- Addons ----------
  getAddons: async (practiceId: string): Promise<TxAddonsConfigDto[]> => {
    const response = await api.get<TxAddonsConfigDto[]>(`/addons/${practiceId}`);
    return response.data;
  },

  getAddonById: async (id: string): Promise<TxAddonsConfigDto> => {
    const response = await api.get<TxAddonsConfigDto>(`/addon/${id}`);
    return response.data;
  },

  createAddon: async (data: TxAddonsConfigDto): Promise<TxAddonsConfigDto> => {
    const response = await api.post<TxAddonsConfigDto>('/addon', data);
    return response.data;
  },

  updateAddon: async (data: TxAddonsConfigDto): Promise<TxAddonsConfigDto> => {
    const response = await api.put<TxAddonsConfigDto>('/addon', data);
    return response.data;
  },

  deleteAddon: async (id: string): Promise<boolean> => {
    const response = await api.delete<boolean>(`/addon/${id}`);
    return response.data;
  },

  // ---------- Categories ----------
  getCategories: async (practiceId: string): Promise<TxCategoryConfigDto[]> => {
    const response = await api.get<TxCategoryConfigDto[]>(`/categories/${practiceId}`);
    return response.data;
  },

  getCategoryById: async (id: string): Promise<TxCategoryConfigDto> => {
    const response = await api.get<TxCategoryConfigDto>(`/category/${id}`);
    return response.data;
  },

  createCategory: async (data: TxCategoryConfigDto): Promise<TxCategoryConfigDto> => {
    const response = await api.post<TxCategoryConfigDto>('/category', data);
    return response.data;
  },

  updateCategory: async (data: TxCategoryConfigDto): Promise<TxCategoryConfigDto> => {
    const response = await api.put<TxCategoryConfigDto>('/category', data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    const response = await api.delete<boolean>(`/category/${id}`);
    return response.data;
  },

  // ---------- Plans ----------
  getPlans: async (practiceId: string): Promise<TxPlansConfigDto[]> => {
    const response = await api.get<TxPlansConfigDto[]>(`/plans/${practiceId}`);
    return response.data;
  },

  getPlanById: async (id: string): Promise<TxPlansConfigDto> => {
    const response = await api.get<TxPlansConfigDto>(`/plan/${id}`);
    return response.data;
  },

  createPlan: async (data: TxPlansConfigDto): Promise<TxPlansConfigDto> => {
    const response = await api.post<TxPlansConfigDto>('/plan', data);
    return response.data;
  },

  updatePlan: async (data: TxPlansConfigDto): Promise<TxPlansConfigDto> => {
    const response = await api.put<TxPlansConfigDto>('/plan', data);
    return response.data;
  },

  deletePlan: async (id: string): Promise<boolean> => {
    const response = await api.delete<boolean>(`/plan/${id}`);
    return response.data;
  },
};

export default txConfigService;
