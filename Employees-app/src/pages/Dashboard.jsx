import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { ClipboardCheck, Receipt, History, User, Banknote, Sparkles, TrendingUp, FileText } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 py-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-5 duration-700">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Hi, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
             {user.role} <span className="mx-1">•</span> {user.branch_id?.name || 'Main Branch'}
          </p>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-primary-600 animate-bounce duration-[3000ms]">
          <Sparkles size={24} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
        <div className="card bg-primary-600 text-white border-none p-5 rounded-[2.5rem] shadow-xl shadow-primary-500/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 bg-white w-24 h-24 rounded-full" />
          <TrendingUp className="text-primary-100 mb-3" size={20} />
          <p className="text-[10px] text-primary-100 font-bold uppercase tracking-widest">Today's Sales</p>
          <p className="text-3xl font-black tracking-tight">₹0</p>
        </div>
        <div className="card bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 text-gray-900 relative">
          <Banknote className="text-green-500 mb-3" size={20} />
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Services</p>
          <p className="text-3xl font-black tracking-tight">0</p>
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
        <h3 className="text-lg font-black text-gray-900 ml-1 tracking-tight">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <NavLink to="/billing" className="card flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl transition-all active:scale-95 shadow-sm hover:shadow-md">
            <div className="p-4 bg-primary-100 rounded-2xl text-primary-600"><Receipt size={28} /></div>
            <span className="text-sm font-black text-gray-700 uppercase tracking-tight">New Bill</span>
          </NavLink>
          <NavLink to="/attendance" className="card flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl transition-all active:scale-95 shadow-sm hover:shadow-md">
            <div className="p-4 bg-orange-100 rounded-2xl text-orange-600"><ClipboardCheck size={28} /></div>
            <span className="text-sm font-black text-gray-700 uppercase tracking-tight">Attendance</span>
          </NavLink>
          <NavLink to="/history" className="card flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl transition-all active:scale-95 shadow-sm hover:shadow-md">
            <div className="p-4 bg-green-100 rounded-2xl text-green-600"><History size={28} /></div>
            <span className="text-sm font-black text-gray-700 uppercase tracking-tight">Earnings</span>
          </NavLink>
          <NavLink to="/expense" className="card flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl transition-all active:scale-95 shadow-sm hover:shadow-md">
            <div className="p-4 bg-red-100 rounded-2xl text-red-600"><FileText size={28} /></div>
            <span className="text-sm font-black text-gray-700 uppercase tracking-tight">Expense</span>
          </NavLink>
          <NavLink to="/profile" className="card flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl transition-all active:scale-95 shadow-sm hover:shadow-md">
            <div className="p-4 bg-purple-100 rounded-2xl text-purple-600"><User size={28} /></div>
            <span className="text-sm font-black text-gray-700 uppercase tracking-tight">Profile</span>
          </NavLink>
        </div>
      </div>

      <div className="card rounded-[2.5rem] p-6 bg-white border border-gray-50 shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
         <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl"><Sparkles size={24} /></div>
             <div>
               <p className="text-sm font-black text-gray-900 tracking-tight">Stay Productive!</p>
               <p className="text-xs text-gray-500 font-medium tracking-tight line-clamp-1">Every service counts towards your incentive.</p>
             </div>
         </div>
         <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-dashed border-gray-100">
            No Recent Activity
         </button>
      </div>
    </div>
  );
};

export default Dashboard;
