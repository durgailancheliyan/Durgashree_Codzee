import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PrivateRoute from '../components/common/PrivateRoute';
import LandingPage from '../pages/LandingPage';
import Auth from '../pages/auth/Auth';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import Unauthorized from '../pages/Unauthorized';
import Settings from '@/pages/Settings';
import ConsultManager from '@/pages/consult-manager/consultmanager';
import Onboarding from '@/pages/onboarding/Onboarding';
import Newcm from '@/pages/consult-manager/newcm';
import DoctorDashboard from '@/pages/dashboard/DoctorDashboard';
import StaffDashboard from '@/pages/dashboard/StaffDashboard';
import PatientDashboard from '@/pages/dashboard/PatientDashboard';
import DeveloperDashboard from '@/pages/dashboard/DeveloperDashboard';
import DoctorSchedule from '@/pages/doctors/DoctorSchedule';
import PatientProfile from '@/pages/patients/PatientProfile';
import TreatmentConfigPage from '@/pages/configuration/TreatmentConfigPage';
import PatientConfig from '@/pages/configuration/patientconfig';
import PaymentConfig from '@/pages/configuration/paymentconfig';
import AppointmentConfig from '@/pages/configuration/appointmentconfig';
import PracticeManagement from '@/pages/settings/PracticeManagement';
import Subscription from '@/pages/settings/Subscription';
import PlaceholderPage from '@/pages/PlaceholderPage';
import BookAppointment from '@/pages/patient/BookAppointment';
import AccountProfile from '@/pages/account/AccountProfile';
import ReportsExport from '@/pages/ReportsExport';
import NotFound from '@/pages/NotFound';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="/consult-manager" element={<Navigate to="/admin/consult-manager" replace />} />

    <Route
      path="/admin/*"
      element={
        <ProtectedRoute requiredRole="Admin">
          <PrivateRoute>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="consult-manager" element={<ConsultManager />} />
              <Route path="newcm" element={<Newcm />} />
              <Route path="settings" element={<Settings />} />
              <Route
                path="appointments"
                element={<PlaceholderPage title="Appointments" description="Schedule and manage practice appointments." />}
              />
              <Route
                path="departments"
                element={<PlaceholderPage title="Departments" description="Organize departments and service lines." />}
              />
              <Route path="billing" element={<ReportsExport />} />
              <Route path="reports" element={<ReportsExport />} />
              <Route path="configuration/treatment" element={<TreatmentConfigPage />} />
              <Route path="configuration/patient" element={<PatientConfig />} />
              <Route path="configuration/payment" element={<PaymentConfig />} />
              <Route path="configuration/appointment" element={<AppointmentConfig />} />
              <Route path="practice-management" element={<PracticeManagement />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PrivateRoute>
        </ProtectedRoute>
      }
    />

    <Route
      path="/doctor/*"
      element={
        <ProtectedRoute requiredRole="Doctor">
          <PrivateRoute>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="doctor-schedule" element={<DoctorSchedule />} />
              <Route path="consult-manager" element={<ConsultManager />} />
              <Route path="reports" element={<ReportsExport />} />
              <Route path="patients" element={<PlaceholderPage title="My patients" description="Patient list and search." />} />
              <Route path="patients/:id" element={<PatientProfile />} />
              <Route path="settings" element={<AccountProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PrivateRoute>
        </ProtectedRoute>
      }
    />

    <Route
      path="/staff/*"
      element={
        <ProtectedRoute requiredRole="Staff">
          <PrivateRoute>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="staff-dashboard" element={<StaffDashboard />} />
              <Route path="consult-manager" element={<ConsultManager />} />
              <Route
                path="appointments"
                element={<PlaceholderPage title="Appointments" description="View and manage scheduled visits." />}
              />
              <Route path="reports" element={<ReportsExport />} />
              <Route path="settings" element={<AccountProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PrivateRoute>
        </ProtectedRoute>
      }
    />

    <Route
      path="/patient/*"
      element={
        <ProtectedRoute requiredRole="Patient">
          <PrivateRoute>
            <Routes>
              <Route index element={<Navigate to="patient-dashboard" replace />} />
              <Route path="patient-dashboard" element={<PatientDashboard />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="book-appointment" element={<BookAppointment />} />
              <Route path="patient-profile" element={<PatientProfile />} />
              <Route path="settings" element={<AccountProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PrivateRoute>
        </ProtectedRoute>
      }
    />

    <Route
      path="/developer/*"
      element={
        <ProtectedRoute requiredRole="Developer">
          <PrivateRoute>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DeveloperDashboard />} />
              <Route path="profile" element={<AccountProfile />} />
              <Route path="practicemanagement" element={<PracticeManagement />} />
              <Route path="settings" element={<AccountProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PrivateRoute>
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
