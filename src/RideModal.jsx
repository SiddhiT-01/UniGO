// src/RideModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { X, MapPin, ShoppingBag, Car, ArrowRight, Save, Clock, Users } from 'lucide-react';

const RideModal = ({ isOpen, onClose, user, requestToEdit, userProfile }) => {
  const [type, setType] = useState('RIDE'); 
  // NEW: "Offer" vs "Request" toggle (Matches PS "Travel Intentions")
  const [subType, setSubType] = useState('REQUEST'); // 'REQUEST' or 'OFFER'
  const [formData, setFormData] = useState({ destination: '', description: '', time: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requestToEdit) {
      setType(requestToEdit.type);
      setSubType(requestToEdit.subType || 'REQUEST');
      setFormData({ 
        destination: requestToEdit.destination, 
        description: requestToEdit.description,
        time: requestToEdit.time || ''
      });
    } else {
      setFormData({ destination: '', description: '', time: '' });
      setType('RIDE');
      setSubType('REQUEST');
    }
  }, [requestToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destination) return;
    setLoading(true);

    const titlePrefix = type === 'RIDE' 
      ? (subType === 'OFFER' ? "Offering Ride to" : "Need Ride to") 
      : "Errand/Delivery:";

    const payload = {
      type,
      subType, // "Travel Intention"
      status: "OPEN",
      requesterId: user.uid,
      requesterName: userProfile?.customName || user.displayName, // Use custom profile name
      title: `${titlePrefix} ${formData.destination}`,
      destination: formData.destination,
      description: formData.description,
      time: formData.time || "Now", // Matches "Date/Time" requirement
      location: [19.0760 + (Math.random() - 0.5) * 0.005, 72.8777 + (Math.random() - 0.5) * 0.005],
      isPriority: type === 'SOS', // Matches "Priority-based"
    };

    try {
      if (requestToEdit) {
        await updateDoc(doc(db, "requests", requestToEdit.id), { ...payload, isEdited: true });
        alert("✅ Plan Updated!");
      } else {
        await addDoc(collection(db, "requests"), { ...payload, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (error) { alert("Error: " + error.message); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {requestToEdit ? 'Update Plan' : 'New Plan'}
        </h2>
        <p className="text-gray-400 text-xs mb-6">Coordinate travel & errands.</p>

        {/* Main Category Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
          <button type="button" onClick={() => setType('RIDE')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === 'RIDE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
            <Car size={16} /> Travel
          </button>
          <button type="button" onClick={() => setType('ERRAND')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === 'ERRAND' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}>
            <ShoppingBag size={16} /> Errand/Food
          </button>
        </div>

        {/* Sub-Category Toggle (Only for Rides) - Matches "Travel Intentions" */}
        {type === 'RIDE' && (
           <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setSubType('REQUEST')} className={`flex-1 py-2 border-2 rounded-xl text-xs font-bold transition-all ${subType === 'REQUEST' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-100 text-gray-400'}`}>
                 Need Ride
              </button>
              <button type="button" onClick={() => setSubType('OFFER')} className={`flex-1 py-2 border-2 rounded-xl text-xs font-bold transition-all ${subType === 'OFFER' ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-100 text-gray-400'}`}>
                 Offering Ride
              </button>
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Destination / Item Input */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:border-indigo-200 transition">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
               {type === 'RIDE' ? 'Destination' : 'Item / Shop Name'}
             </label>
             <div className="flex items-center gap-2">
                <MapPin size={18} className="text-indigo-400" />
                <input 
                  autoFocus
                  required
                  className="bg-transparent w-full outline-none text-gray-700 font-medium placeholder:text-gray-300 text-sm"
                  placeholder={type === 'RIDE' ? "e.g. Bandra Station, Campus Gate" : "e.g. 2 Coffees, Zomato Order"}
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                />
             </div>
          </div>

          {/* Time Input (Requirement: "Include Date & Time") */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:border-indigo-200 transition">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
               Time of Travel / Delivery
             </label>
             <div className="flex items-center gap-2">
                <Clock size={18} className="text-indigo-400" />
                <input 
                  type="text"
                  className="bg-transparent w-full outline-none text-gray-700 font-medium placeholder:text-gray-300 text-sm"
                  placeholder="e.g. Leaving at 5:00 PM"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
             </div>
          </div>

          {/* Description */}
          <textarea 
            rows="2"
            className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:border-indigo-200 text-xs text-gray-600 resize-none placeholder:text-gray-300"
            placeholder={type === 'RIDE' ? "Details: e.g. 'Have 2 seats left', 'Taking Auto'" : "Details: e.g. 'From Canteen', 'Swiggy Order #445'"}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          <button 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transform active:scale-95 transition-all ${type === 'RIDE' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}
          >
            {loading ? "Posting..." : (requestToEdit ? <span>Save Changes <Save size={18} className="inline"/></span> : <span>Post {subType === 'OFFER' ? 'Offer' : 'Request'} <ArrowRight size={18} className="inline"/></span>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RideModal;