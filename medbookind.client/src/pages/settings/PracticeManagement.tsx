import React, { useEffect, useState } from 'react';
import { Building2, Clock, ImagePlus, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { practiceService } from '@/services/practice.service';
import LocationSettings from '@/components/settings/LocationSettings';

type BusinessHour = { day: number; label: string; open: string; close: string; closed: boolean };

const defaultHours: BusinessHour[] = [
  { day: 1, label: 'Mon', open: '09:00', close: '18:00', closed: false },
  { day: 2, label: 'Tue', open: '09:00', close: '18:00', closed: false },
  { day: 3, label: 'Wed', open: '09:00', close: '18:00', closed: false },
  { day: 4, label: 'Thu', open: '09:00', close: '18:00', closed: false },
  { day: 5, label: 'Fri', open: '09:00', close: '18:00', closed: false },
  { day: 6, label: 'Sat', open: '09:00', close: '13:00', closed: false },
  { day: 0, label: 'Sun', open: '09:00', close: '13:00', closed: true },
];

const PracticeManagement: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'details' | 'logo' | 'hours' | 'locations'>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [practice, setPractice] = useState({
    id: '',
    name: '',
    type: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>(defaultHours);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    practiceService
      .getPracticeByUserId(user.id)
      .then((data) => {
        setPractice({
          id: data.id,
          name: data.name ?? '',
          type: data.type ?? '',
          description: data.description ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          website: data.website ?? '',
        });
        if (data.logoUrl?.startsWith('data:')) setLogoPreview(data.logoUrl);
        if (data.businessHours?.length) setHours(data.businessHours);
      })
      .catch(() => setMessage('Could not load practice'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!practice.id) {
      setMessage('No practice found. Complete onboarding first.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await practiceService.updatePractice(practice.id, {
        name: practice.name,
        type: practice.type,
        description: practice.description,
        address: practice.address,
        email: practice.email,
        phone: practice.phone,
        website: practice.website,
        logo: logoFile,
        businessHours: JSON.stringify(hours),
      });
      setMessage('Practice settings saved.');
    } catch {
      setMessage('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'details' as const, label: 'Practice details', icon: Building2 },
    { id: 'logo' as const, label: 'Logo', icon: ImagePlus },
    { id: 'hours' as const, label: 'Business hours', icon: Clock },
    { id: 'locations' as const, label: 'Branches', icon: MapPin },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Practice settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Practice details, logo, business hours, and branch locations.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/admin/settings" className="text-cyan-600 hover:underline">
            User settings (roles & permissions) →
          </Link>
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t.id ? 'bg-cyan-600 text-white' : 'bg-white border text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['name', 'type', 'email', 'phone', 'website', 'address'] as const).map((field) => (
            <div key={field} className={field === 'address' ? 'md:col-span-2' : ''}>
              <label className="text-sm font-medium text-gray-700 capitalize">{field}</label>
              {field === 'type' ? (
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  value={practice.type}
                  onChange={(e) => setPractice((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="">Select</option>
                  <option value="clinic">Clinic</option>
                  <option value="hospital">Hospital</option>
                  <option value="specialist">Specialist</option>
                </select>
              ) : field === 'address' ? (
                <textarea
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  rows={2}
                  value={practice.address}
                  onChange={(e) => setPractice((p) => ({ ...p, address: e.target.value }))}
                />
              ) : (
                <input
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  value={practice[field]}
                  onChange={(e) => setPractice((p) => ({ ...p, [field]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              rows={3}
              value={practice.description}
              onChange={(e) => setPractice((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>
      )}

      {tab === 'logo' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setLogoFile(f ?? null);
                  if (f) setLogoPreview(URL.createObjectURL(f));
                }}
              />
              <p className="text-xs text-gray-500 mt-2">PNG or JPG, max 2MB</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'hours' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-3">
          {hours.map((h, i) => (
            <div key={h.day} className="flex flex-wrap items-center gap-3 py-2 border-b last:border-0">
              <span className="w-12 font-medium text-sm">{h.label}</span>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={(e) => {
                    const next = [...hours];
                    next[i] = { ...h, closed: e.target.checked };
                    setHours(next);
                  }}
                />
                Closed
              </label>
              {!h.closed && (
                <>
                  <input
                    type="time"
                    className="border rounded px-2 py-1 text-sm"
                    value={h.open}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, open: e.target.value };
                      setHours(next);
                    }}
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    className="border rounded px-2 py-1 text-sm"
                    value={h.close}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, close: e.target.value };
                      setHours(next);
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'locations' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <LocationSettings userId={user?.id} showStaffMapping />
        </div>
      )}

      {tab !== 'locations' && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      )}
    </div>
  );
};

export default PracticeManagement;
