import { useState, useEffect, useCallback } from 'react';
import { expensesAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

const DEFAULT_EXPENSES = [];
const DEFAULT_BRANCHES = [];
const DEFAULT_FORM_DATA = { branch_id: '', title: '', amount: '', category: 'misc' };

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({ date: '', branch_id: '' });
  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA, branch_id: user?.branch_id || '' });
  const [error, setError] = useState(null);

  const loadBranches = useCallback(async () => {
    try {
      const branchRes = await branchesAPI.getAll();
      if (branchRes?.data?.success && Array.isArray(branchRes.data.data)) {
        setBranches(branchRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { ...filters };
      const expRes = await expensesAPI.getAll(params);
      if (expRes?.data?.success && Array.isArray(expRes.data.data)) {
        setExpenses(expRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadExpenses(), loadBranches()]);
    };
    loadData();
  }, [loadExpenses, loadBranches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, formData);
      } else {
        await expensesAPI.create(formData);
      }
      
      await loadExpenses();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      branch_id: expense.branch_id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await expensesAPI.delete(id);
      await loadExpenses();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({ ...DEFAULT_FORM_DATA, branch_id: user?.branch_id || '' });
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading expenses...</span>
      </div>
    );
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="filterDate" className="text-xs font-medium text-gray-500">Filter Date</label>
            <input
              id="filterDate"
              name="date"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
              className="input w-auto"
            />
          </div>
          {user?.role === 'admin' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="filterBranch" className="text-xs font-medium text-gray-500">Filter Branch</label>
              <select
                id="filterBranch"
                name="branch_id"
                value={filters.branch_id}
                onChange={(e) => setFilters({...filters, branch_id: e.target.value})}
                className="input w-auto"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
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
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
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
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDelete(expense.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
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
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="expBranch" className="label">Branch *</label>
                <select
                  id="expBranch"
                  name="branch_id"
                  autoComplete="off"
                  value={formData.branch_id}
                  onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="expTitle" className="label">Title *</label>
                <input
                  id="expTitle"
                  name="title"
                  type="text"
                  autoComplete="off"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expAmount" className="label">Amount (₹) *</label>
                  <input
                    id="expAmount"
                    name="amount"
                    type="number"
                    autoComplete="off"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="input"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="expCategory" className="label">Category</label>
                  <select
                    id="expCategory"
                    name="category"
                    autoComplete="off"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input"
                  >
                    <option value="rent">Rent</option>
                    <option value="salary">Salary</option>
                    <option value="electricity">Electricity</option>
                    <option value="supplies">Supplies</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>
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
                    editingExpense ? 'Update' : 'Create'
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
