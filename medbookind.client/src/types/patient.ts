export interface Patient {
    id: number;
    name: string;
    dateOfBirth: string;
}

export interface Treatment {
    id: number;
    name: string;
    type: string;
    status: string;
    fee: number;
    duration: number;
    description: string;
}

export type AppointmentStatus = 'InProgress' | 'Pending' | 'Completed';
export type AppointmentType = 'Observation' | 'Consultation' | 'FollowUp' | 'Emergency';

export interface AppointmentFilters {
    locationId?: number;
    doctorId?: number;
    appointmentDate?: string;
    appointmentType?: AppointmentType;
    status?: AppointmentStatus;
}

export interface Doctor {
    id: number;
    name: string;
    specialization: string;
}

export interface Location {
    id: number;
    name: string;
    address: string;
}

export interface Appointment {
    id: number;
    patient: Patient;
    doctor: Doctor;
    location: Location;
    appointmentDateTime: string;
    appointmentType: AppointmentType;
    status: AppointmentStatus;
    followUpDate?: string;
    notes?: string;
} 