/** URL prefix for role-scoped routes (matches AppRoutes). */
export function getRolePathPrefix(role: string | undefined): string {
  switch (role) {
    case 'Admin':
      return '/admin';
    case 'Doctor':
      return '/doctor';
    case 'Staff':
      return '/staff';
    case 'Developer':
      return '/developer';
    case 'Patient':
      return '/patient';
    default:
      return '';
  }
}

/** Default route after login / onboarding for each role (matches AppRoutes). */
export function getDashboardPathForRole(role: string | undefined): string {
  switch (role) {
    case 'Admin':
      return '/admin/dashboard';
    case 'Doctor':
      return '/doctor/dashboard';
    case 'Staff':
      return '/staff/dashboard';
    case 'Developer':
      return '/developer/dashboard';
    case 'Patient':
      return '/patient/patient-dashboard';
    default:
      return '/';
  }
}

export function getProfilePathForRole(role: string | undefined): string {
  const prefix = getRolePathPrefix(role);
  return prefix ? `${prefix}/profile` : '/auth';
}

export function getSettingsPathForRole(role: string | undefined): string {
  if (role === 'Admin') return '/admin/settings';
  return getProfilePathForRole(role);
}
