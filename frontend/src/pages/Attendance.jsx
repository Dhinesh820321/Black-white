import { useState, useEffect, useCallback, useMemo } from 'react';
import { attendanceAPI, branchesAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatTime } from '../utils/helpers';
import { Clock, LogIn, LogOut, Calendar, Loader2, User, Building2, Users, Download } from 'lucide-react';

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const formatHours = (decimalHours) => {
  if (!decimalHours || decimalHours === 0) return '0h';
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [attendance, setAttendance] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterType, setFilterType] = useState('date');
  
  const [viewMode, setViewMode] = useState('summary');
  
  const [stats, setStats] = useState({ totalPresent: 0, totalAbsent: 0, totalHours: 0 });

  const loadBranches = useCallback(async () => {
    try {
      const res = await branchesAPI.getAll();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setBranches(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await employeesAPI.getAll();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setEmployees(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (selectedBranch) params.branch_id = selectedBranch;
      
      const res = await attendanceAPI.getAll(params);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setAttendance(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    loadBranches();
    loadEmployees();
  }, [loadBranches, loadEmployees]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      const recordDate = record.date || '';
      const recordMonth = recordDate.substring(0, 7);
      
      let matchesDate = true;
      if (filterType === 'date') {
        matchesDate = recordDate === selectedDate;
      } else if (filterType === 'month') {
        matchesDate = recordMonth === selectedMonth;
      }
      
      const matchesEmployee = !selectedEmployee || 
        record.employee_id?.toString() === selectedEmployee ||
        record.employee_id?._id?.toString() === selectedEmployee;
      
      return matchesDate && matchesEmployee;
    });
  }, [attendance, selectedDate, selectedMonth, filterType, selectedEmployee]);

  const summaryData = useMemo(() => {
    const grouped = {};
    
    filteredAttendance.forEach(record => {
      const empId = record.employee_id?._id?.toString() || record.employee_id?.toString();
      const empName = record.employee_name || 'Unknown';
      const branchName = record.branch_name || '-';
      const role = record.employee_role || 'employee';
      
      if (!grouped[empId]) {
        grouped[empId] = {
          employee_id: empId,
          employee_name: empName,
          branch_name: branchName,
          role: role,
          present_days: 0,
          total_hours: 0,
          records: []
        };
      }
      
      grouped[empId].present_days += 1;
      grouped[empId].total_hours += record.total_hours || 0;
      grouped[empId].records.push(record);
    });
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDaysInMonth = getDaysInMonth(year, month);
    
    Object.values(grouped).forEach(emp => {
      emp.absent_days = Math.max(0, totalDaysInMonth - emp.present_days);
      emp.total_days = totalDaysInMonth;
    });
    
    return Object.values(grouped).sort((a, b) => b.present_days - a.present_days);
  }, [filteredAttendance, selectedMonth]);

  useEffect(() => {
    const totalPresent = summaryData.reduce((sum, emp) => sum + emp.present_days, 0);
    const totalAbsent = summaryData.reduce((sum, emp) => sum + emp.absent_days, 0);
    const totalHours = summaryData.reduce((sum, emp) => sum + emp.total_hours, 0);
    setStats({ totalPresent, totalAbsent, totalHours });
  }, [summaryData]);

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Branch', 'Role', 'Present Days', 'Absent Days', 'Total Hours'];
    const rows = summaryData.map(emp => [
      emp.employee_name,
      emp.branch_name,
      emp.role,
      emp.present_days,
      emp.absent_days,
      formatHours(emp.total_hours)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${filterType === 'date' ? selectedDate : selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading attendance...</span>
      </div>
    );
  }

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const totalDaysInMonth = getDaysInMonth(year, month);
  const dateLabel = filterType === 'date' 
    ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : `${monthName} (${totalDaysInMonth} days)`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track and manage employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'summary' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" /> Summary
          </button>
          <button
            onClick={() => setViewMode('details')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'details' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1" /> Details
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setFilterType('date')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  filterType === 'date' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setFilterType('month')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  filterType === 'month' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
            </div>
            
            {filterType === 'date' ? (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input py-2"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input py-2"
                />
              </div>
            )}
          </div>
          
          {isAdmin && (
            <>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="input pl-10 pr-8 appearance-none bg-white min-w-[160px]"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id || branch._id} value={branch.id || branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="input pl-10 pr-8 appearance-none bg-white min-w-[160px]"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id || emp._id} value={emp.id || emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="w-12 h-12 mx-auto bg-primary-600 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{summaryData.length}</h3>
            <p className="text-gray-600 text-sm">Active Employees</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="w-12 h-12 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600">{totalDaysInMonth}</h3>
            <p className="text-gray-600 text-sm">Total Days</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-green-50 to-green-100">
            <div className="w-12 h-12 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-3">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{stats.totalPresent}</h3>
            <p className="text-gray-600 text-sm">Present Days</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-red-50 to-red-100">
            <div className="w-12 h-12 mx-auto bg-red-600 rounded-full flex items-center justify-center mb-3">
              <LogOut className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-600">{stats.totalAbsent}</h3>
            <p className="text-gray-600 text-sm">Absent Days</p>
          </div>
          <div className="card text-center bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="w-12 h-12 mx-auto bg-yellow-600 rounded-full flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-600">{formatHours(stats.totalHours)}</h3>
            <p className="text-gray-600 text-sm">Total Hours</p>
          </div>
        </div>
      </div>

      {viewMode === 'summary' ? (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{filterType === 'date' ? 'Daily' : 'Monthly'} Summary - {dateLabel}</h2>
              {filterType === 'month' && (
                <p className="text-sm text-gray-500">7 days working (No holidays, No weekends)</p>
              )}
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Present Days</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Absent Days</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No attendance records found for {dateLabel}
                    </td>
                  </tr>
                ) : (
                  summaryData.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {emp.employee_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.employee_name}</p>
                            <p className="text-xs text-gray-500 capitalize">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.branch_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {emp.present_days}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          {emp.absent_days}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {formatHours(emp.total_hours)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{filterType === 'date' ? 'Date' : 'Monthly'} Details - {dateLabel}</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Start Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">End Time</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No attendance records found for {dateLabel}
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((record) => (
                    <tr key={record.id || record._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-sm">
                              {record.employee_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{record.employee_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.branch_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.date || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.start_time ? formatTime(record.start_time) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.end_time ? formatTime(record.end_time) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.total_hours ? (
                          <span className="text-sm font-medium text-gray-900">{formatHours(record.total_hours)}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
