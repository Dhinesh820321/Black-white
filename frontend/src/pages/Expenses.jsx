import { useState, useEffect } from 'react';
import { expensesAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';

const DEFAULT_EXPENSES = [];
const DEFAULT_BRANCHES = [];
const DEFAULT_SUMMARY = { byCategory: [], total: 0 };
const DEFAULT_FORM_DATA = { branch_id: '', title: '', amount: '', category: 'misc' };

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({ date: '', branch_id: '' });
  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA, branch_id: user?.branch_id || '' });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      const params = { ...filters };
      const [expRes, branchRes] = await Promise.all([
        expensesAPI.getAll(params),
        branchesAPI.getAll()
      ]);
      if (expRes?.data?.success && Array.isArray(expRes.data.data)) {
        setExpenses(expRes.data.data);
      }
      if (branchRes?.data?.success && Array.isArray(branchRes.data.data)) {
        setBranches(branchRes.data.data);
      }
      if (filters.date && (filters.branch_id || user?.branch_id)) {
        const sumRes = await expensesAPI.getSummary({ branch_id: filters.branch_id || user?.branch_id, start_date: filters.date, end_date: filters.date });
        if (sumRes?.data?.success) {
          setSummary(sumRes.data.data);
        }
      }
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, formData);
      } else {
        await expensesAPI.create(formData);
      }
      loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({ branch_id: expense.branch_id, title: expense.title, amount: expense.amount, category: expense.category });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this expense?')) {
      await expensesAPI.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({ ...DEFAULT_FORM_DATA, branch_id: user?.branch_id || '' });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track branch expenses</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} className="input w-auto" />
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Created By</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(expenses || []).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(expense.created_at)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{expense.branch_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{expense.created_by_name || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(expense)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
            <h2 className="text-xl font-semibold mb-4">{editingExpense ? 'Edit' : 'Add'} Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Branch</label>
                <select value={formData.branch_id} onChange={(e) => setFormData({...formData, branch_id: e.target.value})} className="input" required>
                  <option value="">Select Branch</option>
                  {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input">
                    <option value="rent">Rent</option>
                    <option value="salary">Salary</option>
                    <option value="electricity">Electricity</option>
                    <option value="supplies">Supplies</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editingExpense ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
