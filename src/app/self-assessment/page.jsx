'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import FooterSection from '@/components/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    ChevronRight, ChevronLeft, Brain, HeartPulse, Shield, 
    AlertTriangle, Phone, PhoneOff, CheckCircle2, Loader2, 
    BookOpen, Headphones, Play, FileText, ArrowRight, X
} from 'lucide-react'

// ─── Clinically-inspired Assessment Questions ───────────────────────────
const PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things such as reading or watching TV",
    "Moving or speaking so slowly that others could have noticed. Or being so restless that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead, or of hurting yourself in some way"
];

const GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid, as if something awful might happen"
];

const PSS_QUESTIONS = [
    "How often have you felt that you were unable to control the important things in your life?",
    "How often have you felt confident about your ability to handle your personal problems?",
    "How often have you felt that things were going your way?",
    "How often have you felt difficulties were piling up so high that you could not overcome them?"
];

const ANSWER_OPTIONS_PHQ = [
    { label: "Not at all", value: 0 },
    { label: "Several days", value: 1 },
    { label: "More than half the days", value: 2 },
    { label: "Nearly every day", value: 3 }
];

const ANSWER_OPTIONS_PSS = [
    { label: "Never", value: 0 },
    { label: "Almost Never", value: 1 },
    { label: "Sometimes", value: 2 },
    { label: "Fairly Often", value: 3 },
    { label: "Very Often", value: 4 }
];

// Reverse-scored items for PSS (confidence + things going well)
const PSS_REVERSE_INDICES = [1, 2];

