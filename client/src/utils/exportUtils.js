import { format } from 'date-fns';

/**
 * Common configuration for document styling
 */
const getDocumentConfig = (schoolName, schoolAddress, reportName, appliedFilters) => {
  return {
    schoolName: schoolName || 'School Management System',
    schoolAddress: schoolAddress || '',
    reportName: reportName || 'System Report',
    date: format(new Date(), 'dd MMM yyyy, HH:mm'),
    filters: appliedFilters ? Object.entries(appliedFilters).map(([k, v]) => `${k}: ${v}`).join(' | ') : 'None'
  };
};

/**
 * Generate PDF Report
 */
export const exportToPDF = async (data, columns, schoolInfo, reportName, appliedFilters) => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF('landscape');
  const config = getDocumentConfig(schoolInfo?.name, schoolInfo?.address, reportName, appliedFilters);
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(config.schoolName, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  if (config.schoolAddress) {
    doc.text(config.schoolAddress, 14, 26);
  }

  // Report Title & Meta
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(config.reportName, 14, 35);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${config.date}`, 14, 42);
  doc.text(`Filters: ${config.filters}`, 14, 47);

  // Table Data
  const tableColumn = columns.map(col => col.header);
  const tableRows = data.map(item => {
    return columns.map(col => {
      // Access nested properties if key contains dot (e.g. 'students.name')
      const value = col.key.split('.').reduce((acc, curr) => (acc ? acc[curr] : null), item);
      return value !== null && value !== undefined ? value.toString() : '-';
    });
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 55,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 15, right: 14, bottom: 20, left: 14 },
    didDrawPage: (data) => {
      // Footer
      const str = 'Page ' + doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
      doc.text('Powered by SchoolMS', pageSize.width - 50, pageHeight - 10);
    }
  });

  doc.save(`${reportName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

/**
 * Generate Excel Report
 */
export const exportToExcel = async (data, columns, reportName) => {
  const XLSX = await import('xlsx');
  const formattedData = data.map(item => {
    const row = {};
    columns.forEach(col => {
      const value = col.key.split('.').reduce((acc, curr) => (acc ? acc[curr] : null), item);
      row[col.header] = value !== null && value !== undefined ? value : '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

/**
 * Generate CSV Report
 */
export const exportToCSV = async (data, columns, reportName) => {
  const XLSX = await import('xlsx');
  const formattedData = data.map(item => {
    const row = {};
    columns.forEach(col => {
      const value = col.key.split('.').reduce((acc, curr) => (acc ? acc[curr] : null), item);
      row[col.header] = value !== null && value !== undefined ? value : '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${reportName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
