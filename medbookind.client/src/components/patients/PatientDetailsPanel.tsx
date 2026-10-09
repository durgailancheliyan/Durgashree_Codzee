import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, Treatment } from '../../types/patient';

interface PatientDetailsPanelProps {
    patient: Patient;
    appointment: Appointment;
    onClose: () => void;
}

const mockTreatments: Treatment[] = [
    { id: 1, name: 'General Checkup', type: 'Regular', status: 'pending', fee: 100, duration: 30, description: 'Complete physical examination' },
    { id: 2, name: 'X-Ray', type: 'Diagnostic', status: 'pending', fee: 150, duration: 45, description: 'Chest X-Ray examination' },
    { id: 3, name: 'Blood Test', type: 'Laboratory', status: 'pending', fee: 80, duration: 20, description: 'Complete blood count test' },
    { id: 4, name: 'MRI Scan', type: 'Diagnostic', status: 'pending', fee: 300, duration: 60, description: 'Magnetic Resonance Imaging' },
    { id: 5, name: 'Dental Cleaning', type: 'Regular', status: 'pending', fee: 120, duration: 40, description: 'Professional dental cleaning' },
    { id: 6, name: 'Eye Exam', type: 'Regular', status: 'pending', fee: 90, duration: 25, description: 'Comprehensive eye examination' },
];

const PatientDetailsPanel: React.FC<PatientDetailsPanelProps> = ({ patient, appointment, onClose }) => {
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [treatmentStatus, setTreatmentStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
    const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const categories = ['all', ...new Set(mockTreatments.map(t => t.type))];

    const handleStatusChange = (status: 'pending' | 'in-progress' | 'completed') => {
        setTreatmentStatus(status);
    };

    const handleTreatmentSelect = (treatment: Treatment) => {
        setSelectedTreatments(prev => {
            const exists = prev.find(t => t.id === treatment.id);
            if (exists) {
                return prev.filter(t => t.id !== treatment.id);
            }
            return [...prev, treatment];
        });
    };

    const calculateTotal = () => {
        return selectedTreatments.reduce((sum, treatment) => sum + treatment.fee, 0);
    };

    const filteredTreatments = activeCategory === 'all' 
        ? mockTreatments 
        : mockTreatments.filter(t => t.type === activeCategory);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !sliderRef.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        sliderRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
                {/* Reference Information */}
                <div className="bg-gray-50 rounded-lg p-2 sm:p-4 md:p-6 mb-4 sm:mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500">Patient Name</p>
                            <p className="font-medium text-sm sm:text-base">{patient.name}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500">DOB</p>
                            <p className="font-medium text-sm sm:text-base">{patient.dateOfBirth}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500">Appointment Date & Time</p>
                            <p className="font-medium text-sm sm:text-base">{new Date(appointment.appointmentDateTime).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500">Doctor</p>
                            <p className="font-medium text-sm sm:text-base">{appointment.doctor.name}</p>
                        </div>
                    </div>
                </div>

                {/* Treatment Selection */}
                <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg p-2 sm:p-4 md:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Treatment Selection</h3>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <span className="text-xs sm:text-sm text-gray-500">Status:</span>
                            <div className="flex space-x-1 sm:space-x-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        value="pending"
                                        checked={treatmentStatus === 'pending'}
                                        onChange={() => handleStatusChange('pending')}
                                    />
                                    <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Pending</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        value="in-progress"
                                        checked={treatmentStatus === 'in-progress'}
                                        onChange={() => handleStatusChange('in-progress')}
                                    />
                                    <span className="ml-1 sm:ml-2 text-xs sm:text-sm">In Progress</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        value="completed"
                                        checked={treatmentStatus === 'completed'}
                                        onChange={() => handleStatusChange('completed')}
                                    />
                                    <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Completed</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Treatment Categories */}
                    <div className="mb-3 sm:mb-4">
                        <div
                            ref={sliderRef}
                            className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide"
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        >
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Available Treatments */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">Available Treatments</h4>
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {filteredTreatments.map(treatment => (
                                <div
                                    key={treatment.id}
                                    className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-all ${
                                        selectedTreatments.find(t => t.id === treatment.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => handleTreatmentSelect(treatment)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="text-sm sm:text-[15px] font-medium text-gray-800">{treatment.name}</h5>
                                            <p className="text-xs sm:text-[13px] text-gray-600">{treatment.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm sm:text-[15px] font-medium text-gray-800">${treatment.fee}</p>
                                            <p className="text-xs sm:text-[13px] text-gray-600">{treatment.duration} mins</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Treatments Summary */}
                    {selectedTreatments.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 sm:pt-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Selected Treatments</h4>
                            <div className="space-y-1 sm:space-y-2">
                                {selectedTreatments.map(treatment => (
                                    <div key={treatment.id} className="flex justify-between items-center text-xs sm:text-sm">
                                        <span>{treatment.name}</span>
                                        <span>${treatment.fee}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                    <div className="flex justify-between items-center font-medium">
                                        <span>Total</span>
                                        <span>${calculateTotal()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Insurance Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4 md:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Insurance Information</h3>
                    <div className="space-y-2 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                                <input
                                    type="text"
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                    placeholder="Enter insurance provider"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                                <input
                                    type="text"
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                    placeholder="Enter policy number"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Coverage Type</label>
                                <select className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm">
                                    <option value="">Select coverage type</option>
                                    <option value="basic">Basic</option>
                                    <option value="premium">Premium</option>
                                    <option value="comprehensive">Comprehensive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-2 sm:p-4 md:p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={onClose}
                        className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsPanel;