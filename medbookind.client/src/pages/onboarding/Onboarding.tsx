import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Users,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Shield,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { onboardingService } from '../../services/onboarding.service';
import { paymentService } from '../../services/payment.service';
import { SUBSCRIPTION_PLANS, type PlanName } from '@/constants/subscriptionPlans';
import { loadRazorpayScript, openRazorpayCheckout } from '@/utils/razorpayCheckout';
import {
  OnboardingRequest,
  LocationRequest,
  PracticeRoleRequest,
  UserRequest,
  OnboardingResponse,
} from '@/interfaces';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { getDashboardPathForRole } from '@/utils/dashboardPath';
import WizardField from '@/components/onboarding/WizardField';
import { fieldControlClass } from '@/components/onboarding/fieldStyles';
import WizardProgress, { type WizardStepMeta } from '@/components/onboarding/WizardProgress';
import StatusBanner from '@/components/onboarding/StatusBanner';

type Tab = 'practice' | 'locations' | 'practiceRoles' | 'users' | 'subscription';
type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS: WizardStepMeta[] = [
  {
    id: 'practice',
    label: 'Practice Details',
    shortLabel: 'Practice',
    description: 'Tell us about your clinic or hospital so patients can find you.',
    icon: Building2,
  },
  {
    id: 'locations',
    label: 'Locations',
    shortLabel: 'Locations',
    description: 'Add every site where care is delivered.',
    icon: MapPin,
  },
  {
    id: 'practiceRoles',
    label: 'Practice Roles',
    shortLabel: 'Roles',
    description: 'Define custom roles used when inviting your team.',
    icon: Shield,
  },
  {
    id: 'users',
    label: 'App Users',
    shortLabel: 'Users',
    description: 'Invite doctors and staff (optional — you can skip).',
    icon: Users,
  },
  {
    id: 'subscription',
    label: 'Subscription',
    shortLabel: 'Plan',
    description: 'Pick a plan and complete secure payment to finish setup.',
    icon: CreditCard,
  },
];

const emptyLocation = (practiceId = ''): LocationRequest => ({
  id: null,
  name: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  practiceId,
});

const emptyUser = (practiceId = ''): UserRequest => ({
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  locationId: '',
  practiceId,
});

const emptyRole = (practiceId = ''): PracticeRoleRequest => ({
  id: null,
  name: '',
  practiceId,
});

function collectStepErrors(tab: Tab, formData: OnboardingRequest): FieldErrors {
  const next: FieldErrors = {};

  if (tab === 'practice') {
    const p = formData.practice;
    if (!p.name.trim()) next['practice.name'] = 'Practice name is required';
    if (!p.type.trim()) next['practice.type'] = 'Select a practice type';
    if (!p.address.trim()) next['practice.address'] = 'Address is required';
    if (!p.phone.trim()) next['practice.phone'] = 'Phone number is required';
    if (!p.email.trim()) next['practice.email'] = 'Email is required';
    else if (!EMAIL_RE.test(p.email.trim())) next['practice.email'] = 'Enter a valid email address';
  }

  if (tab === 'locations') {
    if (formData.locations.length === 0) {
      next.locations = 'Add at least one location';
    }
    formData.locations.forEach((loc, i) => {
      if (!loc.name.trim()) next[`locations.${i}.name`] = 'Location name is required';
      if (!loc.address.trim()) next[`locations.${i}.address`] = 'Address is required';
    });
  }

  if (tab === 'practiceRoles') {
    formData.practiceRoles.forEach((role, i) => {
      if (!role.name?.trim()) next[`practiceRoles.${i}.name`] = 'Role name is required';
    });
  }

  if (tab === 'users') {
    formData.additionalUsers.forEach((u, i) => {
      if (!u.firstName.trim()) next[`users.${i}.firstName`] = 'First name is required';
      if (!u.lastName.trim()) next[`users.${i}.lastName`] = 'Last name is required';
      if (!u.email.trim()) next[`users.${i}.email`] = 'Email is required';
      else if (!EMAIL_RE.test(u.email.trim())) next[`users.${i}.email`] = 'Enter a valid email';
    });
  }

  if (tab === 'subscription') {
    if (!formData.subscriptionPlan) next.subscriptionPlan = 'Select a subscription plan';
  }

  return next;
}

