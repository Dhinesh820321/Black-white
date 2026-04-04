import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Add Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap Data and Handle Auth Errors
api.interceptors.response.use(
  (response) => {
    // If backend returns { success, data, message }
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/employee/login', data),
  getProfile: () => api.get('/auth/profile'),
  requestOTP: (data) => api.post('/auth/otp/request', data),
  verifyOTP: (data) => api.post('/auth/otp/verify', data),
  resetPassword: (data) => api.post('/auth/password/reset', data),
  uploadProfileImage: (formData) => api.post('/auth/upload-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const attendanceAPI = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  getToday: () => api.get('/attendance/today'),
  getHistory: (params) => api.get('/attendance', { params }),
};

export const customersAPI = {
  search: (phone) => api.get(`/customers?search=${phone}`),
  create: (data) => api.post('/customers', data),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  create: (data) => api.post('/invoices', data),
};

export const expensesAPI = {
  create: (data) => api.post('/expenses', data),
};

export default api;
