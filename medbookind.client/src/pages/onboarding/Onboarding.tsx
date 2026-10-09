import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Users, CreditCard, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { onboardingService} from '../../services/onboarding.service';
import { paymentService } from '../../services/payment.service';
import { SUBSCRIPTION_PLANS, type PlanName } from '@/constants/subscriptionPlans';
import { loadRazorpayScript, openRazorpayCheckout } from '@/utils/razorpayCheckout';
import { OnboardingRequest, LocationRequest, PracticeRoleRequest, UserRequest, OnboardingResponse } from '@/interfaces';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { getDashboardPathForRole } from '@/utils/dashboardPath';

type Tab = 'practice' | 'locations' | 'users' | 'subscription' | 'practiceRoles';

const Onboarding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');
  const [savedData, setSavedData] = useState<OnboardingResponse | null>(null);
  const [formData, setFormData] = useState<OnboardingRequest>({
    practice: {
      name: '',
      type: '',
      description: '',
      address: '',
      email: '',
      phone: '',
      website: '',
      logo: null // <-- allow null or File
    },
    locations: [{
      id: null,
      name: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      phone: '',
      practiceId: '', // You can set this later if needed
    }],
    practiceRoles: [],
    additionalUsers: [],
    subscriptionPlan: 'Basic',
    adminPrimaryLocationId: undefined
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingRequest, string>>>({});
  const navigate = useNavigate();
  const { user, isOnboarded, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // Move fetchSavedData to component scope so it can be used elsewhere
  const fetchSavedData = async () => {
    try {
      if (!user?.id) return; // Ensure user ID is available
      setLoading(true);
      const data = await onboardingService.getOnboardingData(user?.id);
      if (data) {
        setSavedData(data);
        setFormData({
          practice: data.practice || formData.practice,
          locations: data.locations || formData.locations,
          additionalUsers: data.additionalUsers || formData.additionalUsers,
          practiceRoles: data.practiceRoles || formData.practiceRoles,
          subscriptionPlan: data.subscriptionPlan || formData.subscriptionPlan,
          adminPrimaryLocationId: data.adminPrimaryLocationId
        });
      }
    } catch (error) {
      console.error('Failed to fetch saved onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedData();
  }, [user?.id]);

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

  const tabs = [
    { id: 'practice', label: 'Practice Details', icon: Building2 },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'practiceRoles', label: 'Practice Roles', icon: Shield },
    { id: 'users', label: 'App Users', icon: Users },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  const currentStepIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));
  const progressPercent = useMemo(
    () => Math.round(((currentStepIndex + 1) / tabs.length) * 100),
    [currentStepIndex, tabs.length]
  );

  const milestoneCompletion = useMemo(() => {
    const p = formData.practice;
    const practiceDone = !!(savedData?.practice?.id || (p.name && p.type && p.email && p.phone && p.address));
    const locationsDone =
      (savedData?.locations?.length ?? 0) > 0 ||
      formData.locations.some((l) => l.name && l.address);
    const rolesDone =
      (savedData?.practiceRoles?.length ?? 0) > 0 ||
      formData.practiceRoles.some((r) => r.name?.trim());
    const usersDone =
      formData.additionalUsers.length === 0 ||
      formData.additionalUsers.every((u) => u.firstName && u.lastName && u.email);
    const subDone = !!formData.subscriptionPlan;
    const completed = [practiceDone, locationsDone, rolesDone, usersDone, subDone].filter(Boolean).length;
    return {
      items: [
        { key: 'practice', label: 'Practice', done: practiceDone },
        { key: 'locations', label: 'Locations', done: locationsDone },
        { key: 'roles', label: 'Roles', done: rolesDone },
        { key: 'users', label: 'Users', done: usersDone },
        { key: 'subscription', label: 'Plan', done: subDone },
      ],
      completed,
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

  const handleTabClick = (index: number) => {
    setActiveTab(tabs[index].id as Tab);
    setStep(index + 1);
    setError(null);
  };

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof OnboardingRequest, string>> = {};
    switch (activeTab) {
      case 'practice':
        if (!formData.practice.name) newErrors.practice = 'Practice name is required';
        if (!formData.practice.type) newErrors.practice = 'Practice type is required';
        if (!formData.practice.email) newErrors.practice = 'Practice email is required';
        if (!formData.practice.phone) newErrors.practice = 'Practice phone is required';
        if (!formData.practice.address) newErrors.practice = 'Practice address is required';
        break;
      case 'locations':
        if (formData.locations.some(loc => !loc.name || !loc.address)) {
          newErrors.locations = 'Location name and address are required';
        }
        break;
      case 'users':
        if (formData.additionalUsers.some(user => !user.firstName || !user.lastName || !user.email)) {
          newErrors.additionalUsers = 'Name and email are required for all users';
        }
        break;
      case 'subscription':
        if (!formData.subscriptionPlan) newErrors.subscriptionPlan = 'Please select a subscription plan';
        break;
      case 'practiceRoles':
        if (
          formData.practiceRoles.length > 0 &&
          formData.practiceRoles.some((r) => !r.name?.trim())
        ) {
          newErrors.practiceRoles = 'Each role must have a name';
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add a helper to save the current tab's form
  const saveCurrentTab = async () => {
    switch (activeTab) {
      case 'practice':
        await handleSavePractice();
        break;
      case 'locations':
        await handleSaveLocations();
        break;
      case 'users':
        await handleSaveUsers();
        break;
      case 'practiceRoles':
        await handleSavePracticeRoles();
        break;
      // Add more cases if needed
    }
  };

  const handleNext = async () => {
    if (validateStep()) {
      setIsSubmitting(true);
      await saveCurrentTab();
      setIsSubmitting(false);
      setStep(step + 1);
      setActiveTab(tabs[step].id as Tab);
    }
  };

  const handleBack = () => {
    if (step <= 1) return;
    const nextStep = step - 1;
    setStep(nextStep);
    setActiveTab(tabs[nextStep - 1].id as Tab);
  };

  const handleInputChange = (
    section: keyof OnboardingRequest | 'Practice' | 'Locations' | 'AdditionalUsers' | 'SubscriptionPlan',
    field: string,
    value: string,
    index?: number
  ) => {
    if (section === 'Practice') {
      setFormData((prev: OnboardingRequest) => ({
        ...prev,
        practice: { ...prev.practice, [field]: value }
      }));
    } else if (section === 'Locations') {
      setFormData((prev: OnboardingRequest) => ({
        ...prev,
        locations: prev.locations.map((loc: LocationRequest, i: number) =>
          i === index ? { ...loc, [field]: value } : loc
        )
      }));
    } else if (section === 'AdditionalUsers') {
      setFormData((prev: OnboardingRequest) => ({
        ...prev,
        additionalUsers: prev.additionalUsers.map((user: UserRequest, i: number) =>
          i === index ? { ...user, [field]: value } : user
        )
      }));
    } else if (section === 'SubscriptionPlan') {
      setFormData((prev: OnboardingRequest) => ({
        ...prev,
        subscriptionPlan: value
      }));
    }
  };

  const addLocation = () => {
    setFormData((prev: OnboardingRequest) => ({
      ...prev,
      locations: [
        ...prev.locations,
        {
          name: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          phone: '',
          practiceId: savedData?.practice?.id || '',
        }
      ]
    }));
  };

  const removeLocation = (index: number) => {
    setFormData((prev: OnboardingRequest) => ({
      ...prev,
      locations: prev.locations.filter((_: LocationRequest, i: number) => i !== index)
    }));
  };

  const addUser = () => {
    setFormData((prev: OnboardingRequest) => ({
      ...prev,
      additionalUsers: [
        ...prev.additionalUsers,
        {
          id: null,
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: '',
          locationId: '',
          practiceId: savedData?.practice?.id || '',
        }
      ]
    }));
  };

  const removeUser = (index: number) => {
    setFormData((prev: OnboardingRequest) => ({
      ...prev,
      additionalUsers: prev.additionalUsers.filter((_: UserRequest, i: number) => i !== index)
    }));
  };

  const addPracticeRole = () => {
    setFormData((prev: OnboardingRequest) => ({
      ...prev,
      practiceRoles: [
        ...prev.practiceRoles,
        {
          id: null,
          name: '',
          practiceId: savedData?.practice?.id || '',
        }
      ]
    }));
  };

  const removePracticeRole = (index: number) => {
    setFormData((prev: OnboardingRequest) => ({
      ...prev,
      practiceRoles: prev.practiceRoles.filter((_, i) => i !== index)
    }));
  };

  const handlePracticeRoleChange = (index: number, field: string, value: string) => {
    setFormData((prev: OnboardingRequest) => ({
      ...prev,
      practiceRoles: prev.practiceRoles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role
      )
    }));
  };

  const handleSavePractice = async () => {
    try {
      setIsSubmitting(true);
      const practiceRes = await onboardingService.savePracticeSection(formData.practice);
      setSavedData((prev) => ({
        ...prev,
        practice: practiceRes,
        locations: prev?.locations ?? [],
        additionalUsers: prev?.additionalUsers ?? [],
        practiceRoles: prev?.practiceRoles ?? [],
        subscriptionPlan: prev?.subscriptionPlan ?? '',
        adminPrimaryLocationId: prev?.adminPrimaryLocationId ?? undefined
      }));
      await fetchSavedData();
      setApiStatus('Practice details saved!');
    } catch (error: any) {
      setError(error.message || 'Failed to save practice details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLocations = async () => {
    try {
      setIsSubmitting(true);
      formData.locations.forEach(ele => {
        ele.practiceId = savedData?.practice?.id || '';
      });
      console.log('locations:', formData.locations);
      await onboardingService.saveLocationsSection(formData.locations);
      await fetchSavedData();
      setApiStatus('Locations saved!');
    } catch (error: any) {
      setError(error.message || 'Failed to save locations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUsers = async () => {
    try {
      setIsSubmitting(true);
      const cleanedUsers = formData.additionalUsers.map(u => ({
        ...u,
        locationId: u.locationId || '',
        role: u.role || ''
      }));
      await onboardingService.saveUsersSection(cleanedUsers);
      await fetchSavedData();
      setApiStatus('Users saved!');
    } catch (error: any) {
      setError(error.message || 'Failed to save users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePracticeRoles = async () => {
      try {
        setIsSubmitting(true);
        console.log('Saving practice roles:', formData.practiceRoles);
        if (formData.practiceRoles.length > 0) {
          const rolesToSave = formData.practiceRoles.map((role) => ({
            ...role,
            practiceId: savedData?.practice?.id || role.practiceId,
          }));
          await onboardingService.savePracticeRolesSection(rolesToSave);
        }
        await fetchSavedData();
        setApiStatus('Practice roles saved!');
      } catch (error: any) {
        setError(error.message || 'Failed to save practice roles');
      } finally {
        setIsSubmitting(false);
      }
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
            await paymentService.verifyPayment(
              payment,
              plan,
              formData.adminPrimaryLocationId
            );
            finishOnboardingAfterPayment();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Payment verification failed';
            setError(msg);
          } finally {
            setIsSubmitting(false);
          }
        },
        () => {
          setIsSubmitting(false);
          setError('Payment cancelled. Select a plan and try again.');
        },
        (message) => {
          setIsSubmitting(false);
          setError(message);
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

  // Repeat for Users and Subscription...

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* API Status Display */}
          {apiStatus && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-700 whitespace-pre-line">{apiStatus}</p>
                </div>
              </div>
            </div>
          )}

          {/* Onboarding progress */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-8 border-b border-gray-100">
            <div className="flex flex-col space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Practice setup</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Step {currentStepIndex + 1} of {tabs.length} · Wizard position {progressPercent}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Checklist completion</p>
                  <p className="text-lg font-semibold text-cyan-700">{milestoneCompletion.overallPercent}%</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Current step</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/80 border border-cyan-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {milestoneCompletion.items.map((m) => (
                  <span
                    key={m.key}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
                      m.done ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white/70 border-gray-200 text-gray-500'
                    }`}
                  >
                    {m.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-2">
                {tabs.map((tab, index) => (
                  <div key={tab.id} className="flex-1 flex flex-col md:flex-row md:items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTabClick(index)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 text-left ${
                        index < step - 1
                          ? 'bg-green-50 text-green-700 shadow-sm border border-green-100'
                          : index === step - 1
                            ? 'bg-cyan-50 text-cyan-800 shadow-md border border-cyan-200'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm shrink-0">
                        {index < step - 1 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <tab.icon className={`h-5 w-5 ${index === step - 1 ? 'text-cyan-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium leading-tight">{tab.label}</span>
                    </button>
                    {index < tabs.length - 1 && (
                      <div className="hidden md:flex flex-1 items-center px-1 min-w-[1rem]">
                        <div className="h-0.5 w-full bg-gray-200 rounded">
                          <div
                            className={`h-0.5 rounded transition-all duration-300 ${index < step - 1 ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {error && (
              <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </div>
                      </div>
                    )}

            <form className="space-y-8">
              {/* Practice Details */}
              {activeTab === 'practice' && (
                <div className="space-y-6 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900">Practice Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Practice Name</label>
                        <input
                          type="text"
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter practice name"
                          value={formData.practice.name}
                          onChange={(e) => handleInputChange('Practice', 'name', e.target.value)}
                        />
                      </div>
                      {/* Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Practice Type</label>
                        <select
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          value={formData.practice.type}
                          onChange={(e) => handleInputChange('Practice', 'type', e.target.value)}
                        >
                        <option value="">Select a type</option>
                        <option value="Clinic">Clinic</option>
                          <option value="Hospital">Hospital</option>
                        <option value="Medical Center">Medical Center</option>
                        <option value="Specialty Practice">Specialty Practice</option>
                        </select>
                      </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          rows={3}
                        placeholder="Enter practice description"
                          value={formData.practice.description}
                          onChange={(e) => handleInputChange('Practice', 'description', e.target.value)}
                        />
                      </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter practice address"
                          value={formData.practice.address}
                          onChange={(e) => handleInputChange('Practice', 'address', e.target.value)}
                        />
                      </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter practice phone"
                          value={formData.practice.phone}
                          onChange={(e) => handleInputChange('Practice', 'phone', e.target.value)}
                        />
                      </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter practice email"
                          value={formData.practice.email}
                          onChange={(e) => handleInputChange('Practice', 'email', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <input
                          type="url"
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter website URL"
                          value={formData.practice.website}
                          onChange={(e) => handleInputChange('Practice', 'website', e.target.value)}
                        />
                      </div>

                      {/* Logo */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Logo</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-xl file:border-0
                            file:text-sm file:font-semibold
                            file:bg-cyan-50 file:text-cyan-700
                            hover:file:bg-cyan-100"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setFormData((prev) => ({
                              ...prev,
                              practice: {
                                ...prev.practice,
                                logo: file
                              }
                            }));
                          }}
                        />
                        {formData.practice.logo && typeof formData.practice.logo !== 'string' && (
                          <div className="mt-2 text-xs text-gray-500">
                            Selected: {formData.practice.logo.name}
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              )}

              {/* Locations */}
                {activeTab === 'locations' && (
                  <div className="space-y-6">
                  {formData.locations.map((location: any, index: number) => (
                    <div key={index} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Location {index + 1}</h3>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors duration-200"
                          >
                            Remove Location
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Name</label>
                              <input
                                type="text"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter location name"
                                value={location.name}
                                onChange={(e) => handleInputChange('Locations', 'name', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Address</label>
                              <input
                                type="text"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter location address"
                                value={location.address}
                                onChange={(e) => handleInputChange('Locations', 'address', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">City</label>
                              <input
                                type="text"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter city"
                                value={location.city}
                                onChange={(e) => handleInputChange('Locations', 'city', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">State</label>
                              <input
                                type="text"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter state"
                                value={location.state}
                                onChange={(e) => handleInputChange('Locations', 'state', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                              <input
                                type="text"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter postal code"
                                value={location.postalCode}
                                onChange={(e) => handleInputChange('Locations', 'postalCode', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Phone</label>
                              <input
                                type="tel"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter location phone"
                                value={location.phone}
                                onChange={(e) => handleInputChange('Locations', 'phone', e.target.value, index)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addLocation}
                    className="w-full flex justify-center items-center px-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200"
                      >
                    <MapPin className="h-5 w-5 mr-2" />
                        Add Another Location
                      </button>
                      <button
      type="button"
      onClick={handleSaveLocations}
      className="mt-4 px-6 py-3 rounded-xl bg-cyan-600 text-white font-medium"
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Saving...' : 'Save Locations'}
    </button>
                  </div>
                )}

              {/* Users */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                  {formData.additionalUsers.map((user: UserRequest, index: number) => (
                    <div key={index} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">User {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeUser(index)}
                          className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors duration-200"
                        >
                          Remove User
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">First Name</label>
                              <input
                                type="text"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter first name"
                                value={user.firstName}
                                onChange={(e) => handleInputChange('AdditionalUsers', 'firstName', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Last Name</label>
                              <input
                                type="text"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter last name"
                                value={user.lastName}
                                onChange={(e) => handleInputChange('AdditionalUsers', 'lastName', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Role</label>
                              <select
                                className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                                value={user.role || ''}
                                onChange={(e) => handleInputChange('AdditionalUsers', 'role', e.target.value, index)}
                              >
                                <option value="">Select Role</option>
                                {roleOptions.map((role) => (
                                  <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Location</label>
                              <select
                                className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                                value={user.locationId || ''}
                                onChange={(e) => handleInputChange('AdditionalUsers', 'locationId', e.target.value, index)}
                              >
                                <option value="">Select Location</option>
                                {locationOptions.map((loc) => (
                                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Email</label>
                              <input
                                type="email"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter user email"
                                value={user.email}
                            onChange={(e) => handleInputChange('AdditionalUsers', 'email', e.target.value, index)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Phone</label>
                              <input
                                type="tel"
                            className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
                            placeholder="Enter user phone"
                                value={user.phone}
                            onChange={(e) => handleInputChange('AdditionalUsers', 'phone', e.target.value, index)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addUser}
                    className="w-full flex justify-center items-center px-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200"
                      >
                    <Users className="h-5 w-5 mr-2" />
                        Add Another User
                      </button>
                      <button
      type="button"
      onClick={handleSaveUsers}
      className="mt-4 px-6 py-3 rounded-xl bg-cyan-600 text-white font-medium"
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Saving...' : 'Save Users'}
    </button>
                  </div>
                )}

              {/* Practice Roles */}
                {activeTab === 'practiceRoles' && (
                  <div className="space-y-6">
    {formData.practiceRoles.map((role: PracticeRoleRequest, index: number) => (
      <div key={index} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Role {index + 1}</h3>
          {index > 0 && (
            <button
              type="button"
              onClick={() => removePracticeRole(index)}
              className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors duration-200"
            >
              Remove Role
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role Name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 border-gray-300"
              placeholder="Enter role name"
              value={role.name}
              onChange={(e) => handlePracticeRoleChange(index, 'name', e.target.value)}
            />
          </div>
        </div>
      </div>
    ))}
    <button
      type="button"
      onClick={addPracticeRole}
      className="w-full flex justify-center items-center px-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200"
    >
      Add Another Role
    </button>
    <button
      type="button"
      onClick={handleSavePracticeRoles}
      className="mt-4 px-6 py-3 rounded-xl bg-cyan-600 text-white font-medium"
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Saving...' : 'Save Roles'}
    </button>
  </div>
)}

              {/* Subscription */}
                {activeTab === 'subscription' && (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Plan</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Secure payment via Razorpay — UPI (GPay, PhonePe, Paytm), cards, netbanking, or wallets.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {['UPI', 'Cards', 'Netbanking', 'Wallets'].map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-100"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <div
                        key={plan.name}
                        className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          formData.subscriptionPlan === plan.name
                            ? 'border-cyan-500 bg-cyan-50 shadow-md'
                            : 'border-gray-200 hover:border-cyan-300'
                        }`}
                        onClick={() => handleInputChange('SubscriptionPlan', '', plan.name)}
                      >
                        {formData.subscriptionPlan === plan.name && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                      </div>
                        )}
                        <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                        <p className="mt-1 text-2xl font-bold text-cyan-700">
                          {plan.displayPrice}
                          <span className="text-sm font-normal text-gray-500">/month</span>
                        </p>
                        <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                      </div>
                    ))}
                  </div>
                  </div>
                )}

              <div className="mt-8 flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 textBase font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                  </button>
                )}
                {step < tabs.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center px-6 py-3 border border-transparent textBase font-medium rounded-xl text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    Save and Continue
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCompleteSetup}
                    className="inline-flex items-center px-6 py-3 border border-transparent textBase font-medium rounded-xl text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      'Pay & complete setup'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;