import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, type Permission } from '@/utils/rbac';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();
  if (!hasPermission(user?.role, permission)) return <>{fallback}</>;
  return <>{children}</>;
};

export default PermissionGate;
