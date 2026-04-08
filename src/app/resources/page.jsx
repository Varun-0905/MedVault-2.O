'use client'
import React from 'react'
import { HeroHeader } from '@/components/header'
import FooterSection from '@/components/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const ResourcesPage = () => {
    const resourceCategories = [
        {
            title: "Stress Management",
            icon: "🧠",
            color: "blue",
            description: "Learn effective techniques to identify, understand, and manage academic and personal stress.",
            resources: [
                {
                    title: "Progressive Muscle Relaxation Guide",
                    type: "Video",
                    duration: "15 min",
                    description: "Step-by-step guide to relieve physical tension and mental stress."
                },
                {
                    title: "Breathing Exercises for Anxiety",
                    type: "Audio",
                    duration: "10 min",
                    description: "Guided breathing techniques for immediate stress relief."
                },
                {
                    title: "Time Management Workbook",
                    type: "PDF",
                    pages: "24 pages",
                    description: "Practical strategies for managing academic workload effectively."
                },
                {
                    title: "Mindfulness for Students",
                    type: "Article",
                    readTime: "8 min",
                    description: "Introduction to mindfulness practices for daily stress reduction."
                }
            ]
        },
        {
            title: "Anxiety & Depression",
            icon: "💚",
            color: "green",
            description: "Understand the signs, symptoms, and effective strategies for managing anxiety and depression.",
            resources: [
                {
                    title: "Understanding Anxiety Disorders",
                    type: "Article",
                    readTime: "12 min",
                    description: "Comprehensive guide to recognizing and understanding anxiety."
                },
                {
                    title: "Depression Self-Assessment Tool",
                    type: "Interactive",
                    duration: "5 min",
                    description: "Self-screening tool to assess depression symptoms."
                },
                {
                    title: "Cognitive Behavioral Techniques",
                    type: "Video",
                    duration: "20 min",
                    description: "Learn CBT strategies for managing negative thought patterns."
                },
                {
                    title: "Building Support Networks",
                    type: "Guide",
                    readTime: "10 min",
                    description: "How to create and maintain supportive relationships."
                }
            ]
        },
        {
            title: "Academic Wellness",
            icon: "🎯",
            color: "purple",
            description: "Balance academic success with mental well-being through proven strategies and habits.",
            resources: [
                {
                    title: "Study-Life Balance Planner",
                    type: "Tool",
                    duration: "Interactive",
                    description: "Plan your schedule to balance academics and personal life."
                },
                {
                    title: "Dealing with Academic Pressure",
                    type: "Video",
                    duration: "18 min",
                    description: "Strategies for managing exam stress and academic expectations."
                },
                {
                    title: "Goal Setting Framework",
                    type: "Worksheet",
                    pages: "8 pages",
                    description: "SMART goal setting for academic and personal growth."
                },
                {
                    title: "Motivation and Procrastination",
                    type: "Article",
                    readTime: "15 min",
                    description: "Understanding and overcoming procrastination patterns."
                }
            ]
        },
        {
            title: "Relationship Skills",
            icon: "🤝",
            color: "orange",
            description: "Build healthy relationships and communication skills for better social connections.",
            resources: [
                {
                    title: "Effective Communication Guide",
                    type: "eBook",
                    pages: "32 pages",
                    description: "Master the art of clear and empathetic communication."
                },
                {
                    title: "Conflict Resolution Strategies",
                    type: "Video",
                    duration: "25 min",
                    description: "Learn to resolve conflicts constructively and peacefully."
                },
                {
                    title: "Setting Healthy Boundaries",
                    type: "Workshop",
                    duration: "45 min",
                    description: "Interactive workshop on establishing personal boundaries."
                },
                {
                    title: "Building Emotional Intelligence",
                    type: "Course",
                    duration: "2 hours",
                    description: "Develop skills to understand and manage emotions effectively."
                }
            ]
        },
        {
            title: "Work-Life Balance",
            icon: "⚖️",
            color: "yellow",
            description: "Learn to balance academics, work, and personal life for optimal mental health.",
            resources: [
                {
                    title: "Priority Setting Matrix",
                    type: "Tool",
                    duration: "Interactive",
                    description: "Eisenhower Matrix for effective priority management."
                },
                {
                    title: "Self-Care Checklist",
                    type: "Checklist",
                    items: "50 items",
                    description: "Daily and weekly self-care activities for students."
                },
                {
                    title: "Burnout Prevention Guide",
                    type: "Article",
                    readTime: "12 min",
                    description: "Recognize early signs of burnout and prevention strategies."
                },
                {
                    title: "Energy Management Techniques",
                    type: "Video",
                    duration: "16 min",
                    description: "Optimize your energy levels throughout the day."
                }
            ]
        },
        {
            title: "Crisis Resources",
            icon: "🆘",
            color: "red",
            description: "Know when and how to seek help during mental health emergencies and crises.",
            resources: [
                {
                    title: "Crisis Hotline Directory",
                    type: "Directory",
                    updated: "Weekly",
                    description: "24/7 crisis support numbers and online chat services."
                },
                {
                    title: "Emergency Action Plan",
                    type: "Template",
                    pages: "4 pages",
                    description: "Personal safety plan for mental health emergencies."
                },
                {
                    title: "When to Seek Professional Help",
                    type: "Guide",
                    readTime: "8 min",
                    description: "Understand when it's time to reach out for professional support."
                },
                {
                    title: "Campus Mental Health Services",
                    type: "Directory",
                    updated: "Monthly",
                    description: "Find mental health resources available on your campus."
                }
            ]
        }
    ]

    const getColorClasses = (color) => {
        const colorMap = {
            blue: "bg-blue-100 text-blue-600 border-blue-200",
            green: "bg-green-100 text-green-600 border-green-200",
            purple: "bg-purple-100 text-purple-600 border-purple-200",
            orange: "bg-orange-100 text-orange-600 border-orange-200",
            yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
            red: "bg-red-100 text-red-600 border-red-200"
        }
        return colorMap[color] || "bg-gray-100 text-gray-600 border-gray-200"
    }

    return (
        <div className="min-h-screen bg-background">
            <HeroHeader />
            
            {/* Header Section */}
            <section className="pt-24 pb-16 bg-gradient-to-b from-primary/5 to-background">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Mental Health Resource Library
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                            Free, evidence-based mental health resources designed by professionals. 
                            Access comprehensive guides, tools, and support materials anytime, anywhere.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <span className="px-3 py-1 bg-primary/10 rounded-full">✓ No Login Required</span>
                            <span className="px-3 py-1 bg-primary/10 rounded-full">✓ Always Free</span>
                            <span className="px-3 py-1 bg-primary/10 rounded-full">✓ Expert Reviewed</span>
                            <span className="px-3 py-1 bg-primary/10 rounded-full">✓ Multilingual</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Resources Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="space-y-16">
                        {resourceCategories.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="space-y-8">
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${getColorClasses(category.color)}`}>
                                        <span className="text-3xl">{category.icon}</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-4">{category.title}</h2>
                                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                        {category.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {category.resources.map((resource, resourceIndex) => (
                                        <div key={resourceIndex} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getColorClasses(category.color)}`}>
                                                    {resource.type}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {resource.duration || resource.readTime || resource.pages || resource.items || resource.updated}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold mb-2 text-card-foreground">{resource.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                                            <Button size="sm" className="w-full">
                                                Access Resource
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Emergency Resources Section */}
            <section className="py-16 bg-red-50 dark:bg-red-900/10">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 text-red-600">Emergency Mental Health Resources</h2>
                        <p className="text-lg text-muted-foreground">
                            If you're experiencing a mental health emergency, please reach out immediately.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-background border border-red-200 rounded-lg p-6 text-center">
                            <h3 className="font-bold text-lg mb-2">Crisis Text Line</h3>
                            <p className="text-2xl font-bold text-red-600 mb-2">Text HOME to 741741</p>
                            <p className="text-sm text-muted-foreground">Free, 24/7 crisis support via text message</p>
                        </div>
                        <div className="bg-background border border-red-200 rounded-lg p-6 text-center">
                            <h3 className="font-bold text-lg mb-2">National Suicide Prevention Lifeline</h3>
                            <p className="text-2xl font-bold text-red-600 mb-2">988</p>
                            <p className="text-sm text-muted-foreground">Free, confidential support 24/7</p>
                        </div>
                    </div>
                    
                    <div className="text-center mt-8">
                        <p className="text-sm text-muted-foreground mb-4">
                            Remember: Seeking help is a sign of strength, not weakness.
                        </p>
                        <Button asChild variant="outline">
                            <Link href="/consult">
                                Start Anonymous Chat Session
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold mb-6">
                        Need More Personalized Support?
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        While these resources are helpful for everyone, consider creating an account for personalized recommendations and progress tracking.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg">
                            <Link href="/register">
                                Create Free Account
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/anonymous-session">
                                Anonymous Support Session
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    )
}

export default ResourcesPage