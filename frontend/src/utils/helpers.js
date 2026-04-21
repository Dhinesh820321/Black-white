import { format, formatDistanceToNow, parseISO } from 'date-fns';
import jsPDFLib from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Apply autoTable plugin to jsPDF
applyPlugin(jsPDFLib);

const jsPDF = jsPDFLib;

export const isValidDate = (date) => {
  if (date === null || date === undefined || date === '') return false;
  if (typeof date === 'string' && date === 'null') return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

export const getDaysSinceVisit = (lastVisit) => {
  if (!isValidDate(lastVisit)) return null;
  const visitDate = new Date(lastVisit);
  const today = new Date();
  const diffTime = today - visitDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatDate = (date) => {
  if (!date || !isValidDate(date)) return '-';
  try {
    return format(parseISO(date), 'dd MMM yyyy');
  } catch {
    return '-';
  }
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(parseISO(date), 'dd MMM yyyy, hh:mm a');
};

export const formatTime = (date) => {
  if (!date) return '-';
  return format(parseISO(date), 'hh:mm a');
};

export const formatRelative = (date) => {
  if (!date) return '-';
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getRoleColor = (role) => {
  const colors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    stylist: 'bg-green-100 text-green-800',
    helper: 'bg-gray-100 text-gray-800'
  };
  return colors[role] || colors.helper;
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    checked_in: 'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || colors.inactive;
};

export const getPaymentTypeColor = (type) => {
  const colors = {
    UPI: 'bg-blue-100 text-blue-800',
    CASH: 'bg-green-100 text-green-800',
    CARD: 'bg-purple-100 text-purple-800'
  };
  return colors[type] || colors.CASH;
};

export const exportToPDF = ({ title, data, columns, filename, footerData }) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  try {
    console.log('📄 PDF Export: Starting...');
    console.log('📄 Data rows:', data.length);
    console.log('📄 Columns:', columns);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Use helvetica - handle rupee symbol specially
    const formatCurrencyForPDF = (amount) => {
      if (amount === null || amount === undefined) return 'Rs. 0.00';
      return 'Rs. ' + new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Salon Management', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(title, pageWidth / 2, 23, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Exported on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 30);
    
    // Prepare table data - replace currency formatting with PDF-safe version
    const tableRows = data.map(item => {
      return columns.map(col => {
        let value = item[col.key];
        if (col.key === 'amount' && typeof value === 'number') {
          value = formatCurrencyForPDF(value);
        } else if (col.format) {
          const formatted = col.format(value, item);
          if (typeof formatted === 'string' && formatted.includes('₹')) {
            value = formatted.replace('₹', 'Rs. ');
          } else {
            value = formatted;
          }
        } else if (value === null || value === undefined) {
          value = '-';
        }
        return String(value);
      });
    });

    console.log('📄 Table rows prepared:', tableRows.length);

    // Use doc.autoTable instead of autoTable(doc, ...)
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: tableRows,
      startY: 35,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
    });

    console.log('📄 AutoTable rendered');

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    
    let footerY = finalY;
    if (footerData) {
      if (footerData.totalCount !== undefined) {
        doc.text(`Total Records: ${footerData.totalCount}`, 14, footerY);
        footerY += 6;
      }
      if (footerData.totalAmount !== undefined) {
        doc.text(`Total Amount: ${formatCurrencyForPDF(footerData.totalAmount)}`, 14, footerY);
        footerY += 6;
      }
      if (footerData.totalCustomers !== undefined) {
        doc.text(`Total Customers: ${footerData.totalCustomers}`, 14, footerY);
        footerY += 6;
      }
    }

    // Page number
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    console.log('📄 Saving PDF...');
    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    console.log('📄 PDF saved successfully');
  } catch (error) {
    console.error('❌ PDF Export Error:', error);
    alert('Failed to export PDF. Error: ' + error.message);
  }
};
