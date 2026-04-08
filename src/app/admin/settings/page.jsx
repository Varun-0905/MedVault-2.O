'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Lock, ShieldAlert, Database, Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SettingsMock() {
  const [toggles, setToggles] = useState({
     anonymous: true,
     criticalAlerts: true,
     maintenance: false,
     publicSignups: false
  })

  const toggle = (key) => setToggles({...toggles, [key]: !toggles[key]})

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-[140px] pb-16 px-6 lg:px-12">
      <div className="max-w-[800px] mx-auto">
        <Link href="/admin">
          <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 font-semibold mb-8 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Core Hub
          </button>
        </Link>
        
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900">Configuration.</span></h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">Modify core system parameters and security controls.</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
           
           <div className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-sky-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Peer Forum Anonymity</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Allow users to post masking their true registered identity.</p>
                 </div>
              </div>
              <button 
                onClick={() => toggle('anonymous')}
                className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${toggles.anonymous ? 'bg-sky-500' : 'bg-slate-200'}`}
              >
                 <div className={`w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 shadow-md transform transition-transform ${toggles.anonymous ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>

           <div className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Auto-Ping 988 Routing</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Automatically trigger administrative SMS alerts on PHQ-9 &ge; 20.</p>
                 </div>
              </div>
              <button 
                onClick={() => toggle('criticalAlerts')}
                className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${toggles.criticalAlerts ? 'bg-rose-500' : 'bg-slate-200'}`}
              >
                 <div className={`w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 shadow-md transform transition-transform ${toggles.criticalAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>

           <div className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Database className="w-6 h-6 text-orange-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Toggle Maintenance Mode</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Gracefully block user access indicating system upgrades.</p>
                 </div>
              </div>
              <button 
                onClick={() => toggle('maintenance')}
                className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${toggles.maintenance ? 'bg-orange-500' : 'bg-slate-200'}`}
              >
                 <div className={`w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 shadow-md transform transition-transform ${toggles.maintenance ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>

        </motion.div>
      </div>
    </div>
  );
}
