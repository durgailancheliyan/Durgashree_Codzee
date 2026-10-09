import { Appointment, Doctor, Location, AppointmentStatus, AppointmentType } from '../types/appointment';

export const mockLocations: Location[] = [
    { id: 1, name: 'Main Hospital', address: '123 Medical Center Dr' },
    { id: 2, name: 'Downtown Clinic', address: '456 Health Ave' },
    { id: 3, name: 'North Branch', address: '789 Wellness St' }
];

export const mockDoctors: Doctor[] = [
    { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Cardiology' },
    { id: 2, name: 'Dr. Michael Chen', specialization: 'Pediatrics' },
    { id: 3, name: 'Dr. Emily Brown', specialization: 'Neurology' }
];

export const mockAppointments: Appointment[] = [
    {
        id: 1,
        patient: { id: 1, name: 'John Smith', dateOfBirth: '1980-05-15' },
        doctor: mockDoctors[0],
        location: mockLocations[0],
        appointmentDateTime: '2024-03-20T09:00:00',
        appointmentType: 'Observation',
        status: 'InProgress',
        followUpDate: '2024-04-20',
        notes: 'Regular checkup'
    },
    {
        id: 2,
        patient: { id: 2, name: 'Mary Johnson', dateOfBirth: '1992-08-23' },
        doctor: mockDoctors[1],
        location: mockLocations[1],
        appointmentDateTime: '2024-03-21T14:30:00',
        appointmentType: 'Consultation',
        status: 'Pending',
        notes: 'Initial consultation'
    },
    {
        id: 3,
        patient: { id: 3, name: 'Robert Davis', dateOfBirth: '1975-11-30' },
        doctor: mockDoctors[2],
        location: mockLocations[2],
        appointmentDateTime: '2024-03-22T10:15:00',
        appointmentType: 'FollowUp',
        status: 'Completed',
        followUpDate: '2024-04-22',
        notes: 'Post-surgery follow-up'
    },
    {
        id: 4,
        patient: { id: 4, name: 'Lisa Anderson', dateOfBirth: '1988-03-12' },
        doctor: mockDoctors[0],
        location: mockLocations[0],
        appointmentDateTime: '2024-03-23T11:00:00',
        appointmentType: 'Emergency',
        status: 'InProgress',
        notes: 'Chest pain'
    }
]; 