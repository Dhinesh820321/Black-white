import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Home, ClipboardCheck, History, User, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 max-w-lg mx-auto border-x border-gray-100 shadow-xl">
      <header className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600">Employee Hub</h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            {user.name.charAt(0)}
          </div>
        </div>
      </header>

      <main className="p-4 flex-grow overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Home size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <ClipboardCheck size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Punch</span>
        </NavLink>
        <NavLink to="/billing" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className="p-2 -mt-8 bg-primary-600 rounded-full shadow-lg text-white">
            <Receipt size={28} />
          </div>
          <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">Bill</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <History size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">History</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <User size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