const Onboarding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');
  const [savedData, setSavedData] = useState<OnboardingResponse | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);
  const [formData, setFormData] = useState<OnboardingRequest>({
    practice: {
      name: '',
      type: '',
      description: '',
      address: '',
      email: '',
      phone: '',
      website: '',
      logo: null,
    },
    locations: [emptyLocation()],
    practiceRoles: [],
    additionalUsers: [],
    subscriptionPlan: 'Basic',
    adminPrimaryLocationId: undefined,
  });
  const navigate = useNavigate();
  const { user, isOnboarded, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const currentStepIndex = Math.max(
    0,
    STEPS.findIndex((t) => t.id === activeTab)
  );
  const progressPercent = useMemo(
    () => Math.round(((currentStepIndex + 1) / STEPS.length) * 100),
    [currentStepIndex]
  );

  const liveErrors = useMemo(
    () => collectStepErrors(activeTab, formData),
    [activeTab, formData]
  );
  const isCurrentStepValid = Object.keys(liveErrors).length === 0;

  const milestoneCompletion = useMemo(() => {
    const p = formData.practice;
    const practiceDone = !!(
      savedData?.practice?.id ||
      (p.name && p.type && p.email && p.phone && p.address)
    );
    const locationsDone =
      (savedData?.locations?.length ?? 0) > 0 ||
      formData.locations.some((l) => l.name && l.address);
    const rolesDone =
      (savedData?.practiceRoles?.length ?? 0) > 0 ||
      formData.practiceRoles.some((r) => r.name?.trim()) ||
      formData.practiceRoles.length === 0;
    const usersDone =
      formData.additionalUsers.length === 0 ||
      formData.additionalUsers.every((u) => u.firstName && u.lastName && u.email);
    const subDone = !!formData.subscriptionPlan;
    const items = [
      { key: 'practice', label: 'Practice', done: practiceDone },
      { key: 'locations', label: 'Locations', done: locationsDone },
      { key: 'roles', label: 'Roles', done: rolesDone },
      { key: 'users', label: 'Users', done: usersDone },
      { key: 'subscription', label: 'Plan', done: subDone },
    ];
    const completed = items.filter((i) => i.done).length;
    return {
      items,
      overallPercent: Math.round((completed / 5) * 100),
    };
  }, [savedData, formData]);

  const roleOptions = useMemo(() => {
    const saved = Array.isArray(savedData?.practiceRoles) ? savedData.practiceRoles : [];
    const seen = new Set(saved.map((r) => r.id));
    const fromForm = formData.practiceRoles
      .filter((r) => r.name?.trim() && r.id && !seen.has(r.id))
      .map((r) => ({ id: r.id as string, name: r.name, practiceId: r.practiceId }));
    return [...saved, ...fromForm];
  }, [savedData?.practiceRoles, formData.practiceRoles]);

  const locationOptions = useMemo(() => {
    const saved = Array.isArray(savedData?.locations) ? savedData.locations : [];
    const seen = new Set(saved.map((l) => l.id));
    const fromForm = formData.locations
      .filter((l) => l.name?.trim() && l.id && !seen.has(l.id))
      .map((l) => ({
        id: l.id as string,
        name: l.name,
        address: l.address,
        practiceId: l.practiceId,
      }));
    return [...saved, ...fromForm];
  }, [savedData?.locations, formData.locations]);

  const fetchSavedData = useCallback(async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
      const data = await onboardingService.getOnboardingData(user.id);
      if (data) {
        setSavedData(data);
        setFormData((prev) => ({
          practice: data.practice
            ? {
                name: data.practice.name ?? '',
                type: data.practice.type ?? '',
                description: data.practice.description ?? '',
                address: data.practice.address ?? '',
                email: data.practice.email ?? '',
                phone: data.practice.phone ?? '',
                website: data.practice.website ?? '',
                logo: null,
              }
            : prev.practice,
          locations:
            data.locations?.length > 0
              ? data.locations.map((l) => ({
                  id: l.id,
                  name: l.name ?? '',
                  address: l.address ?? '',
                  city: l.city ?? '',
                  state: l.state ?? '',
                  postalCode: l.postalCode ?? '',
                  phone: l.phone ?? '',
                  practiceId: l.practiceId ?? '',
                }))
              : prev.locations,
          additionalUsers: data.additionalUsers?.length
            ? data.additionalUsers.map((u) => ({
                id: u.id,
                firstName: u.firstName ?? '',
                lastName: u.lastName ?? '',
                email: u.email ?? '',
                phone: u.phone ?? '',
                role: u.role ?? '',
                locationId: u.locationId ?? '',
                practiceId: u.practiceId ?? '',
              }))
            : prev.additionalUsers,
          practiceRoles: data.practiceRoles?.length
            ? data.practiceRoles.map((r) => ({
                id: r.id,
                name: r.name ?? '',
                practiceId: r.practiceId ?? '',
              }))
            : prev.practiceRoles,
          subscriptionPlan: data.subscriptionPlan || prev.subscriptionPlan,
          adminPrimaryLocationId: data.adminPrimaryLocationId,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch saved onboarding data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSavedData();
  }, [fetchSavedData]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/auth');
        return;
      }
      if (isOnboarded) {
        navigate(getDashboardPathForRole(user?.role));
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [user, isOnboarded, navigate]);

  const showError = (key: string) => {
    if (touched) return liveErrors[key] || fieldErrors[key];
    return fieldErrors[key];
  };

  const markTouched = () => {
    if (!touched) setTouched(true);
  };

  const validateStep = (): boolean => {
    const next = collectStepErrors(activeTab, formData);
    setFieldErrors(next);
    setTouched(true);
    return Object.keys(next).length === 0;
  };

  const goToStep = (index: number) => {
    setActiveTab(STEPS[index].id as Tab);
    setStep(index + 1);
    setError(null);
    setTouched(false);
    setFieldErrors({});
  };

  const handleSavePractice = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const practiceRes = await onboardingService.savePracticeSection(formData.practice);
      setSavedData((prev) => ({
        ...prev,
        practice: practiceRes,
        locations: prev?.locations ?? [],
        additionalUsers: prev?.additionalUsers ?? [],
        practiceRoles: prev?.practiceRoles ?? [],
        subscriptionPlan: prev?.subscriptionPlan ?? '',
        adminPrimaryLocationId: prev?.adminPrimaryLocationId ?? undefined,
      }));
      await fetchSavedData();
      setApiStatus('Practice details saved successfully.');
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save practice details');
      setApiStatus('');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLocations = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const payload = formData.locations.map((ele) => ({
        ...ele,
        practiceId: savedData?.practice?.id || ele.practiceId || '',
      }));
      await onboardingService.saveLocationsSection(payload);
      await fetchSavedData();
      setApiStatus('Locations saved successfully.');
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save locations');
      setApiStatus('');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUsers = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const cleanedUsers = formData.additionalUsers.map((u) => ({
        ...u,
        locationId: u.locationId || '',
        role: u.role || '',
        practiceId: savedData?.practice?.id || u.practiceId || '',
      }));
      await onboardingService.saveUsersSection(cleanedUsers);
      await fetchSavedData();
      setApiStatus('Users saved successfully.');
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save users');
      setApiStatus('');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePracticeRoles = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      if (formData.practiceRoles.length > 0) {
        const rolesToSave = formData.practiceRoles.map((role) => ({
          ...role,
          practiceId: savedData?.practice?.id || role.practiceId,
        }));
        await onboardingService.savePracticeRolesSection(rolesToSave);
      }
      await fetchSavedData();
      setApiStatus('Practice roles saved successfully.');
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save practice roles');
      setApiStatus('');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCurrentTab = async (): Promise<boolean> => {
    switch (activeTab) {
      case 'practice':
        return handleSavePractice();
      case 'locations':
        return handleSaveLocations();
      case 'users':
        return handleSaveUsers();
      case 'practiceRoles':
        return handleSavePracticeRoles();
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    const ok = await saveCurrentTab();
    if (!ok) return;
    const nextIndex = step; // step is 1-based; next tab index = step
    if (nextIndex < STEPS.length) {
      goToStep(nextIndex);
    }
  };

  const handleBack = () => {
    if (step <= 1) return;
    goToStep(step - 2);
  };

  const handleInputChange = (
    section: 'Practice' | 'Locations' | 'AdditionalUsers' | 'SubscriptionPlan',
    field: string,
    value: string,
    index?: number
  ) => {
    setApiStatus('');
    markTouched();
    if (section === 'Practice') {
      setFormData((prev) => ({
        ...prev,
        practice: { ...prev.practice, [field]: value },
      }));
    } else if (section === 'Locations' && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        locations: prev.locations.map((loc, i) =>
          i === index ? { ...loc, [field]: value } : loc
        ),
      }));
    } else if (section === 'AdditionalUsers' && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        additionalUsers: prev.additionalUsers.map((u, i) =>
          i === index ? { ...u, [field]: value } : u
        ),
      }));
    } else if (section === 'SubscriptionPlan') {
      setFormData((prev) => ({
        ...prev,
        subscriptionPlan: value,
      }));
    }
  };

  const addLocation = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [...prev.locations, emptyLocation(savedData?.practice?.id || '')],
    }));
  };

  const removeLocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    }));
  };

  const addUser = () => {
    setFormData((prev) => ({
      ...prev,
      additionalUsers: [...prev.additionalUsers, emptyUser(savedData?.practice?.id || '')],
    }));
  };

  const removeUser = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalUsers: prev.additionalUsers.filter((_, i) => i !== index),
    }));
  };

  const addPracticeRole = () => {
    setFormData((prev) => ({
      ...prev,
      practiceRoles: [...prev.practiceRoles, emptyRole(savedData?.practice?.id || '')],
    }));
  };

  const removePracticeRole = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      practiceRoles: prev.practiceRoles.filter((_, i) => i !== index),
    }));
  };

  const handlePracticeRoleChange = (index: number, field: string, value: string) => {
    markTouched();
    setFormData((prev) => ({
      ...prev,
      practiceRoles: prev.practiceRoles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role
      ),
    }));
  };

  const finishOnboardingAfterPayment = () => {
    if (user) {
      const updated = { ...user, isOnboarded: true };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      localStorage.setItem('user', JSON.stringify(updated));
      refreshUser();
    }
    setApiStatus('Payment successful! Redirecting to your dashboard…');
    navigate(getDashboardPathForRole(user?.role), { replace: true });
  };

  const handleCompleteSetup = async () => {
    if (!validateStep()) return;
    const plan = formData.subscriptionPlan as PlanName | undefined;
    if (!plan) {
      setError('Please select a subscription plan');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await loadRazorpayScript();
      const order = await paymentService.createOrder(plan);

      openRazorpayCheckout(
        order,
        plan,
        async (payment) => {
          try {
            setIsSubmitting(true);
            setApiStatus('Verifying payment…');
            await paymentService.verifyPayment(payment, plan, formData.adminPrimaryLocationId);
            finishOnboardingAfterPayment();
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Payment verification failed');
            setApiStatus('');
          } finally {
            setIsSubmitting(false);
          }
        },
        () => {
          setIsSubmitting(false);
          setError('Payment cancelled. Select a plan and try again.');
          setApiStatus('');
        },
        (message) => {
          setIsSubmitting(false);
          setError(message);
          setApiStatus('');
        }
      );
      setIsSubmitting(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg =
        err.response?.data?.message ??
        (e instanceof Error ? e.message : 'Failed to start payment');
      setError(msg);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50">
        <div className="flex flex-col items-center gap-3 text-slate-600" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-medium">Loading your setup…</p>
        </div>
      </div>
    );
  }

  const continueDisabled = isSubmitting || !isCurrentStepValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50">
      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-teal-900/5 overflow-hidden border border-slate-100">
          <WizardProgress
            steps={STEPS}
            currentIndex={currentStepIndex}
            progressPercent={progressPercent}
            checklistPercent={milestoneCompletion.overallPercent}
            checklistItems={milestoneCompletion.items}
            onStepSelect={goToStep}
          />

          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
            {isSubmitting ? (
              <StatusBanner tone="loading" message="Saving your changes… Please wait." />
            ) : null}
            {apiStatus && !error ? (
              <StatusBanner tone="success" message={apiStatus} onDismiss={() => setApiStatus('')} />
            ) : null}
            {error ? (
              <StatusBanner tone="error" message={error} onDismiss={() => setError(null)} />
            ) : null}

            <div
              key={activeTab}
              className="animate-[fadeIn_0.35s_ease-out]"
              style={{
                animation: 'onboardFade 0.35s ease-out',
              }}
            >
              {/* Practice */}
              {activeTab === 'practice' && (
                <section className="space-y-5 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-4 sm:p-7 shadow-sm">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Practice information</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Fields marked with <span className="text-rose-500">*</span> are required.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <WizardField
                      id="practice-name"
                      label="Practice name"
                      required
                      hint="Official name patients will see"
                      error={showError('practice.name')}
                    >
                      <input
                        id="practice-name"
                        type="text"
                        autoComplete="organization"
                        className={fieldControlClass(!!showError('practice.name'))}
                        placeholder="e.g. Sunrise Family Clinic"
                        value={formData.practice.name}
                        onChange={(e) => handleInputChange('Practice', 'name', e.target.value)}
                        aria-invalid={!!showError('practice.name')}
                        aria-required
                      />
                    </WizardField>

                    <WizardField
                      id="practice-type"
                      label="Practice type"
                      required
                      hint="Helps tailor defaults for your specialty"
                      error={showError('practice.type')}
                    >
                      <select
                        id="practice-type"
                        className={fieldControlClass(!!showError('practice.type'))}
                        value={formData.practice.type}
                        onChange={(e) => handleInputChange('Practice', 'type', e.target.value)}
                        aria-invalid={!!showError('practice.type')}
                        aria-required
                      >
                        <option value="">Select a type</option>
                        <option value="Clinic">Clinic</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Medical Center">Medical Center</option>
                        <option value="Specialty Practice">Specialty Practice</option>
                      </select>
                    </WizardField>

                    <WizardField
                      id="practice-description"
                      label="Description"
                      hint="Short summary of services offered"
                      className="md:col-span-2"
                    >
                      <textarea
                        id="practice-description"
                        rows={3}
                        className={fieldControlClass()}
                        placeholder="Primary care, diagnostics, and specialty consultations…"
                        value={formData.practice.description}
                        onChange={(e) => handleInputChange('Practice', 'description', e.target.value)}
                      />
                    </WizardField>

                    <WizardField
                      id="practice-address"
                      label="Address"
                      required
                      hint="Main street address for your practice"
                      error={showError('practice.address')}
                      className="md:col-span-2"
                    >
                      <input
                        id="practice-address"
                        type="text"
                        autoComplete="street-address"
                        className={fieldControlClass(!!showError('practice.address'))}
                        placeholder="Building, street, area"
                        value={formData.practice.address}
                        onChange={(e) => handleInputChange('Practice', 'address', e.target.value)}
                        aria-invalid={!!showError('practice.address')}
                        aria-required
                      />
                    </WizardField>

                    <WizardField
                      id="practice-phone"
                      label="Phone"
                      required
                      hint="Primary contact number with country code"
                      error={showError('practice.phone')}
                    >
                      <input
                        id="practice-phone"
                        type="tel"
                        autoComplete="tel"
                        className={fieldControlClass(!!showError('practice.phone'))}
                        placeholder="+91 98765 43210"
                        value={formData.practice.phone}
                        onChange={(e) => handleInputChange('Practice', 'phone', e.target.value)}
                        aria-invalid={!!showError('practice.phone')}
                        aria-required
                      />
                    </WizardField>

                    <WizardField
                      id="practice-email"
                      label="Email"
                      required
                      hint="Used for notifications and billing receipts"
                      error={showError('practice.email')}
                    >
                      <input
                        id="practice-email"
                        type="email"
                        autoComplete="email"
                        className={fieldControlClass(!!showError('practice.email'))}
                        placeholder="admin@yourpractice.com"
                        value={formData.practice.email}
                        onChange={(e) => handleInputChange('Practice', 'email', e.target.value)}
                        aria-invalid={!!showError('practice.email')}
                        aria-required
                      />
                    </WizardField>

                    <WizardField
                      id="practice-website"
                      label="Website"
                      hint="Public website or Google Business profile URL"
                    >
                      <input
                        id="practice-website"
                        type="url"
                        className={fieldControlClass()}
                        placeholder="https://…"
                        value={formData.practice.website}
                        onChange={(e) => handleInputChange('Practice', 'website', e.target.value)}
                      />
                    </WizardField>

                    <WizardField
                      id="practice-logo"
                      label="Logo"
                      hint="PNG or JPG, recommended square image"
                    >
                      <input
                        id="practice-logo"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-teal-800 hover:file:bg-teal-100 file:cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setFormData((prev) => ({
                            ...prev,
                            practice: { ...prev.practice, logo: file ?? null },
                          }));
                        }}
                      />
                      {formData.practice.logo && typeof formData.practice.logo !== 'string' ? (
                        <p className="mt-1 text-xs text-teal-700">Selected: {formData.practice.logo.name}</p>
                      ) : null}
                    </WizardField>
                  </div>
                </section>
              )}

              {/* Locations */}
              {activeTab === 'locations' && (
                <section className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Locations</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Add each branch or department site. Name and address are required.
                    </p>
                    {showError('locations') ? (
                      <p className="mt-2 text-xs font-medium text-rose-600" role="alert">
                        {showError('locations')}
                      </p>
                    ) : null}
                  </div>

                  {formData.locations.map((location, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                          Location {index + 1}
                        </h3>
                        {index > 0 ? (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-lg px-2 py-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WizardField
                          id={`loc-${index}-name`}
                          label="Name"
                          required
                          hint="e.g. Main campus, Downtown clinic"
                          error={showError(`locations.${index}.name`)}
                        >
                          <input
                            id={`loc-${index}-name`}
                            type="text"
                            className={fieldControlClass(!!showError(`locations.${index}.name`))}
                            placeholder="Location name"
                            value={location.name}
                            onChange={(e) =>
                              handleInputChange('Locations', 'name', e.target.value, index)
                            }
                            aria-required
                          />
                        </WizardField>
                        <WizardField
                          id={`loc-${index}-address`}
                          label="Address"
                          required
                          error={showError(`locations.${index}.address`)}
                        >
                          <input
                            id={`loc-${index}-address`}
                            type="text"
                            className={fieldControlClass(!!showError(`locations.${index}.address`))}
                            placeholder="Street address"
                            value={location.address}
                            onChange={(e) =>
                              handleInputChange('Locations', 'address', e.target.value, index)
                            }
                            aria-required
                          />
                        </WizardField>
                        <WizardField id={`loc-${index}-city`} label="City">
                          <input
                            id={`loc-${index}-city`}
                            type="text"
                            className={fieldControlClass()}
                            placeholder="City"
                            value={location.city}
                            onChange={(e) =>
                              handleInputChange('Locations', 'city', e.target.value, index)
                            }
                          />
                        </WizardField>
                        <WizardField id={`loc-${index}-state`} label="State">
                          <input
                            id={`loc-${index}-state`}
                            type="text"
                            className={fieldControlClass()}
                            placeholder="State"
                            value={location.state}
                            onChange={(e) =>
                              handleInputChange('Locations', 'state', e.target.value, index)
                            }
                          />
                        </WizardField>
                        <WizardField id={`loc-${index}-postal`} label="Postal code">
                          <input
                            id={`loc-${index}-postal`}
                            type="text"
                            className={fieldControlClass()}
                            placeholder="PIN / ZIP"
                            value={location.postalCode}
                            onChange={(e) =>
                              handleInputChange('Locations', 'postalCode', e.target.value, index)
                            }
                          />
                        </WizardField>
                        <WizardField id={`loc-${index}-phone`} label="Phone">
                          <input
                            id={`loc-${index}-phone`}
                            type="tel"
                            className={fieldControlClass()}
                            placeholder="Location phone"
                            value={location.phone}
                            onChange={(e) =>
                              handleInputChange('Locations', 'phone', e.target.value, index)
                            }
                          />
                        </WizardField>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addLocation}
                    className="w-full flex justify-center items-center gap-2 px-4 py-3.5 border-2 border-dashed border-teal-200 rounded-xl text-teal-800 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-all"
                  >
                    <Plus className="h-5 w-5" />
                    Add another location
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!validateStep()) return;
                      await handleSaveLocations();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    disabled={isSubmitting || !isCurrentStepValid}
                  >
                    {isSubmitting ? 'Saving…' : 'Save locations'}
                  </button>
                </section>
              )}

              {/* Practice roles */}
              {activeTab === 'practiceRoles' && (
                <section className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Practice roles</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Optional custom roles (e.g. Receptionist, Lab Tech). You can continue without adding any.
                    </p>
                  </div>

                  {formData.practiceRoles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                      No custom roles yet. Add one below, or continue to invite users.
                    </div>
                  ) : null}

                  {formData.practiceRoles.map((role, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Role {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removePracticeRole(index)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                      <WizardField
                        id={`role-${index}-name`}
                        label="Role name"
                        required
                        hint="Shown when assigning users"
                        error={showError(`practiceRoles.${index}.name`)}
                      >
                        <input
                          id={`role-${index}-name`}
                          type="text"
                          className={fieldControlClass(!!showError(`practiceRoles.${index}.name`))}
                          placeholder="e.g. Front desk"
                          value={role.name}
                          onChange={(e) => handlePracticeRoleChange(index, 'name', e.target.value)}
                          aria-required
                        />
                      </WizardField>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPracticeRole}
                    className="w-full flex justify-center items-center gap-2 px-4 py-3.5 border-2 border-dashed border-teal-200 rounded-xl text-teal-800 bg-teal-50/40 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <Plus className="h-5 w-5" />
                    Add role
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!validateStep()) return;
                      await handleSavePracticeRoles();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting || !isCurrentStepValid}
                  >
                    {isSubmitting ? 'Saving…' : 'Save roles'}
                  </button>
                </section>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <section className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">App users</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Invite team members now, or skip and add them later from Settings.
                    </p>
                  </div>

                  {formData.additionalUsers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                      No additional users yet. You can continue without inviting anyone.
                    </div>
                  ) : null}

                  {formData.additionalUsers.map((u, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">User {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeUser(index)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WizardField
                          id={`user-${index}-first`}
                          label="First name"
                          required
                          error={showError(`users.${index}.firstName`)}
                        >
                          <input
                            id={`user-${index}-first`}
                            type="text"
                            className={fieldControlClass(!!showError(`users.${index}.firstName`))}
                            value={u.firstName}
                            onChange={(e) =>
                              handleInputChange('AdditionalUsers', 'firstName', e.target.value, index)
                            }
                            aria-required
                          />
                        </WizardField>
                        <WizardField
                          id={`user-${index}-last`}
                          label="Last name"
                          required
                          error={showError(`users.${index}.lastName`)}
                        >
                          <input
                            id={`user-${index}-last`}
                            type="text"
                            className={fieldControlClass(!!showError(`users.${index}.lastName`))}
                            value={u.lastName}
                            onChange={(e) =>
                              handleInputChange('AdditionalUsers', 'lastName', e.target.value, index)
                            }
                            aria-required
                          />
                        </WizardField>
                        <WizardField
                          id={`user-${index}-role`}
                          label="Role"
                          hint="From practice roles you created"
                        >
                          <select
                            id={`user-${index}-role`}
                            className={fieldControlClass()}
                            value={u.role || ''}
                            onChange={(e) =>
                              handleInputChange('AdditionalUsers', 'role', e.target.value, index)
                            }
                          >
                            <option value="">Select role</option>
                            {roleOptions.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </WizardField>
                        <WizardField id={`user-${index}-loc`} label="Location">
                          <select
                            id={`user-${index}-loc`}
                            className={fieldControlClass()}
                            value={u.locationId || ''}
                            onChange={(e) =>
                              handleInputChange('AdditionalUsers', 'locationId', e.target.value, index)
                            }
                          >
                            <option value="">Select location</option>
                            {locationOptions.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        </WizardField>
                        <WizardField
                          id={`user-${index}-email`}
                          label="Email"
                          required
                          error={showError(`users.${index}.email`)}
                        >
                          <input
                            id={`user-${index}-email`}
                            type="email"
                            className={fieldControlClass(!!showError(`users.${index}.email`))}
                            value={u.email}
                            onChange={(e) =>
                              handleInputChange('AdditionalUsers', 'email', e.target.value, index)
                            }
                            aria-required
                          />
                        </WizardField>
                        <WizardField id={`user-${index}-phone`} label="Phone">
                          <input
                            id={`user-${index}-phone`}
                            type="tel"
                            className={fieldControlClass()}
                            value={u.phone}
                            onChange={(e) =>
                              handleInputChange('AdditionalUsers', 'phone', e.target.value, index)
                            }
                          />
                        </WizardField>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addUser}
                    className="w-full flex justify-center items-center gap-2 px-4 py-3.5 border-2 border-dashed border-teal-200 rounded-xl text-teal-800 bg-teal-50/40 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <Plus className="h-5 w-5" />
                    Add user
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!validateStep()) return;
                      await handleSaveUsers();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting || !isCurrentStepValid}
                  >
                    {isSubmitting ? 'Saving…' : 'Save users'}
                  </button>
                </section>
              )}

              {/* Subscription */}
              {activeTab === 'subscription' && (
                <section className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-7 shadow-sm space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Choose your plan</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Secure payment via Razorpay — UPI, cards, netbanking, or wallets.
                    </p>
                    {showError('subscriptionPlan') ? (
                      <p className="mt-2 text-xs font-medium text-rose-600" role="alert">
                        {showError('subscriptionPlan')}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['UPI', 'Cards', 'Netbanking', 'Wallets'].map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-100"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    role="radiogroup"
                    aria-label="Subscription plan"
                  >
                    {SUBSCRIPTION_PLANS.map((plan) => {
                      const selected = formData.subscriptionPlan === plan.name;
                      return (
                        <button
                          key={plan.name}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => handleInputChange('SubscriptionPlan', '', plan.name)}
                          className={`relative text-left rounded-2xl border p-5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                            selected
                              ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 shadow-md ring-1 ring-teal-400 scale-[1.02]'
                              : 'border-slate-200 hover:border-teal-300 hover:shadow-sm bg-white'
                          }`}
                        >
                          {selected ? (
                            <CheckCircle2 className="absolute top-4 right-4 h-6 w-6 text-teal-600" />
                          ) : null}
                          <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                          <p className="mt-1 text-2xl font-bold text-teal-700">
                            {plan.displayPrice}
                            <span className="text-sm font-normal text-slate-500">/month</span>
                          </p>
                          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{plan.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Footer nav */}
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-white/95 backdrop-blur border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 hidden sm:inline">Step 1 of {STEPS.length}</span>
                )}
                {!isCurrentStepValid ? (
                  <p className="text-xs text-amber-700 sm:ml-2" role="status">
                    Complete required fields{touched ? ' highlighted above' : ''} to enable Continue
                  </p>
                ) : (
                  <p className="text-xs text-teal-700 sm:ml-2 hidden sm:block" role="status">
                    Step looks good
                  </p>
                )}
              </div>

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={continueDisabled}
                  title={
                    !isCurrentStepValid
                      ? 'Complete required fields on this step before continuing'
                      : undefined
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-md shadow-teal-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      Save and continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  disabled={continueDisabled}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 disabled:opacity-45 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    'Pay & complete setup'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes onboardFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
