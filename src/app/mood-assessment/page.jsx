'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Brain, FileText, AlertTriangle, CheckCircle, Info, ChevronRight, ChevronLeft } from 'lucide-react'

export default function MoodAssessment() {
    const [user, setUser] = useState(null)
    const [currentAssessment, setCurrentAssessment] = useState(null)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [responses, setResponses] = useState({})
    const [results, setResults] = useState(null)
    const [assessmentHistory, setAssessmentHistory] = useState([])

    // PHQ-9 Depression Screening
    const phq9Questions = [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
        "Trouble concentrating on things, such as reading the newspaper or watching television",
        "Moving or speaking so slowly that other people could have noticed. Or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
        "Thoughts that you would be better off dead, or of hurting yourself"
    ]

    // GAD-7 Anxiety Screening
    const gad7Questions = [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it is hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid, as if something awful might happen"
    ]

    // GHQ-12 General Health Questionnaire
    const ghq12Questions = [
        "Been able to concentrate on whatever you're doing",
        "Lost much sleep over worry",
        "Felt that you were playing a useful part in things",
        "Felt capable of making decisions about things",
        "Felt constantly under strain",
        "Felt you couldn't overcome your difficulties",
        "Been able to enjoy your normal day-to-day activities",
        "Been able to face up to problems",
        "Been feeling unhappy or depressed",
        "Been losing confidence in yourself",
        "Been thinking of yourself as a worthless person",
        "Been feeling reasonably happy, all things considered"
    ]

    const assessments = {
        phq9: {
            name: "PHQ-9",
            title: "Depression Screening",
            description: "Patient Health Questionnaire-9 for depression screening",
            questions: phq9Questions,
            timeframe: "Over the last 2 weeks, how often have you been bothered by:",
            options: [
                { value: 0, label: "Not at all" },
                { value: 1, label: "Several days" },
                { value: 2, label: "More than half the days" },
                { value: 3, label: "Nearly every day" }
            ],
            scoring: {
                "0-4": { level: "Minimal", color: "text-green-600", description: "Minimal depression symptoms" },
                "5-9": { level: "Mild", color: "text-yellow-600", description: "Mild depression symptoms" },
                "10-14": { level: "Moderate", color: "text-orange-600", description: "Moderate depression symptoms" },
                "15-19": { level: "Moderately Severe", color: "text-red-600", description: "Moderately severe depression symptoms" },
                "20-27": { level: "Severe", color: "text-red-800", description: "Severe depression symptoms" }
            }
        },
        gad7: {
            name: "GAD-7",
            title: "Anxiety Screening",
            description: "Generalized Anxiety Disorder 7-item scale",
            questions: gad7Questions,
            timeframe: "Over the last 2 weeks, how often have you been bothered by:",
            options: [
                { value: 0, label: "Not at all" },
                { value: 1, label: "Several days" },
                { value: 2, label: "More than half the days" },
                { value: 3, label: "Nearly every day" }
            ],
            scoring: {
                "0-4": { level: "Minimal", color: "text-green-600", description: "Minimal anxiety symptoms" },
                "5-9": { level: "Mild", color: "text-yellow-600", description: "Mild anxiety symptoms" },
                "10-14": { level: "Moderate", color: "text-orange-600", description: "Moderate anxiety symptoms" },
                "15-21": { level: "Severe", color: "text-red-600", description: "Severe anxiety symptoms" }
            }
        },
        ghq12: {
            name: "GHQ-12",
            title: "General Health Screening",
            description: "General Health Questionnaire for overall psychological wellbeing",
            questions: ghq12Questions,
            timeframe: "Have you recently:",
            options: [
                { value: 0, label: "Better than usual" },
                { value: 1, label: "Same as usual" },
                { value: 2, label: "Less than usual" },
                { value: 3, label: "Much less than usual" }
            ],
            scoring: {
                "0-15": { level: "Good", color: "text-green-600", description: "Good psychological wellbeing" },
                "16-20": { level: "Mild Distress", color: "text-yellow-600", description: "Mild psychological distress" },
                "21-25": { level: "Moderate Distress", color: "text-orange-600", description: "Moderate psychological distress" },
                "26-36": { level: "Severe Distress", color: "text-red-600", description: "Severe psychological distress" }
            }
        }
    }

    useEffect(() => {
        checkAuthStatus()
        loadAssessmentHistory()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/users/me')
            const data = await response.json()
            if (data.user) {
                setUser(data.user)
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
        }
    }

    const loadAssessmentHistory = () => {
        // Mock assessment history
        const mockHistory = [
            {
                id: 1,
                type: "PHQ-9",
                score: 8,
                level: "Mild",
                date: "2025-09-15",
                timestamp: "3 days ago"
            },
            {
                id: 2,
                type: "GAD-7",
                score: 12,
                level: "Moderate",
                date: "2025-09-10",
                timestamp: "1 week ago"
            }
        ]
        setAssessmentHistory(mockHistory)
    }

    const startAssessment = (assessmentType) => {
        setCurrentAssessment(assessmentType)
        setCurrentQuestion(0)
        setResponses({})
        setResults(null)
    }

    const handleResponse = (value) => {
        setResponses(prev => ({
            ...prev,
            [currentQuestion]: value
        }))
    }

    const nextQuestion = () => {
        if (currentQuestion < assessments[currentAssessment].questions.length - 1) {
            setCurrentQuestion(prev => prev + 1)
        } else {
            calculateResults()
        }
    }

    const previousQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1)
        }
    }

    const calculateResults = () => {
        const assessment = assessments[currentAssessment]
        const totalScore = Object.values(responses).reduce((sum, value) => sum + value, 0)
        
        let resultCategory = null
        for (const [range, details] of Object.entries(assessment.scoring)) {
            const [min, max] = range.split('-').map(Number)
            if (totalScore >= min && totalScore <= max) {
                resultCategory = details
                break
            }
        }

        const result = {
            assessmentType: currentAssessment,
            assessmentName: assessment.name,
            score: totalScore,
            maxScore: assessment.questions.length * (assessment.options.length - 1),
            category: resultCategory,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toLocaleString()
        }

        setResults(result)
        
        // Add to history
        setAssessmentHistory(prev => [
            {
                id: prev.length + 1,
                type: assessment.name,
                score: totalScore,
                level: resultCategory.level,
                date: result.date,
                timestamp: "Just now"
            },
            ...prev
        ])
    }

    const resetAssessment = () => {
        setCurrentAssessment(null)
        setCurrentQuestion(0)
        setResponses({})
        setResults(null)
    }

    if (currentAssessment && !results) {
        const assessment = assessments[currentAssessment]
        const progress = ((currentQuestion + 1) / assessment.questions.length) * 100

        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <Card className="p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-2xl font-bold">{assessment.title}</h1>
                                <Button variant="outline" onClick={resetAssessment}>
                                    Exit Assessment
                                </Button>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Question {currentQuestion + 1} of {assessment.questions.length}
                            </p>
                        </div>

                        {/* Question */}
                        <div className="mb-8">
                            <p className="text-lg mb-2">{assessment.timeframe}</p>
                            <h2 className="text-xl font-semibold mb-6">
                                {assessment.questions[currentQuestion]}
                            </h2>

                            <div className="space-y-3">
                                {assessment.options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleResponse(option.value)}
                                        className={`w-full p-4 text-left border rounded-lg transition-colors ${
                                            responses[currentQuestion] === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                                responses[currentQuestion] === option.value
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                            }`}>
                                                {responses[currentQuestion] === option.value && (
                                                    <div className="w-full h-full bg-white rounded-full transform scale-50"></div>
                                                )}
                                            </div>
                                            <span>{option.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={previousQuestion}
                                disabled={currentQuestion === 0}
                                className="flex items-center gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                onClick={nextQuestion}
                                disabled={responses[currentQuestion] === undefined}
                                className="flex items-center gap-2"
                            >
                                {currentQuestion === assessment.questions.length - 1 ? 'Finish' : 'Next'}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    if (results) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <Card className="p-8">
                        <div className="text-center mb-8">
                            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold mb-2">Assessment Complete</h1>
                            <p className="text-muted-foreground">
                                {results.assessmentName} - {results.timestamp}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 mb-8">
                            <div className="text-center">
                                <div className="text-4xl font-bold mb-2">
                                    {results.score}/{results.maxScore}
                                </div>
                                <div className={`text-xl font-semibold mb-2 ${results.category.color}`}>
                                    {results.category.level}
                                </div>
                                <p className="text-muted-foreground">
                                    {results.category.description}
                                </p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-yellow-800 mb-2">Important Note</h3>
                                    <p className="text-sm text-yellow-700">
                                        This screening tool is for informational purposes only and is not a substitute 
                                        for professional medical advice, diagnosis, or treatment. Please consult with 
                                        a qualified healthcare provider for proper evaluation and care.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Button onClick={resetAssessment}>
                                Take Another Assessment
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/consult'}>
                                Consult a Professional
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center">
                        <Brain className="mx-auto h-16 w-16 mb-4" />
                        <h1 className="text-4xl font-bold mb-4">Mood Assessment</h1>
                        <p className="text-xl text-purple-100 max-w-3xl mx-auto">
                            Professional psychological screening tools to help assess your mental health. 
                            Take validated assessments used by healthcare professionals worldwide.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Important Disclaimer */}
                <Card className="mb-8 p-6 bg-red-50 border-red-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                            <h2 className="text-lg font-semibold mb-2 text-red-900">Medical Disclaimer</h2>
                            <p className="text-sm text-red-800">
                                These screening tools are for educational and informational purposes only. 
                                They are not intended to replace professional medical advice, diagnosis, or treatment. 
                                If you are experiencing a mental health emergency, please contact emergency services 
                                or a crisis hotline immediately.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Assessment Options */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {Object.entries(assessments).map(([key, assessment]) => (
                        <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">{assessment.name}</h3>
                                <h4 className="text-lg text-muted-foreground mb-3">{assessment.title}</h4>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {assessment.description}
                                </p>
                                <div className="text-sm text-muted-foreground mb-4">
                                    {assessment.questions.length} questions • 5-10 minutes
                                </div>
                                <Button 
                                    onClick={() => startAssessment(key)}
                                    className="w-full"
                                >
                                    Start Assessment
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Assessment History */}
                {assessmentHistory.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Assessment History</h2>
                        <div className="space-y-4">
                            {assessmentHistory.map((assessment) => (
                                <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-semibold">{assessment.type}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Score: {assessment.score} • Level: {assessment.level}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">{assessment.timestamp}</p>
                                        <p className="text-xs text-muted-foreground">{assessment.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Additional Resources */}
                <Card className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-medium mb-2">Professional Help</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Connect with licensed mental health professionals for personalized care.
                            </p>
                            <Button variant="outline" size="sm">
                                Find a Therapist
                            </Button>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">Crisis Support</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Immediate help is available 24/7 if you're in crisis.
                            </p>
                            <Button variant="outline" size="sm">
                                Crisis Resources
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}