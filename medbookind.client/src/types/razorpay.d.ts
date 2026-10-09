export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
  };
  config?: {
    display?: {
      blocks?: Record<
        string,
        { name: string; instruments: Array<{ method: string }> }
      >;
      sequence?: string[];
      preferences?: { show_default_blocks?: boolean };
    };
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export {};
