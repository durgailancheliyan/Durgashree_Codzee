export type PlanName = 'Basic' | 'Professional' | 'Enterprise';

export interface SubscriptionPlanConfig {
  name: PlanName;
  amountPaise: number;
  currency: 'INR';
  description: string;
  displayPrice: string;
}

export const SUBSCRIPTION_PLANS: Record<PlanName, SubscriptionPlanConfig> = {
  Basic: {
    name: 'Basic',
    amountPaise: 99900,
    currency: 'INR',
    description: 'Essential features for small practices',
    displayPrice: '₹999',
  },
  Professional: {
    name: 'Professional',
    amountPaise: 249900,
    currency: 'INR',
    description: 'Advanced features for growing practices',
    displayPrice: '₹2,499',
  },
  Enterprise: {
    name: 'Enterprise',
    amountPaise: 499900,
    currency: 'INR',
    description: 'Complete solution for large organizations',
    displayPrice: '₹4,999',
  },
};

export function getPlanConfig(planName: string): SubscriptionPlanConfig | null {
  const key = planName as PlanName;
  return SUBSCRIPTION_PLANS[key] ?? null;
}
