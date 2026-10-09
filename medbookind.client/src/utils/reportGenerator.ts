import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface ReportData {
  type: 'appointment' | 'medical' | 'prescription' | 'billing';
  data: any;
  title: string;
}

export const generatePDF = (reportData: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Add header
  doc.setFontSize(20);
  doc.text('Hospital Management System', pageWidth / 2, margin, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text(reportData.title, pageWidth / 2, margin + 10, { align: 'center' });

  // Add date
  doc.setFontSize(12);
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, margin, margin + 20);

  // Add content based on report type
  doc.setFontSize(12);
  let yPosition = margin + 30;

  switch (reportData.type) {
    case 'appointment':
      reportData.data.forEach((appointment: any, index: number) => {
        const text = `${index + 1}. ${appointment.patient} - ${appointment.doctor}`;
        const date = format(new Date(appointment.date), 'PPP');
        doc.text(`${text} (${date})`, margin, yPosition);
        yPosition += 10;
      });
      break;

    case 'medical':
      reportData.data.forEach((record: any, index: number) => {
        const text = `${index + 1}. ${record.type}: ${record.title}`;
        const date = format(new Date(record.date), 'PPP');
        doc.text(`${text} - ${date}`, margin, yPosition);
        yPosition += 10;
      });
      break;

    case 'prescription':
      reportData.data.forEach((prescription: any, index: number) => {
        const text = `${index + 1}. ${prescription.medication} ${prescription.dosage}`;
        doc.text(text, margin, yPosition);
        doc.text(`    Frequency: ${prescription.frequency}`, margin, yPosition + 5);
        doc.text(`    Doctor: ${prescription.doctor}`, margin, yPosition + 10);
        yPosition += 20;
      });
      break;

    case 'billing':
      reportData.data.forEach((bill: any, index: number) => {
        const text = `${index + 1}. Amount: $${bill.amount}`;
        const date = format(new Date(bill.date), 'PPP');
        doc.text(`${text} - ${date}`, margin, yPosition);
        doc.text(`    Description: ${bill.description}`, margin, yPosition + 5);
        yPosition += 15;
      });
      break;
  }

  // Add footer
  doc.setFontSize(10);
  doc.text('This is a system-generated report.', margin, doc.internal.pageSize.height - 20);

  // Save the PDF
  doc.save(`${reportData.type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateCSV = (reportData: ReportData) => {
  let csvContent = '';

  // Add headers based on report type
  switch (reportData.type) {
    case 'appointment':
      csvContent = 'Patient,Doctor,Date,Time,Status\n';
      reportData.data.forEach((appointment: any) => {
        csvContent += `${appointment.patient},${appointment.doctor},${appointment.date},${appointment.time},${appointment.status}\n`;
      });
      break;

    case 'medical':
      csvContent = 'Type,Title,Date,Doctor,Department\n';
      reportData.data.forEach((record: any) => {
        csvContent += `${record.type},${record.title},${record.date},${record.doctor},${record.department}\n`;
      });
      break;

    case 'prescription':
      csvContent = 'Medication,Dosage,Frequency,Doctor,Date\n';
      reportData.data.forEach((prescription: any) => {
        csvContent += `${prescription.medication},${prescription.dosage},${prescription.frequency},${prescription.doctor},${prescription.prescribedDate}\n`;
      });
      break;

    case 'billing':
      csvContent = 'Amount,Date,Description,Status\n';
      reportData.data.forEach((bill: any) => {
        csvContent += `${bill.amount},${bill.date},${bill.description},${bill.status}\n`;
      });
      break;
  }

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportData.type}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};