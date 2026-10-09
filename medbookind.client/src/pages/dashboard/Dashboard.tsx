import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, subDays, differenceInDays } from 'date-fns';

// Demo data
const locations = ['Main Clinic', 'Branch A', 'Branch B'];
const roles = ['Admin', 'Doctor', 'Receptionist'];
const users = ['Dr. Smith', 'Dr. Lee', 'Receptionist Jane'];

const demoPatients = [
  { id: 1, name: 'John Doe', location: 'Main Clinic', registered: subDays(new Date(), 10) },
  { id: 2, name: 'Jane Roe', location: 'Branch A', registered: subDays(new Date(), 5) },
  { id: 3, name: 'Sam Patel', location: 'Branch B', registered: subDays(new Date(), 3) },
  { id: 4, name: 'Lisa Wong', location: 'Main Clinic', registered: subDays(new Date(), 1) },
];

const demoAppointments = [
  { id: 1, patient: 'John Doe', date: subDays(new Date(), 2), location: 'Main Clinic', user: 'Dr. Smith', role: 'Doctor' },
  { id: 2, patient: 'Jane Roe', date: subDays(new Date(), 1), location: 'Branch A', user: 'Dr. Lee', role: 'Doctor' },
  { id: 3, patient: 'Sam Patel', date: subDays(new Date(), 1), location: 'Branch B', user: 'Dr. Smith', role: 'Doctor' },
  { id: 4, patient: 'Lisa Wong', date: new Date(), location: 'Main Clinic', user: 'Receptionist Jane', role: 'Receptionist' },
];

const demoPayments = [
  { id: 1, amount: 100, date: subDays(new Date(), 2), location: 'Main Clinic' },
  { id: 2, amount: 150, date: subDays(new Date(), 1), location: 'Branch A' },
  { id: 3, amount: 200, date: subDays(new Date(), 1), location: 'Branch B' },
  { id: 4, amount: 120, date: new Date(), location: 'Main Clinic' },
];

const demoFollowUps = [
  { id: 1, patient: 'John Doe', date: subDays(new Date(), 1), status: 'Pending', location: 'Main Clinic' },
  { id: 2, patient: 'Jane Roe', date: new Date(), status: 'Completed', location: 'Branch A' },
  { id: 3, patient: 'Sam Patel', date: new Date(), status: 'Pending', location: 'Branch B' },
];

const tabList = [
  { key: 'overview', label: 'Overview' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'patients', label: 'Patients' },
  { key: 'payments', label: 'Payments' },
  { key: 'followups', label: 'Follow-ups' },
];

