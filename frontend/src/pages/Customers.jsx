import { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { Plus, Edit, Trash2, User, AlertTriangle, Search } from 'lucide-react';

const DEFAULT_CUSTOMERS = [];
const DEFAULT_FORM_DATA = { name: '', phone: '', email: '', notes: '' };

export default function Customers() {
  const [customers, setCustomers] = useState(DEFAULT_CUSTOMERS);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRetention, setShowRetention] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  useEffect(() => {
    loadData();
  }, [showRetention]);

  const loadData = async () => {
    try {
      const params = showRetention ? { retention_alert: true } : {};
      const res = await customersAPI.getAll(params);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setCustomers(res.data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
      } else {
        await customersAPI.create(formData);
      }
      loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone, email: customer.email || '', notes: customer.notes || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this customer?')) {
      await customersAPI.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const filteredCustomers = (customers || []).filter(c =>
    (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (c.phone || '').includes(searchTerm || '')
  );

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRetention(!showRetention)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showRetention ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Retention Alerts
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Last Visit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loyalty Points</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Notes</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(filteredCustomers || []).map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.last_visit ? (
                      <span className={customer.days_since_visit > 45 ? 'text-red-600 font-medium' : ''}>
                        {formatDate(customer.last_visit)} ({customer.days_since_visit} days ago)
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.loyalty_points || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{customer.notes || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingCustomer ? 'Edit' : 'Add'} Customer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" required disabled={!!editingCustomer} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input" rows="3"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editingCustomer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