// ─── Main Component ────────────────────────────────────────────────────
export default function SelfAssessmentPage() {
    const [currentStep, setCurrentStep] = useState(0); // 0=welcome, 1=PHQ9, 2=GAD7, 3=PSS, 4=results
    const [phq9Answers, setPhq9Answers] = useState(Array(9).fill(null));
    const [gad7Answers, setGad7Answers] = useState(Array(7).fill(null));
    const [pssAnswers, setPssAnswers] = useState(Array(4).fill(null));
    const [aiRecommendations, setAiRecommendations] = useState(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [showMockCall, setShowMockCall] = useState(false);
    const [callState, setCallState] = useState('dialing'); // dialing, connected, ended
    const [authChecked, setAuthChecked] = useState(false);
    const [user, setUser] = useState(null);
    const topRef = useRef(null);

    // ─── Mock Call Logic (Moved up to fix Hook Order Violation) ─────
    useEffect(() => {
        if (showMockCall && callState === 'dialing') {
            const timer = setTimeout(() => setCallState('connected'), 3000);
            return () => clearTimeout(timer);
        }
    }, [showMockCall, callState]);

    // ─── Auth Guard ─────────────────────────────────────────────────
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/users/me');
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                } else {
                    window.location.href = '/login';
                    return;
                }
            } catch {
                window.location.href = '/login';
                return;
            }
            setAuthChecked(true);
        }
        checkAuth();
    }, []);

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // ─── Scoring Functions ──────────────────────────────────────────
    const phq9Score = phq9Answers.reduce((sum, v) => sum + (v ?? 0), 0);
    const gad7Score = gad7Answers.reduce((sum, v) => sum + (v ?? 0), 0);
    const pssScore = pssAnswers.reduce((sum, v, i) => {
        if (v === null) return sum;
        if (PSS_REVERSE_INDICES.includes(i)) return sum + (4 - v);
        return sum + v;
    }, 0);
    const totalScore = phq9Score + gad7Score + pssScore;

    const getRiskLevel = () => {
        if (totalScore >= 55) return 'critical';
        if (totalScore >= 40) return 'high';
        if (totalScore >= 20) return 'moderate';
        return 'low';
    };

    const getRiskConfig = () => {
        const level = getRiskLevel();
        const configs = {
            low: { color: 'emerald', label: 'Low Risk', emoji: '🟢', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', barColor: 'bg-emerald-500' },
            moderate: { color: 'amber', label: 'Moderate Risk', emoji: '🟡', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', barColor: 'bg-amber-500' },
            high: { color: 'orange', label: 'High Risk', emoji: '🟠', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', barColor: 'bg-orange-500' },
            critical: { color: 'red', label: 'Critical — Immediate Attention Needed', emoji: '🔴', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', barColor: 'bg-red-600' }
        };
        return configs[level];
    };

    const getSeverityLabel = (score, max) => {
        const pct = (score / max) * 100;
        if (pct < 25) return { label: 'Minimal', color: 'text-emerald-600' };
        if (pct < 50) return { label: 'Mild', color: 'text-amber-600' };
        if (pct < 75) return { label: 'Moderate', color: 'text-orange-600' };
        return { label: 'Severe', color: 'text-red-600' };
    };

    // ─── Submit & AI Recommendation ─────────────────────────────────
    const handleSubmitAssessment = async () => {
        setCurrentStep(4);
        topRef.current?.scrollIntoView({ behavior: 'smooth' });

        const risk = getRiskLevel();
        if (risk === 'critical') {
            setTimeout(() => setShowMockCall(true), 1500);
        }

        setIsLoadingAI(true);
        try {
            const res = await fetch('/api/assessment-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phq9Score, gad7Score, pssScore, totalScore,
                    answers: { phq9: phq9Answers, gad7: gad7Answers, pss: pssAnswers }
                })
            });
            const data = await res.json();
            setAiRecommendations(data);
        } catch (err) {
            console.error('AI recommendation error:', err);
            setAiRecommendations({
                recommendations: "We couldn't reach our AI engine right now. Please visit the Resource Hub for helpful materials.",
                riskLevel: getRiskLevel(),
                suggestedResources: []
            });
        } finally {
            setIsLoadingAI(false);
        }
    };

    // ─── Navigation Helpers ─────────────────────────────────────────
    const canProceedFromStep = (step) => {
        if (step === 1) return phq9Answers.every(a => a !== null);
        if (step === 2) return gad7Answers.every(a => a !== null);
        if (step === 3) return pssAnswers.every(a => a !== null);
        return true;
    };

    const handleNext = () => {
        if (currentStep === 3) {
            handleSubmitAssessment();
        } else {
            setCurrentStep(prev => prev + 1);
            topRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const progressPercentage = currentStep === 0 ? 0 : (currentStep / 4) * 100;

    // ─── Question Renderer ──────────────────────────────────────────
    const renderQuestions = (questions, answers, setAnswers, options) => (
        <div className="space-y-5">
            {questions.map((q, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                        <span className="text-primary/60 mr-2">{i + 1}.</span>
                        {q}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    const updated = [...answers];
                                    updated[i] = opt.value;
                                    setAnswers(updated);
                                }}
                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                    answers[i] === opt.value
                                        ? 'bg-primary text-white border-primary shadow-md scale-105'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );

    // ─── Render ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background pt-[120px]" ref={topRef}>

            {/* Progress Bar */}
            {currentStep > 0 && currentStep < 4 && (
                <div className="fixed top-[57px] left-0 right-0 z-10 h-1.5 bg-gray-200">
                    <motion.div 
                        className="h-full bg-primary rounded-r-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            )}

            <main className="pt-24 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <AnimatePresence mode="wait">

                        {/* ═══ STEP 0: WELCOME ═══ */}
                        {currentStep === 0 && (
                            <motion.div 
                                key="welcome"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-12"
                            >
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8">
                                    <Brain className="w-10 h-10 text-primary" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-6">Mental Health Self-Assessment</h1>
                                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                                    Take a quick, confidential self-assessment based on clinically validated scales. 
                                    Our AI will analyze your results and recommend the best resources tailored to your needs.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12 text-left">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                        <HeartPulse className="w-8 h-8 text-blue-600 mb-3" />
                                        <h3 className="font-bold text-gray-900 mb-1">PHQ-9</h3>
                                        <p className="text-sm text-gray-600">Depression screening — 9 questions about your mood and energy levels.</p>
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                                        <Shield className="w-8 h-8 text-green-600 mb-3" />
                                        <h3 className="font-bold text-gray-900 mb-1">GAD-7</h3>
                                        <p className="text-sm text-gray-600">Anxiety screening — 7 questions about your worry and tension patterns.</p>
                                    </div>
                                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                                        <Brain className="w-8 h-8 text-purple-600 mb-3" />
                                        <h3 className="font-bold text-gray-900 mb-1">PSS-4</h3>
                                        <p className="text-sm text-gray-600">Stress screening — 4 questions about your perceived stress.</p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl mx-auto mb-10">
                                    <p className="text-sm text-amber-800">
                                        <strong>Privacy Notice:</strong> Your responses are processed locally and are never stored or shared. 
                                        This assessment is for self-awareness only and does not constitute a clinical diagnosis.
                                    </p>
                                </div>

                                <Button size="lg" className="text-lg px-10 py-7 h-auto shadow-lg" onClick={() => setCurrentStep(1)}>
                                    Begin Assessment <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        )}

                        {/* ═══ STEP 1: PHQ-9 (Depression) ═══ */}
                        {currentStep === 1 && (
                            <motion.div 
                                key="phq9"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                            >
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <HeartPulse className="w-6 h-6 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Step 1 of 3</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">Depression Screening (PHQ-9)</h2>
                                    <p className="text-muted-foreground">Over the <strong>last 2 weeks</strong>, how often have you been bothered by any of the following problems?</p>
                                </div>

                                {renderQuestions(PHQ9_QUESTIONS, phq9Answers, setPhq9Answers, ANSWER_OPTIONS_PHQ)}

                                <div className="flex justify-between items-center mt-10 pt-6 border-t">
                                    <Button variant="outline" onClick={() => setCurrentStep(0)}>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                    </Button>
                                    <div className="text-sm text-muted-foreground">{phq9Answers.filter(a => a !== null).length}/{PHQ9_QUESTIONS.length} answered</div>
                                    <Button onClick={handleNext} disabled={!canProceedFromStep(1)}>
                                        Next: Anxiety <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 2: GAD-7 (Anxiety) ═══ */}
                        {currentStep === 2 && (
                            <motion.div 
                                key="gad7"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                            >
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="w-6 h-6 text-green-600" />
                                        <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">Step 2 of 3</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">Anxiety Screening (GAD-7)</h2>
                                    <p className="text-muted-foreground">Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following problems?</p>
                                </div>

                                {renderQuestions(GAD7_QUESTIONS, gad7Answers, setGad7Answers, ANSWER_OPTIONS_PHQ)}

                                <div className="flex justify-between items-center mt-10 pt-6 border-t">
                                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                    </Button>
                                    <div className="text-sm text-muted-foreground">{gad7Answers.filter(a => a !== null).length}/{GAD7_QUESTIONS.length} answered</div>
                                    <Button onClick={handleNext} disabled={!canProceedFromStep(2)}>
                                        Next: Stress <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 3: PSS-4 (Stress) ═══ */}
                        {currentStep === 3 && (
                            <motion.div 
                                key="pss"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                            >
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Brain className="w-6 h-6 text-purple-600" />
                                        <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Step 3 of 3</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">Stress Screening (PSS-4)</h2>
                                    <p className="text-muted-foreground">In the <strong>last month</strong>, answer the following about your feelings and thoughts.</p>
                                </div>

                                {renderQuestions(PSS_QUESTIONS, pssAnswers, setPssAnswers, ANSWER_OPTIONS_PSS)}

                                <div className="flex justify-between items-center mt-10 pt-6 border-t">
                                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                    </Button>
                                    <div className="text-sm text-muted-foreground">{pssAnswers.filter(a => a !== null).length}/{PSS_QUESTIONS.length} answered</div>
                                    <Button onClick={handleNext} disabled={!canProceedFromStep(3)} className="bg-primary shadow-lg">
                                        Get AI Analysis <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 4: RESULTS DASHBOARD ═══ */}
                        {currentStep === 4 && (
                            <motion.div 
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <h2 className="text-3xl font-bold mb-8 text-center">Your Assessment Results</h2>

                                {/* Risk Meter */}
                                <div className={`${getRiskConfig().bg} ${getRiskConfig().border} border-2 rounded-2xl p-8 mb-8 text-center`}>
                                    <p className="text-5xl mb-3">{getRiskConfig().emoji}</p>
                                    <h3 className={`text-2xl font-black mb-2 ${getRiskConfig().text}`}>{getRiskConfig().label}</h3>
                                    <p className="text-sm text-gray-600 mb-4">Combined Score: <strong>{totalScore}</strong> / 64</p>
                                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${getRiskConfig().barColor}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((totalScore / 64) * 100, 100)}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-2 max-w-md mx-auto">
                                        <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
                                    </div>
                                </div>

                                {/* Score Breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                    {[
                                        { title: 'Depression (PHQ-9)', score: phq9Score, max: 27, icon: <HeartPulse className="w-5 h-5" />, color: 'blue' },
                                        { title: 'Anxiety (GAD-7)', score: gad7Score, max: 21, icon: <Shield className="w-5 h-5" />, color: 'green' },
                                        { title: 'Stress (PSS-4)', score: pssScore, max: 16, icon: <Brain className="w-5 h-5" />, color: 'purple' }
                                    ].map((item, i) => {
                                        const severity = getSeverityLabel(item.score, item.max);
                                        return (
                                            <div key={i} className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 border rounded-xl p-6 text-center shadow-sm">
                                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${item.color}-100 text-${item.color}-600 mb-3`}>
                                                    {item.icon}
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h4>
                                                <p className="text-3xl font-black text-gray-900">{item.score}<span className="text-lg text-gray-400">/{item.max}</span></p>
                                                <p className={`text-sm font-semibold mt-1 ${severity.color}`}>{severity.label}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* AI Recommendations */}
                                <div className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 border-2 border-primary/20 rounded-2xl p-8 mb-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Brain className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">AI-Powered Analysis</h3>
                                            <p className="text-sm text-muted-foreground">Personalized recommendations based on your assessment</p>
                                        </div>
                                    </div>

                                    {isLoadingAI ? (
                                        <div className="flex flex-col items-center py-12 text-center">
                                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                            <p className="text-muted-foreground font-medium">Analyzing your responses with AI...</p>
                                            <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
                                        </div>
                                    ) : aiRecommendations ? (
                                        <div>
                                            <div className="prose prose-sm max-w-none text-gray-700 mb-8 whitespace-pre-line leading-relaxed">
                                                {aiRecommendations.recommendations}
                                            </div>

                                            {/* Suggested Resources */}
                                            {aiRecommendations.suggestedResources?.length > 0 && (
                                                <div>
                                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-primary" />
                                                        Recommended for You
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {aiRecommendations.suggestedResources.map((res, i) => (
                                                            <Link
                                                                key={i}
                                                                href="/resources"
                                                                className="group bg-gray-50 hover:bg-primary/5 border rounded-xl p-4 transition-all hover:border-primary/30 hover:shadow-md block"
                                                            >
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    {res.type === 'Video' && <Play className="w-4 h-4 text-blue-500" />}
                                                                    {res.type === 'Audio' && <Headphones className="w-4 h-4 text-green-500" />}
                                                                    {res.type === 'Interactive' && <BookOpen className="w-4 h-4 text-purple-500" />}
                                                                    {res.type === 'Article' && <FileText className="w-4 h-4 text-amber-500" />}
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase">{res.type}</span>
                                                                </div>
                                                                <h5 className="font-bold text-sm text-gray-800 group-hover:text-primary transition-colors mb-1">{res.title}</h5>
                                                                <p className="text-xs text-gray-500 line-clamp-2">{res.reason}</p>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                                    <Button asChild size="lg" className="text-base px-8 py-6 h-auto">
                                        <Link href="/resources">
                                            <BookOpen className="w-5 h-5 mr-2" /> Browse Resource Hub
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" className="text-base px-8 py-6 h-auto" onClick={() => {
                                        setCurrentStep(0);
                                        setPhq9Answers(Array(9).fill(null));
                                        setGad7Answers(Array(7).fill(null));
                                        setPssAnswers(Array(4).fill(null));
                                        setAiRecommendations(null);
                                    }}>
                                        Retake Assessment
                                    </Button>
                                    {(getRiskLevel() === 'high' || getRiskLevel() === 'critical') && (
                                        <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 h-auto border-red-200 text-red-700 hover:bg-red-50">
                                            <Link href="/consult">
                                                <Phone className="w-5 h-5 mr-2" /> Talk to a Counselor
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <FooterSection />

            {/* ═══ MOCK EMERGENCY CALL MODAL ═══ */}
            <AnimatePresence>
                {showMockCall && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 30 }}
                            className="bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            {/* Call Header */}
                            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-8 text-center relative">
                                <div className="absolute top-3 right-3">
                                    <button onClick={() => { setShowMockCall(false); setCallState('dialing'); }} className="p-1.5 rounded-full hover:bg-white dark:bg-slate-900 border-transparent dark:border-slate-800/20 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                {callState === 'dialing' && (
                                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                        <Phone className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
                                    </motion.div>
                                )}
                                {callState === 'connected' && (
                                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-300" />
                                )}
                                {callState === 'ended' && (
                                    <PhoneOff className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                )}

                                <h3 className="text-2xl font-bold mb-1">
                                    {callState === 'dialing' && 'Calling Crisis Helpline...'}
                                    {callState === 'connected' && 'Connected'}
                                    {callState === 'ended' && 'Call Ended'}
                                </h3>
                                <p className="text-red-200 text-lg font-semibold">988 Suicide & Crisis Lifeline</p>
                                
                                {callState === 'dialing' && (
                                    <motion.div 
                                        className="flex justify-center gap-1.5 mt-4"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 1.2 }}
                                    >
                                        <div className="w-2.5 h-2.5 bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-full"></div>
                                        <div className="w-2.5 h-2.5 bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-full"></div>
                                        <div className="w-2.5 h-2.5 bg-white dark:bg-slate-900 border-transparent dark:border-slate-800 rounded-full"></div>
                                    </motion.div>
                                )}

                                {callState === 'connected' && (
                                    <p className="text-green-200 mt-3 text-sm font-medium">
                                        A trained crisis counselor is ready to help you.
                                    </p>
                                )}
                            </div>

                            {/* Call Body */}
                            <div className="p-6 space-y-4">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <p className="text-amber-900 text-sm font-semibold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        DEMO MODE — This is a simulated call for demonstration purposes only.
                                    </p>
                                </div>

                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Your assessment indicated a critical risk level. In a real deployment, this would automatically initiate 
                                    a connection to a trained crisis counselor.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <p className="text-sm font-bold text-gray-800">Real Emergency Resources:</p>
                                    <p className="text-sm text-gray-700">📞 <strong>988 Lifeline:</strong> Call or text 988</p>
                                    <p className="text-sm text-gray-700">💬 <strong>Crisis Text Line:</strong> Text HOME to 741741</p>
                                    <p className="text-sm text-gray-700">🌐 <strong>AASRA (India):</strong> +91-9820466726</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    {callState === 'connected' && (
                                        <Button 
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                            onClick={() => setCallState('ended')}
                                        >
                                            <PhoneOff className="w-4 h-4 mr-2" /> End Call
                                        </Button>
                                    )}
                                    <Button 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => { setShowMockCall(false); setCallState('dialing'); }}
                                    >
                                        Close Demo
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
