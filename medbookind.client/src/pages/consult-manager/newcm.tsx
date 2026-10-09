import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

// Define types

type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
};

type Appointment = {
  date: string;
  doctor: string;
};

type Exam = {
  notes: string;
  vitals: string;
};

type Treatment = {
  type: string;
  details: string;
};

type Medicine = {
  id: string;
  name: string;
  price: number;
};

type Payment = {
  mode: string;
  amount: number;
};

type Step = 'exam' | 'appointments' | 'treatment' | 'prescription' | 'payment' | 'done';

// Sample/mock data
const samplePatients: Patient[] = [
  { id: '1', name: 'John Doe', age: 30, gender: 'Male' },
  { id: '2', name: 'Jane Smith', age: 25, gender: 'Female' },
  { id: '3', name: 'Alice Johnson', age: 40, gender: 'Female' },
];

const sampleMedicines: Medicine[] = [
  { id: 'm1', name: 'Paracetamol', price: 50 },
  { id: 'm2', name: 'Ibuprofen', price: 80 },
  { id: 'm3', name: 'Amoxicillin', price: 120 },
];

const steps = [
  { key: 'exam', label: 'Exam' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'prescription', label: 'Prescription' },
  { key: 'payment', label: 'Payment' },
  { key: 'done', label: 'Done' },
];

const DoctorPatientViewPage = () => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment>({ date: '', doctor: '' });
  const [exam, setExam] = useState<Exam>({ notes: '', vitals: '' });
  const [treatment, setTreatment] = useState<Treatment>({ type: '', details: '' });
  const [prescription, setPrescription] = useState<Medicine[]>([]);
  const [payment, setPayment] = useState<Payment>({ mode: '', amount: 0 });
  const [step, setStep] = useState<Step>('exam');
  const [status, setStatus] = useState('New');

  const handleSelectPatient = (id: string) => {
    const selected = samplePatients.find(p => p.id === id) || null;
    setSelectedPatientId(id);
    setPatient(selected);
  };

  const handleNext = () => {
    if (step === 'exam') return setStep('appointments');
    if (step === 'appointments') return setStep('treatment');
    if (step === 'treatment') return setStep('prescription');
    if (step === 'prescription') return setStep('payment');
    if (step === 'payment') {
      setStatus('Completed');
      return setStep('done');
    }
  };

  const handleAddPrescription = (medicineId: string) => {
    const med = sampleMedicines.find(m => m.id === medicineId);
    if (med && !prescription.find(p => p.id === med.id)) {
      setPrescription([...prescription, med]);
      setPayment(p => ({ ...p, amount: p.amount + med.price }));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      {/* Sidebar: Patient List */}
      <aside className="md:w-1/4 w-full">
        <Card className="mb-4">
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Patients</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {samplePatients.map(p => (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg cursor-pointer border transition 
                    ${selectedPatientId === p.id 
                      ? 'bg-blue-100 border-blue-400 text-blue-800 font-semibold' 
                      : 'bg-white hover:bg-blue-50 border-gray-200'}`}
                  onClick={() => handleSelectPatient(p.id)}
                >
                  <div className="text-base">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.gender}, Age {p.age}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Timeline/Stepper */}
        <div className="hidden md:block">
          <ol className="space-y-2 mt-6">
            {steps.map(s => (
              <li key={s.key} className={`flex items-center gap-2 ${step === s.key ? 'font-bold text-blue-700' : 'text-gray-500'}`}>
                <span className={`w-3 h-3 rounded-full border-2 ${step === s.key ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'}`}></span>
                {s.label}
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:w-3/4 w-full">
        {patient && (
          <Card>
            <CardContent>
              {/* Stepper for mobile */}
              <div className="md:hidden flex justify-between mb-4">
                {steps.slice(0, -1).map(s => (
                  <div key={s.key} className={`flex-1 text-center text-xs ${step === s.key ? 'font-bold text-blue-700' : 'text-gray-400'}`}>
                    {s.label}
                  </div>
                ))}
              </div>

              {/* Exam */}
              {step === 'exam' && (
                <>
                  <h2 className="text-xl font-bold mb-2">Exam</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea placeholder="Vitals" value={exam.vitals} onChange={e => setExam({ ...exam, vitals: e.target.value })} className="my-1" />
                    <Textarea placeholder="Notes" value={exam.notes} onChange={e => setExam({ ...exam, notes: e.target.value })} className="my-1" />
                  </div>
                </>
              )}

              {/* Appointments */}
              {step === 'appointments' && (
                <>
                  <h2 className="text-xl font-bold mb-2">Appointments</h2>
                  {/* Example: List of appointments for this patient */}
                  <div className="space-y-2">
                    {/* Map your real appointments here */}
                    <div className="bg-blue-50 rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold">Date: 2024-06-27</div>
                        <div className="text-xs text-gray-500">Doctor: Dr. Smith</div>
                      </div>
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Upcoming</span>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Treatment */}
              {step === 'treatment' && (
                <>
                  <h2 className="text-xl font-bold mb-2">Treatment</h2>
                  <Input placeholder="Treatment Type" value={treatment.type} onChange={e => setTreatment({ ...treatment, type: e.target.value })} className="my-1" />
                  <Textarea placeholder="Details" value={treatment.details} onChange={e => setTreatment({ ...treatment, details: e.target.value })} className="my-1" />
                </>
              )}

              {/* Prescription */}
              {step === 'prescription' && (
                <>
                  <h2 className="text-xl font-bold mb-2">Prescription</h2>
                  <div className="flex flex-wrap gap-2">
                    {sampleMedicines.map(m => (
                      <Button key={m.id} onClick={() => handleAddPrescription(m.id)} className="m-1" variant="outline">
                        {m.name} - ₹{m.price}
                      </Button>
                    ))}
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {prescription.map(p => (
                      <li key={p.id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{p.name}</li>
                    ))}
                  </ul>
                </>
              )}

              {/* Payment */}
              {step === 'payment' && (
                <>
                  <h2 className="text-xl font-bold mb-2">Payment</h2>
                  <Input placeholder="Payment Mode" value={payment.mode} onChange={e => setPayment({ ...payment, mode: e.target.value })} className="my-1" />
                  <div className="text-lg font-semibold mt-2">Total: <span className="text-blue-700">₹{payment.amount}</span></div>
                </>
              )}

              {/* Done */}
              {step === 'done' && (
                <div className="mt-4 text-green-600 font-semibold text-lg flex items-center gap-2">
                  <span>Appointment Completed</span> <span>✔️</span>
                </div>
              )}

              {/* Navigation */}
              {step !== 'done' && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNext} className="bg-blue-600 text-white px-6 py-2 rounded shadow">Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DoctorPatientViewPage;
