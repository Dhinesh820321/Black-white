import { useState, useEffect } from 'react';
import { invoicesAPI, servicesAPI, customersAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cleanParams } from '../utils/cleanParams';
import { formatCurrency, formatDateTime, getPaymentTypeColor } from '../utils/helpers';
import { Plus, Receipt, Search, Calendar } from 'lucide-react';

const DEFAULT_INVOICES = [];
const DEFAULT_SERVICES = [];
const DEFAULT_CUSTOMERS = [];
const DEFAULT_BRANCHES = [];
const DEFAULT_FORM_DATA = { branch_id: '', customer_id: '', employee_id: '', items: [], payment_type: 'CASH', notes: '' };

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState(DEFAULT_INVOICES);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [customers, setCustomers] = useState(DEFAULT_CUSTOMERS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ date: '', branch_id: '' });
  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA, branch_id: user?.branch_id || '', employee_id: user?.id });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      const params = cleanParams({ ...filters });
      const [invRes, svcRes, custRes, branchRes] = await Promise.all([
        invoicesAPI.getAll(params),
        servicesAPI.getAll({ status: 'active' }),
        customersAPI.getAll(),
        branchesAPI.getAll()
      ]);
      if (invRes?.data?.success && Array.isArray(invRes.data.data)) {
        setInvoices(invRes.data.data);
      }
      if (svcRes?.data?.success && Array.isArray(svcRes.data.data)) {
        setServices(svcRes.data.data);
      }
      if (custRes?.data?.success && Array.isArray(custRes.data.data)) {
        setCustomers(custRes.data.data);
      }
      if (branchRes?.data?.success && Array.isArray(branchRes.data.data)) {
        setBranches(branchRes.data.data);
      }
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleAddItem = (service) => {
    const item = {
      service_id: service.id,
      service_name: service.name,
      price: service.price,
      gst_percentage: service.gst_percentage,
      quantity: 1,
      subtotal: service.price
    };
    setFormData({ ...formData, items: [...formData.items, item] });
  };

  const handleRemoveItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one service');
      return;
    }

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = formData.items.reduce((sum, item) => sum + ((item.price * item.quantity * item.gst_percentage) / 100), 0);
    const finalAmount = totalAmount + taxAmount;

    try {
      await invoicesAPI.create({
        ...formData,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        final_amount: finalAmount
      });
      loadData();
      setShowModal(false);
      setFormData({ branch_id: user?.branch_id || '', customer_id: '', employee_id: user?.id, items: [], payment_type: 'CASH', notes: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Create and manage invoices</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} className="input pl-10" />
          </div>
          {user?.role === 'admin' && (
            <select value={filters.branch_id} onChange={(e) => setFilters({...filters, branch_id: e.target.value})} className="input w-auto">
              <option value="">All Branches</option>
              {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(invoices || []).map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-primary-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{inv.customer_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{inv.branch_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{inv.employee_name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(inv.final_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentTypeColor(inv.payment_type)}`}>
                      {inv.payment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">New Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Branch</label>
                  <select value={formData.branch_id} onChange={(e) => setFormData({...formData, branch_id: e.target.value})} className="input" required>
                    <option value="">Select Branch</option>
                    {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Customer</label>
                  <select value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="input">
                    <option value="">Walk-in Customer</option>
                    {(customers || []).map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Services</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(services || []).map(s => (
                    <button type="button" key={s.id} onClick={() => handleAddItem(s)} className="p-2 text-left border rounded-lg hover:bg-gray-50 text-sm">
                      {s.name} - {formatCurrency(s.price)}
                    </button>
                  ))}
                </div>
                {formData.items.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{item.service_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Type</label>
                  <select value={formData.payment_type} onChange={(e) => setFormData({...formData, payment_type: e.target.value})} className="input">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input" rows="2"></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
