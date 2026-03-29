import axios from 'axios';
import { cleanParams } from '../utils/cleanParams';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
<<<<<<< HEAD
  timeout: 10000
});

api.interceptors.request.use((config) => {
  console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    data: config.data,
    params: config.params
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`🔴 API Error: ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

if (USE_MOCK) {
  api.interceptors.request.use((config) => {
    console.log(`🔵 [MOCK] Intercepted ${config.method?.toUpperCase()} ${config.url}`);
    
    const path = config.url.replace('/api', '');
    
    if (['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase())) {
      console.warn(`⚠️ [MOCK] ${config.method?.toUpperCase()} request - Mock mode does not support mutations. Set VITE_USE_MOCK=false to use real backend.`);
      throw {
        __MOCK__: true,
        __MOCK_ERROR__: true,
        message: `Mock mode: Cannot ${config.method} data. Disable mock mode for write operations.`
      };
    }
    
    const mockResponses = {
      '/dashboard': mockDashboard,
      '/branches': mockData.branches,
      '/employees': mockData.employees,
      '/services': mockData.services,
      '/customers': mockData.customers,
      '/invoices': mockData.invoices,
      '/payments': mockData.payments,
      '/inventory': mockData.inventory,
      '/expenses': mockData.expenses,
      '/attendance/today': mockData.attendance
    };
    
    const mockResponse = mockResponses[path];
    
    if (mockResponse) {
      throw { __MOCK__: true, data: mockResponse };
    }
    
    console.warn(`⚠️ [MOCK] No mock data for ${path} - proceeding to backend`);
    return config;
  });
  
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.__MOCK_ERROR__) {
        alert(error.message);
        return Promise.reject(new Error(error.message));
      }
      if (error.__MOCK__) {
        return Promise.resolve({ data: { success: true, data: error.data } });
      }
      if (!error.response && USE_MOCK) {
        console.warn('⚠️ Backend offline and no mock data available');
        alert('Backend is offline. Set VITE_USE_MOCK=false to use real backend, or start the backend server.');
        return { data: { success: true, data: {} }, status: 200 };
      }
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
} else {
  api.interceptors.request.use((config) => {
=======
  timeout: 15000
});

api.interceptors.request.use(
  (config) => {
    if (config.params) {
      config.params = cleanParams(config.params);
    }
>>>>>>> e44e6b5089c84c50e2b323a799a64103fd242bed
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login/password', data),
  requestOTP: (data) => api.post('/auth/login/otp/request', data),
  verifyOTP: (data) => api.post('/auth/login/otp/verify', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data)
};

export const branchesAPI = {
  getAll: (params) => api.get('/branches', { params }),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`)
};

export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getPerformance: (id, params) => api.get(`/employees/${id}/performance`, { params })
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getToday: (params) => api.get('/attendance/today', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params }),
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data)
};

export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  getDailyTotals: (params) => api.get('/payments/daily-totals', { params }),
  getAnalytics: (params) => api.get('/payments/analytics', { params })
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getDailyRevenue: (params) => api.get('/invoices/daily-revenue', { params }),
  getMonthlyRevenue: (params) => api.get('/invoices/monthly-revenue', { params })
};

export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`)
};

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getVisitHistory: (id) => api.get(`/customers/${id}/visit-history`),
  getRetentionAlerts: (params) => api.get('/customers/retention-alerts', { params })
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getSummary: (params) => api.get('/expenses/summary', { params })
};

export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  useInventory: (data) => api.post('/inventory/use', data),
  getLowStock: (params) => api.get('/inventory/low-stock', { params }),
  getUsageReport: (params) => api.get('/inventory/usage-report', { params })
};

export const dashboardAPI = {
  getDashboard: (params) => api.get('/dashboard', { params }),
  getBranchComparison: (params) => api.get('/dashboard/branch-comparison', { params }),
  getRevenueChart: (params) => api.get('/dashboard/revenue-chart', { params }),
  getTopPerformers: (params) => api.get('/dashboard/top-performers', { params })
};

export const reportsAPI = {
  getDailyReport: (params) => api.get('/reports/daily', { params }),
  getMonthlyReport: (params) => api.get('/reports/monthly', { params }),
  getBranchPerformance: (params) => api.get('/reports/branch-performance', { params }),
  getEmployeePerformance: (params) => api.get('/reports/employee-performance', { params })
};

export default api;
