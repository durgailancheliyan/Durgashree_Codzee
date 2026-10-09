import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  IndianRupee,
  Building2,
  FileText,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminDashboard, type AdminDashboardData } from '@/services/admin.service';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchAdminDashboard();
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
    {
      name: 'Patients',
      value: String(data.kpis.patients),
      icon: <Users className="h-6 w-6 text-white" />,
    },
    {
      name: 'Appointments',
      value: String(data.kpis.appointments),
      sub: data.kpis.appointmentsToday != null ? `${data.kpis.appointmentsToday} today` : undefined,
      icon: <Calendar className="h-6 w-6 text-white" />,
    },
    {
      name: 'Revenue (INR)',
      value: `₹${data.kpis.revenueInr.toLocaleString('en-IN')}`,
      icon: <IndianRupee className="h-6 w-6 text-white" />,
    },
    {
      name: 'Locations',
      value: String(data.kpis.locations),
      icon: <Building2 className="h-6 w-6 text-white" />,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome, {user?.firstName} {user?.lastName}. Practice overview and reports.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">{stat.icon}</div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">{stat.name}</dt>
                <dd className="text-xl font-semibold text-gray-900">{stat.value}</dd>
                {'sub' in stat && stat.sub && (
                  <dd className="text-xs text-gray-500">{stat.sub}</dd>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System overview</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Practice</dt>
              <dd className="font-medium text-gray-900">{data.systemOverview.practiceName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium text-gray-900">{data.systemOverview.practiceType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Setup status</dt>
              <dd
                className={
                  data.systemOverview.practiceConfigured
                    ? 'text-green-600 font-medium'
                    : 'text-amber-600 font-medium'
                }
              >
                {data.systemOverview.practiceConfigured ? 'Configured' : 'Complete onboarding'}
              </dd>
            </div>
            <div className="pt-2 border-t">
              <dt className="text-gray-500 mb-2">Users by role</dt>
              <dd className="flex flex-wrap gap-2">
                {Object.entries(data.systemOverview.roles).map(([role, count]) => (
                  <span
                    key={role}
                    className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                  >
                    {role}: {count}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">User management</h3>
            <Link
              to="/admin/settings"
              className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
            >
              <Settings className="h-4 w-4" /> Manage
            </Link>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">{data.userManagement.total} users</p>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {data.userManagement.recent.map((u) => (
              <li key={u.id} className="py-2 flex justify-between text-sm">
                <span className="text-gray-900">
                  {u.firstName} {u.lastName}
                </span>
                <span className="text-gray-500">
                  {u.role}
                  {!u.isOnboarded && (
                    <span className="ml-1 text-amber-600 text-xs">pending</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-600" />
          Reports access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.reports.map((report) => (
            <Link
              key={report.id}
              to={report.path}
              className="block p-4 border border-gray-200 rounded-xl hover:border-cyan-400 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900">{report.title}</h4>
              <p className="mt-1 text-xs text-gray-500">{report.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
