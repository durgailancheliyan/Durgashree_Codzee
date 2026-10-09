import React, { useState } from 'react';
import { 
  User, 
  FileText, 
  Calendar, 
  Activity, 
  Heart, 
  Upload, 
  Download,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Mock data
const patientInfo = {
  id: '12345',
  name: 'John Doe',
  dob: '1985-07-15',
  gender: 'Male',
  bloodType: 'O+',
  height: '175 cm',
  weight: '75 kg',
  allergies: ['Penicillin', 'Peanuts'],
  emergencyContact: {
    name: 'Jane Doe',
    relationship: 'Spouse',
    phone: '(555) 123-4567',
  },
  insurance: {
    provider: 'Health Shield Insurance',
    policyNumber: 'HS-987654321',
    validUntil: '2026-12-31',
  },
};

const medicalRecords = [
  {
    id: 1,
    type: 'Lab Results',
    title: 'Complete Blood Count',
    date: '2025-04-15',
    doctor: 'Dr. Sarah Johnson',
    department: 'Cardiology',
    file: 'cbc_results.pdf',
  },
  {
    id: 2,
    type: 'Prescription',
    title: 'Atorvastatin 20mg',
    date: '2025-04-15',
    doctor: 'Dr. Sarah Johnson',
    department: 'Cardiology',
    file: 'prescription_20250415.pdf',
  },
  {
    id: 3,
    type: 'Medical Report',
    title: 'Annual Checkup Report',
    date: '2025-04-15',
    doctor: 'Dr. Sarah Johnson',
    department: 'Cardiology',
    file: 'annual_checkup_2025.pdf',
  },
  {
    id: 4,
    type: 'Imaging',
    title: 'Chest X-Ray',
    date: '2025-02-28',
    doctor: 'Dr. James Rodriguez',
    department: 'Radiology',
    file: 'chest_xray.jpg',
  },
  {
    id: 5,
    type: 'Lab Results',
    title: 'Lipid Panel',
    date: '2025-02-28',
    doctor: 'Dr. Sarah Johnson',
    department: 'Cardiology',
    file: 'lipid_panel.pdf',
  },
];

const prescriptions = [
  {
    id: 1,
    medication: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once daily',
    prescribedDate: '2025-04-15',
    duration: '3 months',
    doctor: 'Dr. Sarah Johnson',
    notes: 'Take at night before bed',
  },
  {
    id: 2,
    medication: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    prescribedDate: '2025-04-15',
    duration: '3 months',
    doctor: 'Dr. Sarah Johnson',
    notes: 'Take in the morning',
  },
  {
    id: 3,
    medication: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    prescribedDate: '2025-02-28',
    duration: '6 months',
    doctor: 'Dr. Michael Chen',
    notes: 'Take with meals',
  },
];

const vitalHistory = [
  {
    id: 1,
    date: '2025-04-15',
    bloodPressure: '120/80',
    heartRate: '72',
    temperature: '98.6°F',
    oxygenSaturation: '98%',
    weight: '75 kg',
  },
  {
    id: 2,
    date: '2025-02-28',
    bloodPressure: '122/82',
    heartRate: '75',
    temperature: '98.4°F',
    oxygenSaturation: '97%',
    weight: '76 kg',
  },
  {
    id: 3,
    date: '2025-01-15',
    bloodPressure: '118/78',
    heartRate: '70',
    temperature: '98.6°F',
    oxygenSaturation: '99%',
    weight: '77 kg',
  },
];

type TabType = 'overview' | 'records' | 'prescriptions' | 'vitals';

const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = () => {
    setUploading(true);
    // Simulate file upload
    setTimeout(() => {
      setUploading(false);
    }, 2000);
  };

  const renderOverviewTab = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Personal Information
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patientInfo.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Patient ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patientInfo.id}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(patientInfo.dob).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patientInfo.gender}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Blood type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patientInfo.bloodType}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Height</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patientInfo.height}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Weight</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patientInfo.weight}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patientInfo.allergies.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {patientInfo.allergies.map((allergy, index) => (
                          <li key={index}>{allergy}</li>
                        ))}
                      </ul>
                    ) : (
                      'No known allergies'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Emergency Contact
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{patientInfo.emergencyContact.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Relationship</dt>
                    <dd className="mt-1 text-sm text-gray-900">{patientInfo.emergencyContact.relationship}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{patientInfo.emergencyContact.phone}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Insurance Information
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Provider</dt>
                    <dd className="mt-1 text-sm text-gray-900">{patientInfo.insurance.provider}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Policy Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{patientInfo.insurance.policyNumber}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(patientInfo.insurance.validUntil).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <ul className="space-y-4">
              <li className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Appointment with Dr. Sarah Johnson</p>
                    <p className="mt-1 text-sm text-gray-500">April 15, 2025 at 10:30 AM</p>
                  </div>
                </div>
              </li>
              <li className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Prescription Updated</p>
                    <p className="mt-1 text-sm text-gray-500">Atorvastatin 20mg - April 15, 2025</p>
                  </div>
                </div>
              </li>
              <li className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Lab Results Received</p>
                    <p className="mt-1 text-sm text-gray-500">Complete Blood Count - April 15, 2025</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderRecordsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            View and download your medical records
          </div>
          <div className="mt-3 sm:mt-0">
            <button
              onClick={handleFileUpload}
              disabled={uploading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                uploading
                  ? 'bg-cyan-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
              }`}
            >
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {medicalRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {record.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.doctor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-cyan-600 hover:text-cyan-900 inline-flex items-center mr-3">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                      <a href="#" className="text-cyan-600 hover:text-cyan-900">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPrescriptionsTab = () => {
    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-500">
          View your current and past prescriptions
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {prescription.medication}
                  </h3>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {prescription.dosage} - {prescription.frequency}
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Prescribed Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(prescription.prescribedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prescription.duration}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Doctor</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prescription.doctor}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prescription.notes}</dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Request Refill
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVitalsTab = () => {
    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-500">
          Track your vital signs over time
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Vital Signs History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Pressure
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heart Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oxygen Saturation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vitalHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 text-red-500 mr-1" />
                        {record.bloodPressure}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.heartRate} bpm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.temperature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.oxygenSaturation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.weight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Vital Signs Chart
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder - Vital signs over time</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-3 sm:p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <User className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Medical Records</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                View and manage your medical information
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-2 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'overview'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`whitespace-nowrap py-2 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'records'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medical Records
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`whitespace-nowrap py-2 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'prescriptions'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`whitespace-nowrap py-2 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'vitals'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vital Signs
            </button>
          </nav>
        </div>
        <div className="p-2 sm:p-4 md:p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'records' && renderRecordsTab()}
          {activeTab === 'prescriptions' && renderPrescriptionsTab()}
          {activeTab === 'vitals' && renderVitalsTab()}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;