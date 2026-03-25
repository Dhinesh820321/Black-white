import { useState, useEffect } from 'react';
import { servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import { Plus, Edit, Trash2, Scissors } from 'lucide-react';

const DEFAULT_SERVICES = [];
const DEFAULT_FORM_DATA = { name: '', price: '', gst_percentage: 18, duration_minutes: 30, commission_percentage: 0, status: 'active' };

export default function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await servicesAPI.getAll();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setServices(res.data.data);
      }
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await servicesAPI.update(editingService.id, formData);
      } else {
        await servicesAPI.create(formData);
      }
      loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({ name: service.name, price: service.price, gst_percentage: service.gst_percentage, duration_minutes: service.duration_minutes, commission_percentage: service.commission_percentage, status: service.status });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this service?')) {
      await servicesAPI.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600">Manage your salon services</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(services || []).map((service) => (
          <div key={service.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Scissors className="w-5 h-5 text-primary-600" />
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {service.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
            <p className="text-2xl font-bold text-primary-600 mt-2">{formatCurrency(service.price)}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-gray-500">
              <span>{service.duration_minutes} min</span>
              <span>GST: {service.gst_percentage}%</span>
            </div>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleEdit(service)} className="flex-1 btn-secondary text-sm py-2">
                  <Edit className="w-4 h-4 inline mr-1" /> Edit
                </button>
                <button onClick={() => handleDelete(service.id)} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingService ? 'Edit' : 'Add'} Service</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Service Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">GST %</label>
                  <input type="number" value={formData.gst_percentage} onChange={(e) => setFormData({...formData, gst_percentage: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Commission %</label>
                  <input type="number" value={formData.commission_percentage} onChange={(e) => setFormData({...formData, commission_percentage: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editingService ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
