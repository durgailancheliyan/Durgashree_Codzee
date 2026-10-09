import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { registerPatient } from '@/services/patients.service';
import { fetchPracticeConfigs, type PatientConfigData } from '@/services/practiceConfig.service';
import { UsersService } from '@/services/users.service';
import { usePracticeId } from '@/hooks/usePracticeId';

const STEPS = ['Personal', 'Address', 'Emergency & Insurance', 'Appointment'];

interface NewPatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patientData: unknown) => Promise<void>;
}

const initialForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  phoneNumber: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceGroupNumber: '',
  allergies: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentType: 'Consultation',
  doctorId: '',
  notes: '',
};

const NewPatientForm: React.FC<NewPatientFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { practiceId } = usePracticeId();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<PatientConfigData | null>(null);
  const [doctors, setDoctors] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setForm(initialForm);
      setErrors({});
      setSuccess(false);
      return;
    }
    if (practiceId) {
      fetchPracticeConfigs(practiceId).then((d) => setConfig(d.patientConfig)).catch(() => {});
    }
    UsersService.getUsers()
      .then((users) =>
        setDoctors(
          users
            .filter((u) => u.role === 'Doctor')
            .map((u) => ({ id: u.id!, firstName: u.firstName, lastName: u.lastName }))
        )
      )
      .catch(() => {});
  }, [isOpen, practiceId]);

  const rules = config?.validationRules ?? {
    requireEmail: true,
    requirePhone: true,
    requireAddress: true,
    requireEmergencyContact: true,
    requireInsurance: false,
    pincodePattern: '^\\d{6}$',
  };

  const setField = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.firstName.trim()) e.firstName = 'Required';
      if (!form.lastName.trim()) e.lastName = 'Required';
      if (!form.gender) e.gender = 'Required';
      if (!form.dateOfBirth) e.dateOfBirth = 'Required';
      if (rules.requirePhone && !form.phoneNumber.trim()) e.phoneNumber = 'Required';
      else if (form.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(form.phoneNumber))
        e.phoneNumber = 'Invalid phone';
      if (rules.requireEmail && !form.email.trim()) e.email = 'Required';
      else if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    }
    if (s === 1 && rules.requireAddress) {
      if (!form.address.trim() || form.address.length < 5) e.address = 'Enter a valid street address (min 5 chars)';
      if (!form.city.trim()) e.city = 'Required';
      if (!form.state.trim() || form.state.length < 2) e.state = 'Enter state';
      const pinRe = new RegExp(String(rules.pincodePattern ?? '^\\d{6}$'));
      if (!pinRe.test(form.postalCode.trim())) e.postalCode = 'Invalid PIN / postal code (use 6 digits for India)';
    }
    if (s === 2) {
      if (rules.requireEmergencyContact) {
        if (!form.emergencyName.trim()) e.emergencyName = 'Required';
        if (!form.emergencyPhone.trim()) e.emergencyPhone = 'Required';
      }
      if (rules.requireInsurance && !form.insuranceProvider.trim()) e.insuranceProvider = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const result = await registerPatient({
        ...form,
        phone: form.phoneNumber,
      });
      await onSubmit(result);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="w-full max-w-lg h-full bg-white shadow-xl flex flex-col">
        <div className="p-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">New patient registration</h2>
            <button type="button" onClick={onClose} className="text-white/90 hover:text-white">
              ✕
            </button>
          </div>
          <div className="flex gap-1 mt-3">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 h-1 rounded ${i <= step ? 'bg-white' : 'bg-white/30'}`}
                title={label}
              />
            ))}
          </div>
          <p className="text-xs mt-2 opacity-90">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>

        {success && (
          <div className="bg-green-50 text-green-800 px-4 py-3 text-sm border-b border-green-200">
            Patient registered successfully.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {['firstName', 'middleName', 'lastName'].map((f) => (
                <div key={f} className={f === 'middleName' ? '' : 'col-span-1'}>
                  <label className="text-xs font-medium text-gray-600 capitalize">{f.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form[f as keyof typeof form]}
                    onChange={(e) => setField(f, e.target.value)}
                  />
                  {errors[f] && <p className="text-xs text-red-600">{errors[f]}</p>}
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Gender</label>
                <select
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                {errors.gender && <p className="text-xs text-red-600">{errors.gender}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Date of birth</label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={form.dateOfBirth}
                  onChange={(e) => setField('dateOfBirth', e.target.value)}
                />
                {errors.dateOfBirth && <p className="text-xs text-red-600">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Phone</label>
                <input
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={form.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value)}
                />
                {errors.phoneNumber && <p className="text-xs text-red-600">{errors.phoneNumber}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Street address</label>
                <input
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                />
                {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">City</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                  />
                  {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">State</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form.state}
                    onChange={(e) => setField('state', e.target.value)}
                  />
                  {errors.state && <p className="text-xs text-red-600">{errors.state}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">PIN / Postal code</label>
                <input
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  placeholder="6-digit PIN (India)"
                  value={form.postalCode}
                  onChange={(e) => setField('postalCode', e.target.value)}
                />
                {errors.postalCode && <p className="text-xs text-red-600">{errors.postalCode}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Emergency contact</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600">Contact name</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form.emergencyName}
                    onChange={(e) => setField('emergencyName', e.target.value)}
                  />
                  {errors.emergencyName && <p className="text-xs text-red-600">{errors.emergencyName}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Phone</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form.emergencyPhone}
                    onChange={(e) => setField('emergencyPhone', e.target.value)}
                  />
                  {errors.emergencyPhone && <p className="text-xs text-red-600">{errors.emergencyPhone}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Relation</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    placeholder="Spouse, Parent..."
                    value={form.emergencyRelation}
                    onChange={(e) => setField('emergencyRelation', e.target.value)}
                  />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Insurance</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Provider</label>
                  <input
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form.insuranceProvider}
                    onChange={(e) => setField('insuranceProvider', e.target.value)}
                  />
                  {errors.insuranceProvider && <p className="text-xs text-red-600">{errors.insuranceProvider}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Policy number</label>
                    <input
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                      value={form.insurancePolicyNumber}
                      onChange={(e) => setField('insurancePolicyNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Group number</label>
                    <input
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                      value={form.insuranceGroupNumber}
                      onChange={(e) => setField('insuranceGroupNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Optional: schedule first appointment</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form.appointmentDate}
                    onChange={(e) => setField('appointmentDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Time</label>
                  <input
                    type="time"
                    className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                    value={form.appointmentTime}
                    onChange={(e) => setField('appointmentTime', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Doctor</label>
                <select
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={form.doctorId}
                  onChange={(e) => setField('doctorId', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Type</label>
                <select
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={form.appointmentType}
                  onChange={(e) => setField('appointmentType', e.target.value)}
                >
                  <option>Consultation</option>
                  <option>Follow-up</option>
                  <option>Check-up</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between gap-2">
          <button
            type="button"
            onClick={step === 0 ? onClose : back}
            className="inline-flex items-center px-3 py-2 text-sm border rounded-md"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center px-4 py-2 text-sm bg-cyan-600 text-white rounded-md"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm bg-cyan-600 text-white rounded-md disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register patient'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewPatientForm;
