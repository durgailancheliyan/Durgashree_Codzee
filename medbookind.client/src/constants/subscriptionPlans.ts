export type PlanName = 'Basic' | 'Professional' | 'Enterprise';

export interface SubscriptionPlanDisplay {
  name: PlanName;
  displayPrice: string;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDisplay[] = [
  {
    name: 'Basic',
    displayPrice: '₹999',
    description: 'Essential features for small practices',
  },
  {
    name: 'Professional',
    displayPrice: '₹2,499',
    description: 'Advanced features for growing practices',
  },
  {
    name: 'Enterprise',
    displayPrice: '₹4,999',
    description: 'Complete solution for large organizations',
  },
];