// Utility for growth calculation
function getGrowth(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

// Utility for CSV export
function exportCSV(data: any[], filename: string) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  for (const row of data) {
    csvRows.push(headers.map(h => `"${row[h]}"`).join(','));
  }
  const csvData = csvRows.join('\n');
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isOnboarded } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [compareRange, setCompareRange] = useState<{from: Date, to: Date} | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Previous period calculation
  const days = differenceInDays(dateRange.to, dateRange.from) + 1;
  const prevFrom = subDays(dateRange.from, days);
  const prevTo = subDays(dateRange.from, 1);

  const filterData = <T extends { date?: Date; location?: string; user?: string; role?: string }>(
    data: T[],
    range = dateRange
  ) => {
    return data.filter(item => {
      const inLocation = selectedLocation === 'All' || item.location === selectedLocation;
      const inUser = selectedUser === 'All' || item.user === selectedUser;
      const inRole = selectedRole === 'All' || item.role === selectedRole;
      const inDate = item.date
        ? item.date >= range.from && item.date <= range.to
        : true;
      return inLocation && inUser && inRole && inDate;
    });
  };

  // Filtered data
  const filteredAppointments = filterData(demoAppointments);
  const filteredPatients = demoPatients.filter(
    p => p.registered >= dateRange.from && p.registered <= dateRange.to &&
      (selectedLocation === 'All' || p.location === selectedLocation)
  );
  const filteredPayments = filterData(demoPayments);
  const filteredFollowUps = filterData(demoFollowUps);

  // Previous period data
  const prevAppointments = filterData(demoAppointments, { from: prevFrom, to: prevTo });
  const prevPatients = demoPatients.filter(
    p => p.registered >= prevFrom && p.registered <= prevTo &&
      (selectedLocation === 'All' || p.location === selectedLocation)
  );
  const prevPayments = filterData(demoPayments, { from: prevFrom, to: prevTo });

  // Unique patient count in appointments
  const uniqueAppointmentPatients = [
    ...new Set(filteredAppointments.map(a => a.patient))
  ].length;
  const prevUniqueAppointmentPatients = [
    ...new Set(prevAppointments.map(a => a.patient))
  ].length;

  // Alerts
  const pendingFollowUps = filteredFollowUps.filter(f => f.status === 'Pending');
  const emptySlots = filteredAppointments.length < days * 5; // e.g., less than 5 appts/day

  // Role-based greeting
  const getGreeting = () => {
    if (!user) return '';
    if (user.role === 'Doctor') return `Good day, Dr. ${user.firstName} ${user.lastName}! Here’s your practice at a glance.`;
    if (user.role === 'Receptionist') return `Welcome, ${user.firstName} ${user.lastName}! Here’s today’s front desk summary.`;
    if (user.role === 'Admin') return `Hello Admin! Here’s your clinic’s performance.`;
    return `Welcome, ${user.firstName} ${user.lastName}!`;
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/auth', { state: { from: '/dashboard' } });
        return;
      }
      if (!isOnboarded) {
        navigate('/onboarding');
        return;
      }
    };
    checkAuth();
  }, [user, isOnboarded, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Management Dashboard</h1>
        {/* Role-based greeting */}
        <div className="mb-4 text-lg text-blue-700 font-semibold">{getGreeting()}</div>
        {/* Tabs */}
        <div className="flex gap-2 border-b mb-4">
          {tabList.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-2 mb-6">
          <select className="p-2 border rounded" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
            <option value="All">All Locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <select className="p-2 border rounded" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="All">All Users</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select className="p-2 border rounded" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
            <option value="All">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input
            type="date"
            className="p-2 border rounded"
            value={format(dateRange.from, 'yyyy-MM-dd')}
            onChange={e => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
          />
          <input
            type="date"
            className="p-2 border rounded"
            value={format(dateRange.to, 'yyyy-MM-dd')}
            onChange={e => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
          />
          <button
            className="p-2 bg-blue-500 text-white rounded"
            onClick={() => setCompareRange({
              from: subDays(dateRange.from, days),
              to: subDays(dateRange.from, 1),
            })}
          >
            Compare Previous
          </button>
          <button
            className="p-2 bg-gray-300 rounded"
            onClick={() => setCompareRange(null)}
          >
            Clear Compare
          </button>
          {/* Export Button */}
          <button
            className="p-2 bg-green-500 text-white rounded"
            onClick={() => exportCSV(filteredAppointments, 'appointments.csv')}
          >
            Export Appointments CSV
          </button>
        </div>
        {/* Alerts */}
        <div className="mb-4">
          {pendingFollowUps.length > 0 && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-2">
              <strong>Alert:</strong> {pendingFollowUps.length} follow-up(s) pending!
            </div>
          )}
          {emptySlots && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded">
              <strong>Notice:</strong> There are empty appointment slots in this period.
            </div>
          )}
        </div>
        {/* Summary Cards for Overview */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Appointments */}
              <div className="bg-white rounded shadow p-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-600">{filteredAppointments.length}</span>
                <span className="text-gray-600">Appointments</span>
                <span className="text-sm mt-2 flex items-center">
                  {getGrowth(filteredAppointments.length, prevAppointments.length) >= 0 ? (
                    <span className="text-green-600">&#9650;</span>
                  ) : (
                    <span className="text-red-600">&#9660;</span>
                  )}
                  <span className={getGrowth(filteredAppointments.length, prevAppointments.length) >= 0 ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                    {getGrowth(filteredAppointments.length, prevAppointments.length)}%
                  </span>
                  <span className="ml-1 text-gray-400">vs previous</span>
                </span>
              </div>
              {/* Patients */}
              <div className="bg-white rounded shadow p-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">{filteredPatients.length}</span>
                <span className="text-gray-600">Patients Registered</span>
                <span className="text-sm mt-2 flex items-center">
                  {getGrowth(filteredPatients.length, prevPatients.length) >= 0 ? (
                    <span className="text-green-600">&#9650;</span>
                  ) : (
                    <span className="text-red-600">&#9660;</span>
                  )}
                  <span className={getGrowth(filteredPatients.length, prevPatients.length) >= 0 ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                    {getGrowth(filteredPatients.length, prevPatients.length)}%
                  </span>
                  <span className="ml-1 text-gray-400">vs previous</span>
                </span>
              </div>
              {/* Payments */}
              <div className="bg-white rounded shadow p-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-purple-600">{filteredPayments.reduce((sum, p) => sum + p.amount, 0)}</span>
                <span className="text-gray-600">Total Payments</span>
                <span className="text-sm mt-2 flex items-center">
                  {getGrowth(
                    filteredPayments.reduce((sum, p) => sum + p.amount, 0),
                    prevPayments.reduce((sum, p) => sum + p.amount, 0)
                  ) >= 0 ? (
                    <span className="text-green-600">&#9650;</span>
                  ) : (
                    <span className="text-red-600">&#9660;</span>
                  )}
                  <span className={getGrowth(
                    filteredPayments.reduce((sum, p) => sum + p.amount, 0),
                    prevPayments.reduce((sum, p) => sum + p.amount, 0)
                  ) >= 0 ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                    {getGrowth(
                      filteredPayments.reduce((sum, p) => sum + p.amount, 0),
                      prevPayments.reduce((sum, p) => sum + p.amount, 0)
                    )}%
                  </span>
                  <span className="ml-1 text-gray-400">vs previous</span>
                </span>
              </div>
            </div>
            {/* Appointments vs Patients */}
            <div className="bg-white rounded shadow p-6 mb-8">
              <h2 className="font-semibold mb-4 text-lg">Appointments vs Patients</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Appointments', count: filteredAppointments.length },
                  { name: 'Unique Patients (in Appointments)', count: uniqueAppointmentPatients },
                  { name: 'Patients Registered', count: filteredPatients.length }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* Tab Content */}
        {activeTab === 'appointments' && (
          <div className="bg-white p-4 rounded shadow mb-8">
            <h2 className="font-semibold mb-2">Appointments</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredAppointments}>
                <XAxis dataKey="patient" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="id" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === 'patients' && (
          <div className="bg-white p-4 rounded shadow mb-8">
            <h2 className="font-semibold mb-2">Patients Registered</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredPatients}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="id" fill="#f59e42" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === 'payments' && (
          <div className="bg-white p-4 rounded shadow mb-8">
            <h2 className="font-semibold mb-2">Payments</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={filteredPayments}
                  dataKey="amount"
                  nameKey="location"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#10b981"
                  label
                >
                  {filteredPayments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e42'][index % 3]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === 'followups' && (
          <div className="bg-white p-4 rounded shadow mb-8">
            <h2 className="font-semibold mb-2">Follow-ups</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredFollowUps}>
                <XAxis dataKey="patient" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="id" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Comparison Panel */}
        {compareRange && (
          <div className="mt-8 bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Comparison with Previous Period</h3>
            <p className="text-gray-700">Show comparison stats here (implement as needed).</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;