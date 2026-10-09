import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Activity, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchDoctorDashboard,
  type DoctorDashboardData,
  type AppointmentItem,
} from '@/services/dashboard.service';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    checked_in: 'bg-green-100 text-green-800',
    in_progress: 'bg-amber-100 text-amber-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
  };
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
}

function AppointmentList({ items, empty }: { items: AppointmentItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-sm text-gray-500 text-center">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-gray-200">
      {items.map((a) => (
        <li key={a.id} className="px-4 py-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-cyan-700">{a.patientName}</p>
              <p className="text-sm text-gray-500">{a.appointmentType}</p>
            </div>
            {statusBadge(a.status)}
          </div>
          <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {a.dateLabel} · {a.timeLabel}
          </p>
        </li>
      ))}
    </ul>
  );
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const d = await fetchDoctorDashboard();
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
    { name: "Today's appointments", value: data.kpis.todayAppointments, icon: Calendar },
    { name: 'Patient queue', value: data.kpis.queueCount, icon: Users },
    { name: 'Consultations this week', value: data.kpis.weekConsultations, icon: Activity },
    { name: 'My patients', value: data.kpis.totalPatients, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome, {user?.firstName}. Today&apos;s schedule, queue, and treatment history.
          </p>
        </div>
        <Link
          to="/doctor/doctor-schedule"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Schedule view
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-4 border-b">
            <h3 className="font-medium text-gray-900">Today&apos;s appointments</h3>
          </div>
          <AppointmentList items={data.todayAppointments} empty="No appointments today." />
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-4 border-b">
            <h3 className="font-medium text-gray-900">Patient queue</h3>
            <p className="text-xs text-gray-500">Checked in / in progress</p>
          </div>
          <AppointmentList items={data.patientQueue} empty="No patients in queue." />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-4 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-900">Week schedule</h3>
          <Link to="/doctor/doctor-schedule" className="text-sm text-cyan-600 hover:text-cyan-700">
            Full schedule
          </Link>
        </div>
        <AppointmentList items={data.scheduleView} empty="No upcoming appointments this week." />
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment history</h3>
        {data.treatmentHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No treatment records yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.treatmentHistory.map((r) => (
              <li key={r.id} className="bg-gray-50 rounded-md p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{r.title}</span>
                  <span className="text-gray-500">
                    {new Date(r.recordedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-cyan-600 mt-1">{r.recordType}</p>
                {r.description && <p className="mt-2 text-sm text-gray-600">{r.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
