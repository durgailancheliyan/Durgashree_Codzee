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

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  Admin: 'Full access — all modules, settings, billing, and exports',
  Doctor: 'Limited — consultations, schedule, patient view, operational exports',
  Staff: 'Operational — front desk, registration, appointments, consult queue',
  Patient: 'Self — own profile, bookings, and medical records only',
  Developer: 'System — practice and configuration tools',
};

export function getPermissions(role: string | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as AppRole] ?? [];
}

export function hasPermission(role: string | undefined, perm: Permission): boolean {
  const perms = getPermissions(role);
  return perms.includes('admin_full') || perms.includes(perm);
}

export function canAccessRoute(role: string | undefined, path: string): boolean {
  if (!role) return false;
  if (role === 'Admin') return true;
  if (path.startsWith('/admin')) return false;
  if (role === 'Doctor' && path.startsWith('/doctor')) return true;
  if (role === 'Staff' && path.startsWith('/staff')) return true;
  if (role === 'Patient' && path.startsWith('/patient')) return true;
  if (role === 'Developer' && path.startsWith('/developer')) return true;
  return false;
}
