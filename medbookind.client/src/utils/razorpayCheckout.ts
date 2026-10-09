import type { CreateOrderResponse } from '@/services/payment.service';
import type { PlanName } from '@/constants/subscriptionPlans';
import type { RazorpayPaymentResponse } from '@/types/razorpay';

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export function openRazorpayCheckout(
  order: CreateOrderResponse,
  planName: PlanName,
  onSuccess: (payment: RazorpayPaymentResponse) => void | Promise<void>,
  onDismiss?: () => void,
  onFailure?: (message: string) => void
): void {
  if (!window.Razorpay) {
    throw new Error('Razorpay is not loaded');
  }

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: 'MedBookInd',
    description: `${planName} plan — ${order.displayPrice}/month`,
    order_id: order.orderId,
    prefill: {
      name: order.prefill.name,
      email: order.prefill.email,
      contact: order.prefill.contact,
    },
    theme: { color: '#0891b2' },
    // Enable UPI, cards, netbanking, wallets
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
    },
    // Show UPI first (GPay, PhonePe, Paytm, BHIM, UPI ID)
    config: {
      display: {
        blocks: {
          upi: {
            name: 'Pay with UPI',
            instruments: [{ method: 'upi' }],
          },
          card: {
            name: 'Debit / Credit Card',
            instruments: [{ method: 'card' }],
          },
          other: {
            name: 'Netbanking & Wallets',
            instruments: [{ method: 'netbanking' }, { method: 'wallet' }],
          },
        },
        sequence: ['block.upi', 'block.card', 'block.other'],
        preferences: {
          show_default_blocks: false,
        },
      },
    },
    handler: (response) => {
      void Promise.resolve(onSuccess(response)).catch(() => {
        /* caller shows error */
      });
    },
    modal: {
      ondismiss: onDismiss,
    },
  });

  rzp.on('payment.failed', (response) => {
    onFailure?.(response.error?.description ?? 'Payment failed');
  });

  rzp.open();
}
