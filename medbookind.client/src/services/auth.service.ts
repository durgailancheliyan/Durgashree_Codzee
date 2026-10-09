import axios from 'axios';

const API_URL = '/api';

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

export type OtpChannel = 'email' | 'phone';
export type OtpPurpose =
  | 'password_reset'
  | 'register_email'
  | 'register_phone'
  | 'verify_email'
  | 'verify_phone';

interface SendOtpResponse {
  message: string;
  channel?: OtpChannel;
  purpose?: string;
  otp?: string;
  devNote?: string;
  identifier?: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  Phone: string;
  role: string;
  emailOtp?: string;
  phoneOtp?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isOnboarded: boolean;
  practiceId?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface User extends AuthUser {}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
}

function apiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error((error.response?.data as { message?: string })?.message || fallback);
  }
  return new Error(error instanceof Error ? error.message : fallback);
}

class AuthService {
  private validateUser(user: unknown): user is User {
    const u = user as User;
    return (
      !!u &&
      typeof u.id === 'string' &&
      typeof u.email === 'string' &&
      typeof u.firstName === 'string' &&
      typeof u.lastName === 'string' &&
      typeof u.role === 'string' &&
      typeof u.isOnboarded === 'boolean'
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      localStorage.clear();
      const response = await api.post<LoginResponse>('/auth/login', { email, password });
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid login response');
      }
      if (!this.validateUser(response.data.user)) {
        throw new Error('Invalid user data received from server');
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw apiError(error, 'An error occurred during login');
    }
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/register', userData);
      if (!response.data?.token) {
        throw new Error('No response received from server');
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error: unknown) {
      throw apiError(error, 'An error occurred during registration');
    }
  }

  async sendOtp(params: {
    channel: OtpChannel;
    email?: string;
    phone?: string;
    purpose: OtpPurpose;
  }): Promise<SendOtpResponse> {
    try {
      const body =
        params.channel === 'email'
          ? { channel: 'email', email: params.email, purpose: params.purpose }
          : { channel: 'phone', phone: params.phone, purpose: params.purpose };
      const response = await api.post<SendOtpResponse>('/auth/send-otp', body);
      return response.data;
    } catch (error: unknown) {
      throw apiError(error, 'Failed to send verification code');
    }
  }

  async verifyOtp(params: {
    channel: OtpChannel;
    email?: string;
    phone?: string;
    purpose: OtpPurpose;
    otp: string;
  }): Promise<{ verified: boolean; message: string }> {
    try {
      const body =
        params.channel === 'email'
          ? {
              channel: 'email',
              email: params.email,
              purpose: params.purpose,
              otp: params.otp,
            }
          : {
              channel: 'phone',
              phone: params.phone,
              purpose: params.purpose,
              otp: params.otp,
            };
      const response = await api.post('/auth/verify-otp', body);
      return response.data;
    } catch (error: unknown) {
      throw apiError(error, 'Verification failed');
    }
  }

  async requestPasswordReset(params: {
    channel: OtpChannel;
    email?: string;
    phone?: string;
  }): Promise<SendOtpResponse> {
    try {
      const response = await api.post<SendOtpResponse>('/auth/reset-password-request', params);
      return response.data;
    } catch (error: unknown) {
      throw apiError(error, 'Failed to send reset code');
    }
  }

  async resetPassword(params: {
    channel: OtpChannel;
    email?: string;
    phone?: string;
    token: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/reset-password', {
        channel: params.channel,
        email: params.email,
        phone: params.phone,
        token: params.token,
        otp: params.token,
        newPassword: params.newPassword,
      });
      return response.data;
    } catch (error: unknown) {
      throw apiError(error, 'Failed to reset password');
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_user');
    delete api.defaults.headers.common['Authorization'];
  }

  getCurrentToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentToken();
  }

  async getMe(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/auth/me');
    return response.data;
  }

  async updateProfile(data: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<AuthUser> {
    const response = await api.patch<AuthUser>('/auth/me', data);
    const updated = response.data;
    localStorage.setItem('user', JSON.stringify(updated));
    localStorage.setItem('auth_user', JSON.stringify(updated));
    return updated;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await api.post('/auth/validate-token', { token }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.status === 200 && response.data.valid;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
