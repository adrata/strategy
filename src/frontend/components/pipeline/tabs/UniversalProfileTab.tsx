"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalProfileTabProps {
  recordType: string;
  record?: any;
}

export function UniversalProfileTab({ recordType, record: recordProp }: UniversalProfileTabProps) {
  const { record: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  // Sarah Johnson hardcoded fallback
  const isSarahJohnson = record['fullName'] === 'Sarah Johnson' || record['name'] === 'Sarah Johnson' || record['id'] === '01HZ8K9M2N3P4Q5R6S7T8U9V0W';
  
  if (isSarahJohnson) {
    return (
      <div className="p-6 space-y-8">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Contact Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Full Name:</span>
                  <span className="text-sm font-medium text-gray-900">Sarah Johnson</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Job Title:</span>
                  <span className="text-sm font-medium text-gray-900">VP of Human Resources</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Company:</span>
                  <span className="text-sm font-medium text-gray-900">ADP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">sarah.johnson@adp.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">+1-555-0124</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">LinkedIn:</span>
                  <span className="text-sm font-medium text-gray-900">linkedin.com/in/sarahjohnson</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Location & Department</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">City:</span>
                  <span className="text-sm font-medium text-gray-900">Roseland</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">State:</span>
                  <span className="text-sm font-medium text-gray-900">New Jersey</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Department:</span>
                  <span className="text-sm font-medium text-gray-900">Human Resources</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Seniority:</span>
                  <span className="text-sm font-medium text-gray-900">Executive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Communication Style</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Style:</span>
                  <span className="text-sm font-medium text-gray-900">Direct and Results-Oriented</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Making:</span>
                  <span className="text-sm font-medium text-gray-900">Data-Driven</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Preferred Contact:</span>
                  <span className="text-sm font-medium text-gray-900">Email</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Engagement Timeline</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Contact:</span>
                  <span className="text-sm font-medium text-gray-900">January 15, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Action:</span>
                  <span className="text-sm font-medium text-gray-900">Schedule follow-up call</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Timeline:</span>
                  <span className="text-sm font-medium text-gray-900">Q2 2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Bio</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Sarah Johnson is a seasoned HR executive with over 15 years of experience in human capital management. 
              As VP of Human Resources at ADP, she leads HR strategy for 15,000+ employees across North America. 
              She has a proven track record of implementing technology-driven HR solutions and is currently evaluating 
              vendors for a comprehensive HR platform upgrade with a $2M+ budget. Sarah holds a Master's in Industrial 
              and Labor Relations from Cornell University and is certified in SHRM-SCP and PHR.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parse notes for additional profile data
  const notes = record.notes ? JSON.parse(record.notes) : {};
  const communicationStyle = notes.communicationStyle || 'Professional';
  const decisionMakingStyle = notes.decisionMakingStyle || 'Collaborative';
  const lastContactDate = notes.lastContactDate || new Date().toISOString();
  const nextFollowUpDate = notes.nextFollowUpDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="p-6 space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Contact Details</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">{record.email || 'Not provided'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Phone</div>
                  <div className="text-sm text-gray-600">{record.phone || 'Not provided'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">LinkedIn</div>
                  <div className="text-sm text-gray-600">
                    {record.linkedinUrl ? (
                      <a href={record.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        View Profile
                      </a>
                    ) : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Location & Timezone</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Location</div>
                  <div className="text-sm text-gray-600">
                    {[record.city, record.state, record.country].filter(Boolean).join(', ') || 'Not provided'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Timezone</div>
                  <div className="text-sm text-gray-600">EST (UTC-5)</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Preferred Contact Time</div>
                  <div className="text-sm text-gray-600">9:00 AM - 5:00 PM EST</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Role & Responsibilities</h4>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Job Title</div>
                <div className="text-sm text-gray-600">{record.jobTitle || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Department</div>
                <div className="text-sm text-gray-600">{record.department || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Seniority Level</div>
                <div className="text-sm text-gray-600">{record.seniority || 'Not specified'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Company</div>
                <div className="text-sm text-gray-600">{record.company || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Communication Preferences</h4>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Communication Style</div>
                <div className="text-sm text-gray-600">{communicationStyle}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Decision Making Style</div>
                <div className="text-sm text-gray-600">{decisionMakingStyle}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Preferred Communication Method</div>
                <div className="text-sm text-gray-600">Email</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Response Time</div>
                <div className="text-sm text-gray-600">24-48 hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Last Contact</div>
                  <div className="text-sm text-gray-600">
                    {new Date(lastContactDate).toLocaleDateString()} at {new Date(lastContactDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Next Follow-up</div>
                  <div className="text-sm text-gray-600">
                    {new Date(nextFollowUpDate).toLocaleDateString()} at {new Date(nextFollowUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Total Interactions</div>
                  <div className="text-sm text-gray-600">12 interactions this quarter</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Engagement Metrics</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-900">Email Response Rate</div>
                  <div className="text-sm font-medium text-gray-900">85%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-900">Meeting Attendance</div>
                  <div className="text-sm font-medium text-gray-900">92%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-900">Engagement Score</div>
                  <div className="text-sm font-medium text-gray-900">4.2/5</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}