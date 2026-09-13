"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, LogOut, Users, AlertTriangle, FileText, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthorityDashboard() {
  const [activeTab, setActiveTab] = useState('cases');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-6 mb-6 md:mb-0">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
            <ShieldCheck size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Authority Portal</h1>
            <p className="text-slate-500 mt-2 font-medium text-lg">Logged in securely as <span className="font-bold text-blue-600">Admin Official</span></p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="bg-slate-200/50 text-slate-700 px-6 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 shadow-sm">
            <LogOut size={20} /> Secure Logout
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-3">
          <button 
            onClick={() => setActiveTab('cases')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm ${
              activeTab === 'cases' ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg translate-x-2' : 'bg-white/80 text-slate-600 border border-white/50 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <AlertTriangle size={22} /> Active Cases
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm ${
              activeTab === 'patients' ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg translate-x-2' : 'bg-white/80 text-slate-600 border border-white/50 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <Users size={22} /> Patient Registry
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm ${
              activeTab === 'reports' ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg translate-x-2' : 'bg-white/80 text-slate-600 border border-white/50 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <FileText size={22} /> Field Reports
          </button>
        </div>

        {/* CONTENT */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'cases' && (
              <motion.div 
                key="cases"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Critical Alerts & Flagged Cases</h2>
                  <span className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-inner">2 Action Required</span>
                </div>
                
                <div className="divide-y divide-slate-100">
                  
                  <div className="p-8 hover:bg-slate-50/80 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-rose-500 w-4 h-4 rounded-full animate-pulse shadow-sm"></span>
                        <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">High Distress Protocol Triggered</h3>
                      </div>
                      <span className="text-sm text-slate-400 font-bold flex items-center gap-1.5"><Clock size={16}/> 10 mins ago</span>
                    </div>
                    <p className="text-slate-500 mb-6 text-[16px] font-medium leading-relaxed max-w-3xl">
                      Anonymous User <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">#482910</span> has consistently scored RED in the past 3 evaluations. Immediate intervention required by district counsellor.
                    </p>
                    <div className="flex gap-4">
                      <button className="bg-blue-50 text-blue-700 px-6 py-3 rounded-xl text-[15px] font-bold hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2">View Logs <ChevronRight size={18}/></button>
                      <button className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-[15px] font-bold hover:bg-slate-50 transition-colors shadow-sm">Assign Field Worker</button>
                    </div>
                  </div>

                  <div className="p-8 hover:bg-slate-50/80 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-amber-500 w-4 h-4 rounded-full shadow-sm"></span>
                        <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">NGO Intervention Follow-up</h3>
                      </div>
                      <span className="text-sm text-slate-400 font-bold flex items-center gap-1.5"><Clock size={16}/> 2 hrs ago</span>
                    </div>
                    <p className="text-slate-500 mb-6 text-[16px] font-medium leading-relaxed max-w-3xl">
                      Majlis Legal Centre requested psychiatric verification for an ongoing domestic support case.
                    </p>
                    <div className="flex gap-4">
                      <button className="bg-blue-50 text-blue-700 px-6 py-3 rounded-xl text-[15px] font-bold hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2">Review Case File <ChevronRight size={18}/></button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
