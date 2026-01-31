// src/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UniGoLogo } from './UniGoLogo'; // Make sure this exists or replace with text
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UniGoLogo className="h-8 w-auto" />
            <span className="font-extrabold text-xl text-slate-900 tracking-tight"></span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-full font-bold text-slate-600 hover:text-slate-900 transition">Log In</button>
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-indigo-200/30 to-purple-200/30 rounded-full blur-[120px] -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Live on Campus</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
          The Pulse of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Campus Life.</span>
        </h1>
        
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Coordinate rides, find study buddies, and stay safe with SOS alerts. 
          The all-in-one ecosystem for the modern student.
        </p>

        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/login')} className="h-14 px-8 rounded-full bg-slate-900 text-white font-bold text-lg hover:scale-105 transition shadow-xl shadow-indigo-200 flex items-center gap-2">
            Join the Network <ArrowRight size={20}/>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
            <FeatureCard icon={<Zap size={24} className="text-orange-500"/>} title="Instant Rides" desc="Find a commute buddy in seconds with real-time matching." />
            <FeatureCard icon={<Shield size={24} className="text-green-500"/>} title="Campus Safety" desc="SOS Alerts and Virtual Companion mode for secure walks." />
            <FeatureCard icon={<Users size={24} className="text-blue-500"/>} title="Community" desc="Connect with peers for errands, food runs, and projects." />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 text-left">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">{icon}</div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;