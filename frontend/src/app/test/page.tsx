"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, Activity, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_QUESTIONS = [
  "1. Over the last week, how often have you felt overwhelmed by your emotions?",
  "2. How often have you had trouble sleeping or staying asleep?",
  "3. Have you lost interest or pleasure in activities you normally enjoy?",
  "4. How often do you feel a sense of hopelessness or fear about the future?",
  "5. Do you find it difficult to concentrate on everyday tasks?",
  "6. How often have you felt nervous, anxious, or on edge?",
  "7. Have you had unexplainable physical symptoms (like headaches, stomach aches)?",
  "8. Do you find yourself avoiding people or social situations?",
  "9. How often have you felt easily annoyed or irritable?",
  "10. Have you felt bad about yourself, or that you are a failure?"
];

const OPTIONS = [
  { label: "Not at all", score: 0 },
  { label: "Some time", score: 1 },
  { label: "More than half the days", score: 2 },
  { label: "Nearly every day", score: 3 }
];

export default function MCQTestPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  const [questions, setQuestions] = useState<string[]>(DEFAULT_QUESTIONS);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('distress_user_id');
    const storedName = localStorage.getItem('distress_user_name');
    if (!storedId) {
      router.push('/');
    } else {
      const uid = parseInt(storedId, 10);
      setUserId(uid);
      if (storedName) setUserName(storedName);
      
      axios.get(`${API_BASE_URL}/test/questions?user_id=${uid}`)
        .then(res => {
          if (res.data.questions && res.data.questions.length === 10) {
            setQuestions(res.data.questions);
          }
        })
        .catch(err => console.error("Failed to load custom questions", err))
        .finally(() => setLoadingQuestions(false));
    }
  }, [router]);

  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercent = (answeredCount / 10) * 100;
  const isComplete = answeredCount === 10;

  const handleSelect = (qIndex: number, score: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = score;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!isComplete || !userId) return;
    setLoading(true);
    try {
      const res = await axios.post(API_BASE_URL + '/test/mcq', {
        user_id: userId,
        scores: answers
      });
      setResult(res.data);
    } catch (error) {
      console.error("Failed to submit test:", error);
    }
    setLoading(false);
  };

  if (!userId) {
    return <div className="flex justify-center pt-32"><Loader2 className="animate-spin text-teal-600" size={48} /></div>;
  }

  if (result) {
    const isRed = result.color === 'RED';
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-white/50 text-center space-y-8"
      >
        <h2 className="text-4xl font-bold text-slate-800 tracking-tight">Assessment Complete</h2>
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className={`inline-block p-10 rounded-full border-[6px] shadow-inner ${
          result.color === 'RED' ? 'border-red-400 bg-red-50 text-red-600' :
          result.color === 'YELLOW' ? 'border-amber-400 bg-amber-50 text-amber-600' :
          'border-teal-400 bg-teal-50 text-teal-600'
        }`}>
          <div className="text-6xl font-black">{result.score}</div>
          <div className="text-sm font-bold tracking-[0.2em] mt-2 opacity-80">SCORE</div>
        </motion.div>

        <p className="text-lg text-slate-600 font-medium p-6 bg-slate-100/50 rounded-2xl leading-relaxed">
          {result.advice}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 font-bold shadow-lg shadow-teal-200 transition-all">
            Go to Dashboard & AI Chat
          </button>
          {isRed && (
            <button onClick={() => router.push('/support')} className="px-8 py-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all">
              <AlertCircle size={20} /> Immediate Support
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-8 flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-bold text-3xl tracking-tight">Quick Assessment</h2>
          <p className="text-teal-50 mt-2 font-medium">Answer based on the past 7 days.</p>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{userName || `User #${userId}`}</span>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2">
        <motion.div 
          className="bg-teal-500 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ ease: "easeOut" }}
        />
      </div>

      <div className="p-8 space-y-12">
        {loadingQuestions ? (
          <div className="flex flex-col items-center justify-center py-32 text-teal-600 space-y-4">
            <Loader2 className="animate-spin" size={48} />
            <p className="font-medium text-lg">Generating personalized assessment...</p>
          </div>
        ) : (
          questions.map((q, qIndex) => (
            <motion.div 
              key={qIndex} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: qIndex * 0.05 }}
              className="space-y-5 pb-8 border-b border-slate-100 last:border-0 last:pb-0"
            >
              <h3 className="text-xl font-semibold text-slate-800 leading-snug">
                {q}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {OPTIONS.map(opt => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={opt.score}
                    onClick={() => handleSelect(qIndex, opt.score)}
                    className={`p-4 border-2 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      answers[qIndex] === opt.score
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-inner'
                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {answers[qIndex] === opt.score && <CheckCircle2 size={18} />}
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-6 justify-between items-center sticky bottom-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            {answeredCount} / 10 Answered
          </span>
        </div>
        <motion.button
          whileHover={isComplete ? { scale: 1.05 } : {}}
          whileTap={isComplete ? { scale: 0.95 } : {}}
          animate={isComplete ? { boxShadow: ["0px 0px 0px rgba(20,184,166,0)", "0px 0px 20px rgba(20,184,166,0.5)", "0px 0px 0px rgba(20,184,166,0)"] } : {}}
          transition={isComplete ? { repeat: Infinity, duration: 2 } : {}}
          onClick={handleSubmit}
          disabled={!isComplete || loading}
          className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold flex justify-center items-center gap-3 transition-all ${
            isComplete ? 'bg-teal-600 text-white shadow-lg shadow-teal-200 hover:bg-teal-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {loading ? <Loader2 size={22} className="animate-spin" /> : null}
          Submit Assessment
        </motion.button>
      </div>
    </motion.div>
  );
}
