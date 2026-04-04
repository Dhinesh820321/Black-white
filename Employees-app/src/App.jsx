import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Billing from './pages/Billing';
import Expense from './pages/Expense';
import { History as HistoryIcon } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const History = () => (
  <div className="space-y-6 py-6">
    <div className="text-center">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Shift History</h2>
      <p className="text-gray-500 mt-1 font-medium italic">Showing your recent activity</p>
    </div>
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
      <HistoryIcon size={48} className="text-gray-200 mb-4" />
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No history found</p>
    </div>
  </div>
);

const Profile = () => (
  <div className="space-y-6 py-6">
    <div className="text-center">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account</h2>
      <p className="text-gray-500 mt-1 font-medium">Manage your personal settings</p>
    </div>
    <div className="card space-y-4">
      <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 font-black text-2xl">?</div>
        <div>
          <p className="text-lg font-black text-gray-900">Employee Profile</p>
          <p className="text-xs text-gray-400 font-bold uppercase">Settings Coming Soon</p>
        </div>
      </div>
      <button 
        onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
        className="btn-primary w-full bg-red-600 hover:bg-red-700 shadow-red-200"
      >
        Sign Out
      </button>
    </div>
  </div>
);

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
