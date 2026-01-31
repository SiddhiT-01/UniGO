// src/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
        <div className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                    <Shield className="text-green-500" size={32}/> Admin Overwatch
                </h1>
                <p className="text-slate-400 mt-1">Campus Safety & Logistics Monitor</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition">Back to App</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard label="Active SOS" value={logs.filter(l => l.type === 'SOS' && l.status !== 'RESOLVED').length} color="bg-red-500" />
            <StatCard label="Total Requests" value={logs.length} color="bg-blue-500" />
            <StatCard label="Resolved" value={logs.filter(l => l.status === 'RESOLVED').length} color="bg-green-500" />
        </div>

        <div className="bg-slate-800/50 rounded-[32px] overflow-hidden border border-slate-700">
            <div className="p-6 border-b border-slate-700"><h3 className="font-bold text-white">Live Audit Log</h3></div>
            <div className="divide-y divide-slate-700">
                {logs.map(log => (
                    <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-800 transition">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${log.type === 'SOS' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                {log.type === 'SOS' ? <AlertTriangle size={20}/> : <Clock size={20}/>}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{log.type} <span className="text-slate-500">•</span> {log.requesterName}</p>
                                <p className="text-xs text-slate-400">{log.title}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${log.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                                {log.status || 'OPEN'}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">{log.time || 'No time'}</p>
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
    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center justify-between">
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</p>
            <h3 className="text-4xl font-extrabold text-white mt-1">{value}</h3>
        </div>
        <div className={`w-3 h-3 rounded-full ${color} animate-pulse`}></div>
    </div>
);

export default AdminDashboard;