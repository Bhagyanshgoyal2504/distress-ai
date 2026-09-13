"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserPlus, LogIn, Activity, HeartHandshake, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [showAuthority, setShowAuthority] = useState(false);
  const [authorityCode, setAuthorityCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setRegisterLoading(true);
    try {
      const res = await axios.post(API_BASE_URL + '/user/register', { name: name.trim() });
      localStorage.setItem('distress_user_id', res.data.user_id.toString());
      localStorage.setItem('distress_user_name', res.data.name);
      
      // Navigate to test for new user
      router.push('/test');
    } catch (error) {
      console.error("Failed to register:", error);
      alert("Failed to connect to the server.");
    }
    setRegisterLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim()) return;
    
    setLoginLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/user/${loginId.trim()}`);
      localStorage.setItem('distress_user_id', res.data.user_id.toString());
      localStorage.setItem('distress_user_name', res.data.name);
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Failed to login:", error);
      alert(error.response?.data?.detail || "User not found. Please try again.");
    }
    setLoginLoading(false);
  };

  const handleAuthorityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorityCode.trim()) return;
    
    setAuthLoading(true);
    setTimeout(() => {
      router.push('/authority-dashboard');
    }, 800);
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center space-y-16 pb-12 pt-10">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="space-y-6 max-w-4xl"
      >
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm">
          Welcome to <br className="md:hidden" /><span className="text-teal-600 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600">D.I.S.T.R.E.S.S. A.I.</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Dynamic Intelligent System for Trauma Recovery, Evaluation, and Support Services.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
        {/* NEW USER CARD */}
        <motion.div 
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-100 transition-all duration-300"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <UserPlus size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">New User</h2>
          <p className="text-slate-500 mb-8 flex-1 text-lg">
            Start a fresh recovery journey. Just enter a nickname, and we'll generate a secure ID for you.
          </p>
          
          {!showRegister ? (
            <button 
              onClick={() => setShowRegister(true)}
              className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-lg hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/20 transition-all flex justify-center items-center gap-2"
            >
              Start Assessment <ArrowRight size={22} />
            </button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleRegister} 
              className="w-full flex flex-col gap-3"
            >
              <input 
                type="text" 
                placeholder="Enter your name or nickname"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-slate-900 bg-white/50 focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all shadow-inner"
                autoFocus
                disabled={registerLoading}
              />
              <button 
                type="submit"
                disabled={registerLoading || !name.trim()}
                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:bg-teal-600"
              >
                {registerLoading ? <Loader2 className="animate-spin" size={24} /> : "Get Started"}
              </button>
            </motion.form>
          )}
        </motion.div>

        {/* RETURNING USER CARD */}
        <motion.div 
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <LogIn size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Returning User</h2>
          <p className="text-slate-500 mb-8 flex-1 text-lg">
            Welcome back. Enter your name or numeric ID to view your longitudinal recovery dashboard.
          </p>
          
          {!showLogin ? (
            <button 
              onClick={() => setShowLogin(true)}
              className="w-full py-4 bg-slate-100 text-slate-800 rounded-2xl font-bold text-lg hover:bg-slate-200 hover:shadow-md transition-all"
            >
              Log In
            </button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleLogin} 
              className="w-full flex gap-2"
            >
              <input 
                type="text" 
                placeholder="Name or ID"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                className="flex-1 w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-slate-900 bg-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium transition-all shadow-inner"
                autoFocus
                disabled={loginLoading}
              />
              <button 
                type="submit"
                disabled={loginLoading || !loginId.trim()}
                className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:bg-indigo-600"
              >
                {loginLoading ? <Loader2 className="animate-spin" size={24} /> : "Go"}
              </button>
            </motion.form>
          )}
        </motion.div>

        {/* AUTHORITY SIGN IN CARD */}
        <motion.div 
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ShieldCheck size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Authority</h2>
          <p className="text-slate-500 mb-8 flex-1 text-lg">
            Secure login for NGOs, Psychiatrists, District Authorities, and Medical Officers.
          </p>
          
          {!showAuthority ? (
            <button 
              onClick={() => setShowAuthority(true)}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-900 hover:shadow-lg hover:shadow-slate-900/20 transition-all flex justify-center items-center gap-2"
            >
              Authority Login
            </button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAuthorityLogin} 
              className="w-full flex flex-col gap-3"
            >
              <input 
                type="password" 
                placeholder="Auth Code (e.g. ADMIN)"
                value={authorityCode}
                onChange={e => setAuthorityCode(e.target.value)}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-slate-900 bg-white/50 focus:outline-none focus:border-slate-800 focus:bg-white font-medium transition-all shadow-inner"
                autoFocus
                disabled={authLoading}
              />
              <button 
                type="submit"
                disabled={authLoading || !authorityCode.trim()}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-800"
              >
                {authLoading ? <Loader2 className="animate-spin" size={24} /> : "Sign In"}
              </button>
            </motion.form>
          )}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="grid md:grid-cols-3 gap-6 w-full max-w-5xl pt-16 mt-8 border-t border-slate-200/60"
      >
        <div className="flex flex-col items-center space-y-3">
          <Activity size={28} className="text-teal-500" />
          <h3 className="text-lg font-bold text-slate-700">Dynamic Assessment</h3>
          <p className="text-base text-slate-500 text-center px-4 font-medium">Fast MCQ tests and deep AI conversational evaluations.</p>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <ShieldCheck size={28} className="text-teal-500" />
          <h3 className="text-lg font-bold text-slate-700">Secure & Anonymous</h3>
          <p className="text-base text-slate-500 text-center px-4 font-medium">No emails or passwords required. Your data is private.</p>
        </div>
        <Link href="/support" className="flex flex-col items-center space-y-3 hover:bg-slate-100/50 p-6 rounded-3xl transition-all cursor-pointer group">
          <HeartHandshake size={28} className="text-teal-500 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-bold text-slate-700">Support Network</h3>
          <p className="text-base text-slate-500 text-center px-4 font-medium">Connect with verified NGOs and professionals.</p>
        </Link>
      </motion.div>
    </div>
  )
}
