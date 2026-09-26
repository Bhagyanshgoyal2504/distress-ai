'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Mic, HeartPulse, Brain, AlertCircle, HelpCircle, Sparkles, ArrowUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const OPTIONS = [
  { label: "Not at all", score: 0 },
  { label: "Sometimes", score: 1 },
  { label: "More than half the days", score: 2 },
  { label: "Nearly every day", score: 3 }
];

interface Question {
  category: string;
  text: string;
  type: "multi_select" | "single_select";
  options: { label: string; score: number }[];
}

const PHASE_1_QUESTIONS: Question[] = [
  {
    category: "Trauma & Life Events",
    type: "multi_select",
    text: "Which of the following life events have you experienced in the past year? (Select all that apply)",
    options: [
      { label: "Death of a loved one or major loss", score: 8 },
      { label: "Relationship breakup or divorce", score: 6 },
      { label: "Major financial stress or job loss", score: 6 },
      { label: "Severe injury, illness, or health change", score: 5 },
      { label: "Major lifestyle shift (moving, new school)", score: 4 },
      { label: "Legal trouble or severe conflict", score: 5 },
      { label: "Physical, emotional, or domestic abuse", score: 9 },
      { label: "Discrimination, harassment, or caste-based violence", score: 9 },
      { label: "Exposure to a natural disaster or accident", score: 7 },
      { label: "Workplace harassment or toxic environment", score: 6 },
      { label: "Cyberbullying or severe online harassment", score: 5 },
      { label: "Substance abuse struggles (self or family)", score: 7 },
      { label: "Other", score: 2 },
      { label: "None of the above", score: 0 }
    ]
  },
  {
    category: "General Behavior",
    type: "single_select",
    text: "How often have you been feeling down, depressed, or hopeless?",
    options: OPTIONS
  },
  {
    category: "General Behavior",
    type: "single_select",
    text: "How often have you felt nervous, anxious, or on edge?",
    options: OPTIONS
  },
  {
    category: "Daily Routine",
    type: "single_select",
    text: "How often have you had trouble falling or staying asleep, or sleeping too much?",
    options: OPTIONS
  },
  {
    category: "Social Behavior",
    type: "single_select",
    text: "How often do you feel isolated or disconnected from others?",
    options: OPTIONS
  },
  {
    category: "Personal Life",
    type: "single_select",
    text: "How often do you feel overwhelmed by your daily responsibilities?",
    options: OPTIONS
  },
  {
    category: "Physical Symptoms",
    type: "single_select",
    text: "How often do you feel physically exhausted, have unexplained aches, or notice major changes in your appetite?",
    options: OPTIONS
  },
  {
    category: "Cognitive State",
    type: "single_select",
    text: "How often do you have trouble concentrating on routine tasks, like reading or having a conversation?",
    options: OPTIONS
  },
  {
    category: "Trauma Response",
    type: "single_select",
    text: "How often do you experience sudden intrusive thoughts, flashbacks, or bad dreams about past events?",
    options: OPTIONS
  },
  {
    category: "Emotional Volatility",
    type: "single_select",
    text: "How often do you find yourself becoming easily annoyed, irritable, or experiencing sudden bursts of anger?",
    options: OPTIONS
  }
];

