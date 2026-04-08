'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Star, Video, Phone, MessageSquare, Calendar, Clock, MapPin, ShieldCheck, CheckCircle2, Award, ChevronRight, X, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function TherapistDirectory() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedTherapist, setSelectedTherapist] = useState(null)
    const [bookingSuccess, setBookingSuccess] = useState(false)
    const timeoutRef = React.useRef(null)

    // Premium Mock Data
    const therapists = [
        {
            id: 1,
            name: "Dr. Sarah Jenkins",
            title: "Clinical Psychologist, PsyD",
            specialties: ["Academic Stress", "Anxiety", "Perfectionism"],
            rating: 4.9,
            reviews: 128,
            experience: "12 years",
            availability: "Available Tomorrow",
            sessions: ["Video", "Chat"],
            image: "https://i.pravatar.cc/150?u=sarah",
            bio: "I specialize in helping high-achieving students navigate the intense pressures of university life, imposter syndrome, and chronic burnout.",
            price: "Covered by Student Health"
        },
        {
            id: 2,
            name: "Michael Torres, LCSW",
            title: "Licensed Clinical Social Worker",
            specialties: ["Depression", "Grief", "Relationships"],
            rating: 4.8,
            reviews: 95,
            experience: "8 years",
            availability: "Available Today",
            sessions: ["Video", "Phone", "Chat"],
            image: "https://i.pravatar.cc/150?u=michael",
            bio: "Creating a warm, non-judgmental space to help you process difficult emotions, build resilience, and establish healthy boundaries.",
            price: "Covered by Student Health"
        },
        {
            id: 3,
            name: "Dr. Emily Chen",
            title: "Psychiatrist, MD",
            specialties: ["ADHD", "Bipolar Disorder", "Medication Mgt"],
            rating: 5.0,
            reviews: 210,
            experience: "15 years",
            availability: "Next Week",
            sessions: ["Video"],
            image: "https://i.pravatar.cc/150?u=emily",
            bio: "Offering comprehensive psychiatric evaluations and evidence-based medication management tailored specifically for young adults.",
            price: "$30 Copay"
        },
        {
            id: 4,
            name: "James Wilson, LMFT",
            title: "Marriage & Family Therapist",
            specialties: ["Family Conflict", "Trauma", "LGBTQ+"],
            rating: 4.7,
            reviews: 64,
            experience: "6 years",
            availability: "Available Thursday",
            sessions: ["Video", "Chat"],
            image: "https://i.pravatar.cc/150?u=james",
            bio: "Dedicated to helping individuals and couples build stronger relationships and heal from past family dynamics through systemic therapy.",
            price: "Covered by Student Health"
        }
    ]

    const filters = ['All', 'Anxiety', 'Depression', 'Academic Stress', 'ADHD', 'Trauma', 'Relationships']

    const filteredTherapists = therapists.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        
        const matchesFilter = activeFilter === 'All' || t.specialties.includes(activeFilter)
        
        return matchesSearch && matchesFilter
    })

    const handleBookSession = (therapist) => {
        setBookingSuccess(true)
        timeoutRef.current = setTimeout(() => {
            setBookingSuccess(false)
            setSelectedTherapist(null)
            timeoutRef.current = null
        }, 3000)
    }

    const handleCloseModal = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setBookingSuccess(false)
        setSelectedTherapist(null)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 pt-[120px] pb-24">
            
            {/* Booking Modal */}
            <AnimatePresence>
                {selectedTherapist && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-2xl w-full max-w-lg border border-slate-100 relative overflow-hidden"
                        >
                            <button type="button" onClick={handleCloseModal} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:text-slate-400 bg-slate-100 rounded-full p-2 transition-colors z-10">
                                <X className="w-5 h-5" />
                            </button>
                            
                            {bookingSuccess ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <motion.div 
                                        initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }} transition={{ type: "tween", duration: 0.5 }}
                                        className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
                                    >
                                        <CheckCircle2 className="w-10 h-10" />
                                    </motion.div>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">Session Requested!</h2>
                                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                                        {selectedTherapist?.name} will confirm your appointment shortly via your student email.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-5 mb-8 pt-2 mt-4">
                                        <div className="w-20 h-20 rounded-[1.25rem] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                            <User className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedTherapist?.name}</h2>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">{selectedTherapist?.title}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Select Session Type</h3>
                                            <div className="flex gap-3">
                                                {selectedTherapist?.sessions?.map((type, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50 cursor-pointer transition-all bg-white dark:bg-slate-900 border-transparent dark:border-slate-800">
                                                        {type === 'Video' ? <Video className="w-6 h-6 text-slate-600 dark:text-slate-400" /> : type === 'Phone' ? <Phone className="w-6 h-6 text-slate-600 dark:text-slate-400" /> : <MessageSquare className="w-6 h-6 text-slate-600 dark:text-slate-400" />}
                                                        <span className="text-sm font-bold text-slate-700">{type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Next Available</h3>
                                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-lg border border-slate-200">
                                                <Calendar className="w-5 h-5 text-sky-600" />
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedTherapist?.availability}</span>
                                                <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 rounded-xl py-6 text-lg font-bold border-slate-200 hover:bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                                                Cancel
                                            </Button>
                                            <Button onClick={() => handleBookSession(selectedTherapist)} className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 text-lg font-bold shadow-xl shadow-slate-900/10">
                                                Confirm Request
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
                <div className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-[2rem] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-100/40 rounded-full blur-3xl -ml-20 -mb-20"></div>
                    
                    <div className="relative z-10 max-w-xl text-center md:text-left">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold mb-6 tracking-wide uppercase">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Vetted Professionals
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-100 mb-5 tracking-tight leading-tight">
                            Find your perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-sky-600">Therapist</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg mb-8">
                            Browse highly rated, student-focused mental health professionals. Filter by specialty, read reviews, and book video sessions instantly.
                        </p>
                        
                        <div className="relative max-w-md mx-auto md:mx-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input 
                                placeholder="Search by name or specialty..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 py-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 text-lg shadow-inner focus:bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                            />
                        </div>
                    </div>
                    
                    <div className="relative z-10 shrink-0 hidden md:block">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center -rotate-2 transform hover:scale-105 transition-transform cursor-default">
                                <Video className="w-8 h-8 text-indigo-500 mb-2" />
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Telehealth<br/>Ready</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center rotate-3 transform hover:scale-105 transition-transform cursor-default mt-6">
                                <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Strictly<br/>Confidential</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-6 no-scrollbar mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Specialties:</span>
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                                activeFilter === filter 
                                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' 
                                : 'bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950 border border-slate-200/60 hover:border-slate-300'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Therapist Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredTherapists.map(therapist => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                key={therapist.id}
                                className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-[2rem] p-6 lg:p-8 shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:border-teal-100 hover:shadow-[0_8px_30px_rgb(20,184,166,0.08)] transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="flex items-start gap-5 mb-6">
                                    <div className="relative shrink-0">
                                        <div className="w-24 h-24 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 flex items-center justify-center shadow-sm">
                                            <User className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 p-1 rounded-full shadow-sm">
                                            <div className="bg-emerald-100 text-emerald-600 rounded-full p-1.5">
                                                <Award className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{therapist.name}</h2>
                                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md shrink-0">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <span className="text-xs font-bold">{therapist.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-teal-600 mb-3">{therapist.title}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {therapist.specialties.map((spec, i) => (
                                                <span key={i} className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                                    "{therapist.bio}"
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 flex items-center justify-center shadow-sm">
                                            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
                                            <p className="text-sm font-bold text-slate-700">{therapist.experience}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 flex items-center justify-center shadow-sm">
                                            <Calendar className="w-4 h-4 text-teal-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next Slot</p>
                                            <p className="text-sm font-bold text-teal-700">{therapist.availability}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 pt-2">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4" /> {therapist.price}
                                    </span>
                                    <Button onClick={() => setSelectedTherapist(therapist)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-5 font-bold shadow-lg shadow-slate-900/10">
                                        Book Session
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredTherapists.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-[2rem] border border-slate-100 border-dashed">
                            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">No therapists found</h3>
                            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or specialty filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
