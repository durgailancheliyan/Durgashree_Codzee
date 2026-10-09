import React, { useEffect, useState } from 'react';
import { ClipboardList, Calendar, Save } from 'lucide-react';
import {
  ensureConsultation,
  updateConsultation,
  type ConsultationRecord,
} from '@/services/consult.service';
import type { AppointmentItem } from '@/services/dashboard.service';
import { updateAppointmentStatus } from '@/services/dashboard.service';

interface ConsultationPanelProps {
  appointment: AppointmentItem | null;
  consultation: ConsultationRecord | null;
  onUpdated: () => void;
}

const ConsultationPanel: React.FC<ConsultationPanelProps> = ({
  appointment,
  consultation,
  onUpdated,
}) => {
  const [notes, setNotes] = useState('');
  const [followUpAt, setFollowUpAt] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [busy, setBusy] = useState(false);
  const [consultId, setConsultId] = useState<string | null>(consultation?.id ?? null);

  useEffect(() => {
    setConsultId(consultation?.id ?? null);
    setNotes(consultation?.notes ?? '');
    setChiefComplaint(consultation?.chiefComplaint ?? appointment?.notes ?? '');
    setFollowUpNotes(consultation?.followUpNotes ?? '');
    setFollowUpAt(
      consultation?.followUpAt
        ? new Date(consultation.followUpAt).toISOString().slice(0, 16)
        : ''
    );
  }, [consultation, appointment]);

  if (!appointment) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500">
        Select a patient from the queue to track consultation.
      </div>
    );
  }

  const startConsult = async () => {
    setBusy(true);
    try {
      if (appointment.status === 'scheduled') {
        await updateAppointmentStatus(appointment.id, 'checked_in');
      }
      const c = await ensureConsultation({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId ?? undefined,
        chiefComplaint,
      });
      setConsultId(c.id);
      await updateConsultation(c.id, { status: 'in_progress', chiefComplaint, notes });
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    if (!consultId) {
      await startConsult();
      return;
    }
    setBusy(true);
    try {
      await updateConsultation(consultId, {
        notes,
        chiefComplaint,
        followUpNotes,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined,
      });
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const completeConsult = async () => {
    setBusy(true);
    try {
      let id = consultId;
      if (!id) {
        const c = await ensureConsultation({ appointmentId: appointment.id });
        id = c.id;
      }
      await updateConsultation(id!, {
        status: 'completed',
        notes,
        followUpNotes,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined,
        appointmentId: appointment.id,
      });
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const scheduleFollowUp = async () => {
    setBusy(true);
    try {
      let id = consultId;
      if (!id) {
        const c = await ensureConsultation({ appointmentId: appointment.id });
        id = c.id;
      }
      await updateConsultation(id!, {
        status: 'follow_up',
        followUpNotes,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined,
        notes,
      });
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-cyan-700 flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Consultation tracking
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-800">
          {consultation?.status ?? appointment.status}
        </span>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Chief complaint</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2 text-sm"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Consultation notes</label>
        <textarea
          className="mt-1 w-full border rounded px-3 py-2 text-sm"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Exam findings, plan, prescriptions..."
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1 mb-2">
          <Calendar className="h-4 w-4" />
          Follow-up
        </h4>
        <input
          type="datetime-local"
          className="w-full border rounded px-3 py-2 text-sm mb-2"
          value={followUpAt}
          onChange={(e) => setFollowUpAt(e.target.value)}
        />
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={2}
          value={followUpNotes}
          onChange={(e) => setFollowUpNotes(e.target.value)}
          placeholder="Follow-up instructions"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={startConsult}
          className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-md disabled:opacity-50"
        >
          Start consult
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={saveNotes}
          className="px-3 py-1.5 text-sm border border-cyan-600 text-cyan-700 rounded-md flex items-center gap-1"
        >
          <Save className="h-3 w-3" /> Save notes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={scheduleFollowUp}
          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md"
        >
          Schedule follow-up
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={completeConsult}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md"
        >
          Complete
        </button>
      </div>
    </div>
  );
};

export default ConsultationPanel;
