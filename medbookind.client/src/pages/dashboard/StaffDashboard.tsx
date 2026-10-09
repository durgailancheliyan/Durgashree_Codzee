import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  UserPlus,
  ClipboardList,
  FileText,
  Loader2,
  AlertCircle,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchStaffDashboard,
  updateAppointmentStatus,
  createAppointment,
  type StaffDashboardData,
} from '@/services/dashboard.service';

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedulePatient, setSchedulePatient] = useState('');
  const [scheduleDoctor, setScheduleDoctor] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const d = await fetchStaffDashboard();
      setData(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await updateAppointmentStatus(id, status);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulePatient || !scheduleAt) return;
    setBusyId('new');
    try {
      await createAppointment({
        patientId: schedulePatient,
        doctorId: scheduleDoctor || undefined,
        scheduledAt: new Date(scheduleAt).toISOString(),
      });
      setShowSchedule(false);
      setSchedulePatient('');
      setScheduleDoctor('');
      setScheduleAt('');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create appointment');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    { name: "Today's appointments", value: data.kpis.todayAppointments, icon: Calendar },
    { name: 'Checked in', value: data.kpis.checkedIn, icon: LogIn },
    { name: 'Awaiting check-in', value: data.kpis.pendingScheduled, icon: ClipboardList },
    { name: 'New patients (week)', value: data.kpis.newPatientsWeek, icon: UserPlus },
  ];

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome, {user?.firstName}. Check-in, scheduling, registration, and reports.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.name} className="bg-white shadow-sm rounded-lg p-5 flex items-center gap-4">
            <div className="bg-cyan-500 rounded-md p-3">
              <k.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{k.name}</p>
              <p className="text-xl font-semibold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-4 border-b flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-medium text-gray-900">Patient check-in / out</h3>
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-sm px-3 py-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
            >
              Schedule appointment
            </button>
          </div>

          {showSchedule && (
            <form onSubmit={handleSchedule} className="p-4 border-b bg-gray-50 space-y-3">
              <select
                required
                value={schedulePatient}
                onChange={(e) => setSchedulePatient(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select patient</option>
                {data.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <select
                value={scheduleDoctor}
                onChange={(e) => setScheduleDoctor(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Doctor (optional)</option>
                {data.doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                required
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busyId === 'new'}
                className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-md disabled:opacity-50"
              >
                Book
              </button>
            </form>
          )}

          {data.todayAppointments.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 text-center">No appointments today.</p>
          ) : (
            <ul className="divide-y">
              {data.todayAppointments.map((a) => (
                <li key={a.id} className="px-4 py-4 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{a.patientName}</p>
                    <p className="text-sm text-gray-500">
                      {a.timeLabel} · {a.doctorName} · {a.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {a.status === 'scheduled' && (
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => handleStatus(a.id, 'checked_in')}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <LogIn className="h-3 w-3" /> Check in
                      </button>
                    )}
                    {(a.status === 'checked_in' || a.status === 'in_progress') && (
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => handleStatus(a.id, 'completed')}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        <LogOut className="h-3 w-3" /> Check out
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-cyan-600" />
            Registration
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {data.patients.length} patients in practice. New this week: {data.kpis.newPatientsWeek}.
          </p>
          <Link
            to="/staff/settings"
            className="block w-full text-center px-4 py-2 border border-cyan-600 text-cyan-700 rounded-md text-sm hover:bg-cyan-50"
          >
            Manage users & registration
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-600" />
          Reports access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.reports.map((r) => (
            <Link
              key={r.id}
              to={r.path}
              className="p-4 border rounded-xl hover:border-cyan-400 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900">{r.title}</h4>
              <p className="mt-1 text-xs text-gray-500">{r.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
