export interface IdentityUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: PracticeRoles;
    status?: string;
    locationId?: string;
    practiceId?: string;
    lastLogin?: string;
}
export interface IdentityRoles {
    id: string;
    name: string;
}
export interface PracticeRoles {
    id: string;
    role: IdentityRoles;
    practiceId: string;
}
export interface UserLocation {
    id: string;
    name: string;
    address: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
    practiceId: string;
}