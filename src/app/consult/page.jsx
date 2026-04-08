'use client' 

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const ConsultPage = () => {
  const router = useRouter()
  const [sessionData, setSessionData] = useState(null)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! Welcome to your anonymous counseling session. I\'m here to listen and support you. How are you feeling today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    // Check for session token
    const token = localStorage.getItem('anonymousSessionToken')
    const expiresAt = localStorage.getItem('sessionExpiresAt')
    
    if (!token || !expiresAt) {
      // No session found, redirect to anonymous session creation
      router.push('/anonymous-session')
      return
    }

    // Check if session is expired
    const now = new Date()
    const sessionExpiry = new Date(expiresAt)
    
    if (now > sessionExpiry) {
      // Session expired, clean up and redirect
      localStorage.removeItem('anonymousSessionToken')
      localStorage.removeItem('sessionExpiresAt')
      router.push('/anonymous-session')
      return
    }

    setSessionData({ token, expiresAt })
  }, [router])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.type === 'bot' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, userContext: { sessionId: sessionData.token } }),
      });

      const data = await response.json();
      
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: data.content || data.response || "I'm here to support you. Could you tell me more about what you're experiencing?",
        isCrisis: data.metadata?.riskLevel === 'high',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        type: 'bot',
        content: "I'm having trouble connecting right now. If you're in crisis, please immediately contact emergency services or text 988.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const endSession = () => {
    localStorage.removeItem('anonymousSessionToken')
    localStorage.removeItem('sessionExpiresAt')
    router.push('/landing')
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Anonymous Counseling Session
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Secure & Confidential
            </p>
          </div>
          <Button 
            onClick={endSession}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-120px)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.isCrisis && (<div className="mb-2 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-lg"><p className="text-red-800 dark:text-red-200 font-bold text-xs uppercase tracking-wider mb-1">priority safety alert</p><p className="text-red-700 dark:text-red-300 text-sm">You are not alone. Please reach out to the National Suicide Prevention Lifeline at <strong>988</strong> immediately. They are available 24/7. We strongly encourage you to talk to a trusted friend or counselor right now.</p></div>)}<p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows="2"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This is a safe space. Your conversation is anonymous and confidential.
          </p>
        </div>
      </div>

      {/* Emergency Resources */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Crisis Support:</strong> If you're having thoughts of self-harm, please contact emergency services (911) or 
            text HOME to 741741 for immediate crisis support.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConsultPage