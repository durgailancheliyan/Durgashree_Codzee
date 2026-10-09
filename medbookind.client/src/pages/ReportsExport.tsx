import React, { useEffect, useState } from 'react';
import { FileDown, FileText, IndianRupee, Loader2, Megaphone, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SmartFilters, { type SmartFilterValues } from '@/components/filters/SmartFilters';
import PermissionGate from '@/components/rbac/PermissionGate';
import {
  downloadAppointmentsCsv,
  downloadPatientsCsv,
  fetchAppointmentsForExport,
  fetchBillingSummary,
} from '@/services/export.service';
import { downloadAppointmentsPdf, downloadBillingPdf } from '@/utils/exportPdf';
import { postAnnouncement } from '@/services/notifications.service';
import { ROLE_DESCRIPTIONS, type AppRole } from '@/utils/rbac';
import { UsersService } from '@/services/users.service';

const ReportsExport: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SmartFilterValues>({
    dateFrom: '',
    dateTo: '',
    doctorId: '',
    patientSearch: '',
  });
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const [busy, setBusy] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');

  useEffect(() => {
    UsersService.getUsers()
      .then((users) =>
        setDoctors(
          users
            .filter((u) => u.role === 'Doctor')
            .map((u) => ({ id: u.id!, name: `Dr. ${u.firstName} ${u.lastName}` }))
        )
      )
      .catch(() => {});
  }, []);

  const exportParams = () => ({
    from: filters.dateFrom || undefined,
    to: filters.dateTo ? `${filters.dateTo}T23:59:59` : undefined,
    doctorId: filters.doctorId || undefined,
    patientSearch: filters.patientSearch || undefined,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <header className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & export</h1>
        <p className="text-sm text-gray-500 mt-1">CSV, PDF, and billing summaries</p>
      </header>

      <div className="bg-slate-50 border rounded-lg p-4 flex gap-3">
        <Shield className="h-8 w-8 text-cyan-600 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Your access: {user?.role}</p>
          <p className="text-xs text-gray-600 mt-1">
            {ROLE_DESCRIPTIONS[user?.role as AppRole] ?? '—'}
          </p>
        </div>
      </div>

      <SmartFilters values={filters} onChange={setFilters} doctors={doctors} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExportCard
          title="Appointments CSV"
          icon={<FileDown className="h-6 w-6 text-green-600" />}
          loading={busy === 'csv-a'}
          onClick={async () => {
            setBusy('csv-a');
            try {
              await downloadAppointmentsCsv(exportParams());
            } finally {
              setBusy('');
            }
          }}
        />
        <ExportCard
          title="Appointments PDF"
          icon={<FileText className="h-6 w-6 text-red-600" />}
          loading={busy === 'pdf-a'}
          onClick={async () => {
            setBusy('pdf-a');
            try {
              const data = await fetchAppointmentsForExport(exportParams());
              downloadAppointmentsPdf(
                data.rows as Parameters<typeof downloadAppointmentsPdf>[0]
              );
            } finally {
              setBusy('');
            }
          }}
        />
        <ExportCard
          title="Patients CSV"
          icon={<FileDown className="h-6 w-6 text-blue-600" />}
          loading={busy === 'csv-p'}
          onClick={async () => {
            setBusy('csv-p');
            try {
              await downloadPatientsCsv(filters.patientSearch);
            } finally {
              setBusy('');
            }
          }}
        />
        <PermissionGate permission="billing">
          <ExportCard
            title="Billing PDF"
            icon={<IndianRupee className="h-6 w-6 text-amber-600" />}
            loading={busy === 'pdf-b'}
            onClick={async () => {
              setBusy('pdf-b');
              try {
                const s = await fetchBillingSummary();
                downloadBillingPdf(s);
              } finally {
                setBusy('');
              }
            }}
          />
        </PermissionGate>
      </div>

      <PermissionGate permission="announcements">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-cyan-600" />
            Post announcement
          </h2>
          <input
            className="w-full border rounded px-3 py-2 text-sm mb-2"
            placeholder="Title"
            value={announceTitle}
            onChange={(e) => setAnnounceTitle(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2 text-sm mb-3"
            rows={3}
            placeholder="Message to all practice users..."
            value={announceBody}
            onChange={(e) => setAnnounceBody(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-md"
            onClick={async () => {
              await postAnnouncement(announceTitle, announceBody);
              setAnnounceTitle('');
              setAnnounceBody('');
              alert('Announcement sent');
            }}
          >
            Publish
          </button>
        </div>
      </PermissionGate>
    </div>
  );
};

function ExportCard({
  title,
  icon,
  onClick,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="bg-white border rounded-xl p-5 text-left hover:border-cyan-400 hover:shadow-md transition disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : icon}
      <p className="mt-3 font-medium text-gray-900">{title}</p>
    </button>
  );
}

export default ReportsExport;
