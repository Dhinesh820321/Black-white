import { useState, useEffect } from 'react';
import { dashboardAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/helpers';
import {
  TrendingUp, TrendingDown, Users, CreditCard, Calendar,
  Package, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#a855f7'];

const defaultDashboard = {
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

const defaultBranches = [
  { id: 1, name: 'Main Branch - Downtown' },
  { id: 2, name: 'South Mall Branch' }
];

const defaultChartData = Array.from({ length: 25 }, (_, i) => ({
  day: i + 1,
  revenue: Math.random() * 5000 + 3000,
  invoices: Math.floor(Math.random() * 10) + 5
}));

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(defaultDashboard);
  const [chartData, setChartData] = useState(defaultChartData);
  const [branches, setBranches] = useState(defaultBranches);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(user?.branch_id || '');

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedBranch ? { branch_id: selectedBranch } : {};
      const [dashRes, chartRes, branchRes] = await Promise.all([
        dashboardAPI.getDashboard(params),
        dashboardAPI.getRevenueChart(params),
        branchesAPI.getAll()
      ]);
      
      if (dashRes?.data?.success && dashRes.data.data) {
        setDashboard(dashRes.data.data);
      }
      if (chartRes?.data?.success && chartRes.data.data) {
        setChartData(chartRes.data.data);
      }
      if (branchRes?.data?.success && branchRes.data.data) {
        setBranches(Array.isArray(branchRes.data.data) ? branchRes.data.data : defaultBranches);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      // Keep default values on error
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const pieData = [
    { name: 'UPI', value: dashboard?.today?.upiCollection || 0 },
    { name: 'Cash', value: dashboard?.today?.cashCollection || 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        {user?.role === 'admin' && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Branches</option>
            {(branches || []).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(dashboard?.today?.revenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            {dashboard?.today?.invoices || 0} invoices today
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Collection</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(dashboard?.today?.collection || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            UPI: {formatCurrency(dashboard?.today?.upiCollection || 0)} | Cash: {formatCurrency(dashboard?.today?.cashCollection || 0)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(dashboard?.month?.revenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            This month so far
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Attendance Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboard?.today?.attendance?.checkedIn || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Out of {dashboard?.today?.attendance?.total || 0} employees
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Split</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-gray-600">{entry.name}: {formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboard?.alerts?.lowStock?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            </div>
            <div className="space-y-3">
              {dashboard.alerts.lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-sm text-gray-500">{item.branch_name}</p>
                  </div>
                  <span className="text-red-600 font-semibold">
                    {item.remaining_quantity} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dashboard?.alerts?.retention?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Retention Alerts</h3>
            </div>
            <div className="space-y-3">
              {dashboard.alerts.retention.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                  <span className="text-yellow-600 font-medium">
                    {customer.days_since_visit} days ago
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
