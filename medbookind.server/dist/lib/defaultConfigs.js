export const DEFAULT_PATIENT_CONFIG = {
    customFields: [
        { key: 'weight', label: 'Weight', enabled: false, required: false, type: 'text' },
        { key: 'height', label: 'Height', enabled: false, required: false, type: 'text' },
        { key: 'bloodGroup', label: 'Blood group', enabled: false, required: false, type: 'text' },
        { key: 'allergies', label: 'Allergies', enabled: true, required: false, type: 'text' },
    ],
    validationRules: {
        requireEmail: true,
        requirePhone: true,
        requireAddress: true,
        requireEmergencyContact: true,
        requireInsurance: false,
        phonePattern: '^\\+?[\\d\\s-]{10,}$',
        pincodePattern: '^\\d{6}$',
        minAddressLength: 5,
    },
    formControl: {
        multiStepForm: true,
        showMiddleName: true,
        showDocuments: false,
    },
};
export const DEFAULT_PAYMENT_CONFIG = {
    paymentMethods: [
        { id: 'cash', label: 'Cash', enabled: true },
        { id: 'card', label: 'Card', enabled: true },
        { id: 'upi', label: 'UPI', enabled: true },
        { id: 'insurance', label: 'Insurance', enabled: true },
    ],
    fees: [
        { id: 'consultation', name: 'Consultation fee', amountInr: 500 },
        { id: 'followup', name: 'Follow-up fee', amountInr: 300 },
    ],
    discounts: [
        { id: 'senior', name: 'Senior citizen', type: 'percent', value: 10 },
        { id: 'staff', name: 'Staff discount', type: 'percent', value: 15 },
    ],
};
export const DEFAULT_APPOINTMENT_CONFIG = {
    timeSlots: {
        startTime: '09:00',
        endTime: '18:00',
        intervalMinutes: 30,
        workingDays: [1, 2, 3, 4, 5, 6],
    },
    bookingRules: {
        maxAdvanceDays: 30,
        minNoticeHours: 2,
        allowSameDayBooking: true,
        maxPerDayPerPatient: 1,
    },
    cancellationPolicy: {
        allowCancellation: true,
        minHoursBefore: 24,
        cancellationFeePercent: 0,
        noShowFeeInr: 0,
    },
    notifications: {
        emailReminders: true,
        smsReminders: true,
        reminderHoursBefore: 24,
        notifyOnBooking: true,
        notifyOnCancel: true,
    },
};
export function mergeConfig(defaults, stored) {
    if (!stored || typeof stored !== 'object')
        return defaults;
    return { ...defaults, ...stored };
}
