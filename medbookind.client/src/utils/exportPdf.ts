import { jsPDF } from 'jspdf';
import type { BillingSummary } from '@/services/export.service';

export function downloadAppointmentsPdf(
  rows: Array<{
    dateLabel: string;
    timeLabel: string;
    patientName: string;
    doctorName: string;
    appointmentType: string;
    status: string;
    feePaise?: number;
  }>,
  title = 'Appointments Report'
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  let y = 38;
  const headers = ['Date', 'Patient', 'Doctor', 'Type', 'Status'];
  doc.setFont(undefined, 'bold');
  headers.forEach((h, i) => doc.text(h, 14 + i * 36, y));
  doc.setFont(undefined, 'normal');
  y += 8;

  for (const r of rows.slice(0, 40)) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(r.dateLabel.slice(0, 12), 14, y);
    doc.text(r.patientName.slice(0, 18), 50, y);
    doc.text(r.doctorName.slice(0, 16), 86, y);
    doc.text(r.appointmentType.slice(0, 12), 122, y);
    doc.text(r.status, 158, y);
    y += 7;
  }

  doc.save('appointments-report.pdf');
}

export function downloadBillingPdf(summary: BillingSummary) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Billing Summary', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  let y = 42;
  doc.text(`Subscription revenue: INR ${summary.subscriptionRevenueInr.toLocaleString('en-IN')}`, 14, y);
  y += 10;
  doc.text(`Appointment revenue: INR ${summary.appointmentRevenueInr.toLocaleString('en-IN')}`, 14, y);
  y += 10;
  doc.setFont(undefined, 'bold');
  doc.text(`Total: INR ${summary.totalRevenueInr.toLocaleString('en-IN')}`, 14, (y += 12));
  doc.setFont(undefined, 'normal');

  y += 10;
  doc.text('Subscription line items:', 14, (y += 8));
  for (const item of summary.lineItems.slice(0, 15)) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(
      `${item.planName} — ${item.status} — INR ${item.amountInr} (${new Date(item.date).toLocaleDateString()})`,
      14,
      y
    );
    y += 8;
  }

  doc.save('billing-summary.pdf');
}
