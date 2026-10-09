// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';

// type Role = 'Admin' | 'Doctor' | 'Staff' | 'Developer' | 'Patient';

// interface ProtectedRouteProps {
//     children: React.ReactNode | ((props: { user: any }) => React.ReactNode);
//     requiredRole?: Role;
//     allowedRoles?: Role[];
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
//     children, 
//     requiredRole,
//     allowedRoles 
// }) => {
//     const { isAuthenticated, user, loading } = useAuth();

//     if (loading) {
//         return <div>Loading...</div>;
//     }

//     if (!isAuthenticated) {
//         return <Navigate to="/auth" />;
//     }

//     if (requiredRole && user?.role !== requiredRole) {
//         return <Navigate to="/unauthorized" />;
//     }

//     if (allowedRoles && !allowedRoles.includes(user?.role as Role)) {
//         return <Navigate to="/unauthorized" />;
//     }

//     if (typeof children === 'function') {
//         return <>{children({ user })}</>;
//     }

//     return <>{children}</>;
// };

// export default ProtectedRoute;
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, type Permission, ROLE_DESCRIPTIONS, type AppRole } from '@/utils/rbac';

type Role = 'Admin' | 'Doctor' | 'Staff' | 'Developer' | 'Patient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredPermission?: Permission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/unauthorized" />;
  if (requiredPermission && !hasPermission(user?.role, requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

export { ROLE_DESCRIPTIONS };
export type { AppRole };

export default ProtectedRoute;