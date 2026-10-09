import axios from 'axios';
import type { PlanName } from '@/constants/subscriptionPlans';
import type { RazorpayPaymentResponse } from '@/types/razorpay';

const api = axios.create({
  baseURL: '/api/payment',
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

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planName: PlanName;
  displayPrice: string;
  prefill: { name: string; email: string; contact: string };
}

class PaymentService {
  async createOrder(planName: PlanName): Promise<CreateOrderResponse> {
    try {
      const response = await api.post<CreateOrderResponse>('/create-order', { planName });
      return response.data;
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message
        : undefined;
      throw new Error(msg || 'Failed to create payment order');
    }
  }

  async verifyPayment(
    payment: RazorpayPaymentResponse,
    planName: PlanName,
    adminPrimaryLocationId?: string
  ): Promise<{ ok: boolean }> {
    try {
      const response = await api.post<{ ok: boolean }>('/verify', {
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
        planName,
        adminPrimaryLocationId,
      });
      return response.data;
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message
        : undefined;
      throw new Error(msg || 'Payment verification failed');
    }
  }
}

export const paymentService = new PaymentService();
