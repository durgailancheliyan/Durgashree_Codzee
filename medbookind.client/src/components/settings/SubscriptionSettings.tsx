import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, AlertCircle, CreditCard, Pencil } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isCurrent: boolean;
}

interface SubscriptionSettingsProps {
  editMode: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

const SubscriptionSettings: React.FC<SubscriptionSettingsProps> = ({ editMode, onEdit, onCancel }) => {
  const [currentPlan] = useState<SubscriptionPlan>({
    id: '1',
    name: 'Professional',
    price: 99,
    billingCycle: 'monthly',
    features: [
      'Unlimited users',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    isCurrent: true,
  });

  const [availablePlans] = useState<SubscriptionPlan[]>([
    {
      id: '2',
      name: 'Enterprise',
      price: 299,
      billingCycle: 'monthly',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Training sessions',
      ],
      isCurrent: false,
    },
  ]);

  const handleUpgrade = (planId: string) => {
    toast.info('Upgrade functionality coming soon');
  };

  const handleCancel = () => {
    toast.info('Cancellation functionality coming soon');
  };

  return (
    <div className="space-y-8">
      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card className="border-primary shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                {currentPlan.name}
                <span className="text-sm font-normal text-muted-foreground">
                  ({currentPlan.billingCycle})
                </span>
              </CardTitle>
              <CardDescription>
                You are currently on the <span className="font-semibold">{currentPlan.name}</span> plan
              </CardDescription>
            </div>
            {!editMode && (
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600 hover:bg-blue-100"
                aria-label="Edit Subscription"
                onClick={onEdit}
              >
                <Pencil className="w-5 h-5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              ${currentPlan.price}
              <span className="text-base font-normal text-muted-foreground">
                /{currentPlan.billingCycle}
              </span>
            </div>
            <ul className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel Subscription
            </Button>
          </CardFooter>
        </Card>

        {/* Available Plans */}
        {availablePlans.map((plan) => (
          <Card key={plan.id} className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.name}
                <span className="text-sm font-normal text-muted-foreground">
                  ({plan.billingCycle})
                </span>
              </CardTitle>
              <CardDescription>Upgrade to get more features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                ${plan.price}
                <span className="text-base font-normal text-muted-foreground">
                  /{plan.billingCycle}
                </span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleUpgrade(plan.id)}>Upgrade Plan</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Billing Info */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Billing Information
          </CardTitle>
          <CardDescription>
            Manage your billing details and payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your next billing date is on{' '}
            <span className="font-semibold">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Update Payment Method</Button>
        </CardFooter>
      </Card>

      {/* Edit Mode Overlay */}
      {editMode && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto shadow-2xl">
            <CardHeader>
              <CardTitle>Edit Subscription</CardTitle>
              <CardDescription>Change your plan or billing details</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add your editable form fields here */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Plan</label>
                <select className="w-full border rounded px-3 py-2">
                  <option>Professional</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Billing Cycle</label>
                <select className="w-full border rounded px-3 py-2">
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSettings;