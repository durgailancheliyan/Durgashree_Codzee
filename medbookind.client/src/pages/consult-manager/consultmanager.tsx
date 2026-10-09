import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NewPatientForm from "@/components/patients/NewPatientForm";
import ConsultationPanel from "@/components/consult/ConsultationPanel";
import {
  fetchConsultManager,
  type ConsultManagerData,
  type ConsultationRecord,
} from "@/services/consult.service";
import type { AppointmentItem } from "@/services/dashboard.service";
import dayjs from "dayjs";
import SmartFilters, { type SmartFilterValues } from "@/components/filters/SmartFilters";

// --- Sample Data ---
const samplePractices = [
  {
    id: "p1",
    name: "City Health Clinic",
    locations: [
      { id: "l1", name: "Downtown" },
      { id: "l2", name: "Uptown" },
    ],
  },
  {
    id: "p2",
    name: "Sunrise Medical Center",
    locations: [{ id: "l3", name: "Main Branch" }],
  },
];

const samplePatients = [
  {
    id: "1",
    firstName: "Lisa",
    lastName: "Anderson",
    gender: "Female",
    dob: "1988-03-12",
    email: "lisa.anderson@email.com",
    phone: "555-1234",
    address: "123 Main St",
    practiceId: "p1",
    locationId: "l1",
    insurance: "Aetna",
    doctor: "Dr. Sarah Johnson",
    doctorSpecialty: "Cardiology",
  },
  {
    id: "2",
    firstName: "Robert",
    lastName: "Davis",
    gender: "Male",
    dob: "1975-11-30",
    email: "robert.davis@email.com",
    phone: "555-5678",
    address: "456 Oak Ave",
    practiceId: "p2",
    locationId: "l2",
    insurance: "Blue Cross",
    doctor: "Dr. Emily Brown",
    doctorSpecialty: "Neurology",
  },
  {
    id: "3",
    firstName: "Mary",
    lastName: "Johnson",
    gender: "Female",
    dob: "1992-08-23",
    email: "mary.johnson@email.com",
    phone: "555-9999",
    address: "789 Pine Rd",
    practiceId: "p1",
    locationId: "l1",
    insurance: "Cigna",
    doctor: "Dr. Michael Chen",
    doctorSpecialty: "Pediatrics",
  },
  {
    id: "4",
    firstName: "John",
    lastName: "Smith",
    gender: "Male",
    dob: "1980-05-15",
    email: "john.smith@email.com",
    phone: "555-8888",
    address: "321 Elm St",
    practiceId: "p2",
    locationId: "l2",
    insurance: "United Health",
    doctor: "Dr. Sarah Johnson",
    doctorSpecialty: "Cardiology",
  },
];

const sampleAppointments = [
  {
    id: "a1",
    patientId: "1",
    date: "2024-03-23",
    time: "11:00:00",
    type: "Emergency",
    status: "Pending",
    doctor: "Dr. Sarah Johnson",
    doctorSpecialty: "Cardiology",
    location: "Main Hospital",
    notes: "Chest pain, needs urgent attention.",
  },
  {
    id: "a2",
    patientId: "2",
    date: "2024-03-22",
    time: "10:15:00",
    type: "FollowUp",
    status: "Confirmed",
    doctor: "Dr. Emily Brown",
    doctorSpecialty: "Neurology",
    location: "North Branch",
    notes: "Follow-up for migraine treatment.",
  },
  {
    id: "a3",
    patientId: "3",
    date: "2024-03-21",
    time: "14:30:00",
    type: "Consultation",
    status: "Completed",
    doctor: "Dr. Michael Chen",
    doctorSpecialty: "Pediatrics",
    location: "Downtown Clinic",
    notes: "Routine child checkup.",
  },
  {
    id: "a4",
    patientId: "4",
    date: "2024-03-20",
    time: "09:00:00",
    type: "Observation",
    status: "In Progress",
    doctor: "Dr. Sarah Johnson",
    doctorSpecialty: "Cardiology",
    location: "Main Hospital",
    notes: "Observation for blood pressure.",
  },
];

const treatmentCategories = [
  { key: "all", label: "All" },
  { key: "regular", label: "Regular" },
  { key: "diagnostic", label: "Diagnostic" },
  { key: "laboratory", label: "Laboratory" },
];

const treatments = [
  {
    id: "t1",
    name: "General Checkup",
    description: "Complete physical examination",
    price: 100,
    duration: "30 mins",
    category: "regular",
  },
  {
    id: "t2",
    name: "X-Ray",
    description: "Chest X-Ray examination",
    price: 150,
    duration: "45 mins",
    category: "diagnostic",
  },
  {
    id: "t3",
    name: "Blood Test",
    description: "Complete blood count test",
    price: 80,
    duration: "20 mins",
    category: "laboratory",
  },
  {
    id: "t4",
    name: "MRI Scan",
    description: "Full body MRI scan",
    price: 300,
    duration: "60 mins",
    category: "diagnostic",
  },
];

const treatmentAddons = [
  { id: "a1", name: "ECG", price: 50 },
  { id: "a2", name: "Vitamin D Test", price: 30 },
  { id: "a3", name: "Ultrasound", price: 120 },
];

const statusColors: Record<string, string> = {
  Pending: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
  Confirmed: "bg-purple-100 text-purple-700",
  "": "bg-gray-100 text-gray-700",
};

const typeColors: Record<string, string> = {
  Emergency: "bg-purple-100 text-purple-700",
  FollowUp: "bg-violet-100 text-violet-700",
  Consultation: "bg-pink-100 text-pink-700",
  Observation: "bg-yellow-100 text-yellow-700",
  "": "bg-gray-100 text-gray-700",
};

const treatmentSteps = [
  "Select Treatments",
  "Add Addons",
  "Pharmacy",
  "Payments",
  "Summary",
];

type UiAppointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  status: string;
  doctor: string;
  doctorSpecialty: string;
  location: string;
  notes?: string;
  followupDate?: string;
  _api?: AppointmentItem;
};

