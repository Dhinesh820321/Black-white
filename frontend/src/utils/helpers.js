import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '-';
  return format(parseISO(date), 'dd MMM yyyy');
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

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
