export const SUBSCRIPTION_PLANS = {
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
export function getPlanConfig(planName) {
    const key = planName;
    return SUBSCRIPTION_PLANS[key] ?? null;
}
