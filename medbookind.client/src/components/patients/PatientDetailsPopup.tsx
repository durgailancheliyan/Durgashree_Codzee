import React, { useState } from 'react';
import { Patient, Appointment, Treatment } from '../../types/patient';

interface PatientDetailsPanelProps {
    patient: Patient;
    appointment: Appointment;
    onClose: () => void;
}

const PatientDetailsPanel: React.FC<PatientDetailsPanelProps> = ({ patient, appointment, onClose }) => {
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [treatmentStatus, setTreatmentStatus] = useState<string>('pending');
    const [insuranceDetails, setInsuranceDetails] = useState({
        provider: '',
        policyNumber: '',
        coverage: '',
        validUntil: ''
    });

    // Mock treatment options
    const treatmentOptions: Treatment[] = [
        {
            id: 1,
            name: 'Root Canal Treatment',
            type: 'Dental',
            status: 'Pending',
            fee: 15000,
            duration: 3,
            description: 'Complete root canal treatment with crown'
        },
        {
            id: 2,
            name: 'Dental Implant',
            type: 'Surgical',
            status: 'Pending',
            fee: 45000,
            duration: 6,
            description: 'Single tooth implant with crown'
        },
        {
            id: 3,
            name: 'Orthodontic Treatment',
            type: 'Orthodontic',
            status: 'Pending',
            fee: 75000,
            duration: 24,
            description: 'Complete orthodontic treatment with braces'
        }
    ];

    const calculatePayment = () => {
        if (!selectedTreatment) return null;

        const baseAmount = selectedTreatment.fee;
        const gst = baseAmount * 0.18; // 18% GST
        const total = baseAmount + gst;

        return {
            baseAmount,
            gst,
            total
        };
    };

    const payment = calculatePayment();

    const handleStatusChange = (status: string) => {
        setTreatmentStatus(status);
        if (selectedTreatment) {
            setSelectedTreatment({
                ...selectedTreatment,
                status: status === 'pending' ? 'Pending' : 
                       status === 'in-progress' ? 'In Progress' : 'Completed'
            });
        }
    };

    return (
        <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Patient Details</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Patient and Appointment Info in a single row */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-4 gap-4">
                        {/* Patient Info */}
                        <div className="space-y-1">
                            <div>
                                <span className="block text-xs text-gray-400">Patient Name</span>
                                <span className="font-medium">{patient.name}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400">Date of Birth</span>
                                <span className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div>
                                <span className="block text-xs text-gray-400">Appointment</span>
                                <span className="font-medium">
                                    {new Date(appointment.appointmentDateTime).toLocaleDateString()} at {new Date(appointment.appointmentDateTime).toLocaleTimeString()}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400">Doctor</span>
                                <span className="font-medium">{appointment.doctor.name}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div>
                                <span className="block text-xs text-gray-400">Location</span>
                                <span className="font-medium">{appointment.location.name}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400">Type</span>
                                <span className="font-medium">{appointment.appointmentType}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Treatment Selection Card - visually dominant */}
                <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Treatment Selection
                        </h3>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            <div className="flex items-center space-x-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="treatmentStatus"
                                        value="pending"
                                        className="form-radio h-4 w-4 text-blue-600"
                                        checked={treatmentStatus === 'pending'}
                                        onChange={() => handleStatusChange('pending')}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Pending</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="treatmentStatus"
                                        value="in-progress"
                                        className="form-radio h-4 w-4 text-blue-600"
                                        checked={treatmentStatus === 'in-progress'}
                                        onChange={() => handleStatusChange('in-progress')}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">In Progress</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="treatmentStatus"
                                        value="completed"
                                        className="form-radio h-4 w-4 text-blue-600"
                                        checked={treatmentStatus === 'completed'}
                                        onChange={() => handleStatusChange('completed')}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Completed</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Treatment</label>
                            <select
                                value={selectedTreatment?.id || ''}
                                onChange={(e) => {
                                    const treatment = treatmentOptions.find(t => t.id === Number(e.target.value));
                                    setSelectedTreatment(treatment || null);
                                }}
                                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a treatment</option>
                                {treatmentOptions.map(treatment => (
                                    <option key={treatment.id} value={treatment.id}>
                                        {treatment.name} - ₹{treatment.fee.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedTreatment && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Treatment Type</p>
                                        <p className="font-medium">{selectedTreatment.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Duration</p>
                                        <p className="font-medium">{selectedTreatment.duration} months</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <p className="font-medium">{selectedTreatment.status}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Base Fee</p>
                                        <p className="font-medium">₹{selectedTreatment.fee.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Insurance Details */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-md font-medium text-gray-800 mb-3">Insurance Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Provider</label>
                                            <input
                                                type="text"
                                                value={insuranceDetails.provider}
                                                onChange={(e) => setInsuranceDetails({...insuranceDetails, provider: e.target.value})}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter insurance provider"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                                            <input
                                                type="text"
                                                value={insuranceDetails.policyNumber}
                                                onChange={(e) => setInsuranceDetails({...insuranceDetails, policyNumber: e.target.value})}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter policy number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Coverage</label>
                                            <input
                                                type="text"
                                                value={insuranceDetails.coverage}
                                                onChange={(e) => setInsuranceDetails({...insuranceDetails, coverage: e.target.value})}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter coverage details"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Valid Until</label>
                                            <input
                                                type="date"
                                                value={insuranceDetails.validUntil}
                                                onChange={(e) => setInsuranceDetails({...insuranceDetails, validUntil: e.target.value})}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Calculation */}
                                {payment && (
                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="text-md font-medium text-gray-800 mb-3">Payment Calculation</h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Base Amount:</span>
                                                    <span className="font-medium">₹{payment.baseAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">GST (18%):</span>
                                                    <span className="font-medium">₹{payment.gst.toLocaleString()}</span>
                                                </div>
                                                <div className="border-t border-gray-200 pt-2 mt-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-800 font-medium">Total Amount:</span>
                                                        <span className="text-gray-800 font-bold">₹{payment.total.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsPanel; 