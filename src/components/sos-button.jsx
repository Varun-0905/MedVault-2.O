'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ShieldAlert, Wind, MessageCircle, X } from 'lucide-react';
import Link from 'next/link';

export function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
         {/* Essential floating Crisis button, z-index high to overlap all platform elements */}
         {!isOpen && (
           <motion.button
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0, opacity: 0 }}
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => setIsOpen(true)}
             className="fixed bottom-[104px] left-6 z-50 w-14 h-14 bg-gradient-to-tr from-rose-600 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer border-2 border-white/20 hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] transition-shadow"
           >
             <ShieldAlert className="w-6 h-6 text-white relative z-10" />
             <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
           </motion.button>
         )}

         {/* The Safety Modal Overlay */}
         {isOpen && (
           <motion.div
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
           >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
              >
                  {/* Top Red Gradient Strip */}
                  <div className="h-2 w-full bg-gradient-to-r from-rose-500 to-orange-500" />
                  
                  <div className="p-6 sm:p-8">
                     <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center shadow-inner border border-rose-200 dark:border-rose-500/20">
                             <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-500" />
                           </div>
                           <div>
                             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Emergency Support</h2>
                             <p className="text-sm font-semibold text-rose-500">You are not alone in this.</p>
                           </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 rounded-full p-2">
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <div className="space-y-4">
                        <a href="tel:988" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 transition-all hover:-translate-y-1 group shadow-sm">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                              <Phone className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex-1">
                              <h3 className="font-bold text-rose-800 dark:text-rose-400 text-lg leading-tight mb-1">Call 988 Lifeline</h3>
                              <p className="text-xs font-semibold text-rose-600/70 dark:text-rose-400/80 uppercase tracking-widest">Free & 24/7 Support</p>
                           </div>
                        </a>

                        <Link href="/zen" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 border border-teal-100 dark:border-teal-500/20 transition-all hover:-translate-y-1 group shadow-sm">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                              <Wind className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex-1">
                              <h3 className="font-bold text-teal-800 dark:text-teal-400 text-lg leading-tight mb-1">Zen & Grounding Zone</h3>
                              <p className="text-xs font-semibold text-teal-600/70 dark:text-teal-400/80 uppercase tracking-widest">Regulate your breathing</p>
                           </div>
                        </Link>

                        <Link href="/dashboard" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-all hover:-translate-y-1 group shadow-sm">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                              <MessageCircle className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex-1">
                              <h3 className="font-bold text-indigo-800 dark:text-indigo-400 text-lg leading-tight mb-1">Chat Therapy with AI</h3>
                              <p className="text-xs font-semibold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-widest">Talk to an empathetic AI listener</p>
                           </div>
                        </Link>
                     </div>
                  </div>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>
    </>
  );
}
