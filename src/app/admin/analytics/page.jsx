'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    activeSessions: 0,
    appointmentsToday: 0,
    moodTrends: [],
    resourceUsage: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Mock data - replace with actual API call
      setAnalytics({
        totalStudents: 1247,
        activeSessions: 23,
        appointmentsToday: 8,
        moodTrends: [
          { mood: 'Happy', count: 45, percentage: 35 },
          { mood: 'Neutral', count: 52, percentage: 40 },
          { mood: 'Stressed', count: 25, percentage: 20 },
          { mood: 'Anxious', count: 6, percentage: 5 },
        ],
        resourceUsage: [
          { resource: 'AI Chatbot', usage: 89 },
          { resource: 'Anonymous Sessions', usage: 67 },
          { resource: 'Peer Forum', usage: 45 },
          { resource: 'Therapist Bookings', usage: 34 },
        ]
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/admin" className="text-blue-600 hover:text-blue-500 text-sm">
                ← Back to Admin Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">Analytics Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.totalStudents.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Sessions</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.activeSessions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Appointments Today</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.appointmentsToday}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Mood Trends */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Student Mood Trends</h3>
                <div className="space-y-4">
                  {analytics.moodTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          trend.mood === 'Happy' ? 'bg-green-500' :
                          trend.mood === 'Neutral' ? 'bg-blue-500' :
                          trend.mood === 'Stressed' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">{trend.mood}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{trend.count} students</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              trend.mood === 'Happy' ? 'bg-green-500' :
                              trend.mood === 'Neutral' ? 'bg-blue-500' :
                              trend.mood === 'Stressed' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${trend.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{trend.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Resource Usage</h3>
                <div className="space-y-4">
                  {analytics.resourceUsage.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{resource.resource}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${resource.usage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{resource.usage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">New anonymous session started</span>
                  <span className="ml-auto text-gray-400">2 minutes ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Therapist appointment booked</span>
                  <span className="ml-auto text-gray-400">5 minutes ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">New forum post in "Stress Management"</span>
                  <span className="ml-auto text-gray-400">12 minutes ago</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}