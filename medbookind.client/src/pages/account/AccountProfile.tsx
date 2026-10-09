import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Save, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { getDashboardPathForRole, getSettingsPathForRole } from '@/utils/dashboardPath';

const AccountProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authService.getMe();
        if (!cancelled) {
          setFirstName(me.firstName);
          setLastName(me.lastName);
          setPhone(me.phone ?? '');
          setEmail(me.email);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await authService.updateProfile({ firstName, lastName, phone });
      refreshUser();
      setMessage('Profile updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
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

  const dashboardPath = getDashboardPathForRole(user?.role);
  const settingsPath = getSettingsPathForRole(user?.role);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xl font-semibold">
            {firstName?.[0]}
            {lastName?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6 text-cyan-600" />
              Your profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">View and update your account details.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="bg-white shadow-sm rounded-lg p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
        {message && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">{message}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            disabled
            value={email}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed here.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">Role:</span> {user?.role}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </button>
          <Link to={dashboardPath} className="px-4 py-2 text-sm text-gray-700 border rounded-md hover:bg-gray-50">
            Back to dashboard
          </Link>
          {user?.role === 'Admin' && (
            <Link to={settingsPath} className="px-4 py-2 text-sm text-cyan-700 border border-cyan-200 rounded-md hover:bg-cyan-50">
              Practice settings
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};

export default AccountProfile;
