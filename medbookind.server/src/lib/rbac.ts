export type AppRole = 'Admin' | 'Doctor' | 'Staff' | 'Patient' | 'Developer';

export type Permission =
  | 'admin_full'
  | 'manage_users'
  | 'manage_practice'
  | 'manage_config'
  | 'consult'
  | 'appointments'
  | 'patients_all'
  | 'patients_register'
  | 'billing'
  | 'export_all'
  | 'export_ops'
  | 'announcements'
  | 'self_profile'
  | 'self_booking'
  | 'self_records';

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  Admin: [
    'admin_full',
    'manage_users',
    'manage_practice',
    'manage_config',
    'consult',
    'appointments',
    'patients_all',
    'patients_register',
    'billing',
    'export_all',
    'announcements',
  ],
  Doctor: ['consult', 'appointments', 'patients_all', 'export_ops', 'self_profile'],
  Staff: ['consult', 'appointments', 'patients_register', 'export_ops', 'self_profile'],
  Patient: ['self_profile', 'self_booking', 'self_records'],
  Developer: ['admin_full', 'manage_practice', 'manage_config'],
};

export function getPermissions(role: string | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as AppRole] ?? [];
}

export function hasPermission(role: string | undefined, perm: Permission): boolean {
  const perms = getPermissions(role);
  return perms.includes('admin_full') || perms.includes(perm);
}

export function getAccessLevel(role: string | undefined): string {
  switch (role) {
    case 'Admin':
      return 'Full access';
    case 'Doctor':
      return 'Limited (clinical)';
    case 'Staff':
      return 'Operational (front desk)';
    case 'Patient':
      return 'Self-service only';
    case 'Developer':
      return 'System';
    default:
      return 'Unknown';
  }
}
