import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  FileText,
  PlusCircle,
  Loader2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPatientDashboard, type PatientDashboardData } from '@/services/dashboard.service';

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    checked_in: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`px-2 text-xs font-semibold rounded-full ${colors[status] ?? 'bg-yellow-100 text-yellow-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchPatientDashboard();
        if (!cancelled) setData(d);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-red-700">{error ?? 'Unable to load dashboard'}</p>
      </div>
    );
  }

  const kpis = [
    { name: 'Upcoming bookings', value: data.kpis.upcomingCount, icon: Calendar },
    { name: 'Past visits', value: data.kpis.historyCount, icon: FileText },
    { name: 'Medical records', value: data.kpis.recordsCount, icon: FileText },
    { name: 'Profile complete', value: `${data.kpis.profileCompletion}%`, icon: User },
  ];

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-4 sm:p-6 flex flex-col md:flex-row md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome, {user?.firstName}. Appointments, progress, and profile.
          </p>
        </div>
        <Link
          to="/patient/book-appointment"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Book appointment
        </Link>
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

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-4 border-b">
          <h3 className="font-medium text-gray-900">Upcoming bookings</h3>
        </div>
        {data.upcomingBookings.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            No upcoming appointments.{' '}
            <Link to="/patient/book-appointment" className="text-cyan-600">
              Book one
            </Link>
          </p>
        ) : (
          <ul className="divide-y">
            {data.upcomingBookings.map((a) => (
              <li key={a.id} className="px-4 py-4">
                <div className="flex justify-between">
                  <p className="font-medium text-cyan-700">{a.doctorName}</p>
                  {statusBadge(a.status)}
                </div>
                <p className="text-sm text-gray-500">{a.appointmentType}</p>
                <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {a.dateLabel}
                  <Clock className="h-4 w-4" />
                  {a.timeLabel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-4 border-b">
            <h3 className="font-medium text-gray-900">Appointment history</h3>
          </div>
          {data.appointmentHistory.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 text-center">No past appointments.</p>
          ) : (
            <ul className="divide-y">
              {data.appointmentHistory.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <span className="font-medium">{a.doctorName}</span>
                  <span className="text-gray-500"> — {a.dateLabel} {a.timeLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-4 border-b">
            <h3 className="font-medium text-gray-900">Medical progress</h3>
          </div>
          {data.medicalProgress.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 text-center">No records yet.</p>
          ) : (
            <ul className="divide-y">
              {data.medicalProgress.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <p className="font-medium text-sm text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.recordType} ·{' '}
                    {r.doctorFirstName
                      ? `Dr. ${r.doctorFirstName} ${r.doctorLastName ?? ''}`
                      : 'Clinic'}{' '}
                    · {new Date(r.recordedAt).toLocaleDateString('en-IN')}
                  </p>
                  {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-900">Profile management</h3>
          <Link
            to="/patient/settings"
            className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Profile completion</span>
            <span className="font-medium">{data.profile.completionPercent}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${data.profile.completionPercent}%` }}
            />
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium">
              {data.profile.firstName} {data.profile.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium">
              {data.profile.email}
              {data.profile.emailVerified && (
                <span className="ml-1 text-green-600 text-xs">verified</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium">{data.profile.phone || '—'}</dd>
          </div>
        </dl>
        <Link
          to="/patient/patient-profile"
          className="mt-4 inline-block text-sm font-medium text-cyan-600 hover:text-cyan-700"
        >
          View full profile →
        </Link>
      </div>
    </div>
  );
};

export default PatientDashboard;
