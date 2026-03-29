import { useState, useEffect } from 'react';
import { paymentsAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime, getPaymentTypeColor } from '../utils/helpers';
import { CreditCard, TrendingUp, Calendar } from 'lucide-react';

const DEFAULT_PAYMENTS = [];
const DEFAULT_BRANCHES = [];
const DEFAULT_TOTALS = { upi: 0, cash: 0, card: 0, total: 0 };

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [totals, setTotals] = useState(DEFAULT_TOTALS);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', branch_id: '', payment_type: '' });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      const params = { ...filters };
      const [payRes, branchRes, totalRes] = await Promise.all([
        paymentsAPI.getAll(params),
        branchesAPI.getAll(),
        paymentsAPI.getDailyTotals({ branch_id: filters.branch_id || user?.branch_id, date: filters.date || new Date().toISOString().split('T')[0] })
      ]);
      if (payRes?.data?.success && Array.isArray(payRes.data.data)) {
        setPayments(payRes.data.data);
      }
      if (branchRes?.data?.success && Array.isArray(branchRes.data.data)) {
        setBranches(branchRes.data.data);
      }
      if (totalRes?.data?.success) {
        setTotals(totalRes.data.data);
      }
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Track all payment collections</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">UPI</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.upi_total || totals.upi)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cash</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.cash_total || totals.cash)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Card</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.card_total || totals.card)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-primary-50 border-primary-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-primary-700">Total</p>
              <p className="text-xl font-bold text-primary-900">{formatCurrency(totals.total)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative">
            <label htmlFor="paymentDate" className="sr-only">Filter by Date</label>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input id="paymentDate" name="date" type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} className="input pl-10" />
          </div>
          {user?.role === 'admin' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="paymentBranch" className="sr-only">Filter by Branch</label>
              <select id="paymentBranch" name="branch_id" value={filters.branch_id} onChange={(e) => setFilters({...filters, branch_id: e.target.value})} className="input w-auto">
                <option value="">All Branches</option>
                {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="paymentType" className="sr-only">Filter by Payment Type</label>
            <select id="paymentType" name="payment_type" value={filters.payment_type} onChange={(e) => setFilters({...filters, payment_type: e.target.value})} className="input w-auto">
              <option value="">All Types</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
            </select>
          </div>
        </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(payments || []).map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(payment.created_at)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{payment.branch_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.employee_name}</td>
                  <td className="px-4 py-3 text-sm text-primary-600">{payment.invoice_number || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentTypeColor(payment.payment_type)}`}>
                      {payment.payment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