export default function TestPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  const [phase, setPhase] = useState<1 | 2 | 3>(1); // 1=Baseline, 2=Adaptive Followup, 3=Result
  const [phase2Questions, setPhase2Questions] = useState<Question[]>([]);
  
  const [answers1, setAnswers1] = useState<Record<number, any>>({});
  const [answers2, setAnswers2] = useState<Record<number, any>>({});
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({});
  const [listeningId, setListeningId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [explanations, setExplanations] = useState<Record<string, { text: string, loading: boolean }>>({});

  useEffect(() => {
    const uid = localStorage.getItem('distress_user_id');
    const uname = localStorage.getItem('distress_user_name');
    if (!uid) {
      router.push('/');
      return;
    }
    setUserId(parseInt(uid));
    setUserName(uname || '');
  }, [router]);

  const handleSelect1 = (qIndex: number, optIndex: number, type: string) => {
    if (type === 'multi_select') {
      setAnswers1(prev => {
        const current = prev[qIndex] || [];
        if (current.includes(optIndex)) {
          return { ...prev, [qIndex]: current.filter((i: number) => i !== optIndex) };
        } else {
          return { ...prev, [qIndex]: [...current, optIndex] };
        }
      });
    } else {
      setAnswers1(prev => ({ ...prev, [qIndex]: optIndex }));
    }
  };

  const handleSelect2 = (qIndex: number, optIndex: number) => {
    setAnswers2(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const startListening = (qIndex: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setListeningId(qIndex);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCustomTexts(prev => ({
        ...prev, 
        [qIndex]: ((prev[qIndex] || '') + ' ' + transcript).trim()
      }));
    };
    recognition.onerror = (e: any) => { console.error(e); setListeningId(null); };
    recognition.onend = () => setListeningId(null);
    recognition.start();
  };

  const handleExplain = async (qIndex: number, text: string) => {
    const key = `${phase}-${qIndex}`;
    if (explanations[key]?.text) return;
    setExplanations(prev => ({ ...prev, [key]: { text: "", loading: true } }));
    try {
      const res = await fetch(`${API_BASE_URL}/test/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_text: text || "help" })
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setExplanations(prev => ({ ...prev, [key]: { text: data.explanation || "No explanation available.", loading: false } }));
    } catch (err) {
      setExplanations(prev => ({ ...prev, [key]: { text: "Explanation unavailable.", loading: false } }));
    }
  };

  const submitPhase1 = async () => {
    setLoading(true);
    const trauma: string[] = [];
    const symptoms: Record<string, string> = {};
    
    PHASE_1_QUESTIONS.forEach((q, i) => {
      if (q.type === 'multi_select') {
        const selected = answers1[i] || [];
        selected.forEach((idx: number) => trauma.push(q.options[idx].label));
      } else {
        const selectedIdx = answers1[i];
        if (selectedIdx !== undefined) {
          symptoms[q.category] = q.options[selectedIdx].label;
        }
      }
    });

    try {
      const res = await fetch(`${API_BASE_URL}/test/adaptive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, trauma_events: trauma, symptoms })
      });
      const data = await res.json();
      
      const newQs: Question[] = data.questions.map((qObj: any) => ({
        category: "AI Deep Dive",
        type: "single_select",
        text: qObj.text,
        options: qObj.options
      }));
      setPhase2Questions(newQs);
      setPhase(2);
      window.scrollTo(0,0);
    } catch (err) {
      console.error(err);
      // Fallback if adaptive fails, just submit everything as is
      submitFinal();
    }
    setLoading(false);
  };

  const submitFinal = async () => {
    setLoading(true);
    let transcript = "PHASE 1 (BASELINE):\n";
    let xSum = 0;
    let ySum = 0;
    
    PHASE_1_QUESTIONS.forEach((q, i) => {
      if (q.type === 'multi_select') {
        const selected = answers1[i] || [];
        const labels = selected.map((idx: number) => q.options[idx].label);
        selected.forEach((idx: number) => { xSum += q.options[idx].score; });
        transcript += `Q: ${q.text}\nA: ${labels.join(', ')}\n\n`;
      } else {
        const selectedIdx = answers1[i];
        if (selectedIdx !== undefined) {
          ySum += q.options[selectedIdx].score;
          transcript += `Q: ${q.text}\nA: ${q.options[selectedIdx].label}\n\n`;
        }
      }
    });
    
    transcript += "PHASE 2 (ADAPTIVE FOLLOW-UP):\n";
    phase2Questions.forEach((q, i) => {
      const selectedIdx = answers2[i];
      if (selectedIdx !== undefined) {
        if (selectedIdx === q.options.length) {
          ySum += 2;
          transcript += `Q: ${q.text}\nA: Other: ${customTexts[i] || 'No comment'}\n\n`;
        } else {
          ySum += q.options[selectedIdx].score;
          transcript += `Q: ${q.text}\nA: ${q.options[selectedIdx].label}\n\n`;
        }
      }
    });

    // Scale X (0 to 34 max -> scaled to 10)
    let xScore = Math.min(10, (xSum / 25) * 10);
    // Scale Y (0 to 24 max -> scaled to 10)
    let yScore = Math.min(10, (ySum / 20) * 10);

    try {
      const res = await fetch(`${API_BASE_URL}/test/submit_adaptive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, transcript, x_score: xScore, y_score: yScore })
      });
      const data = await res.json();
      setResult({ ...data, xScore, yScore });
      setPhase(3);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Checking completion
  const isPhase1Complete = PHASE_1_QUESTIONS.every((q, i) => {
    if (q.type === 'multi_select') return true; // optional
    return answers1[i] !== undefined;
  });
  
  const isPhase2Complete = phase2Questions.every((q, i) => {
    if (answers2[i] === undefined) return false;
    if (answers2[i] === q.options.length && !(customTexts[i] && customTexts[i].trim().length > 0)) return false;
    return true;
  });

  if (phase === 3 && result) {
    const isRed = result.color === "RED";
    const xScore = result.xScore;
    const yScore = result.yScore;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden"
      >
        {/* Results Header */}
        <div className="bg-slate-900 text-white p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-sm font-black tracking-widest text-slate-400 mb-2 uppercase">Assessment Complete</h2>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl sm:text-7xl font-black tracking-tighter">{result.score}</span>
              <span className="text-xl sm:text-2xl text-slate-400 font-bold mt-4">/ 100</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold">Overall Distress Score</h3>
          </div>
        </div>

        {/* 2D Aura Map */}
        <div className="relative w-full aspect-square sm:aspect-video bg-slate-950 overflow-hidden flex items-center justify-center shadow-inner shadow-slate-900/50">
          
          {/* Legend and Title */}
          <div className="absolute top-4 left-6 z-30">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 drop-shadow-md"><Sparkles size={20} className="text-cyan-400" /> Clinical Assessment Matrix</h3>
          </div>
          
          {/* Quadrant Informational Labels */}
          <div className="absolute top-8 right-8 z-20 text-right opacity-80">
            <div className="text-rose-400 font-black text-sm sm:text-lg uppercase tracking-widest drop-shadow-lg">Critical Zone</div>
            <div className="text-white/60 text-[10px] sm:text-xs font-bold">High Trauma / High Symptoms</div>
          </div>
          <div className="absolute bottom-8 right-8 z-20 text-right opacity-80">
            <div className="text-amber-400 font-black text-sm sm:text-lg uppercase tracking-widest drop-shadow-lg">Suppressed</div>
            <div className="text-white/60 text-[10px] sm:text-xs font-bold">High Trauma / Low Symptoms</div>
          </div>
          <div className="absolute top-8 left-8 z-20 text-left opacity-80">
            <div className="text-fuchsia-400 font-black text-sm sm:text-lg uppercase tracking-widest drop-shadow-lg mt-8">Acute Distress</div>
            <div className="text-white/60 text-[10px] sm:text-xs font-bold">Low Trauma / High Symptoms</div>
          </div>
          <div className="absolute bottom-8 left-8 z-20 text-left opacity-80">
            <div className="text-emerald-400 font-black text-sm sm:text-lg uppercase tracking-widest drop-shadow-lg">Stable Zone</div>
            <div className="text-white/60 text-[10px] sm:text-xs font-bold">Low Trauma / Low Symptoms</div>
          </div>
          
          {/* Axis Titles */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] sm:text-xs font-bold text-white/90 z-30 flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full backdrop-blur-md">
            Baseline Trauma Severity (X-Axis) <ArrowRight size={14} className="text-cyan-400" />
          </div>
          <div className="absolute top-1/2 left-4 -translate-y-1/2 -rotate-90 origin-left text-[11px] sm:text-xs font-bold text-white/90 z-30 flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full backdrop-blur-md whitespace-nowrap">
            <ArrowUp size={14} className="text-fuchsia-400" /> AI Symptom Severity (Y-Axis)
          </div>
          
          {/* Vibrant Aura Effects */}
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-20 -left-20 w-3/4 h-3/4 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] opacity-50" />
          <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-10 -right-10 w-2/3 h-2/3 bg-rose-600 rounded-full mix-blend-screen filter blur-[100px] opacity-70" />
          <motion.div animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-10 right-10 w-1/2 h-1/2 bg-amber-500 rounded-full mix-blend-screen filter blur-[90px] opacity-60" />
          <motion.div animate={{ scale: [1, 1.15, 1], y: [0, -30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-cyan-500 rounded-full mix-blend-screen filter blur-[90px] opacity-60" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-0 right-0 w-1/2 h-1/2 bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[110px] opacity-50" />
          
          {/* Grid Lines */}
          <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-white/5 border-l border-dashed border-white/10" />
          <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-white/5 border-l border-dashed border-white/10" />
          <div className="absolute left-0 right-0 top-1/4 h-[1px] bg-white/5 border-t border-dashed border-white/10" />
          <div className="absolute left-0 right-0 top-3/4 h-[1px] bg-white/5 border-t border-dashed border-white/10" />
          
          {/* Central Axis */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/30" />
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/30" />

          {/* Marker */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
            className="absolute z-40 flex flex-col items-center justify-center -translate-x-1/2 translate-y-1/2"
            style={{ left: `${(xScore / 10) * 100}%`, bottom: `${(yScore / 10) * 100}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 border-[4px] border-white shadow-2xl relative flex items-center justify-center">
               <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[11px] font-black px-3 py-1 rounded-full tracking-wider shadow-lg">YOU</div>
            </div>
          </motion.div>
        </div>

        <p className="text-lg text-slate-600 font-medium p-6 bg-slate-50 border-t border-slate-100 leading-relaxed">
          {result.advice}
        </p>

        <div className="p-6 flex flex-col sm:flex-row gap-4 justify-center bg-white">
          <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 font-bold shadow-lg shadow-teal-200 transition-all">
            Go to Dashboard
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

  const currentQuestions = phase === 1 ? PHASE_1_QUESTIONS : phase2Questions;
  const currentAnswers = phase === 1 ? answers1 : answers2;
  const currentHandleSelect = phase === 1 ? handleSelect1 : handleSelect2;
  const currentIsComplete = phase === 1 ? isPhase1Complete : isPhase2Complete;
  const currentSubmit = phase === 1 ? submitPhase1 : submitFinal;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden"
    >
      {/* Header */}
      <div className={`text-white p-8 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center relative overflow-hidden ${phase === 1 ? 'bg-gradient-to-r from-teal-600 to-teal-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
        <div className="relative z-10">
          <h2 className="font-bold text-3xl tracking-tight flex items-center gap-2">
            {phase === 1 ? "Baseline Assessment" : <><Sparkles size={28}/> AI Deep Dive</>}
          </h2>
          <p className="text-white/80 mt-2 font-medium">
            {phase === 1 ? "Phase 1: Your recent experiences." : "Phase 2: Generating dynamic follow-ups based on your answers."}
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="p-8 space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-indigo-600 space-y-4">
            <Loader2 className="animate-spin" size={48} />
            <p className="font-medium text-lg">AI is analyzing your baseline & personalizing Phase 2...</p>
          </div>
        ) : (
          currentQuestions.map((q, qIndex) => (
            <motion.div 
              key={qIndex} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: qIndex * 0.05 }}
              className="space-y-5 pb-8 border-b border-slate-100 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-3 mb-2">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit ${phase === 1 ? 'bg-teal-50 text-teal-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  {q.category}
                </span>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold text-slate-800 leading-snug">
                    {q.text}
                  </h3>
                  <button 
                    onClick={() => handleExplain(qIndex, q.text)}
                    disabled={explanations[`${phase}-${qIndex}`]?.loading}
                    className="shrink-0 p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {explanations[`${phase}-${qIndex}`]?.loading ? <Loader2 size={18} className="animate-spin" /> : <HelpCircle size={18} />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {explanations[`${phase}-${qIndex}`]?.text && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm font-medium text-indigo-800 mt-2"
                    >
                      <span className="font-bold flex items-center gap-2 mb-1 text-indigo-600"><Sparkles size={16} /> AI Insight</span>
                      {explanations[`${phase}-${qIndex}`].text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {q.type === 'multi_select' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = (currentAnswers[qIndex] || []).includes(optIndex);
                    return (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        key={optIndex}
                        onClick={() => currentHandleSelect(qIndex, optIndex, q.type)}
                        className={`p-4 border-2 rounded-2xl text-sm font-bold transition-all flex items-center justify-start text-left gap-3 ${
                          isSelected ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-inner' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && <CheckCircle2 size={14} strokeWidth={4} />}
                        </div>
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <>
                <div className={`grid gap-3 ${phase === 1 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {(phase === 2 ? [...q.options, { label: "Other (Please describe...)", score: 2 }] : q.options).map((opt, optIndex) => (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={optIndex}
                      onClick={() => currentHandleSelect(qIndex, optIndex, q.type)}
                      className={`p-4 border-2 rounded-2xl text-sm font-bold transition-all flex items-center justify-start text-left gap-3 ${
                        currentAnswers[qIndex] === optIndex
                          ? (phase === 1 
                              ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-inner' 
                              : 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner')
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${currentAnswers[qIndex] === optIndex ? (phase === 1 ? 'border-teal-500 bg-teal-500 text-white' : 'border-indigo-500 bg-indigo-500 text-white') : 'border-slate-300'}`}>
                        {currentAnswers[qIndex] === optIndex && <CheckCircle2 size={14} strokeWidth={4} />}
                      </div>
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
                {phase === 2 && currentAnswers[qIndex] === q.options.length && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-4">
                    <div className="relative">
                      <textarea
                        className="w-full pl-4 pr-16 py-4 border-2 border-indigo-200 rounded-2xl bg-indigo-50/50 focus:border-indigo-500 focus:outline-none text-slate-800 font-medium placeholder:text-indigo-400"
                        placeholder="Please share your experience or feelings regarding this..."
                        value={customTexts[qIndex] || ''}
                        onChange={(e) => setCustomTexts(prev => ({...prev, [qIndex]: e.target.value}))}
                        rows={4}
                      />
                      <button
                        type="button"
                        onClick={() => startListening(qIndex)}
                        className={`absolute right-3 bottom-4 p-3 rounded-full flex items-center justify-center transition-all shadow-md ${listeningId === qIndex ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' : 'bg-white text-indigo-600 hover:bg-indigo-100 shadow-indigo-200/50'}`}
                        title="Voice Type"
                      >
                        <Mic size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}
                </>
              )}
            </motion.div>
          ))
        )}
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-6 justify-between items-center sticky bottom-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            {phase === 1 ? "Phase 1 / 2" : "Phase 2 / 2"}
          </span>
        </div>
        <motion.button
          onClick={currentSubmit}
          disabled={!currentIsComplete || loading}
          className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold flex justify-center items-center gap-3 transition-all ${
            currentIsComplete ? (phase === 1 ? 'bg-teal-600 text-white shadow-lg hover:bg-teal-700' : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700') : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {loading ? <Loader2 size={22} className="animate-spin" /> : null}
          {phase === 1 ? <span className="flex items-center gap-2">Proceed to Phase 2 <ArrowRight size={20} /></span> : "Submit Final Assessment"}
        </motion.button>
      </div>
    </motion.div>
  );
}
