import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../api/api';
import { Fingerprint, MapPin, Clock, ArrowLeftRight } from 'lucide-react';

const Attendance = () => {
  const [status, setStatus] = useState('loading'); // loading, active, checked_in
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetchStatus();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(p => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }));
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await attendanceAPI.getToday();
      if (res.success && res.data && res.data.length > 0) {
        const activeRec = res.data.find(r => r.status === 'checked_in');
        setTodayRecord(activeRec || res.data[0]);
        setStatus(activeRec ? 'checked_in' : 'active');
      } else {
        setStatus('active');
      }
    } catch (err) {
      console.error(err);
      setStatus('active');
    }
  };

  const handlePunch = async () => {
    setLoading(true);
    try {
      if (status === 'active') {
        const res = await attendanceAPI.checkIn({ 
          latitude: location?.lat, 
          longitude: location?.lng 
        });
        if (res.success) {
          setStatus('checked_in');
          setTodayRecord(res.data);
        }
      } else {
        const res = await attendanceAPI.checkOut({ 
          attendance_id: todayRecord?.id || todayRecord?._id,
          latitude: location?.lat, 
          longitude: location?.lng 
        });
        if (res.success) {
          setStatus('active');
          setTodayRecord(res.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
    setLoading(false);
  };

  if (status === 'loading') return <div className="flex animate-pulse items-center justify-center p-20 text-gray-400">Loading status...</div>;

  return (
    <div className="space-y-8 py-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Attendance</h2>
        <p className="text-gray-500 mt-2 font-medium">Punch in to start your shift</p>
      </div>

      <div className="flex justify-center py-6">
        <button
          onClick={handlePunch}
          disabled={loading || !location}
          className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl ${
            status === 'checked_in' 
            ? 'bg-red-50 text-red-600 border-8 border-red-100 shadow-red-500/20' 
            : 'bg-primary-50 text-primary-600 border-8 border-primary-100 shadow-primary-500/20'
          }`}
        >
          <div className={`absolute inset-0 rounded-full border-4 border-white opacity-20 animate-ping ${status === 'checked_in' ? 'border-red-400' : 'border-primary-400'}`} />
          <Fingerprint size={80} strokeWidth={1.5} className="mb-4" />
          <span className="text-2xl font-black uppercase tracking-widest">
            {loading ? 'Processing...' : status === 'checked_in' ? 'Check Out' : 'Check In'}
          </span>
          {!location && <span className="text-xs mt-2 text-red-500 font-bold">Waiting for GPS...</span>}
        </button>
      </div>

      <div className="card space-y-4 rounded-3xl p-6 bg-white border-2 border-gray-50 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-xl"><Clock className="text-blue-600 w-5 h-5" /></div>
             <div>
               <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Today's Shift</p>
               <p className="text-lg font-black text-gray-900">
                 {todayRecord ? (todayRecord.check_in_time ? new Date(todayRecord.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Not started') : 'Not started'}
               </p>
             </div>
           </div>
           <div className="text-right">
             <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Status</p>
             <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mt-1 ${status === 'checked_in' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {status === 'checked_in' ? 'Active' : 'Offline'}
             </span>
           </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
           <div className={`p-2 rounded-xl ${location ? 'bg-green-100' : 'bg-red-100'}`}><MapPin className={`w-5 h-5 ${location ? 'text-green-600' : 'text-red-600'}`} /></div>
           <div className="flex-1">
             <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Current Location</p>
             <p className="text-sm font-bold text-gray-700 truncate line-clamp-1">
               {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Access Denied / Not Found'}
             </p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-gray-900 ml-1 tracking-tight">Shift Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center bg-gray-50 border-none rounded-2xl shadow-none p-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Hours Today</p>
            <p className="text-2xl font-black text-gray-900">{todayRecord?.working_hours || '0.00'}</p>
          </div>
          <div className="card text-center bg-gray-50 border-none rounded-2xl shadow-none p-4">
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Break Time</p>
             <p className="text-2xl font-black text-gray-900">0m</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
