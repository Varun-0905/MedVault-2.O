'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Users, Mail, PhoneCall, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CounselorsMock() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    try {
      const res = await fetch('/api/admin/counselors');
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCounselor = async (id) => {
    if (!confirm('Remove this counselor?')) return;
    try {
      const res = await fetch(`/api/admin/counselors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStaff(staff.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-[140px] pb-16 px-6 lg:px-12">
      <div className="max-w-[1200px] mx-auto">
        <Link href="/admin">
          <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-purple-600 font-semibold mb-8 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Core Hub
          </button>
        </Link>
        
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Counselors.</span></h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">Manage and coordinate on-ground support resources.</p>

        {loading ? (
           <div className="flex justify-center items-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
           </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {staff.map((c, i) => (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={c._id} className="relative bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow-xl transition-shadow cursor-default">
                <button onClick={() => deleteCounselor(c._id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                   <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-md mb-6 relative">
                   {c.name.charAt(0)}
                   <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{c.name}</h3>
                <p className="text-sm font-semibold text-purple-600 mb-4">{c.role || c.department}</p>
                <div className="w-full h-px bg-slate-100 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                   <Users className="w-4 h-4" /> {c.location || c.campus}
                </p>
                
                <div className="flex gap-4 w-full">
                   <button onClick={() => window.location.href = `mailto:${c.email}`} className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-600 dark:text-slate-400 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-200">
                     <Mail className="w-4 h-4" /> Email
                   </button>
                   <button onClick={() => alert('Contacting ' + c.name)} className="flex-1 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-purple-200">
                     <PhoneCall className="w-4 h-4" /> Contact
                   </button>
                </div>
             </motion.div>
           ))}
        </div>
        )}
      </div>
    </div>
  );
}
