import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Billing from './pages/Billing';
import Expense from './pages/Expense';
import { attendanceAPI, authAPI } from './api/api';
import { History as HistoryIcon, Calendar, ChevronLeft, ChevronRight, Clock, Loader2, Camera, User, LogOut } from 'lucide-react';

const getImageUrl = (path, timestamp) => {
  if (!path) return null;
  let url = path.startsWith('http') ? path : `http://localhost:5000${path}`;
  const t = timestamp || Date.now();
  return `${url}?t=${t}`;
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const History = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;
      
      const res = await attendanceAPI.getHistory({ start_date: startDate, end_date: endDate });
      if (res.success && res.data) {
        setRecords(res.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatDate = (date) => {
    if (!date) return '--';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Shift History</h2>
        <p className="text-gray-500 mt-1 font-medium italic">Your attendance records</p>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        <button onClick={prevMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100">
          <Calendar size={18} className="text-primary-500" />
          <span className="font-bold text-gray-900">{monthNames[currentMonth - 1]} {currentYear}</span>
        </div>
        <button onClick={nextMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <HistoryIcon size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No records found</p>
          <p className="text-gray-400 text-xs mt-1">for {monthNames[currentMonth - 1]} {currentYear}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record._id || record.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.end_time ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <Clock size={18} className={record.end_time ? 'text-green-600' : 'text-yellow-600'} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{formatDate(record.start_time)}</p>
                    <p className="text-xs text-gray-500">
                      {record.end_time ? 'Completed Shift' : 'Shift Ongoing'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatTime(record.start_time)} - {formatTime(record.end_time)}</p>
                  <p className="text-xs text-gray-500">{record.total_hours ? `${record.total_hours.toFixed(1)} hrs` : 'In Progress'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const fileInputRef = useRef(null);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await authAPI.uploadProfileImage(formData);
      if (res.success && res.data) {
        const updatedUser = { ...user, profile_image: res.data.profile_image };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setImageTimestamp(Date.now());
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image');
    }
    setUploading(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account</h2>
        <p className="text-gray-500 mt-1 font-medium">Manage your personal settings</p>
      </div>
      <div className="card space-y-4">
        <div className="flex flex-col items-center gap-4 pb-4">
          <div className="relative">
            {user?.profile_image ? (
              <img 
                src={getImageUrl(user.profile_image, imageTimestamp)} 
                alt="Profile" 
                className="w-24 h-24 rounded-2xl object-cover border-4 border-primary-50"
              />
            ) : (
              <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 font-black text-3xl border-4 border-primary-50">
                {getInitials(user?.name)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-700 transition-colors"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-gray-900">{user?.name || 'Employee'}</p>
            <p className="text-xs text-gray-400 font-bold uppercase">{user?.role || 'Employee'}</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <User size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Phone</p>
              <p className="text-sm font-bold text-gray-900">{user?.phone || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Branch</p>
              <p className="text-sm font-bold text-gray-900">{user?.branch_id?.name || 'Main Branch'}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="btn-primary w-full bg-red-600 hover:bg-red-700 shadow-red-200 flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="billing" element={<Billing />} />
        <Route path="expense" element={<Expense />} />
        <Route path="history" element={<History />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
