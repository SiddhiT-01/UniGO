import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { UniGoLogo } from './UniGoLogo';
import { ArrowRight, Mail, Lock, User, Loader2, Key } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error) { setError(error.message); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name, photoURL: `https://ui-avatars.com/api/?name=${formData.name}&background=random` });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (err) { setError(err.message.replace('Firebase:', '')); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center p-6">
      <div className="hero-aura"></div>

      {/* Official Badge */}
      <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm mb-8 animate-[float_6s_ease-in-out_infinite]">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-[pulse-ring_2s_infinite]"></span>
        <span className="text-[10px] font-extrabold tracking-widest text-indigo-900 uppercase">Official Campus Network</span>
      </div>

      {/* Hero Content */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
          The Pulse of <br />
          <span className="gradient-text">Campus Life.</span>
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
          A unified ecosystem for travel coordination, peer assistance, and instant emergency response.
        </p>
      </div>

      {/* Interactive Cards (Login Form) */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/50 p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all hover:translate-y-[-5px]">
        
        <div className="flex justify-center mb-6">
           <UniGoLogo className="h-10" />
        </div>

        {error && <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl mb-4 text-center">{error}</div>}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div className="group bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 focus-within:border-indigo-300 focus-within:bg-white transition-all">
              <User size={20} className="text-slate-400 group-focus-within:text-indigo-500" />
              <input type="text" placeholder="Full Name" required className="bg-transparent w-full outline-none text-slate-800 font-medium placeholder:text-slate-400" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          <div className="group bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 focus-within:border-indigo-300 focus-within:bg-white transition-all">
            <Mail size={20} className="text-slate-400 group-focus-within:text-indigo-500" />
            <input type="email" placeholder="Student Email" required className="bg-transparent w-full outline-none text-slate-800 font-medium placeholder:text-slate-400" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="group bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 focus-within:border-indigo-300 focus-within:bg-white transition-all">
            <Key size={20} className="text-slate-400 group-focus-within:text-indigo-500" />
            <input type="password" placeholder="Password" required minLength={6} className="bg-transparent w-full outline-none text-slate-800 font-medium placeholder:text-slate-400" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 hover:translate-y-[-2px]">
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Join Platform' : 'Access Dashboard')}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <span className="bg-white/80 px-2 text-xs font-bold text-slate-400 relative z-10">OR</span>
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100"></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5"/>
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-slate-500 text-sm font-medium">
          {isSignUp ? "Already a member?" : "New to campus?"}
          <button onClick={() => {setIsSignUp(!isSignUp); setError('');}} className="ml-2 text-indigo-600 font-bold hover:underline">
            {isSignUp ? "Sign In" : "Get Started"}
          </button>
        </p>
      </div>

      <div className="absolute bottom-6 flex gap-4 text-xs font-bold text-slate-300 uppercase tracking-widest">
        <span>© 2026 UniGo</span>
        <span>•</span>
        <span>Secure Connection</span>
      </div>
    </div>
  );
};

export default Login;