'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageCircle, Heart, Users, PlusCircle, Clock, User } from 'lucide-react'

export default function PeerForum() {
    const [user, setUser] = useState(null)
    const [posts, setPosts] = useState([])
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' })
    const [isCreating, setIsCreating] = useState(false)

    // Mock data for demonstration
    const mockPosts = [
        {
            id: 1,
            title: "Dealing with exam anxiety",
            content: "I've been struggling with severe anxiety before exams. Any tips or strategies that have worked for you?",
            author: "Anonymous User",
            category: "anxiety",
            replies: 12,
            likes: 8,
            timestamp: "2 hours ago",
            isAnonymous: true
        },
        {
            id: 2,
            title: "Meditation helped me through depression",
            content: "Just wanted to share that daily meditation practice really helped me manage my depression symptoms. Happy to share resources!",
            author: "HopefulSoul",
            category: "depression",
            replies: 5,
            likes: 15,
            timestamp: "5 hours ago",
            isAnonymous: false
        },
        {
            id: 3,
            title: "Support group meetup ideas?",
            content: "Looking to organize local peer support meetings. What activities or formats work best for group sessions?",
            author: "CommunityBuilder",
            category: "support",
            replies: 7,
            likes: 11,
            timestamp: "1 day ago",
            isAnonymous: false
        }
    ]

    useEffect(() => {
        // Check authentication status
        checkAuthStatus()
        setPosts(mockPosts)
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

    const handleCreatePost = () => {
        if (!newPost.title.trim() || !newPost.content.trim()) return

        const post = {
            id: posts.length + 1,
            title: newPost.title,
            content: newPost.content,
            author: user ? user.name : "Anonymous User",
            category: newPost.category,
            replies: 0,
            likes: 0,
            timestamp: "Just now",
            isAnonymous: !user
        }

        setPosts([post, ...posts])
        setNewPost({ title: '', content: '', category: 'general' })
        setIsCreating(false)
    }

    const categories = [
        { value: 'general', label: 'General Discussion' },
        { value: 'anxiety', label: 'Anxiety Support' },
        { value: 'depression', label: 'Depression Support' },
        { value: 'stress', label: 'Stress Management' },
        { value: 'relationships', label: 'Relationships' },
        { value: 'success', label: 'Success Stories' },
        { value: 'support', label: 'Peer Support' }
    ]

    const getCategoryColor = (category) => {
        const colors = {
            general: 'bg-blue-100 text-blue-800',
            anxiety: 'bg-red-100 text-red-800',
            depression: 'bg-purple-100 text-purple-800',
            stress: 'bg-orange-100 text-orange-800',
            relationships: 'bg-pink-100 text-pink-800',
            success: 'bg-green-100 text-green-800',
            support: 'bg-yellow-100 text-yellow-800'
        }
        return colors[category] || colors.general
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center">
                        <Users className="mx-auto h-16 w-16 mb-4" />
                        <h1 className="text-4xl font-bold mb-4">Peer Forum</h1>
                        <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                            Connect with others who understand your journey. Share experiences, 
                            offer support, and find strength in community.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Community Guidelines */}
                <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
                    <h2 className="text-lg font-semibold mb-4 text-blue-900">Community Guidelines</h2>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• Be respectful and supportive to all community members</li>
                        <li>• Share experiences without giving medical advice</li>
                        <li>• Maintain confidentiality and respect privacy</li>
                        <li>• Report any concerning content to moderators</li>
                        <li>• Remember: This is peer support, not professional therapy</li>
                    </ul>
                </Card>

                {/* Create New Post */}
                <Card className="mb-8 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Share Your Experience</h2>
                        <Button
                            onClick={() => setIsCreating(!isCreating)}
                            className="flex items-center gap-2"
                        >
                            <PlusCircle className="h-4 w-4" />
                            New Post
                        </Button>
                    </div>

                    {isCreating && (
                        <div className="space-y-4 border-t pt-4">
                            <Input
                                placeholder="Post title..."
                                value={newPost.title}
                                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                            />
                            
                            <select
                                className="w-full p-2 border rounded-md"
                                value={newPost.category}
                                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>

                            <textarea
                                placeholder="Share your thoughts, experiences, or questions..."
                                className="w-full p-3 border rounded-md h-32 resize-none"
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            />

                            <div className="flex gap-2">
                                <Button onClick={handleCreatePost}>
                                    Post
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Posts List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">Recent Discussions</h2>
                    
                    {posts.map((post) => (
                        <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                                            {categories.find(cat => cat.value === post.category)?.label}
                                        </span>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {post.timestamp}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                                    <p className="text-muted-foreground mb-4">{post.content}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    {post.author}
                                    {post.isAnonymous && <span className="text-xs">(Anonymous)</span>}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-600 transition-colors">
                                        <Heart className="h-4 w-4" />
                                        {post.likes}
                                    </button>
                                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                                        <MessageCircle className="h-4 w-4" />
                                        {post.replies} replies
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Help Resources */}
                <Card className="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50">
                    <h2 className="text-xl font-semibold mb-4">Need Professional Help?</h2>
                    <p className="text-muted-foreground mb-4">
                        While peer support is valuable, professional help is sometimes necessary. 
                        If you're experiencing crisis or severe symptoms, please reach out to:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium">Crisis Hotlines:</h3>
                            <p className="text-sm text-muted-foreground">
                                National Suicide Prevention Lifeline: 988<br />
                                Crisis Text Line: Text HOME to 741741
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium">Professional Support:</h3>
                            <Button variant="outline" size="sm" className="mt-2">
                                Find a Therapist
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}