import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, MapPin, Eye, EyeOff, Smartphone } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocating(false);
        },
        (err) => {
          console.error("Location error:", err);
          setLocating(false);
        }
      );
    } else {
      setLocating(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(phone, password, location?.lat, location?.lng);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 max-w-lg mx-auto border-x border-gray-100 shadow-xl overflow-hidden">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary-500/10 rotate-3">
             <Smartphone className="text-primary-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2 font-medium">Log in to check-in and start billing</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 animate-in fade-in zoom-in duration-300">
             <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
            <div className="relative group">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Enter 10-digit phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input h-14 pl-4 font-semibold text-lg"
                required
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <div className="relative group">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter security password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input h-14 pl-4 font-semibold text-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-2 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2 px-1 text-sm font-medium">
             <div className={`w-2.5 h-2.5 rounded-full ${location ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : locating ? 'bg-yellow-400' : 'bg-red-500'}`} />
             <span className={location ? 'text-green-600' : locating ? 'text-yellow-600' : 'text-red-500'}>
                {location ? 'Location captured' : locating ? 'Capturing location...' : 'Allow GPS to login'}
             </span>
             <MapPin size={14} className={location ? 'text-green-500' : 'text-gray-400'} />
          </div>

          <button
            type="submit"
            disabled={loading || locating || (!location && !import.meta.env.DEV)}
            className="btn-primary w-full h-15 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all enabled:hover:scale-[1.02] enabled:active:scale-95 shadow-lg shadow-primary-500/20"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><LogIn size={22} /> Log In</>}
          </button>
        </form>

        <p className="text-center mt-10 text-gray-400 text-sm font-medium">
          Forgot your credentials? Contact Admin.
        </p>
      </div>
    </div>
  );
};

export default Login;
