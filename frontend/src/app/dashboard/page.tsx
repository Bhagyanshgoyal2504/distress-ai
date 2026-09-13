"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { LogOut, MessageSquare, Send, Loader2, Activity, User } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  const [stats, setStats] = useState<any[]>([]);
  
  // Chat state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('distress_user_id');
    const storedName = localStorage.getItem('distress_user_name');
    if (!storedId) {
      router.push('/');
    } else {
      const uid = parseInt(storedId, 10);
      setUserId(uid);
      if (storedName) setUserName(storedName);
      
      const fetchStats = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/dashboard/stats?user_id=${uid}`);
          setStats(res.data);
        } catch (error) {
          console.error("Failed to load stats", error);
        }
      };
      fetchStats();
    }
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleLogout = () => {
    localStorage.removeItem('distress_user_id');
    localStorage.removeItem('distress_user_name');
    router.push('/');
  };

  const startChat = async () => {
    if (!userId) return;
    setChatLoading(true);
    try {
      const res = await axios.post(API_BASE_URL + '/test/start', { user_id: userId });
      setSessionId(res.data.session_id);
      setMessages([{ role: 'ai', text: res.data.first_question }]);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
    setChatLoading(false);
  };

  const handleEndChat = async () => {
    if (!sessionId) return;
    setChatLoading(true);
    try {
      const res = await axios.post(API_BASE_URL + '/test/end', { session_id: sessionId });
      if (res.data.status === 'completed') {
        setMessages(prev => [...prev, { role: 'ai', text: res.data.advice }]);
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'system', text: "SESSION RECORDED. AI INSIGHTS UPDATED." }]);
          const fetchStats = async () => {
            const statsRes = await axios.get(`${API_BASE_URL}/dashboard/stats?user_id=${userId}`);
            setStats(statsRes.data);
          };
          fetchStats();
          setSessionId(null);
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to end chat", error);
    }
    setChatLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || chatLoading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    
    const lastAiMsg = messages.slice().reverse().find(m => m.role === 'ai')?.text || "";
    setChatLoading(true);

    try {
      const res = await axios.post(API_BASE_URL + '/test/answer', {
        session_id: sessionId,
        question: lastAiMsg,
        answer: userMsg
      });

      if (res.data.status === 'completed') {
        setMessages(prev => [...prev, { role: 'ai', text: res.data.advice }]);
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'system', text: "SESSION RECORDED. YOU MAY START A NEW CHAT ANYTIME." }]);
          const fetchStats = async () => {
            const statsRes = await axios.get(`${API_BASE_URL}/dashboard/stats?user_id=${userId}`);
            setStats(statsRes.data);
          };
          fetchStats();
          setSessionId(null);
        }, 1500);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: res.data.next_question }]);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => [...prev, { role: 'system', text: "Network error. Please try again." }]);
    }
    setChatLoading(false);
  };

  if (!userId) return null;

  const latestStat = stats.length > 0 ? stats[stats.length - 1] : null;
  const isRed = latestStat?.color === 'RED';
  const isYellow = latestStat?.color === 'YELLOW';
  const isGreen = latestStat?.color === 'GREEN';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-10 pb-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-xl shadow-slate-200/50">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-4 tracking-tight">
            <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shadow-inner">
              <User size={28} />
            </div>
            {userName || `User #${userId}`}'s Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium pl-18">Track your well-being and connect with your AI companion.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/support" className="bg-white border-2 border-teal-600 text-teal-700 px-6 py-3 rounded-2xl font-bold hover:bg-teal-50 transition-all shadow-sm">
            Support Directory
          </Link>
          <Link href="/test" className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-md shadow-teal-200">
            Quick Baseline Test
          </Link>
          <button onClick={handleLogout} className="bg-slate-200/50 text-slate-600 px-5 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
            <LogOut size={20} /> Exit
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        
        {/* Top Section: Score & Graph */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-3 grid lg:grid-cols-4 gap-8"
        >
          
          {/* Current Status Card */}
          <div className={`p-8 rounded-[2rem] border flex flex-col justify-center shadow-lg transition-colors duration-500 ${
            isRed ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-100' :
            isYellow ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100' :
            isGreen ? 'bg-teal-50 border-teal-200 text-teal-900 shadow-teal-100' :
            'bg-white/80 backdrop-blur-md border-slate-200 text-slate-500 shadow-slate-100'
          }`}>
            {latestStat ? (
              <>
                <h3 className="text-xl font-bold opacity-80 mb-2">Current Status</h3>
                <div className="text-7xl font-black mb-2 tracking-tighter">{latestStat.score}</div>
                <div className="font-bold text-xl uppercase tracking-[0.2em] opacity-90">
                  {isRed && "Critical Alert"}
                  {isYellow && "Monitoring"}
                  {isGreen && "Stable"}
                </div>
                
                {isRed && (
                  <div className="mt-8">
                    <p className="text-sm font-bold mb-4 opacity-90">Your recent score indicates high distress. Please reach out to our network.</p>
                    <Link href="/support" className="inline-block bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 w-full text-center shadow-lg shadow-rose-200 transition-all">
                      Get Support Now
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <Activity size={56} className="mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-xl">No Data Yet</h3>
              </div>
            )}
          </div>

          {/* Graph Section */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-xl shadow-slate-200/50 min-h-[300px]">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 tracking-tight">Longitudinal Distress Trend</h3>
            {stats.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#0d9488" 
                      strokeWidth={4}
                      dot={{ fill: '#0d9488', strokeWidth: 3, r: 5, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#0f766e' }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-400 font-medium text-lg">
                Take an assessment to generate your chart.
              </div>
            )}
          </div>

          {/* AI Insights Section */}
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-50 to-white backdrop-blur-xl p-8 rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-200/40 flex flex-col min-h-[300px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">AI Insights</h3>
            </div>
            {latestStat && latestStat.advice ? (
              <p className="text-slate-600 font-medium leading-relaxed overflow-y-auto">
                {latestStat.advice}
              </p>
            ) : (
              <p className="text-slate-400 font-medium my-auto text-center italic">
                Take an assessment or chat with the AI to receive personalized insights.
              </p>
            )}
          </div>
        </motion.div>

        {/* Bottom Section: AI Chat Companion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col h-[700px]"
        >
          <div className="bg-gradient-to-r from-teal-700 to-teal-500 text-white p-6 flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <MessageSquare size={24} />
              </div>
              <h2 className="font-bold text-xl tracking-wide">AI Therapeutic Companion</h2>
            </div>
            {sessionId && (
              <div className="flex items-center gap-3">
                <span className="text-teal-50 text-sm font-bold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-inner">Session Active</span>
                <button onClick={handleEndChat} disabled={chatLoading} className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md transition-all disabled:opacity-50">End & Get Insights</button>
              </div>
            )}
          </div>

          {!sessionId ? (
             <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center bg-slate-50/50 relative overflow-hidden">
               {/* Decorative background elements */}
               <div className="absolute top-10 right-10 w-64 h-64 bg-teal-100/50 rounded-full blur-3xl"></div>
               <div className="absolute bottom-10 left-10 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl"></div>
               
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-2 shadow-inner relative z-10"
               >
                 <MessageSquare size={40} />
               </motion.div>
               <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight relative z-10">Need someone to talk to?</h3>
               <p className="text-slate-500 max-w-lg font-medium text-lg leading-relaxed relative z-10">
                 Start a secure, deeply empathetic conversation with your AI companion. Discuss your feelings, explore coping strategies, or simply vent.
               </p>
               <button 
                 onClick={startChat}
                 disabled={chatLoading}
                 className="mt-6 px-10 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 flex items-center gap-3 transition-all shadow-lg shadow-teal-200 hover:shadow-xl relative z-10"
               >
                 {chatLoading ? <Loader2 className="animate-spin" size={24} /> : null}
                 Start Conversation
               </button>
             </div>
          ) : (
            <>
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 bg-slate-50/50">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'}`}
                    >
                      {m.role === 'system' ? (
                        <div className="bg-slate-800/80 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-bold tracking-wider uppercase shadow-lg my-4">
                          {m.text}
                        </div>
                      ) : (
                        <div className={`max-w-[80%] rounded-[1.5rem] px-6 py-4 shadow-md text-[16px] leading-relaxed font-medium ${
                          m.role === 'user' 
                            ? 'bg-teal-600 text-white rounded-br-sm shadow-teal-200' 
                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-slate-200/50'
                        }`}>
                          {m.text}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {chatLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white border border-slate-100 text-slate-800 rounded-[1.5rem] rounded-bl-sm shadow-md shadow-slate-200/50 px-6 py-4 flex gap-3 items-center">
                        <div className="flex gap-1.5">
                          <motion.div className="w-2 h-2 bg-teal-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0 }} />
                          <motion.div className="w-2 h-2 bg-teal-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0.2 }} />
                          <motion.div className="w-2 h-2 bg-teal-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, delay: 0.4 }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              <div className="p-5 sm:p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-4">
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white text-slate-800 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-teal-500/20 shadow-inner font-medium text-lg placeholder:text-slate-400"
                  disabled={chatLoading}
                />
                <button 
                  onClick={handleSend}
                  disabled={chatLoading || !input.trim()}
                  className="w-16 h-16 bg-teal-600 text-white rounded-2xl flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-teal-200 hover:shadow-xl"
                >
                  <Send size={24} className="ml-1" />
                </button>
                <button 
                  onClick={handleEndChat} 
                  disabled={chatLoading} 
                  className="px-6 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center font-bold hover:bg-rose-600 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-rose-200 hover:shadow-xl"
                  title="End Session & Get Insights"
                >
                  End Chat
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
