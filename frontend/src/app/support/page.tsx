"use client";

import { useState } from 'react';
import { Phone, ExternalLink, Heart, Activity, Briefcase, Building, FileSignature, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportNetwork() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Resources' },
    { id: 'ngos', label: 'NGOs' },
    { id: 'psychiatrists', label: 'Psychiatrists' },
    { id: 'counsellors', label: 'Counsellors' },
    { id: 'social_workers', label: 'Social Workers' },
    { id: 'authorities', label: 'District Authorities' },
    { id: 'officials', label: 'Designated Officials' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 border border-white/50 shadow-xl shadow-slate-200/50 text-center">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Support Network Directory</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Connect with trusted professionals, NGOs, and official authorities dedicated to trauma recovery and mental wellness.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 bg-white/50 backdrop-blur-md p-4 rounded-[2rem] border border-white/50 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${
              activeTab === tab.id 
                ? 'bg-teal-600 text-white shadow-teal-200' 
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-teal-50 hover:text-teal-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        
        <AnimatePresence>
          {/* NGOs */}
          {(activeTab === 'all' || activeTab === 'ngos') && (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-100 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl shadow-inner"><Heart size={28} /></div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">SNEHA NGO</h3>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed h-16">Provides counseling, legal aid, and crisis intervention for survivors of violence.</p>
              <div className="flex flex-col gap-4">
                <a href="#" className="flex items-center justify-center gap-2 text-[15px] font-bold bg-slate-50 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors"><Phone size={18}/> +91 98330 52684</a>
                <a href="#" className="flex items-center justify-center gap-2 text-[15px] font-bold text-rose-600 hover:text-rose-700 py-2"><ExternalLink size={18}/> Visit Website</a>
              </div>
            </motion.div>
          )}

          {(activeTab === 'all' || activeTab === 'ngos') && (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-100 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl shadow-inner"><Heart size={28} /></div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Majlis Legal Centre</h3>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed h-16">Legal representation and social support for women and victims of abuse across districts.</p>
              <div className="flex flex-col gap-4">
                <a href="#" className="flex items-center justify-center gap-2 text-[15px] font-bold bg-slate-50 text-slate-700 py-3 rounded-xl hover:bg-slate-100 transition-colors"><Phone size={18}/> 022-2666 1252</a>
                <a href="#" className="flex items-center justify-center gap-2 text-[15px] font-bold text-rose-600 hover:text-rose-700 py-2"><ExternalLink size={18}/> Visit Website</a>
              </div>
            </motion.div>
          )}

          {/* Psychiatrists */}
          {(activeTab === 'all' || activeTab === 'psychiatrists') && (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-100 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shadow-inner"><Activity size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Dr. Anjali C.</h3>
                    <p className="text-xs font-extrabold text-teal-600 uppercase tracking-widest mt-1">Psychiatrist</p>
                  </div>
                </div>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed h-16">Specializes in clinical trauma recovery, PTSD therapy, and medication management.</p>
              <button className="w-full bg-teal-50 text-teal-700 py-4 rounded-xl font-bold hover:bg-teal-100 transition-colors shadow-sm">Book Appointment</button>
            </motion.div>
          )}

          {/* Counsellors */}
          {(activeTab === 'all' || activeTab === 'counsellors') && (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-100 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl shadow-inner"><Activity size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Sarah Menon</h3>
                    <p className="text-xs font-extrabold text-amber-500 uppercase tracking-widest mt-1">Clinical Counsellor</p>
                  </div>
                </div>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed h-16">Provides safe, confidential therapy sessions for anxiety and emotional distress.</p>
              <button className="w-full bg-amber-50 text-amber-600 py-4 rounded-xl font-bold hover:bg-amber-100 transition-colors shadow-sm">Schedule Chat</button>
            </motion.div>
          )}

          {/* Social Workers */}
          {(activeTab === 'all' || activeTab === 'social_workers') && (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl shadow-inner"><Briefcase size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Priya Sharma</h3>
                    <p className="text-xs font-extrabold text-purple-500 uppercase tracking-widest mt-1">Social Worker</p>
                  </div>
                </div>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed h-16">Field worker offering on-ground support, rehabilitation, and bridging with authorities.</p>
              <button className="w-full bg-purple-50 text-purple-600 py-4 rounded-xl font-bold hover:bg-purple-100 transition-colors shadow-sm">Request Field Visit</button>
            </motion.div>
          )}

          {/* District Authorities */}
          {(activeTab === 'all' || activeTab === 'authorities') && (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl shadow-inner"><Building size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Dist. Welfare</h3>
                    <p className="text-xs font-extrabold text-blue-500 uppercase tracking-widest mt-1">Government Body</p>
                  </div>
                </div>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed h-16">Official board handling rehabilitation schemes and legal protection programs.</p>
              <button className="w-full bg-blue-50 text-blue-600 py-4 rounded-xl font-bold hover:bg-blue-100 transition-colors shadow-sm">File Application</button>
            </motion.div>
          )}

          {/* Designated Officials */}
          {(activeTab === 'all' || activeTab === 'officials') && (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg shadow-slate-200/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl shadow-inner"><FileSignature size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">R.K. Desai</h3>
                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mt-1">Designated Officer</p>
                  </div>
                </div>
              </div>
              <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed h-16">Nodal officer for crisis management and fast-track grievance redressal.</p>
              <button className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm">Submit Grievance</button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  )
}
