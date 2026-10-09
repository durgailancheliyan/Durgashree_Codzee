export interface PracticeRequest {
    name: string;
    type: string;
    description?: string;
    address: string;
    email: string;
    phone: string;
    website?: string;
    logo?: File | null;
}

export interface LocationRequest {
    id?: string | null; // Optional for new locations
    name: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  practiceId: string;
}
export interface PracticeRoleRequest {
    id?: string | null;
    name: string;
    practiceId: string;
}

export interface UserRequest {
    id?: string | null;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    locationId?: string;
    practiceId?: string;
}

export interface OnboardingStatus {
    isOnboarded: boolean;
    userId?: string;
}

export interface OnboardingRequest {
    practice: PracticeRequest;
    locations: LocationRequest[];
    additionalUsers: UserRequest[];
    practiceRoles: PracticeRoleRequest[];
    subscriptionPlan?: string;
    adminPrimaryLocationId?: string;
}
export interface OnboardingResponse {
    practice: PracticeResponse;
    locations: LocationResponse[];
    additionalUsers: UserResponse[];
    practiceRoles: PracticeRoleResponse[];
    subscriptionPlan?: string;
    adminPrimaryLocationId?: string;
}

export interface PracticeResponse {
    id: string;
    name: string;
    type: string;
    description?: string;
    address: string;
    email: string;
    phone: string;
    website?: string;
    logoUrl?: string;
}

export interface LocationResponse {
    id: string;
    name: string;
    address: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
    practiceId: string;
}

export interface PracticeRoleResponse {
    id: string;
    name: string;
    practiceId: string;
}

export interface UserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    locationId?: string;
    practiceId?: string;
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isOnboarded: boolean;
    practiceId?: string | null;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    Phone: string;
    role: string;
}
export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: LoginRequest) => Promise<User>;
    register: (credentials: RegisterRequest) => Promise<void>;
    logout: () => void;
    /** Re-read user from localStorage (e.g. after onboarding completes on server). */
    refreshUser: () => void;
    isAuthenticated: boolean;
    isOnboarded: boolean;
    loading: boolean;
}
// TxPlansConfigDto
export interface TxPlansConfigDto {
  id?: string | null; // corresponds to Guid? in C#
  name: string;
  practiceId?: string | null;
  categoryId: string;
  description?: string;
  fee: number;
  duration: number;
  active: boolean;
}

// TxAddonsConfigDto
export interface TxAddonsConfigDto {
  id?: string | null;
  name: string;
  practiceId?: string | null;
  fee: number;
  description?: string;
  required: boolean;
  multiple: boolean;
}

// TxCategoryConfigDto
export interface TxCategoryConfigDto {
  id?: string | null;
  name: string;
  practiceId?: string | null;
  practice?: [] | null;
  treatmentPlans?: [] | null;
}

export interface TxConfigsDto {
    txPlans: TxPlansConfigDto[];
    txAddons: TxAddonsConfigDto[];
    txCategory: TxCategoryConfigDto[];
}