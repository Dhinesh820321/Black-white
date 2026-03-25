import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const mockData = {
  branches: [
    { id: 1, name: 'Main Branch - Downtown', location: '123 Main Street', status: 'active', geo_latitude: 28.6139, geo_longitude: 77.2090, geo_radius: 100 },
    { id: 2, name: 'South Mall Branch', location: '456 Mall Road', status: 'active', geo_latitude: 28.5355, geo_longitude: 77.2500, geo_radius: 150 }
  ],
  employees: [
    { id: 1, name: 'Rajesh Kumar', role: 'admin', phone: '9999999999', branch_id: 1, branch_name: 'Main Branch', salary: 50000, status: 'active' },
    { id: 2, name: 'Priya Sharma', role: 'manager', phone: '8888888888', branch_id: 1, branch_name: 'Main Branch', salary: 35000, status: 'active' },
    { id: 3, name: 'Amit Singh', role: 'stylist', phone: '7777777777', branch_id: 1, branch_name: 'Main Branch', salary: 25000, status: 'active' },
    { id: 4, name: 'Neha Gupta', role: 'stylist', phone: '6666666666', branch_id: 2, branch_name: 'South Mall Branch', salary: 22000, status: 'active' }
  ],
  services: [
    { id: 1, name: 'Haircut', price: 300, gst_percentage: 18, duration_minutes: 30, status: 'active' },
    { id: 2, name: 'Hair Coloring', price: 1500, gst_percentage: 18, duration_minutes: 90, status: 'active' },
    { id: 3, name: 'Facial', price: 800, gst_percentage: 18, duration_minutes: 60, status: 'active' },
    { id: 4, name: 'Massage', price: 1200, gst_percentage: 18, duration_minutes: 60, status: 'active' },
    { id: 5, name: 'Manicure', price: 500, gst_percentage: 18, duration_minutes: 45, status: 'active' }
  ],
  customers: [
    { id: 1, name: 'Rahul Verma', phone: '9123456789', last_visit: '2026-03-20', loyalty_points: 150, notes: 'Regular customer' },
    { id: 2, name: 'Sneha Patel', phone: '9234567890', last_visit: '2026-03-15', loyalty_points: 320, notes: 'Prefers organic products' },
    { id: 3, name: 'Vikram Mehta', phone: '9345678901', last_visit: '2026-02-01', loyalty_points: 80, notes: '' }
  ],
  invoices: [
    { id: 1, invoice_number: 'INV-1709123456-ABCD', branch_name: 'Main Branch', employee_name: 'Amit Singh', customer_name: 'Rahul Verma', total_amount: 800, tax_amount: 144, final_amount: 944, payment_type: 'UPI', created_at: '2026-03-24T10:30:00' },
    { id: 2, invoice_number: 'INV-1709123457-EFGH', branch_name: 'Main Branch', employee_name: 'Amit Singh', customer_name: 'Sneha Patel', total_amount: 1500, tax_amount: 270, final_amount: 1770, payment_type: 'CASH', created_at: '2026-03-24T11:45:00' }
  ],
  payments: [
    { id: 1, branch_name: 'Main Branch', employee_name: 'Amit Singh', amount: 944, payment_type: 'UPI', created_at: '2026-03-24T10:30:00' },
    { id: 2, branch_name: 'Main Branch', employee_name: 'Amit Singh', amount: 1770, payment_type: 'CASH', created_at: '2026-03-24T11:45:00' }
  ],
  inventory: [
    { id: 1, branch_name: 'Main Branch', item_name: 'Hair Shampoo', category: 'products', total_quantity: 100, used_quantity: 45, remaining_quantity: 55, unit: 'bottles', min_stock_level: 20 },
    { id: 2, branch_name: 'Main Branch', item_name: 'Hair Conditioner', category: 'products', total_quantity: 80, used_quantity: 30, remaining_quantity: 50, unit: 'bottles', min_stock_level: 15 },
    { id: 3, branch_name: 'Main Branch', item_name: 'Facial Cream', category: 'supplies', total_quantity: 50, used_quantity: 42, remaining_quantity: 8, unit: 'tubs', min_stock_level: 10 }
  ],
  expenses: [
    { id: 1, branch_name: 'Main Branch', title: 'Electricity Bill', amount: 15000, category: 'electricity', created_at: '2026-03-20', created_by_name: 'Priya Sharma' },
    { id: 2, branch_name: 'Main Branch', title: 'Rent Payment', amount: 50000, category: 'rent', created_at: '2026-03-01', created_by_name: 'Priya Sharma' }
  ],
  attendance: [
    { id: 1, employee_name: 'Rajesh Kumar', branch_name: 'Main Branch', status: 'checked_in', check_in_time: '2026-03-24T09:00:00', role: 'admin' },
    { id: 2, employee_name: 'Priya Sharma', branch_name: 'Main Branch', status: 'checked_in', check_in_time: '2026-03-24T09:15:00', role: 'manager' },
    { id: 3, employee_name: 'Amit Singh', branch_name: 'Main Branch', status: 'checked_out', check_in_time: '2026-03-24T10:00:00', check_out_time: '2026-03-24T19:00:00', role: 'stylist' }
  ]
};

const mockDashboard = {
  today: {
    revenue: 12580,
    collection: 12580,
    upiCollection: 6800,
    cashCollection: 5780,
    invoices: 15,
    attendance: { total: 8, checkedIn: 6 }
  },
  month: { revenue: 285400 },
  totals: { lowStockItems: 2, retentionAlerts: 3, totalCustomers: 156 },
  alerts: {
    lowStock: [{ id: 3, item_name: 'Facial Cream', branch_name: 'Main Branch', remaining_quantity: 8 }],
    retention: [{ id: 3, name: 'Vikram Mehta', phone: '9345678901', days_since_visit: 52 }]
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

if (USE_MOCK) {
  api.interceptors.request.use((config) => {
    const mockResponses = {
      '/auth/login': () => mockAuth(config.data ? JSON.parse(config.data) : {}),
      '/dashboard': mockDashboard,
      '/dashboard/revenue-chart': mockRevenueChart,
      '/dashboard/top-performers': mockTopPerformers,
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
    
    const path = config.url.replace('/api', '');
    const mockResponse = mockResponses[path];
    
    if (mockResponse) {
      if (typeof mockResponse === 'function') {
        const result = mockResponse();
        throw { __MOCK__: true, data: result };
      } else {
        throw { __MOCK__: true, data: mockResponse };
      }
    }
    
    return config;
  });
  
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.__MOCK__) {
        return Promise.resolve({ data: { success: true, data: error.data } });
      }
      if (!error.response && USE_MOCK) {
        console.log('Backend offline - using mock data');
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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
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
}

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
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
  getToday: (params) => api.get('/attendance/today', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params }),
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data)
};

export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getDailyTotals: (params) => api.get('/payments/daily-totals', { params }),
  getAnalytics: (params) => api.get('/payments/analytics', { params }),
  create: (data) => api.post('/payments', data)
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
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
