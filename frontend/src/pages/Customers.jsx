import { useState, useEffect, useCallback } from 'react';
import { customersAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { Plus, Edit, Trash2, User, AlertTriangle, Search, Loader2 } from 'lucide-react';

const DEFAULT_CUSTOMERS = [];
const DEFAULT_FORM_DATA = { name: '', phone: '', email: '', notes: '' };

export default function Customers() {
  const [customers, setCustomers] = useState(DEFAULT_CUSTOMERS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRetention, setShowRetention] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [error, setError] = useState(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = showRetention ? { retention_alert: true } : {};
      const res = await customersAPI.getAll(params);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [showRetention]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
      } else {
        await customersAPI.create(formData);
      }
      
      await loadCustomers();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await customersAPI.delete(id);
      await loadCustomers();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData(DEFAULT_FORM_DATA);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading customers...</span>
      </div>
    );
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <label htmlFor="customerSearch" className="sr-only">Search Customers</label>
          <input
            id="customerSearch"
            name="search"
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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No customers match your search.' : 'No customers found. Click "Add Customer" to create one.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="customerName" className="label">Name *</label>
                <input
                  id="customerName"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="customerPhone" className="label">Phone *</label>
                <input
                  id="customerPhone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input"
                  required
                  disabled={!!editingCustomer}
                />
                {editingCustomer && (
                  <p className="text-xs text-gray-500 mt-1">Phone cannot be changed</p>
                )}
              </div>
              
              <div>
                <label htmlFor="customerEmail" className="label">Email</label>
                <input
                  id="customerEmail"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input"
                />
              </div>
              
              <div>
                <label htmlFor="customerNotes" className="label">Notes</label>
                <textarea
                  id="customerNotes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input"
                  rows="3"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    editingCustomer ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
