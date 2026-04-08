'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Flame, CircleDot, RefreshCw, Gamepad2, Target, Zap } from 'lucide-react';

export default function ZenZone() {
  const [activeTab, setActiveTab] = useState('breathe');
  const [thought, setThought] = useState('');
  const [isBurning, setIsBurning] = useState(false);
  const [bubbles, setBubbles] = useState(Array(24).fill(false));

  // Game State
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMole, setActiveMole] = useState(null);

  const tabToHash = {
    breathe: '#breathwork',
    burn: '#release',
    pop: '#bubblewrap',
    game: '#mind-sweep',
  };

  const hashToTab = {
    '#breathwork': 'breathe',
    '#release': 'burn',
    '#bubblewrap': 'pop',
    '#mind-sweep': 'game',
  };

  const scrollToHash = (hash) => {
    if (typeof document === 'undefined' || !hash) return;
    const elementId = hash.replace('#', '');
    const run = () => {
      const target = document.getElementById(elementId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(run);
    } else {
      setTimeout(run, 0);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const incomingHash = window.location.hash?.toLowerCase();
      const mappedTab = hashToTab[incomingHash];
      if (mappedTab) {
        setActiveTab(mappedTab);
        scrollToHash(incomingHash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetHash = tabToHash[activeTab];
    if (!targetHash || window.location.hash === targetHash) return;
    const newUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeTab]);

  const handleBurn = () => {
    if (!thought.trim()) return;
    setIsBurning(true);
    setTimeout(() => {
      setThought('');
      setIsBurning(false);
    }, 2000);
  };

  const playRealisticPop = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // 1. High-frequency 'snap' (plastic crinkle)
      const bufferSize = ctx.sampleRate * 0.05; // 50ms of noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 5000;
      noise.connect(noiseFilter);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // 2. Low-frequency 'thud' (air escaping)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(1.5, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      noise.start();
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.log('Audio playback prevented by browser policy until user interacts.');
    }
  };

  const popBubble = (index) => {
    if (bubbles[index]) return;
    playRealisticPop(); // Trigger procedural snap
    const newBubbles = [...bubbles];
    newBubbles[index] = true;
    setBubbles(newBubbles);
  };

  const resetBubbles = () => setBubbles(Array(24).fill(false));

  // Game Engine
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
  };

  useEffect(() => {
    let moleTimer;
    let clockTimer;
    
    if (isPlaying && timeLeft > 0) {
      clockTimer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);

      const spawnMole = () => {
        const randomTarget = Math.floor(Math.random() * 9);
        setActiveMole(randomTarget);
        // It gets slightly faster as they score more points to induce 'flow state'
        const currentSpeed = Math.max(400, 900 - (score * 15)); 
        moleTimer = setTimeout(spawnMole, currentSpeed);
      };
      
      moleTimer = setTimeout(spawnMole, 500);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      setActiveMole(null);
    }

    return () => {
      clearInterval(clockTimer);
      clearTimeout(moleTimer);
    };
  }, [isPlaying, timeLeft, score]);

  const hitMole = (index) => {
    if (index === activeMole && isPlaying) {
      setScore(s => s + 1);
      setActiveMole(null); // Instantly hide target upon successful hit
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-[120px] pb-16 px-6 relative overflow-hidden text-slate-200">
       {/* Ambient Background Glows */}
       <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
       <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]" />

       <div className="max-w-[900px] mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">The Zen <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">Zone.</span></h1>
            <p className="text-slate-400 text-lg">A safe, interactive digital space to ground your nervous system.</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-2 sm:gap-4 mb-12 flex-wrap">
            {[
              { id: 'breathe', icon: Wind, label: 'Box Breathing' },
              { id: 'burn', icon: Flame, label: 'Thought Burner' },
              { id: 'pop', icon: CircleDot, label: 'Bubble Wrap' },
              { id: 'game', icon: Gamepad2, label: 'Stress Buster' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                   setActiveTab(tab.id);
                   setIsPlaying(false);
                   setScore(0);
                   setTimeLeft(30);
                   setActiveMole(null);
                }}
                className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 border-transparent dark:border-slate-800/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-300 hover:bg-white dark:bg-slate-900 border-transparent dark:border-slate-800/5'}`}
              >
                <tab.icon className="w-5 h-5" /> <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Interaction Area */}
          <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 md:p-12 min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
             
             <AnimatePresence mode="wait">
               {/* Breathing Feature */}
               {activeTab === 'breathe' && (
                 <motion.div
                   id="breathwork"
                   key="breathe"
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="flex flex-col items-center w-full"
                 >
                    <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                       <motion.div 
                         animate={{ scale: [1, 1.6, 1.6, 1], opacity: [0.4, 0.8, 0.8, 0.4] }}
                         transition={{ duration: 19, ease: "easeInOut", repeat: Infinity, times: [0, 0.21, 0.57, 1] }} 
                         className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 rounded-full blur-2xl"
                       />
                       <motion.div 
                         animate={{ scale: [1, 1.8, 1.8, 1], borderColor: ['rgba(45,212,191,0.2)', 'rgba(45,212,191,0.6)', 'rgba(45,212,191,0.6)', 'rgba(45,212,191,0.2)'] }}
                         transition={{ duration: 19, ease: "easeInOut", repeat: Infinity, times: [0, 0.21, 0.57, 1] }} 
                         className="w-28 h-28 rounded-full border-[3px] border-teal-400/30 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(45,212,191,0.1)]"
                       >
                         <div className="w-24 h-24 rounded-full bg-teal-900/40 backdrop-blur-md flex items-center justify-center border border-teal-500/30">
                            <Wind className="w-8 h-8 text-teal-300" />
                         </div>
                       </motion.div>
                    </div>
                    <div className="h-16 flex flex-col items-center justify-center">
                       <p className="text-xl font-bold text-teal-100 text-center tracking-wide mb-2">Sync with the sphere.</p>
                       <p className="text-sm font-semibold text-teal-500/70 uppercase tracking-widest text-center">Inhale (4s) • Hold (7s) • Exhale (8s)</p>
                    </div>
                 </motion.div>
               )}

               {/* Thought Burner Feature */}
               {activeTab === 'burn' && (
                 <motion.div
                   id="release"
                   key="burn"
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                   className="w-full max-w-md h-full flex flex-col justify-center"
                 >
                    {!isBurning ? (
                      <div className="flex flex-col gap-6 w-full">
                        <div className="text-center">
                           <Flame className="w-8 h-8 text-rose-500 mx-auto mb-3 opacity-80" />
                           <p className="text-rose-100 font-medium text-lg leading-relaxed">
                             Express a thought causing you distress.
                           </p>
                           <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">Zero Data Saved • Purged on burn</p>
                        </div>
                        <textarea 
                          value={thought}
                          onChange={(e) => setThought(e.target.value)}
                          placeholder="I am overwhelmed by..."
                          className="w-full h-40 bg-slate-900/60 border border-slate-700 rounded-2xl p-5 text-slate-200 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 resize-none shadow-inner placeholder:text-slate-600 dark:text-slate-400 font-medium"
                        />
                        <button 
                          onClick={handleBurn}
                          disabled={!thought.trim()}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-black tracking-widest uppercase hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                          Send to the fire
                        </button>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center relative w-full">
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.5, opacity: [0, 1, 0] }} transition={{ duration: 2 }}
                          className="absolute z-0 mix-blend-screen overflow-hidden"
                        >
                           <Flame className="w-32 h-32 text-orange-500 blur-md animate-pulse" />
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
                          animate={{ opacity: 0, filter: "blur(20px)", scale: 1.2, y: -80 }}
                          transition={{ duration: 1.8, ease: "easeIn" }}
                          className="text-orange-400 font-bold text-xl text-center relative z-10 break-words w-full px-4"
                        >
                          {thought}
                        </motion.div>
                      </div>
                    )}
                 </motion.div>
               )}

               {/* Digital Bubble Wrap Feature */}
               {activeTab === 'pop' && (
                 <motion.div
                   id="bubblewrap"
                   key="pop"
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="w-full flex flex-col items-center justify-center h-full"
                 >
                    <div className="flex items-center justify-between w-full max-w-sm mb-10">
                       <div>
                         <h3 className="font-bold text-xl text-indigo-300">Kinetic Release</h3>
                         <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Pop the grid to exhaust anxious energy.</p>
                       </div>
                       <button onClick={resetBubbles} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 p-3 rounded-xl hover:bg-slate-700 shadow-sm border border-slate-600">
                          <RefreshCw className="w-5 h-5" />
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-3 sm:gap-5 w-full max-w-sm mx-auto">
                       {bubbles.map((popped, i) => (
                         <motion.button
                           key={i}
                           onClick={() => popBubble(i)}
                           whileTap={{ scale: popped ? 1 : 0.8 }}
                           className={`w-full aspect-square rounded-full flex items-center justify-center transition-all duration-200 ${
                             popped 
                               ? 'bg-slate-800 shadow-inner border border-slate-700 opacity-40 cursor-default' 
                               : 'bg-indigo-500/10 border border-indigo-400/40 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.1)] hover:bg-indigo-400/30 cursor-pointer hover:shadow-[inset_0_-2px_8px_rgba(0,0,0,0.4),inset_0_2px_12px_rgba(255,255,255,0.2)]'
                           }`}
                         >
                           {popped && <div className="w-1/3 h-1/3 rounded-full bg-slate-900 shadow-inner" />}
                         </motion.button>
                       ))}
                    </div>
                 </motion.div>
               )}

               {/* Stress Buster Mini-Game */}
               {activeTab === 'game' && (
                 <motion.div
                   id="mind-sweep"
                   key="game"
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="w-full flex flex-col items-center justify-center h-full"
                 >
                    <div className="flex items-center justify-between w-full max-w-md mb-8">
                       <div>
                         <h3 className="font-bold text-xl text-emerald-300">Mind Sweep</h3>
                         <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Smash the stress targets before they fade.</p>
                       </div>
                       <div className="flex flex-col items-end">
                         <div className="text-3xl font-black text-white bg-slate-800/80 px-4 py-1 rounded-xl shadow-inner border border-slate-700">
                           {score}
                         </div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{timeLeft}s remaining</p>
                       </div>
                    </div>
                    
                    {!isPlaying && timeLeft === 30 && (
                      <div className="w-full max-w-md h-[300px] flex items-center justify-center bg-slate-900/40 border border-slate-700/50 rounded-3xl mb-4">
                         <button 
                            onClick={startGame}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xl px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform"
                         >
                            Start Sweeping
                         </button>
                      </div>
                    )}

                    {!isPlaying && timeLeft === 0 && (
                      <div className="w-full max-w-md h-[300px] flex flex-col items-center justify-center bg-slate-900/40 border border-slate-700/50 rounded-3xl mb-4 space-y-6">
                         <h2 className="text-3xl font-bold text-white">Time's Up!</h2>
                         <p className="text-xl text-slate-400 font-medium">You smashed <span className="text-emerald-400 font-black text-2xl">{score}</span> stressors.</p>
                         <button 
                            onClick={startGame}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 rounded-xl transition-colors border border-slate-600"
                         >
                            Play Again
                         </button>
                      </div>
                    )}

                    {isPlaying && (
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-md mx-auto h-[300px] mb-4">
                         {[0,1,2,3,4,5,6,7,8].map((index) => (
                           <div key={index} className="w-full h-full bg-slate-900/30 rounded-2xl border border-slate-700/30 flex items-center justify-center relative shadow-inner">
                              <AnimatePresence>
                                {activeMole === index && (
                                  <motion.button
                                    initial={{ scale: 0, opacity: 0, rotate: -45 }} 
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }} 
                                    exit={{ scale: 0, opacity: 0, filter: "blur(10px)" }}
                                    whileTap={{ scale: 0.8 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    onMouseDown={() => hitMole(index)}
                                    className="w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 shadow-[0_0_20px_rgba(225,29,72,0.5)] border-2 border-rose-400/50 cursor-pointer flex items-center justify-center absolute z-20 group"
                                  >
                                    <Target className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                                  </motion.button>
                                )}
                              </AnimatePresence>
                           </div>
                         ))}
                      </div>
                    )}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
       </div>
    </div>
  );
}
