'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const AnonymousSessionForm = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    ageRange: '',
    academicYear: '',
    preferredLanguage: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const ageRanges = [
    { value: '13-15', label: '13-15 years' },
    { value: '16-18', label: '16-18 years' },
    { value: '19-21', label: '19-21 years' },
    { value: '22-25', label: '22-25 years' },
    { value: '25+', label: '25+ years' }
  ]

  const academicYears = [
    { value: 'high-school', label: 'High School' },
    { value: 'freshman', label: 'Freshman (1st Year)' },
    { value: 'sophomore', label: 'Sophomore (2nd Year)' },
    { value: 'junior', label: 'Junior (3rd Year)' },
    { value: 'senior', label: 'Senior (4th Year)' },
    { value: 'graduate', label: 'Graduate Student' },
    { value: 'postgraduate', label: 'Postgraduate' }
  ]

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'marathi', label: 'Marathi' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'kannada', label: 'Kannada' },
    { value: 'malayalam', label: 'Malayalam' },
    { value: 'punjabi', label: 'Punjabi' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.ageRange || !formData.academicYear || !formData.preferredLanguage) {
      setError('Please fill in all required fields.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sessions/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        // Try to get error message from response
        const responseText = await response.text()
        let errorMessage = 'Failed to create session'
        
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      // Parse successful response
      const responseText = await response.text()
      const data = JSON.parse(responseText)
      
      // Validate response has required fields
      if (!data.sessionToken || !data.expiresAt) {
        throw new Error('Invalid response: missing session data')
      }
      
      // Store session token in localStorage for later use
      localStorage.setItem('anonymousSessionToken', data.sessionToken)
      localStorage.setItem('sessionExpiresAt', data.expiresAt)
      
      // Redirect to consult page
      router.push('/consult')
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Get Help Anonymously
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Start your anonymous counseling session. We only need a few details to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age Range <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.ageRange}
              onChange={(e) => handleInputChange('ageRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select your age range</option>
              {ageRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Academic Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.academicYear}
              onChange={(e) => handleInputChange('academicYear', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select your academic level</option>
              {academicYears.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Language <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select your preferred language</option>
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating Session...
              </div>
            ) : (
              'Start Anonymous Session'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your privacy is our priority. This session is completely anonymous and secure.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AnonymousSessionForm