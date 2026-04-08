'use client'
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const stats = [
  "🔥 150+ students helped today",
  "🌟 5 new counselors joined",
  "⚡ Average response time: < 2 mins",
  "🛡️ 100% anonymous & secure",
  "📈 20% increase in well-being scores"
];

export function PulseBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % stats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-green-600/10 border-b border-green-600/20 py-1.5 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400 text-center"
                >
                    {stats[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    </div>
  );
}