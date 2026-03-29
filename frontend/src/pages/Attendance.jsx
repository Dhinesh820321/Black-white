import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime } from '../utils/helpers';
import { Clock, LogIn, LogOut, Search, Calendar, Loader2, User } from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = { date: dateFilter };
      const res = await attendanceAPI.getAll(params);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setAttendance(res.data.data);
        const present = res.data.data.filter(a => a.status === 'checked_in' || a.status === 'present').length;
        setStats({ present, absent: 0, late: 0, total: res.data.data.length });
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filteredAttendance = attendance.filter(record =>
    (record.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      checked_in: 'bg-green-100 text-green-800',
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      checked_out: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading attendance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Catalog</h1>
          <p className="text-gray-600">Track employee attendance records</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          <p className="text-gray-600 text-sm">Total Staff</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <LogIn className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-600">{stats.present}</h3>
          <p className="text-gray-600 text-sm">Present</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-600">{stats.absent}</h3>
          <p className="text-gray-600 text-sm">Absent</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-600">{stats.late}</h3>
          <p className="text-gray-600 text-sm">Late</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Check In</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Check Out</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {record.employee_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.employee_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{record.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {record.role || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.branch_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.check_in_time ? formatTime(record.check_in_time) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.check_out_time ? formatTime(record.check_out_time) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.working_hours ? `${record.working_hours}h` : '-'}
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
