import { useState, useEffect } from 'react';
import { reportsAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cleanParams } from '../utils/cleanParams';
import { formatCurrency, exportToCSV } from '../utils/helpers';
import { FileText, Download, TrendingUp, Users, Calendar, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const DEFAULT_BRANCHES = [];
const DEFAULT_FILTERS = {
  date: new Date().toISOString().split('T')[0],
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  branch_id: ''
};

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily');
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, branch_id: user?.branch_id || '' });
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType, filters]);

  const loadBranches = async () => {
    try {
      const res = await branchesAPI.getAll();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setBranches(res.data.data);
      }
    } catch (error) { console.error('Error:', error); }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      let res;
      const params = cleanParams({ ...filters });
      if (reportType === 'daily') {
        res = await reportsAPI.getDailyReport(params);
      } else if (reportType === 'monthly') {
        res = await reportsAPI.getMonthlyReport(params);
      } else if (reportType === 'branch') {
        res = await reportsAPI.getBranchPerformance(params);
      } else if (reportType === 'employee') {
        res = await reportsAPI.getEmployeePerformance(params);
      }
      if (res?.data?.success) {
        setReportData(res.data.data);
      }
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleExport = () => {
    if (!reportData) return;
    if (reportType === 'daily' && reportData.invoices) {
      exportToCSV(reportData.invoices, `daily-report-${filters.date}`);
    } else if (reportType === 'monthly' && reportData.dailyData) {
      exportToCSV(reportData.dailyData, `monthly-report-${filters.year}-${filters.month}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and analyze business reports</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'daily', label: 'Daily Report', icon: Calendar },
          { id: 'monthly', label: 'Monthly Report', icon: FileText },
          { id: 'branch', label: 'Branch Performance', icon: Building2, adminOnly: true },
          { id: 'employee', label: 'Employee Performance', icon: Users }
        ].map(tab => (
          (!tab.adminOnly || user?.role === 'admin') && (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${reportType === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        ))}
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          {reportType === 'daily' && (
            <input type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} className="input w-auto" />
          )}
          {reportType === 'monthly' && (
            <>
              <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="input w-auto">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})} className="input w-auto">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString('en', { month: 'long' })}</option>)}
              </select>
            </>
          )}
          {user?.role === 'admin' && (
            <select value={filters.branch_id} onChange={(e) => setFilters({...filters, branch_id: e.target.value})} className="input w-auto">
              <option value="">All Branches</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
        ) : reportData && (
          <>
            {reportType === 'daily' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-700">Revenue</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.revenue?.total)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700">Invoices</p>
                    <p className="text-2xl font-bold text-blue-900">{reportData.revenue?.invoice_count}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-orange-700">Expenses</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(reportData.expenses)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-purple-700">Net Profit</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(reportData.summary?.netProfit)}</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.dailyData?.length > 0 ? reportData.dailyData : []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="revenue" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-700">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.summary?.revenue)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700">Total Invoices</p>
                    <p className="text-2xl font-bold text-blue-900">{reportData.summary?.total_invoices}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-purple-700">Avg Invoice</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(reportData.summary?.avg_invoice_value)}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-orange-700">Profit</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(reportData.profit)}</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.dailyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {reportType === 'branch' && reportData.branches && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Revenue</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Invoices</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Expenses</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Profit</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(reportData.branches || []).map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(b.revenue)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{b.invoices}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(b.expenses)}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(b.profit)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{b.profitMargin}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'employee' && reportData.employees && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Services</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Revenue</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Days Worked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(reportData.employees || []).map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{e.role}</td>
                        <td className="px-4 py-3 text-gray-600">{e.branch_name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{e.services}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrency(e.revenue)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{e.days_worked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
