import axios from 'axios';
import { authService } from '../services/auth.service';

// Add a request interceptor
axios.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error instanceof Error ? error : new Error('Request failed'));
    }
);

// Add a response interceptor
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authService.logout();
            // Redirect to login page or handle unauthorized access
            window.location.href = '/login';
        }
        return Promise.reject(error instanceof Error ? error : new Error('Request failed'));
    }
); 