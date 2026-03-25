import { useState, useEffect } from 'react';
import { inventoryAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatNumber } from '../utils/helpers';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';

const DEFAULT_ITEMS = [];
const DEFAULT_BRANCHES = [];
const DEFAULT_FORM_DATA = { branch_id: '', item_name: '', category: 'misc', total_quantity: '', unit: 'pcs', min_stock_level: 10, cost_per_unit: 0 };

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA, branch_id: user?.branch_id || '' });

  useEffect(() => { loadData(); }, [showLowStock]);

  const loadData = async () => {
    try {
      const params = showLowStock ? { low_stock: true } : {};
      if (user?.branch_id && !showLowStock) params.branch_id = user?.branch_id;
      const [invRes, branchRes] = await Promise.all([
        inventoryAPI.getAll(params),
        branchesAPI.getAll()
      ]);
      if (invRes?.data?.success && Array.isArray(invRes.data.data)) {
        setItems(invRes.data.data);
      }
      if (branchRes?.data?.success && Array.isArray(branchRes.data.data)) {
        setBranches(branchRes.data.data);
      }
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, formData);
      } else {
        await inventoryAPI.create(formData);
      }
      loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      branch_id: item.branch_id, item_name: item.item_name, category: item.category || 'misc',
      total_quantity: item.total_quantity, unit: item.unit, min_stock_level: item.min_stock_level, cost_per_unit: item.cost_per_unit
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this item?')) {
      await inventoryAPI.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ ...DEFAULT_FORM_DATA, branch_id: user?.branch_id || '' });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Track and manage inventory items</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowLowStock(!showLowStock)} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showLowStock ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
            <AlertTriangle className="w-4 h-4" /> Low Stock
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Item</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Used</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Remaining</th>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(items || []).map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.remaining_quantity <= item.min_stock_level ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{item.item_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.branch_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{item.category || 'misc'}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(item.total_quantity)} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(item.used_quantity)} {item.unit}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${item.remaining_quantity <= item.min_stock_level ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatNumber(item.remaining_quantity)} {item.unit}
                    </span>
                  </td>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Edit' : 'Add'} Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Branch</label>
                <select value={formData.branch_id} onChange={(e) => setFormData({...formData, branch_id: e.target.value})} className="input" required>
                  <option value="">Select Branch</option>
                  {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Item Name</label>
                <input type="text" value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input">
                    <option value="misc">Misc</option>
                    <option value="products">Products</option>
                    <option value="supplies">Supplies</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Quantity</label>
                  <input type="number" value={formData.total_quantity} onChange={(e) => setFormData({...formData, total_quantity: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Min Level</label>
                  <input type="number" value={formData.min_stock_level} onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Cost/Unit</label>
                  <input type="number" value={formData.cost_per_unit} onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editingItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
