import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Lock, Mail, Eye, EyeOff, Building2, ArrowRight, Phone, ShieldCheck } from 'lucide-react';
import { LoginDto, RegisterDto } from '../../services/auth.service';
import { authService, type OtpChannel } from '../../services/auth.service';
import OtpInput, { EMPTY_OTP, otpFromDigits } from '@/components/auth/OtpInput';
import { applyOtpToDigits } from '@/utils/otpHelpers';
import { getDashboardPathForRole } from '@/utils/dashboardPath';
import { REGISTER_ROLES } from '@/utils/passwordStrength';
import PasswordStrengthBar from '@/components/auth/PasswordStrengthBar';
import { getPasswordStrength } from '@/utils/passwordStrength';

type AuthMode = 'login' | 'register';
type AuthView = 'login' | 'register' | 'forgot' | 'reset';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [view, setView] = useState<AuthView>('login');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regPasswordStrength, setRegPasswordStrength] = useState(0);
  const [formData, setFormData] = useState<LoginDto | RegisterDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Admin',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetChannel, setResetChannel] = useState<OtpChannel>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [activeResetTab, setActiveResetTab] = useState<'forgot' | 'reset'>('forgot');
  const [resetOtpDigits, setResetOtpDigits] = useState([...EMPTY_OTP]);
  const [regEmailOtpDigits, setRegEmailOtpDigits] = useState([...EMPTY_OTP]);
  const [regPhoneOtpDigits, setRegPhoneOtpDigits] = useState([...EMPTY_OTP]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  
  const { login, user, register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (!user.isOnboarded) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(getDashboardPathForRole(user.role), { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Only redirect if user is already logged in and token is valid
  // React.useEffect(() => {
  //   const checkAuth = async () => {
  //     const storedToken = localStorage.getItem('token');
  //     // Only redirect if user exists, is onboarded, and token is valid
  //     if (user && user.isOnboarded && storedToken) {
  //       const isValid = await authService.validateToken(storedToken);
  //       if (isValid) {
  //         navigate(`/${user.role}/dashboard`);
  //       }
  //       else{
  //         navigate('/auth');
  //       }
  //     }
  //   };
  //   checkAuth();
  // }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: LoginDto | RegisterDto) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (mode === 'login') {
        const loggedInUser = await login({ email, password });

        // Validate token after login
        const storedToken = localStorage.getItem('token');
        const isValid = storedToken ? await authService.validateToken(storedToken) : false;
        if (!isValid) {
          throw new Error('Invalid or expired token. Please login again.');
        }

        // Check if we need to redirect back to onboarding
        const from = location.state?.from;
        if (!loggedInUser.isOnboarded) {
          navigate('/onboarding');
        } else {
          navigate(getDashboardPathForRole(loggedInUser.role));
        }
      } else {
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const phone = formData.get('phone') as string;

        if (!email || !password || !firstName || !lastName) {
          throw new Error('Please fill in all required fields');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (getPasswordStrength(password) < 2) {
          throw new Error('Use a stronger password (8+ chars, upper case, number)');
        }

        const selectedRole = (formData as RegisterDto).role || 'Admin';
        const emailOtp = otpFromDigits(regEmailOtpDigits);
        const phoneOtp = otpFromDigits(regPhoneOtpDigits);
        const hasEmailProof = emailVerified || emailOtp.length === 6;
        const hasPhoneProof = phoneVerified || phoneOtp.length === 6;
        if (!hasEmailProof && !hasPhoneProof) {
          throw new Error(
            'Verify your email or phone: send a code, enter all 6 digits, then Verify (or include the code when you register).'
          );
        }

        const response = await authService.register({
          email,
          password,
          firstName,
          lastName,
          role: selectedRole,
          Phone: phone,
          confirmPassword: password,
          emailOtp: hasEmailProof && emailOtp.length === 6 ? emailOtp : undefined,
          phoneOtp: hasPhoneProof && phoneOtp.length === 6 ? phoneOtp : undefined,
        });
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('auth_user', JSON.stringify(response.user));
          if (!response.user.isOnboarded) {
            navigate('/onboarding');
          } else {
            navigate(getDashboardPathForRole(response.user.role));
          }
        } else {
          throw new Error('Registration completed but no token received');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthView = (v: AuthView) => {
    setView(v);
    setError(null);
    setResetStatus(null);
    if (v === 'login') setMode('login');
    if (v === 'register') setMode('register');
    if (v === 'forgot') setActiveResetTab('forgot');
    if (v === 'reset') setActiveResetTab('reset');
  };

  const toggleMode = () => {
    const next = mode === 'login' ? 'register' : 'login';
    setMode(next);
    setView(next);
    setError('');
    setVerifyStatus(null);
    setDevOtpHint(null);
    setEmailVerified(false);
    setPhoneVerified(false);
    setRegEmailOtpDigits([...EMPTY_OTP]);
    setRegPhoneOtpDigits([...EMPTY_OTP]);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'Admin',
      phone: ''
    });
  };

  function getPasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  const getRegisterEmail = () => formData.email?.trim() || '';
  const getRegisterPhone = () => (formData as RegisterDto).phone?.trim() || '';

  const handleSendRegisterEmailOtp = async () => {
    setVerifyStatus(null);
    setDevOtpHint(null);
    setEmailVerified(false);
    const email = getRegisterEmail();
    if (!email || !email.includes('@')) {
      setVerifyStatus('Enter a valid email above first.');
      return;
    }
    try {
      const res = await authService.sendOtp({ channel: 'email', email, purpose: 'register_email' });
      setVerifyStatus(res.message);
      if (res.otp) {
        setDevOtpHint(`Dev email code: ${res.otp}`);
        setRegEmailOtpDigits(applyOtpToDigits(res.otp));
      }
    } catch (err: unknown) {
      setVerifyStatus(err instanceof Error ? err.message : 'Failed to send code');
    }
  };

  const handleVerifyRegisterEmail = async () => {
    const email = getRegisterEmail();
    const otp = otpFromDigits(regEmailOtpDigits);
    if (!email) {
      setVerifyStatus('Enter your email first.');
      return;
    }
    if (otp.length !== 6) {
      setVerifyStatus('Enter the full 6-digit email code.');
      return;
    }
    try {
      await authService.verifyOtp({
        channel: 'email',
        email,
        purpose: 'register_email',
        otp,
      });
      setEmailVerified(true);
      setVerifyStatus('Email verified. You can create your account.');
    } catch (err: unknown) {
      setEmailVerified(false);
      setVerifyStatus(err instanceof Error ? err.message : 'Invalid or expired code');
    }
  };

  const handleSendRegisterPhoneOtp = async () => {
    setVerifyStatus(null);
    setDevOtpHint(null);
    setPhoneVerified(false);
    const phone = getRegisterPhone();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setVerifyStatus('Enter a valid phone number above first.');
      return;
    }
    try {
      const res = await authService.sendOtp({ channel: 'phone', phone, purpose: 'register_phone' });
      setVerifyStatus(res.message);
      if (res.otp) {
        setDevOtpHint(`Dev SMS code: ${res.otp}`);
        setRegPhoneOtpDigits(applyOtpToDigits(res.otp));
      }
    } catch (err: unknown) {
      setVerifyStatus(err instanceof Error ? err.message : 'Failed to send code');
    }
  };

  const handleVerifyRegisterPhone = async () => {
    const phone = getRegisterPhone();
    const otp = otpFromDigits(regPhoneOtpDigits);
    if (!phone) {
      setVerifyStatus('Enter your phone number first.');
      return;
    }
    if (otp.length !== 6) {
      setVerifyStatus('Enter the full 6-digit phone code.');
      return;
    }
    try {
      await authService.verifyOtp({
        channel: 'phone',
        phone,
        purpose: 'register_phone',
        otp,
      });
      setPhoneVerified(true);
      setVerifyStatus('Phone verified. You can create your account.');
    } catch (err: unknown) {
      setPhoneVerified(false);
      setVerifyStatus(err instanceof Error ? err.message : 'Invalid or expired code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen">
        {/* Left Side - Logo and Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-600 to-blue-600 items-center justify-center p-12">
          <div className="max-w-md">
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <Building2 className="h-10 w-10 text-cyan-600" />
              </div>
              <h1 className="text-3xl font-bold text-white">MedBook India</h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Transform Your Healthcare Practice
            </h2>
            <p className="text-xl text-cyan-100">
              Join the digital healthcare revolution with India's leading practice management system.
            </p>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl shadow-lg mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MedBook India</h1>
            </div>

            {/* Auth Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {view === 'login' && 'Welcome back'}
                  {view === 'register' && 'Create account'}
                  {view === 'forgot' && 'Forgot password'}
                  {view === 'reset' && 'Reset password'}
                </h2>
                <p className="mt-2 text-gray-600 text-sm">
                  {view === 'login' && 'Sign in with your email and password'}
                  {view === 'register' && 'Register with email/phone OTP verification'}
                  {view === 'forgot' && 'We will send a verification code'}
                  {view === 'reset' && 'Enter OTP and your new password'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1 mb-6 p-1 bg-gray-100 rounded-lg">
                {(
                  [
                    { id: 'login' as AuthView, label: 'Login' },
                    { id: 'register' as AuthView, label: 'Register' },
                    { id: 'forgot' as AuthView, label: 'Forgot' },
                    { id: 'reset' as AuthView, label: 'Reset' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAuthView(tab.id)}
                    className={`py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                      view === tab.id
                        ? 'bg-white text-cyan-700 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
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

              {/* Hide login/register form when forgot/reset is active */}
              {(view === 'login' || view === 'register') && (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <div className="relative">
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          placeholder="John"
                          value={(formData as RegisterDto).firstName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <div className="relative">
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          placeholder="Doe"
                          value={(formData as RegisterDto).lastName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  )}

                  {mode === 'register' && (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-3 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => {
                            handleChange(e);
                            setEmailVerified(false);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {mode === 'register' && (
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        required
                        className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                        value={(formData as RegisterDto).role}
                        onChange={handleChange}
                      >
                        {REGISTER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Admin completes onboarding; other roles go to their dashboard.
                      </p>
                    </div>
                  )}

                  {mode === 'register' && (
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          placeholder="+91 9876543210"
                          value={(formData as RegisterDto).phone}
                          onChange={(e) => {
                            handleChange(e);
                            setPhoneVerified(false);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {mode === 'register' && (
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-cyan-800">
                        <ShieldCheck className="h-4 w-4" />
                        Verify email or phone (one required)
                      </div>
                      <p className="text-xs text-gray-600">
                        Send a code to either your email or phone, enter all 6 digits, then click Verify.
                        In dev, the code also appears in the yellow box below.
                      </p>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">Option A — Email</p>
                        <button
                          type="button"
                          onClick={handleSendRegisterEmailOtp}
                          className="text-sm text-cyan-700 font-medium hover:underline"
                        >
                          {emailVerified ? '✓ Email verified' : 'Send code to email'}
                        </button>
                        {!emailVerified && (
                          <>
                            <OtpInput
                              digits={regEmailOtpDigits}
                              onChange={(i, v) => {
                                const next = [...regEmailOtpDigits];
                                next[i] = v;
                                setRegEmailOtpDigits(next);
                              }}
                              idPrefix="reg-email-otp"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyRegisterEmail}
                              className="text-sm py-1.5 px-3 bg-cyan-600 text-white rounded-lg"
                            >
                              Verify email
                            </button>
                          </>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-cyan-100 pt-3">
                        <p className="text-xs font-medium text-gray-700">Option B — Phone</p>
                        <button
                          type="button"
                          onClick={handleSendRegisterPhoneOtp}
                          className="text-sm text-cyan-700 font-medium hover:underline"
                        >
                          {phoneVerified ? '✓ Phone verified' : 'Send SMS code'}
                        </button>
                        {!phoneVerified && (
                          <>
                            <OtpInput
                              digits={regPhoneOtpDigits}
                              onChange={(i, v) => {
                                const next = [...regPhoneOtpDigits];
                                next[i] = v;
                                setRegPhoneOtpDigits(next);
                              }}
                              idPrefix="reg-phone-otp"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyRegisterPhone}
                              className="text-sm py-1.5 px-3 bg-cyan-600 text-white rounded-lg"
                            >
                              Verify phone
                            </button>
                          </>
                        )}
                      </div>

                      {verifyStatus && <p className="text-xs text-cyan-800">{verifyStatus}</p>}
                      {devOtpHint && (
                        <p className="text-xs font-mono bg-amber-100 text-amber-900 p-2 rounded">{devOtpHint}</p>
                      )}
                    </div>
                  )}

                  {mode === 'login' && (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-3 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="block w-full pl-10 pr-10 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => {
                          handleChange(e);
                          if (mode === 'register') {
                            setRegPasswordStrength(getPasswordStrength(e.target.value));
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {mode === 'register' && (
                      <div className="mt-2">
                        <PasswordStrengthBar password={formData.password} />
                      </div>
                    )}
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {confirmPassword && confirmPassword !== formData.password && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="text-sm text-cyan-600 hover:underline"
                        onClick={() => setAuthView('forgot')}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        mode === 'login' ? 'Sign in' : 'Create account'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Forgot / Reset Password */}
              {(view === 'forgot' || view === 'reset') && (
                <div className="space-y-4">
                  <div className="flex border-b">
                    <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-semibold ${activeResetTab === 'forgot' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-gray-500'}`}
                      onClick={() => setAuthView('forgot')}
                    >
                      Forgot password
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-semibold ${activeResetTab === 'reset' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-gray-500'}`}
                      onClick={() => setAuthView('reset')}
                    >
                      Reset password
                    </button>
                  </div>

                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm rounded-md ${resetChannel === 'email' ? 'bg-white shadow text-cyan-700' : 'text-gray-600'}`}
                      onClick={() => setResetChannel('email')}
                    >
                      <Mail className="h-4 w-4" /> Email OTP
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm rounded-md ${resetChannel === 'phone' ? 'bg-white shadow text-cyan-700' : 'text-gray-600'}`}
                      onClick={() => setResetChannel('phone')}
                    >
                      <Phone className="h-4 w-4" /> Phone OTP
                    </button>
                  </div>

                  {activeResetTab === 'forgot' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setResetStatus(null);
                        setDevOtpHint(null);
                        try {
                          const res = await authService.requestPasswordReset({
                            channel: resetChannel,
                            email: resetChannel === 'email' ? resetEmail : undefined,
                            phone: resetChannel === 'phone' ? resetPhone : undefined,
                          });
                          setAuthView('reset');
                          setResetStatus(res.message);
                          if (res.otp) {
                            setDevOtpHint(`Dev code: ${res.otp}`);
                            setResetOtpDigits(applyOtpToDigits(res.otp));
                          }
                        } catch (err: unknown) {
                          setResetStatus(err instanceof Error ? err.message : 'Failed to send OTP');
                        }
                      }}
                      className="space-y-4"
                    >
                      {resetChannel === 'email' ? (
                        <input
                          type="email"
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl"
                          placeholder="Registered email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      ) : (
                        <input
                          type="tel"
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl"
                          placeholder="+91 9876543210"
                          value={resetPhone}
                          onChange={(e) => setResetPhone(e.target.value)}
                        />
                      )}
                      <button
                        type="submit"
                        className="w-full py-3 bg-cyan-600 text-white rounded-xl font-medium"
                      >
                        Send verification code
                      </button>
                    </form>
                  )}

                  {activeResetTab === 'reset' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setResetStatus(null);
                        if (resetPassword !== resetConfirm) {
                          setResetStatus('Passwords do not match.');
                          return;
                        }
                        const otp = otpFromDigits(resetOtpDigits);
                        if (otp.length !== 6) {
                          setResetStatus('Enter the 6-digit code.');
                          return;
                        }
                        try {
                          await authService.resetPassword({
                            channel: resetChannel,
                            email: resetChannel === 'email' ? resetEmail : undefined,
                            phone: resetChannel === 'phone' ? resetPhone : undefined,
                            token: otp,
                            newPassword: resetPassword,
                          });
                          setResetStatus('Password reset successful! You can sign in now.');
                          setTimeout(() => {
                            setAuthView('login');
                            setResetOtpDigits([...EMPTY_OTP]);
                          }, 2000);
                        } catch (err: unknown) {
                          setResetStatus(err instanceof Error ? err.message : 'Reset failed');
                        }
                      }}
                      className="space-y-4"
                    >
                      {resetChannel === 'email' ? (
                        <input
                          type="email"
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl"
                          placeholder="Registered email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      ) : (
                        <input
                          type="tel"
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl"
                          placeholder="Registered phone"
                          value={resetPhone}
                          onChange={(e) => setResetPhone(e.target.value)}
                        />
                      )}
                      <OtpInput
                        digits={resetOtpDigits}
                        onChange={(i, v) => {
                          const next = [...resetOtpDigits];
                          next[i] = v;
                          setResetOtpDigits(next);
                        }}
                        idPrefix="reset-otp"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl"
                        placeholder="New password (min 8 chars)"
                        value={resetPassword}
                        onChange={(e) => {
                          setResetPassword(e.target.value);
                          setPasswordStrength(getPasswordStrength(e.target.value));
                        }}
                      />
                      <div className="w-full h-2 bg-gray-200 rounded">
                        <div
                          className={`h-2 rounded transition-all duration-300 ${
                            passwordStrength === 1
                              ? 'bg-red-500 w-1/4'
                              : passwordStrength === 2
                              ? 'bg-yellow-500 w-2/4'
                              : passwordStrength === 3
                              ? 'bg-blue-500 w-3/4'
                              : passwordStrength === 4
                              ? 'bg-green-500 w-full'
                              : 'w-0'
                          }`}
                        />
                      </div>
                      <input
                        type="password"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl"
                        placeholder="Confirm new password"
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="w-full py-3 bg-cyan-600 text-white rounded-xl font-medium"
                      >
                        Reset password
                      </button>
                    </form>
                  )}

                  {resetStatus && <p className="text-sm text-cyan-700">{resetStatus}</p>}
                  {devOtpHint && (
                    <p className="text-xs font-mono bg-amber-100 text-amber-900 p-2 rounded">{devOtpHint}</p>
                  )}

                  <button
                    type="button"
                    className="text-gray-500 text-sm hover:text-gray-700"
                    onClick={() => setAuthView('login')}
                  >
                    ← Back to sign in
                  </button>
                </div>
              )}

              {(view === 'login' || view === 'register') && (
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-base font-semibold text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {mode === 'login' ? 'Create an account' : 'Sign in'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;