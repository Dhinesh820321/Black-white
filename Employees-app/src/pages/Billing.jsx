import React, { useState, useEffect } from 'react';
import { customersAPI, servicesAPI, invoicesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Wallet, Smartphone, ChevronRight, Check, UserPlus } from 'lucide-react';

const Billing = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [isWalkin, setIsWalkin] = useState(false);
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

  const handleSkipCustomer = () => {
    setIsWalkin(true);
    setCustomer(null);
    setStep(2);
  };

  const handleSearchCustomer = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    try {
      const res = await customersAPI.search(phone);
      if (res.success && res.data && res.data.length > 0) {
        setCustomer(res.data[0]);
        setIsWalkin(false);
        setStep(2);
      } else {
        setCustomer({ phone, isNew: true });
        setIsWalkin(false);
        setStep(2);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleService = (service) => {
    const serviceId = service._id;
    if (selectedServices.find(s => s.service_id === serviceId)) {
      setSelectedServices(selectedServices.filter(s => s.service_id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, { 
        service_id: serviceId,
        name: service.name, 
        price: service.price,
        quantity: 1,
        defaultPrice: service.price
      }]);
    }
  };

  const handlePriceChange = (index, value) => {
    const val = Number(value);
    if (val < 0) return;
    const updated = [...selectedServices];
    updated[index].price = val;
    setSelectedServices(updated);
  };

  const handleQtyChange = (index, value) => {
    const val = Number(value);
    if (val < 1) return;
    const updated = [...selectedServices];
    updated[index].quantity = val;
    setSelectedServices(updated);
  };

  const removeService = (index) => {
    const updated = [...selectedServices];
    updated.splice(index, 1);
    setSelectedServices(updated);
  };

  const totalAmount = selectedServices.reduce((acc, s) => acc + (s.price * s.quantity), 0);

  const handleSubmit = async () => {
    if (selectedServices.length === 0) return;
    setSubmitting(true);
    try {
      let finalCustomerId = null;
      
      if (isWalkin) {
        finalCustomerId = null;
      } else if (customer?.isNew) {
        const custRes = await customersAPI.create({ name: customer.name || 'Walk-in Customer', phone: customer.phone });
        if (custRes.success) finalCustomerId = custRes.data.id || custRes.data._id;
      } else {
        finalCustomerId = customer?.id || customer?._id;
      }

      const res = await invoicesAPI.create({
        branch_id: user.branch_id?._id || user.branch_id?.id || user.branch_id,
        customer_id: finalCustomerId,
        employee_id: user._id || user.id,
        items: selectedServices.map(s => ({
          service_id: s.service_id,
          quantity: s.quantity,
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
    setIsWalkin(false);
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
                placeholder="Enter 10-digit number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input h-14 pl-4 font-bold text-xl placeholder:text-gray-300"
                maxLength={10}
                id="mobile"
                name="mobile"
              />
              <p className="text-xs text-gray-400 font-bold ml-1 uppercase">Enter phone to continue OR skip</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearchCustomer}
              disabled={loading || (phone.length > 0 && phone.length < 10)}
              className="btn-primary flex-1 h-15 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
            >
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <><Search size={20} /> Search</>}
            </button>
            <button
              onClick={handleSkipCustomer}
              disabled={loading}
              className="btn-secondary h-15 px-6 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 active:scale-95 transition-all"
            >
              <UserPlus size={20} /> Skip
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
           {isWalkin ? (
             <div className="card border-gray-200 border-2 rounded-3xl p-5 bg-gray-50/50 flex items-center gap-3">
               <div className="w-12 h-12 bg-gray-400 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white">
                 <UserPlus size={24} />
               </div>
               <div>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Customer</p>
                 <p className="text-lg font-black text-gray-900">Walk-in Customer</p>
                 <p className="text-xs text-gray-500 font-bold">No phone number</p>
               </div>
             </div>
           ) : (
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
                   name="customer_name"
                   id="customer_name"
                   placeholder="Enter Name"
                   onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                   className="input h-10 w-32 text-sm bg-white"
                 />
               )}
             </div>
           )}

            {selectedServices.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold text-gray-900 ml-1 tracking-tight">Selected Services</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedServices.map((s, idx) => (
                    <div key={s.service_id} className="card border-2 border-primary-200 bg-primary-50/30 p-3 rounded-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate">{s.name}</p>
                          <p className="text-xs text-gray-500">Base: ₹{s.defaultPrice}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            id={`qty-${idx}`}
                            name={`qty-${idx}`}
                            value={s.quantity}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className="input w-14 h-9 text-center text-sm font-bold bg-white"
                            min="1"
                          />
                          <span className="text-xs text-gray-400 font-bold">x</span>
                          <input
                            type="number"
                            id={`price-${idx}`}
                            name={`price-${idx}`}
                            value={s.price}
                            onChange={(e) => handlePriceChange(idx, e.target.value)}
                            className="input w-20 h-9 text-center text-sm font-bold bg-white"
                            min="0"
                          />
                          <button
                            onClick={() => removeService(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-right text-xs text-primary-600 font-bold mt-1">
                        Subtotal: ₹{(s.price * s.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center p-3 bg-primary-600 text-white rounded-xl">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-black">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-extrabold text-gray-900 ml-1 tracking-tight">Pick Services</h3>
              <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto px-1">
                {services.map(s => {
                  const isSelected = selectedServices.find(ss => ss.service_id === s._id);
                  return (
                    <button
                      key={s._id}
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
                <span className="opacity-70 font-medium">Next: Pay ₹{totalAmount.toLocaleString()}</span>
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
                 <div key={s.service_id} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <div>
                      <span className="font-bold text-gray-700 text-sm">{s.name}</span>
                      {s.quantity > 1 && (
                        <span className="text-xs text-gray-500 ml-2">x{s.quantity}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-black text-gray-900 text-sm">₹{(s.price * s.quantity).toLocaleString()}</span>
                      {s.quantity > 1 && (
                        <span className="text-xs text-gray-400 block">₹{s.price} each</span>
                      )}
                    </div>
                 </div>
               ))}
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 mt-4">
                <span className="text-xl font-black text-gray-900 tracking-tight">Total Amount</span>
                <span className="text-3xl font-black text-primary-600 drop-shadow-sm">₹{totalAmount.toLocaleString()}</span>
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
