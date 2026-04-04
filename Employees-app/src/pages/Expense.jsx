import React, { useState } from 'react';
import { expensesAPI } from '../api/api';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Expense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    payment_mode: 'CASH',
    notes: ''
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    setLoading(true);
    try {
      await expensesAPI.create({
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        payment_mode: formData.payment_mode,
        notes: formData.notes?.trim() || ''
      });
      
      alert('Expense recorded successfully!');
      navigate('/');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to record expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Record Expense</h2>
          <p className="text-sm text-gray-500">Submit an expense for your branch</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="expTitle" className="label">Title *</label>
            <input
              id="expTitle"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Water can, Advance, Travel"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="expAmount" className="label">Amount (₹) *</label>
            <input
              id="expAmount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              placeholder="0.00"
              required
              min="0.01"
              step="0.01"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="label">Payment Mode *</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`card p-4 cursor-pointer text-center transition-all ${
                formData.payment_mode === 'CASH' 
                  ? 'border-2 border-primary-500 bg-primary-50' 
                  : 'border border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment_mode"
                  value="CASH"
                  checked={formData.payment_mode === 'CASH'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className={`text-lg font-bold ${formData.payment_mode === 'CASH' ? 'text-primary-600' : 'text-gray-700'}`}>
                  CASH
                </span>
                <p className={`text-xs mt-1 ${formData.payment_mode === 'CASH' ? 'text-primary-500' : 'text-gray-400'}`}>
                  Taken from cash
                </p>
              </label>
              <label className={`card p-4 cursor-pointer text-center transition-all ${
                formData.payment_mode === 'ONLINE' 
                  ? 'border-2 border-primary-500 bg-primary-50' 
                  : 'border border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment_mode"
                  value="ONLINE"
                  checked={formData.payment_mode === 'ONLINE'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className={`text-lg font-bold ${formData.payment_mode === 'ONLINE' ? 'text-primary-600' : 'text-gray-700'}`}>
                  ONLINE
                </span>
                <p className={`text-xs mt-1 ${formData.payment_mode === 'ONLINE' ? 'text-primary-500' : 'text-gray-400'}`}>
                  UPI/Transfer
                </p>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="expNotes" className="label">Notes (optional)</label>
            <textarea
              id="expNotes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input min-h-[80px]"
              placeholder="Additional details..."
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-base font-bold"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Recording...
              </span>
            ) : (
              'Record Expense'
            )}
          </button>
        </form>
    </div>
  );
};

export default Expense;
