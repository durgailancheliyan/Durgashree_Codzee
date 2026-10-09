import React, { useState } from 'react';
import { Check } from 'lucide-react';

const Subscription: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$49',
      description: 'Essential features for small practices',
      features: [
        'Up to 5 users',
        'Basic patient management',
        'Appointment scheduling',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$99',
      description: 'Advanced features for growing practices',
      features: [
        'Up to 15 users',
        'Advanced patient management',
        'Custom reporting',
        'Priority support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      description: 'Complete solution for large practices',
      features: [
        'Unlimited users',
        'Custom integrations',
        'Dedicated support',
        'Advanced analytics'
      ]
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    // Implement subscription logic here
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Select the plan that best fits your needs
        </p>
      </div>

      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg shadow-sm divide-y divide-gray-200 ${
              selectedPlan === plan.id ? 'border-cyan-500 ring-2 ring-cyan-500' : ''
            }`}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
              <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-base font-medium text-gray-500">/month</span>}
              </p>
              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`mt-8 block w-full bg-cyan-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-cyan-700 ${
                  selectedPlan === plan.id ? 'bg-cyan-700' : ''
                }`}
              >
                {selectedPlan === plan.id ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h4 className="text-sm font-medium text-gray-900 tracking-wide">What's included</h4>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-cyan-500" />
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;