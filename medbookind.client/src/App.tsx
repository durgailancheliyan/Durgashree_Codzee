// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import ProtectedRoute from './components/common/ProtectedRoute';
// import Layout from './components/layout/Layout';
// import LandingPage from './pages/LandingPage';
// import Auth from './pages/auth/Auth';
// import AdminDashboard from './pages/dashboard/AdminDashboard';
// import DoctorDashboard from './pages/dashboard/DoctorDashboard';
// import StaffDashboard from './pages/dashboard/StaffDashboard';
// import DeveloperDashboard from './pages/dashboard/DeveloperDashboard';
// import Appointments from './pages/Appointments';
// import DoctorSchedule from './pages/doctors/DoctorSchedule';
// import PatientProfile from './pages/patients/PatientProfile';
// import Settings from './pages/Settings';
// import Subscription from './pages/settings/Subscription';
// import PracticeManagement from './pages/settings/PracticeManagement';
// import NotFound from './pages/NotFound';
// import Unauthorized from './pages/Unauthorized';
// import PatientDashboard from './pages/dashboard/PatientDashboard';
// import Onboarding from './pages/onboarding/Onboarding';
// import Dashboard from './pages/dashboard/Dashboard';
// import './index.css';
// import { authService } from './services/auth.service';

// const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isOnboarded } = useAuth();
//   const isAuthenticated = authService.isAuthenticated();

//   if (!isAuthenticated) {
//     return <Navigate to="/auth" />;
//   }

//   if (!isOnboarded) {
//     return <Navigate to="/onboarding" />;
//   }

//   return <Layout>{children}</Layout>;
// };

// const App: React.FC = () => {
//   return (
//     <Router>
//       <AuthProvider>
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<LandingPage />} />
//           <Route path="/auth" element={<Auth />} />
//           <Route path="/unauthorized" element={<Unauthorized />} />

//           {/* Protected Routes */}
//           <Route
//             path="/onboarding"
//             element={
//               <ProtectedRoute>
//                 <Onboarding />
//               </ProtectedRoute>
//             }
//           />

//           {/* Role-specific Routes */}
//           <Route
//             path="/admin/*"
//             element={
//               <ProtectedRoute requiredRole="Admin">
//                 <PrivateRoute>
//                   <Routes>
//                     <Route index element={<Navigate to="dashboard" replace />} />
//                     <Route path="dashboard" element={<AdminDashboard />} />
//                     <Route path="appointments" element={<Appointments />} />
//                     <Route path="settings" element={<Settings />} />
//                     <Route path="practice-management" element={<PracticeManagement />} />
//                     <Route path="subscription" element={<Subscription />} />
//                   </Routes>
//                 </PrivateRoute>
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/doctor/*"
//             element={
//               <ProtectedRoute requiredRole="Doctor">
//                 <PrivateRoute>
//                   <Routes>
//                     <Route index element={<DoctorDashboard />} />
//                     <Route path="schedule" element={<DoctorSchedule />} />
//                     <Route path="appointments" element={<Appointments />} />
//                     <Route path="patients/:id" element={<PatientProfile />} />
//                     <Route path="settings" element={<Settings />} />
//                   </Routes>
//                 </PrivateRoute>
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/staff/*"
//             element={
//               <ProtectedRoute requiredRole="Staff">
//                 <PrivateRoute>
//                   <Routes>
//                     <Route index element={<StaffDashboard />} />
//                     <Route path="appointments" element={<Appointments />} />
//                     <Route path="settings" element={<Settings />} />
//                   </Routes>
//                 </PrivateRoute>
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/developer/*"
//             element={
//               <ProtectedRoute requiredRole="Developer">
//                 <PrivateRoute>
//                   <Routes>
//                     <Route index element={<DeveloperDashboard />} />
//                     <Route path="settings" element={<Settings />} />
//                     <Route path="practice-management" element={<PracticeManagement />} />
//                   </Routes>
//                 </PrivateRoute>
//               </ProtectedRoute>
//             }
//           />

//           {/* Patient Routes */}
//           <Route
//             path="/patient-dashboard/*"
//             element={
//               <ProtectedRoute requiredRole="Patient">
//                 <PrivateRoute>
//                   <Routes>
//                     <Route index element={<PatientDashboard />} />
//                     <Route path="profile" element={<PatientProfile />} />
//                     <Route path="settings" element={<Settings />} />
//                   </Routes>
//                 </PrivateRoute>
//               </ProtectedRoute>
//             }
//           />

//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </AuthProvider>
//     </Router>
//   );
// };

// export default App;

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { ModalProvider } from '@/contexts/ModalContext';

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <ModalProvider>
        <AppRoutes />
      </ModalProvider>
    </AuthProvider>
  </Router>
);

export default App;