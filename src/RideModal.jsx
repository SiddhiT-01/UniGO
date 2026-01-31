// src/RideModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { X, MapPin, ShoppingBag, Car, ArrowRight, Save, Clock, Footprints } from 'lucide-react';

const RideModal = ({ isOpen, onClose, user, requestToEdit, userProfile, mode }) => {
  const [type, setType] = useState('RIDE'); 
  const [subType, setSubType] = useState('REQUEST');
  const [formData, setFormData] = useState({ destination: '', description: '', time: '' });
  const [loading, setLoading] = useState(false);

  // 🔥 CORE FIX: Reset form data whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      if (requestToEdit) {
        // CASE A: Editing an existing request -> Populate data
        setType(requestToEdit.type);
        setSubType(requestToEdit.subType || 'REQUEST');
        setFormData({ 
          destination: requestToEdit.destination, 
          description: requestToEdit.description,
          time: requestToEdit.time || ''
        });
      } else {
        // CASE B: Creating a new request -> WIPE DATA CLEAN
        setFormData({ destination: '', description: '', time: '' });
        
        // Handle specific modes passed from Dashboard
        if (mode === 'WALK') {
            setType('WALK');
            setFormData(prev => ({...prev, description: 'Walking alone, need a virtual companion.'}));
        } else if (mode === 'ERRAND') {
            setType('ERRAND');
        } else {
            setType('RIDE');
            setSubType('REQUEST');
        }
      }
    }
  }, [isOpen, requestToEdit, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destination) return;
    setLoading(true);

    // 1. Determine Title Prefix based on type
    const titlePrefix = type === 'WALK' 
      ? "Safe Walk to" 
      : (type === 'RIDE' ? (subType === 'OFFER' ? "Offering Ride to" : "Need Ride to") : "Errand:");

    // 2. Construct Payload
    const payload = {
      type,
      subType: type === 'WALK' ? 'COMPANION' : subType,
      status: "OPEN",
      requesterId: user.uid,
      requesterName: userProfile?.customName || user.displayName,
      requesterGender: userProfile?.gender || 'Prefer not to say', // 🔥 Crucial for "Women Only" filter
      title: `${titlePrefix} ${formData.destination}`,
      destination: formData.destination,
      description: formData.description,
      time: formData.time || "Now",
      // Randomize location slightly so pins don't stack exactly on top of each other
      location: [19.0760 + (Math.random() - 0.5) * 0.005, 72.8777 + (Math.random() - 0.5) * 0.005],
      isPriority: type === 'SOS',
    };

    try {
      if (requestToEdit) {
        await updateDoc(doc(db, "requests", requestToEdit.id), { ...payload, isEdited: true });
        alert("✅ Updated Successfully!");
      } else {
        await addDoc(collection(db, "requests"), { ...payload, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (error) { alert("Error: " + error.message); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500 transition">
          <X size={20} />
        </button>

        {/* Dynamic Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
          {mode === 'WALK' ? 'Start Safe Walk' : (requestToEdit ? 'Update Plan' : 'New Plan')}
        </h2>
        <p className="text-slate-400 text-sm mb-8 font-medium">
          {mode === 'WALK' ? 'Share live location with a companion.' : 'Coordinate travel & errands.'}
        </p>

        {/* Category Toggle (Only show if in Default mode) */}
        {mode === 'DEFAULT' && (
          <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6">
            <button type="button" onClick={() => setType('RIDE')} className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${type === 'RIDE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <Car size={16} /> Travel
            </button>
            <button type="button" onClick={() => setType('ERRAND')} className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${type === 'ERRAND' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>
              <ShoppingBag size={16} /> Errand
            </button>
          </div>
        )}

        {/* Ride Sub-Toggle (Request vs Offer) */}
        {type === 'RIDE' && (
           <div className="flex gap-3 mb-6">
              <button type="button" onClick={() => setSubType('REQUEST')} className={`flex-1 py-2.5 border-2 rounded-xl text-xs font-extrabold transition-all ${subType === 'REQUEST' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-100 text-slate-400'}`}>
                 Need Ride
              </button>
              <button type="button" onClick={() => setSubType('OFFER')} className={`flex-1 py-2.5 border-2 rounded-xl text-xs font-extrabold transition-all ${subType === 'OFFER' ? 'border-green-600 text-green-600 bg-green-50' : 'border-slate-100 text-slate-400'}`}>
                 Offering Ride
              </button>
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Destination Field */}
          <div className="group bg-slate-50 p-4 rounded-2xl border border-slate-100 transition focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-sm">
             <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
               Destination / Item
             </label>
             <div className="flex items-center gap-3">
                <MapPin size={20} className="text-indigo-500" />
                <input 
                  autoFocus
                  required
                  className="bg-transparent w-full outline-none text-slate-900 font-bold placeholder:text-slate-300 text-base"
                  placeholder={type === 'RIDE' ? "e.g. Bandra Station" : "e.g. 2 Coffees"}
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                />
             </div>
          </div>

          {/* Time Field */}
          <div className="group bg-slate-50 p-4 rounded-2xl border border-slate-100 transition focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-sm">
             <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
               Time
             </label>
             <div className="flex items-center gap-3">
                <Clock size={20} className="text-indigo-500" />
                <input 
                  type="text"
                  className="bg-transparent w-full outline-none text-slate-900 font-bold placeholder:text-slate-300 text-base"
                  placeholder="e.g. Now, 5:30 PM"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
             </div>
          </div>

          {/* Details Field */}
          <textarea 
            rows="3"
            className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-indigo-500 focus:bg-white text-sm text-slate-600 font-medium resize-none placeholder:text-slate-400 transition"
            placeholder="Add details (e.g. 'Have 2 seats', 'Swiggy order')"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          {/* Submit Button */}
          <button 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-xl flex justify-center items-center gap-2 transform active:scale-95 transition-all ${mode === 'WALK' ? 'bg-indigo-900 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? "Posting..." : (mode === 'WALK' ? <span>Start Safe Walk <Footprints size={20} className="inline"/></span> : <span>Post Plan <ArrowRight size={20} className="inline"/></span>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RideModal;