import React, { useState, useEffect } from 'react';
import { customersAPI, servicesAPI, invoicesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Wallet, Smartphone, CreditCard, ChevronRight, Check } from 'lucide-react';

const Billing = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [paymentType, setPaymentType] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll();
      if (res.success) setServices(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSearchCustomer = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    try {
      const res = await customersAPI.search(phone);
      if (res.success && res.data && res.data.length > 0) {
        setCustomer(res.data[0]);
        setStep(2);
      } else {
        setCustomer({ phone, isNew: true });
        setStep(2);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleService = (service) => {
    if (selectedServices.find(s => s.id === (service.id || service._id))) {
      setSelectedServices(selectedServices.filter(s => s.id !== (service.id || service._id)));
    } else {
      setSelectedServices([...selectedServices, { 
        id: service.id || service._id, 
        name: service.name, 
        price: service.price 
      }]);
    }
  };

  const totalAmount = selectedServices.reduce((acc, s) => acc + s.price, 0);

  const handleSubmit = async () => {
    if (selectedServices.length === 0) return;
    setSubmitting(true);
    try {
      let finalCustomerId = customer?.id || customer?._id;
      
      if (customer?.isNew) {
        const custRes = await customersAPI.create({ name: customer.name || 'Walk-in', phone: customer.phone });
        if (custRes.success) finalCustomerId = custRes.data.id || custRes.data._id;
      }

      const res = await invoicesAPI.create({
        branch_id: user.branch_id?._id || user.branch_id?.id || user.branch_id,
        customer_id: finalCustomerId,
        employee_id: user._id || user.id,
        items: selectedServices.map(s => ({
          service_id: s.id,
          quantity: 1,
          price: s.price
        })),
        payment_type: paymentType,
        total_amount: totalAmount,
        paid_amount: totalAmount
      });

      if (res.success) {
        alert('Invoice created successfully!');
        resetForm();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create invoice');
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setStep(1);
    setPhone('');
    setCustomer(null);
    setSelectedServices([]);
    setPaymentType('CASH');
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center py-4">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">New Bill</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
           {[1, 2, 3].map(i => (
             <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-primary-600' : 'w-4 bg-gray-200'}`} />
           ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
          <div className="card space-y-4 rounded-3xl p-6 border-2 border-gray-50 shadow-sm bg-white">
            <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
              <div className="p-2 bg-primary-50 rounded-xl"><Search className="text-primary-600 w-5 h-5" /></div>
              Find Customer
            </h3>
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input h-14 pl-4 font-bold text-xl placeholder:text-gray-300"
                maxLength={10}
              />
              <p className="text-xs text-gray-400 font-bold ml-1 uppercase">Enter phone to continue</p>
            </div>
          </div>
          <button
            onClick={handleSearchCustomer}
            disabled={loading || phone.length < 10}
            className="btn-primary w-full h-15 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <><ChevronRight size={22} /> Continue</>}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
           <div className="card border-primary-100 border-2 rounded-3xl p-5 bg-primary-50/30 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white">
                 {customer?.name?.charAt(0) || <Plus />}
               </div>
               <div>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Customer</p>
                 <p className="text-lg font-black text-gray-900">{customer?.name || 'New Customer'}</p>
                 <p className="text-xs text-primary-600 font-bold">{customer?.phone}</p>
               </div>
             </div>
             {customer?.isNew && (
               <input
                 type="text"
                 placeholder="Enter Name"
                 onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                 className="input h-10 w-32 text-sm bg-white"
               />
             )}
           </div>

           <div className="space-y-3">
             <h3 className="text-lg font-extrabold text-gray-900 ml-1 tracking-tight">Pick Services</h3>
             <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto px-1">
               {services.map(s => {
                 const isSelected = selectedServices.find(ss => ss.id === (s.id || s._id));
                 return (
                   <button
                     key={s.id || s._id}
                     onClick={() => toggleService(s)}
                     className={`card border-2 flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${isSelected ? 'border-primary-500 bg-primary-50/50 shadow-md ring-2 ring-primary-500/10' : 'border-gray-50 hover:bg-gray-50'}`}
                   >
                     <div className="text-left flex items-center gap-3">
                       <div className={`p-2 rounded-xl border transition-colors ${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-gray-100 border-gray-100'}`}>
                          {isSelected ? <Check className="text-white w-4 h-4" /> : <Plus className="text-gray-400 w-4 h-4" />}
                       </div>
                       <div>
                         <p className={`font-black tracking-tight ${isSelected ? 'text-primary-900' : 'text-gray-800'}`}>{s.name}</p>
                         <p className="text-xs text-gray-500 font-bold">Duration: {s.duration} min</p>
                       </div>
                     </div>
                     <span className={`font-black px-3 py-1 bg-white rounded-xl border text-sm ${isSelected ? 'text-primary-600 border-primary-200' : 'text-gray-400 border-gray-100'}`}>₹{s.price}</span>
                   </button>
                 );
               })}
             </div>
           </div>

           <button
             onClick={() => setStep(3)}
             disabled={selectedServices.length === 0}
             className="btn-primary w-full h-15 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all mt-4"
           >
             <div className="flex items-center gap-2">
               <span className="opacity-70 font-medium">Next: Pay ₹{totalAmount}</span>
               <ChevronRight size={22} />
             </div>
           </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
          <div className="card rounded-3xl p-6 bg-white border border-gray-100 shadow-sm space-y-4">
             <div className="flex items-center justify-between border-b border-gray-50 pb-4">
               <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Bill Summary</p>
               <button onClick={() => setStep(2)} className="text-primary-600 text-xs font-black uppercase tracking-tight">Edit Items</button>
             </div>
             <div className="space-y-2">
               {selectedServices.map(s => (
                 <div key={s.id} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                    <span className="font-bold text-gray-700 text-sm truncate max-w-[70%]">{s.name}</span>
                    <span className="font-black text-gray-900 text-sm">₹{s.price}</span>
                 </div>
               ))}
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 mt-4">
                <span className="text-xl font-black text-gray-900 tracking-tight">Total Amount</span>
                <span className="text-3xl font-black text-primary-600 drop-shadow-sm">₹{totalAmount}</span>
             </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-lg font-extrabold text-gray-900 ml-1 tracking-tight">Payment Method</h3>
             <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={() => setPaymentType('CASH')}
                 className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${paymentType === 'CASH' ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-500/10' : 'border-gray-50 bg-white'}`}
               >
                 <div className={`p-3 rounded-2xl ${paymentType === 'CASH' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}><Wallet size={28} /></div>
                 <span className={`text-sm font-black tracking-tight ${paymentType === 'CASH' ? 'text-green-900' : 'text-gray-500'}`}>CASH</span>
               </button>
               <button
                 onClick={() => setPaymentType('UPI')}
                 className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${paymentType === 'UPI' ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-500/10' : 'border-gray-50 bg-white'}`}
               >
                 <div className={`p-3 rounded-2xl ${paymentType === 'UPI' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}><Smartphone size={28} /></div>
                 <span className={`text-sm font-black tracking-tight ${paymentType === 'UPI' ? 'text-primary-900' : 'text-gray-500'}`}>UPI</span>
               </button>
             </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full h-16 rounded-2xl text-xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary-500/30 active:scale-95 transition-all mt-4"
          >
            {submitting ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" /> : <><Check size={28} /> Confirm Bill</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default Billing;
