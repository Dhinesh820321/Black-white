import { useState, useEffect, useCallback } from 'react';
import { customersAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { User, AlertTriangle, Search, Phone, Star, Calendar, Loader2, Plus } from 'lucide-react';

const DEFAULT_CUSTOMERS = [];

export default function Customers() {
  const [customers, setCustomers] = useState(DEFAULT_CUSTOMERS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRetention, setShowRetention] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, new: 0, atRisk: 0, active: 0 });

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = showRetention ? { retention_alert: true } : {};
      const res = await customersAPI.getAll(params);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setCustomers(res.data.data);
        const atRisk = res.data.data.filter(c => c.days_since_visit > 45).length;
        setStats({
          total: res.data.data.length,
          new: res.data.data.filter(c => !c.last_visit).length,
          atRisk,
          active: res.data.data.filter(c => c.days_since_visit <= 30).length
        });
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

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Catalog</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          <p className="text-gray-600 text-sm">Total Customers</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-blue-600">{stats.new}</h3>
          <p className="text-gray-600 text-sm">New Customers</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <Star className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
          <p className="text-gray-600 text-sm">Active (30 days)</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-600">{stats.atRisk}</h3>
          <p className="text-gray-600 text-sm">At Risk (45+ days)</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="customerSearch"
              name="customerSearch"
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button
            onClick={() => setShowRetention(!showRetention)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showRetention ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Retention Alerts
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Last Visit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loyalty Points</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No customers match your search.' : 'No customers found.'}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        {customer.last_visit ? (
                          <>
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={customer.days_since_visit > 45 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {formatDate(customer.last_visit)}
                            </span>
                          </>
                        ) : (
                          <span className="text-blue-600">New Customer</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-600">{customer.loyalty_points || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer.days_since_visit > 45 ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          At Risk
                        </span>
                      ) : customer.days_since_visit > 30 ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Inactive
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
