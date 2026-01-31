// src/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Shield, AlertTriangle, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch ALL requests for audit
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                    <Shield className="text-green-500" size={32}/> Admin Command Center
                </h1>
                <p className="text-slate-400 mt-1 font-medium">Campus Safety Oversight & Logistics</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition text-white flex items-center gap-2">
                <ArrowLeft size={20} /> Back to Live Feed
            </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard label="Active SOS" value={logs.filter(l => l.type === 'SOS' && l.status !== 'RESOLVED').length} color="bg-red-500" />
            <StatCard label="Total Activity" value={logs.length} color="bg-blue-500" />
            <StatCard label="Resolved" value={logs.filter(l => l.status === 'RESOLVED').length} color="bg-green-500" />
        </div>

        {/* Audit Log */}
        <div className="bg-slate-800/50 rounded-[32px] overflow-hidden border border-slate-700 shadow-2xl">
            <div className="p-6 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
                <h3 className="font-bold text-white uppercase tracking-widest text-xs">Real-Time Audit Log</h3>
            </div>
            <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
                {logs.map(log => (
                    <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-800/80 transition group">
                        <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-2xl ${log.type === 'SOS' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                {log.type === 'SOS' ? <AlertTriangle size={24}/> : <Clock size={24}/>}
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg flex items-center gap-2">
                                    {log.type} 
                                    <span className="text-slate-600 text-xs">•</span> 
                                    <span className={log.type === 'SOS' ? 'text-red-300' : 'text-slate-300'}>{log.requesterName}</span>
                                </p>
                                <p className="text-sm text-slate-400 mt-0.5">{log.title}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${log.status === 'RESOLVED' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                {log.status || 'OPEN'}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-2 font-mono">{log.time || 'Unknown Time'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
    <div className="bg-slate-800 p-6 rounded-[24px] border border-slate-700/50 flex items-center justify-between relative overflow-hidden group hover:border-slate-600 transition">
        <div className="relative z-10">
            <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">{label}</p>
            <h3 className="text-4xl font-black text-white mt-2">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-full ${color} opacity-20 group-hover:scale-125 transition duration-500 blur-xl absolute -right-2 -top-2`}></div>
    </div>
);

export default AdminDashboard;