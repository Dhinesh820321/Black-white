import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { formatTime, getRoleColor } from '../utils/helpers';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';

const DEFAULT_TODAY_ATTENDANCE = [];
const DEFAULT_SUMMARY = null;

export default function Attendance() {
  const { user } = useAuth();
  const { location } = useGeolocation();
  const [todayAttendance, setTodayAttendance] = useState(DEFAULT_TODAY_ATTENDANCE);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, summaryRes] = await Promise.all([
        attendanceAPI.getToday(),
        attendanceAPI.getSummary({ start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] })
      ]);
      if (todayRes?.data?.success && Array.isArray(todayRes.data.data)) {
        setTodayAttendance(todayRes.data.data);
        
        const userToday = todayRes.data.data.find(a => a.employee_id === user?.id);
        if (userToday) {
          setCheckedIn(true);
          setCurrentAttendance(userToday);
        }
      }
      
      if (summaryRes?.data?.success) {
        setSummary(summaryRes.data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await attendanceAPI.checkIn({
        latitude: location?.latitude,
        longitude: location?.longitude
      });
      loadData();
      setCheckedIn(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Check-in failed');
    }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    if (!currentAttendance) return;
    setActionLoading(true);
    try {
      await attendanceAPI.checkOut({
        attendance_id: currentAttendance.id,
        latitude: location?.latitude,
        longitude: location?.longitude
      });
      loadData();
      setCheckedIn(false);
      setCurrentAttendance(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Check-out failed');
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Clock className="w-12 h-12 mx-auto text-primary-600 mb-4" />
          <h3 className="text-4xl font-bold text-gray-900">{(todayAttendance || []).length}</h3>
          <p className="text-gray-600 mt-2">Total Checked In</p>
        </div>
        <div className="card text-center">
          <LogIn className="w-12 h-12 mx-auto text-green-600 mb-4" />
          <h3 className="text-4xl font-bold text-gray-900">{(todayAttendance || []).filter(a => a.status === 'checked_in').length}</h3>
          <p className="text-gray-600 mt-2">Currently Active</p>
        </div>
        <div className="card text-center">
          <LogOut className="w-12 h-12 mx-auto text-orange-600 mb-4" />
          <h3 className="text-4xl font-bold text-gray-900">{summary?.avg_working_hours || 0}</h3>
          <p className="text-gray-600 mt-2">Avg. Hours Today</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Attendance</h3>
          <div className="flex gap-3">
            {location && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <MapPin className="w-4 h-4" /> Location captured
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {!checkedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="flex-1 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {actionLoading ? 'Processing...' : 'Check In'}
            </button>
          ) : (
            <div className="flex-1 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">Checked In</p>
                  <p className="text-green-600 text-sm">at {formatTime(currentAttendance?.check_in_time)}</p>
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  {actionLoading ? 'Processing...' : 'Check Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h3>
        <div className="space-y-3">
          {(todayAttendance || []).map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">{record.employee_name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{record.employee_name}</p>
                  <p className="text-sm text-gray-500">{record.branch_name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${record.status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {record.status === 'checked_in' ? 'Active' : 'Checked Out'}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {formatTime(record.check_in_time)}
                  {record.check_out_time && ` - ${formatTime(record.check_out_time)}`}
                </p>
              </div>
            </div>
          ))}
          {(todayAttendance || []).length === 0 && (
            <p className="text-center text-gray-500 py-8">No attendance records for today</p>
          )}
        </div>
      </div>
    </div>
  );
}
