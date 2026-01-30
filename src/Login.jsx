// src/Login.jsx
import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { UniGoLogo } from './UniGoLogo';
import { ArrowRight, Mail, Lock, User, Loader2 } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError(error.message);
    }
  };

  // 2. Handle Manual Email/Password Login & Signup
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Important: Immediately update their profile name so the Dashboard isn't blank
        await updateProfile(userCredential.user, {
          displayName: formData.name,
          photoURL: `https://ui-avatars.com/api/?name=${formData.name}&background=random`
        });
      } else {
        // --- LOGIN LOGIC ---
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (err) {
      // Clean up Firebase error messages for the user
      const msg = err.code.replace('auth/', '').replace(/-/g, ' ');
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f1115] relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vh] h-[60vh] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] bg-orange-500/10 rounded-full blur-[120px]" style={{animationDelay: '1s'}}></div>

      {/* Main Glass Card */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col items-center">
        
        <div className="mb-6 p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
           <UniGoLogo className="h-8 w-auto" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          {isSignUp ? 'Join the Campus.' : 'Welcome Back.'}
        </h2>
        <p className="text-gray-400 text-sm mb-8 text-center">
          {isSignUp ? 'Create an account to start coordinating rides.' : 'Enter your details to access your dashboard.'}
        </p>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-4 text-red-200 text-xs text-center font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* MANUAL FORM */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-4">
          
          {isSignUp && (
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition" size={20} />
              <input 
                type="text" 
                placeholder="Full Name" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 focus:bg-white/10 transition placeholder:text-gray-600"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition" size={20} />
            <input 
              type="email" 
              placeholder="Student Email" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 focus:bg-white/10 transition placeholder:text-gray-600"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 focus:bg-white/10 transition placeholder:text-gray-600"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="w-full flex items-center gap-3 my-6">
          <div className="h-[1px] bg-white/10 flex-1"></div>
          <span className="text-gray-500 text-xs font-bold uppercase">Or continue with</span>
          <div className="h-[1px] bg-white/10 flex-1"></div>
        </div>

        {/* GOOGLE BUTTON */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3.5 bg-white text-gray-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-lg shadow-white/5"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5"/>
          <span>Google</span>
        </button>

        {/* TOGGLE LINK */}
        <p className="mt-8 text-gray-400 text-sm">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button 
            onClick={() => {setIsSignUp(!isSignUp); setError('');}} 
            className="ml-2 text-indigo-400 font-bold hover:text-indigo-300 transition hover:underline"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </p>

      </div>
      
      <div className="absolute bottom-6 text-gray-600 text-xs font-medium tracking-widest uppercase opacity-50">
        Secure Campus Access • v1.0
      </div>
    </div>
  );
};

export default Login;