const ConsultManager: React.FC = () => {
  const [apiData, setApiData] = useState<ConsultManagerData | null>(null);
  const [useLiveData, setUseLiveData] = useState(false);
  const [appointments, setAppointments] = useState<UiAppointment[]>(sampleAppointments as UiAppointment[]);
  const [patients, setPatients] = useState(samplePatients);
  const [search, setSearch] = useState("");
  const [smartFilters, setSmartFilters] = useState<SmartFilterValues>({
    dateFrom: "",
    dateTo: "",
    doctorId: "",
    patientSearch: "",
  });
  const [practiceLocationFilter, setPracticeLocationFilter] = useState<string>("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<UiAppointment | null>(
    appointments[0] ?? null
  );
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [tab, setTab] = useState("details");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [treatmentNotes, setTreatmentNotes] = useState<string>("");
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [showPrescription, setShowPrescription] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState<ConsultationRecord | null>(null);
  const [practiceOptions, setPracticeOptions] = useState(samplePractices);

  const loadConsultData = useCallback(async () => {
    try {
      const data = await fetchConsultManager();
      setApiData(data);
      setUseLiveData(true);
      const uiAppts: UiAppointment[] = data.appointments.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        date: a.scheduledAt.slice(0, 10),
        time: a.timeLabel,
        type: a.appointmentType,
        status: a.status.replace(/_/g, ' '),
        doctor: a.doctorName,
        doctorSpecialty: '',
        location: '',
        notes: a.notes ?? undefined,
        _api: a,
      }));
      setAppointments(uiAppts.length ? uiAppts : (sampleAppointments as UiAppointment[]));
      if (data.patients.length) {
        setPatients(
          data.patients.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            gender: '',
            dob: p.dateOfBirth?.slice(0, 10) ?? '',
            email: '',
            phone: '',
            address: '',
            practiceId: '',
            locationId: '',
            insurance: p.insuranceProvider ?? '',
            doctor: '',
            doctorSpecialty: '',
          }))
        );
      }
      if (data.locations.length) {
        setPracticeOptions([
          {
            id: 'live',
            name: 'Practice',
            locations: data.locations.map((l) => ({ id: l.id, name: l.name })),
          },
        ]);
      }
    } catch {
      setUseLiveData(false);
    }
  }, []);

  useEffect(() => {
    loadConsultData();
  }, [loadConsultData]);

  useEffect(() => {
    if (!selectedAppointment || !apiData) {
      setSelectedConsult(null);
      return;
    }
    const c = apiData.consultations.find((x) => x.appointmentId === selectedAppointment.id);
    setSelectedConsult(c ?? null);
  }, [selectedAppointment, apiData]);

  // Calculate fees
  const treatmentObj = treatments.find(t => t.id === selectedTreatment);
  const addonsObj = treatmentAddons.filter(a => selectedAddons.includes(a.id));
  const treatmentFee = treatmentObj ? treatmentObj.price : 0;
  const addonsFee = addonsObj.reduce((sum, a) => sum + a.price, 0);
  const insuranceDiscount = 0; // Add your logic if needed
  const total = treatmentFee + addonsFee - insuranceDiscount;

  // Add patient handler (replace with your actual logic)
  const handleAddPatient = async (patientData: { patient?: { firstName: string; lastName: string }; temporaryPassword?: string }) => {
    setShowNewPatient(false);
    await loadConsultData();
    const name = patientData.patient
      ? `${patientData.patient.firstName} ${patientData.patient.lastName}`
      : 'Patient';
    const pwdNote = patientData.temporaryPassword
      ? `\nTemporary login password: ${patientData.temporaryPassword}`
      : '';
    window.alert(`Registered ${name} successfully.${pwdNote}`);
  };

  // Helper for multi-level radio
  const renderPracticeLocationRadios = () => (
    <div className="bg-white rounded-lg shadow border px-3 py-2 max-h-56 overflow-y-auto text-xs">
      <label className="flex items-center gap-2 py-1">
        <input
          type="radio"
          name="practiceLocation"
          value="all"
          checked={practiceLocationFilter === "all"}
          onChange={() => setPracticeLocationFilter("all")}
          className="accent-blue-600"
        />
        <span className="font-medium">All Locations</span>
      </label>
      {practiceOptions.map((practice) => (
        <div key={practice.id} className="pl-1">
          <label className="flex items-center gap-2 py-1 font-semibold text-gray-700">
            <input
              type="radio"
              name="practiceLocation"
              value={practice.id}
              checked={practiceLocationFilter === practice.id}
              onChange={() => setPracticeLocationFilter(practice.id)}
              className="accent-blue-600"
            />
            {practice.name}
          </label>
          <div className="pl-6">
            {practice.locations.map((loc) => (
              <label key={loc.id} className="flex items-center gap-2 py-1 text-gray-600">
                <input
                  type="radio"
                  name="practiceLocation"
                  value={`${practice.id}_${loc.id}`}
                  checked={practiceLocationFilter === `${practice.id}_${loc.id}`}
                  onChange={() => setPracticeLocationFilter(`${practice.id}_${loc.id}`)}
                  className="accent-blue-600"
                />
                {loc.name}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Filtered appointments (update to use practiceLocationFilter)
  const doctorFilterOptions = useMemo(() => {
    const fromApi = apiData?.doctors?.map((d) => ({
      id: d.id,
      name: `Dr. ${d.firstName} ${d.lastName}`,
    })) ?? [];
    if (fromApi.length) return fromApi;
    return doctors.map((doc) => ({ id: doc, name: doc }));
  }, [apiData, doctors]);

  const filteredAppointments = appointments.filter((a) => {
    const patient = patients.find((p) => p.id === a.patientId);
    const q = smartFilters.patientSearch || search;
    const matchesSearch =
      !q ||
      (patient &&
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q.toLowerCase()));
    const matchesDateFrom =
      !smartFilters.dateFrom || a.date >= smartFilters.dateFrom;
    const matchesDateTo =
      !smartFilters.dateTo || a.date <= smartFilters.dateTo;
    const matchesSmartDoctor =
      !smartFilters.doctorId ||
      a._api?.doctorId === smartFilters.doctorId ||
      a.doctor.includes(smartFilters.doctorId);
    let matchesLocation = true;
    if (practiceLocationFilter !== "all") {
      const [practiceId, locationId] = practiceLocationFilter.split("_");
      if (locationId) {
        matchesLocation = patient?.practiceId === practiceId && patient?.locationId === locationId;
      } else {
        matchesLocation = patient?.practiceId === practiceId;
      }
    }
    const matchesLegacyDoctor = doctorFilter === "all" || a.doctor === doctorFilter;
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return (
      matchesSearch &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesSmartDoctor &&
      matchesLocation &&
      matchesLegacyDoctor &&
      matchesType &&
      matchesStatus
    );
  });

  // Unique values for filters
  const doctors = Array.from(new Set(appointments.map((a) => a.doctor)));
  const types = Array.from(new Set(appointments.map((a) => a.type)));
  const statuses = Array.from(new Set(appointments.map((a) => a.status)));

  // Patient details form state (for demo, not persisted)
  const patient = selectedAppointment
    ? patients.find((p) => p.id === selectedAppointment.patientId)
    : null;
  const [patientForm, setPatientForm] = useState<any>(patient || {});

  React.useEffect(() => {
    setPatientForm(patient || {});
  }, [patient]);

  // Insurance form state (for demo, not persisted)
  const [insuranceForm, setInsuranceForm] = useState<any>({
    provider: patient?.insurance || "",
    policyNumber: "",
    validTill: "",
  });

  React.useEffect(() => {
    setInsuranceForm({
      provider: patient?.insurance || "",
      policyNumber: "",
      validTill: "",
    });
  }, [patient]);

  // Helper to calculate age from DOB
  const getAge = (dob?: string) => {
    if (!dob) return "";
    const birth = dayjs(dob);
    const now = dayjs();
    return now.diff(birth, "year");
  };

  return (
    <div className="min-h-screen bg-[#f7faff] p-0">
      <div className="max-w-12xl mx-auto flex flex-col md:flex-row gap-4">
        {/* Left: Appointments List */}
        <div className="md:w-3/6 w-full bg-white rounded-2xl shadow-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Consult Manager</h1>
              <div className="text-gray-500 text-sm">Manage and view all patients</div>
            </div>
            <div className="flex gap-2">
              {useLiveData && (
                <span className="text-xs text-green-600 self-center">Live queue</span>
              )}
              <Button
                variant="outline"
                className="text-xs h-8"
                onClick={() => loadConsultData()}
              >
                Refresh
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-md text-xs"
                onClick={() => setShowNewPatient(true)}
              >
                New Patient
              </Button>
            </div>
          </div>
          {apiData && apiData.queue.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-900 mb-2">Patient queue ({apiData.queue.length})</p>
              <div className="flex flex-wrap gap-2">
                {apiData.queue.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className="text-xs px-2 py-1 bg-white border rounded hover:border-cyan-500"
                    onClick={() => {
                      const row = appointments.find((a) => a.id === q.id);
                      if (row) setSelectedAppointment(row);
                    }}
                  >
                    {q.patientName} · {q.timeLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
          <SmartFilters
            compact
            values={smartFilters}
            onChange={setSmartFilters}
            doctors={doctorFilterOptions}
          />
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Input
              placeholder="Quick search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-36 h-8 text-xs"
            />
            {/* Multi-level radio for location filter */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() =>
                  setShowLocationDropdown((prev: boolean) => !prev)
                }
              >
                {practiceLocationFilter === "all"
                  ? "All Locations"
                  : (() => {
                      const [practiceId, locationId] = practiceLocationFilter.split("_");
                      const practice = practiceOptions.find((p) => p.id === practiceId);
                      if (locationId) {
                        const loc = practice?.locations.find((l) => l.id === locationId);
                        return `${practice?.name} - ${loc?.name}`;
                      }
                      return practice?.name;
                    })()}
              </Button>
              {/* Dropdown */}
              {showLocationDropdown && (
                <div className="absolute z-10 mt-1 left-0">{renderPracticeLocationRadios()}</div>
              )}
            </div>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctors.map((doc) => (
                  <SelectItem key={doc} value={doc}>
                    {doc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#f5f7fa] text-gray-700">
                  <th className="py-3 px-4 text-left">PATIENT INFO</th>
                  <th className="py-3 px-4 text-left">DOCTOR</th>
                  <th className="py-3 px-4 text-left">DATE & TIME</th>
                  <th className="py-3 px-4 text-left">TYPE</th>
                  <th className="py-3 px-4 text-left">LOCATION</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => {
                  const patient = patients.find((p) => p.id === a.patientId);
                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-blue-50 cursor-pointer transition ${
                        selectedAppointment?.id === a.id ? "bg-blue-100" : ""
                      }`}
                      onClick={() => setSelectedAppointment(a)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${
                              a.type === "Emergency"
                                ? "bg-purple-400"
                                : a.type === "FollowUp"
                                ? "bg-violet-400"
                                : a.type === "Consultation"
                                ? "bg-pink-400"
                                : a.type === "Observation"
                                ? "bg-yellow-400"
                                : "bg-gray-300"
                            }`}
                          />
                          <div>
                            <div className="font-semibold text-gray-800">
                              {patient?.firstName} {patient?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              DOB: {patient?.dob}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{a.doctor}</div>
                        <div className="text-xs text-gray-500">{a.doctorSpecialty}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {a.date} <span className="text-xs text-gray-400">{a.time}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[a.type] || "bg-gray-100 text-gray-700"}`}
                        >
                          {a.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">{a.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Tabs for Patient Details, Appointments, Insurance */}
        <div className="md:w-3/6 w-full flex flex-col gap-6">
          {/* Patient Summary (Newly Added) */}
          <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-xl shadow p-4 mb-2 border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 items-center">
              {/* Patient Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center text-blue-700 font-bold text-xl shadow">
                  {patient?.firstName?.[0]}
                  {patient?.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-blue-700 text-sm">Patient</div>
                  <div className="font-semibold text-base truncate">
                    {patient?.firstName} {patient?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    DOB: {patient?.dob} {patient?.dob && `(Age: ${getAge(patient?.dob)})`}
                  </div>
                </div>
              </div>
              {/* Appointment Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 min-w-0">
                <div>
                  <div className="font-bold text-blue-700 text-sm mb-1">Date</div>
                  <div className="text-xs text-gray-700 font-semibold">{selectedAppointment?.date}</div>
                  <div className="text-xs text-gray-400">{selectedAppointment?.time}</div>
                </div>
                <div>
                  <div className="font-bold text-blue-700 text-sm mb-1">Status / Type</div>
                  <div className="flex items-center gap-2 text-xs mb-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        statusColors[selectedAppointment?.status] || "bg-gray-100 text-gray-700"
                      }`}
                      title={selectedAppointment?.status}
                    >
                      {selectedAppointment?.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        typeColors[selectedAppointment?.type] || "bg-gray-100 text-gray-700"
                      }`}
                      title={selectedAppointment?.type}
                    >
                      {selectedAppointment?.type}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-blue-700 text-sm mb-1">Doctor</div>
                  <div className="text-xs text-gray-700">{selectedAppointment?.doctor}</div>
                </div>
                <div>
                  <div className="font-bold text-blue-700 text-sm mb-1">Follow-up</div>
                  <div className="text-xs text-gray-500">{selectedAppointment?.followupDate || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          <ConsultationPanel
            appointment={selectedAppointment?._api ?? null}
            consultation={selectedConsult}
            onUpdated={loadConsultData}
          />

          {/* Treatment Recommendation or Prescription */}
          {!showPrescription ? (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-lg text-blue-700">Treatment Recommendation</div>
                <button
                  type="button"
                  className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-3 py-1 rounded transition"
                  onClick={() => {
                    setSelectedTreatment("");
                    setSeverity("");
                    setSelectedAddons([]);
                    setTreatmentNotes("");
                    setInitialPayment(0);
                  }}
                >
                  <span>+ Add Treatment</span>
                </button>
              </div>
              {/* Saved Treatment Chip */}
              {selectedTreatment && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium text-sm">
                    {treatments.find(t => t.id === selectedTreatment)?.name}
                    <button
                      type="button"
                      className="ml-2 text-blue-500 hover:text-red-500 focus:outline-none"
                      onClick={() => setSelectedTreatment("")}
                      aria-label="Remove treatment"
                    >
                      &times;
                    </button>
                  </span>
                </div>
              )}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setShowPrescription(true);
                }}
                className="space-y-4"
              >
                {/* Treatment Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1">Treatment</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={selectedTreatment}
                    onChange={e => setSelectedTreatment(e.target.value)}
                    required
                  >
                    <option value="">Select Treatment</option>
                    {treatments.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.price}$)
                      </option>
                    ))}
                  </select>
                </div>
                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    placeholder="e.g. Mild, Moderate, Severe"
                  />
                </div>
                {/* Addons */}
                <div>
                  <label className="block text-sm font-medium mb-1">Addons</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    multiple
                    value={selectedAddons}
                    onChange={e =>
                      setSelectedAddons(Array.from(e.target.selectedOptions, option => option.value))
                    }
                  >
                    {treatmentAddons.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (+{a.price}$)
                      </option>
                    ))}
                  </select>
                </div>
                {/* Calculation */}
                <div className="bg-blue-50 rounded p-3 mb-2">
                  <div className="flex justify-between">
                    <span>Treatment Fee:</span>
                    <span>${treatmentFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Addons Fee:</span>
                    <span>${addonsFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance/Discount:</span>
                    <span>-${insuranceDiscount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-700">
                    <span>Total:</span>
                    <span>${total}</span>
                  </div>
                </div>
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Treatment Notes</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    value={treatmentNotes}
                    onChange={e => setTreatmentNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                {/* Initial Payment */}
                <div>
                  <label className="block text-sm font-medium mb-1">Initial Payment</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={initialPayment}
                    onChange={e => setInitialPayment(Number(e.target.value))}
                    min={0}
                    max={total}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded font-semibold mt-2"
                >
                  Save & Move to Prescription
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="font-bold text-lg mb-4 text-blue-700">Prescription</div>
              {/* Show prescription details here */}
              <div className="mb-2">Treatment: {treatmentObj?.name}</div>
              <div className="mb-2">Severity: {severity}</div>
              <div className="mb-2">
                Addons: {addonsObj.map(a => a.name).join(", ") || "None"}
              </div>
              <div className="mb-2">Notes: {treatmentNotes}</div>
              <div className="mb-2">Initial Payment: ${initialPayment}</div>
              <div className="mb-2 font-bold text-blue-700">Total: ${total}</div>
              <button
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold mt-2"
                onClick={() => setShowPrescription(false)}
              >
                Back to Treatment Recommendation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Patient Drawer/Popup */}
      <NewPatientForm
        isOpen={showNewPatient}
        onClose={() => setShowNewPatient(false)}
        onSubmit={handleAddPatient}
      />

      {/* Responsive tweaks */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default ConsultManager;