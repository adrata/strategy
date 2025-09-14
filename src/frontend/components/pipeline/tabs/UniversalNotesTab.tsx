"use client";

import React, { useState } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalNotesTabProps {
  recordType: string;
  record?: any;
}

export function UniversalNotesTab({ recordType, record: recordProp }: UniversalNotesTabProps) {
  const { record: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');

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
    const sarahNotes = [
      {
        id: 1,
        category: 'meeting',
        title: 'Initial Discovery Call Notes',
        content: 'Sarah is very interested in AI-powered HR solutions. Currently evaluating 3 vendors for HR technology upgrade. Decision timeline: Q2 2024. Budget: $2M+ for comprehensive HR platform. Key concern: Data security and compliance. Prefers vendor with strong implementation support.',
        author: 'Sales Team',
        date: '2024-01-15',
        tags: ['discovery', 'budget', 'timeline']
      },
      {
        id: 2,
        category: 'conference',
        title: 'HR Technology Conference Meeting',
        content: 'Met Sarah at HR Technology Conference. Discussed current challenges with manual processes and need for better analytics. She mentioned that ADP is looking to modernize their HR tech stack and is particularly interested in workforce analytics and employee engagement tools.',
        author: 'Conference Team',
        date: '2024-01-05',
        tags: ['conference', 'pain-points', 'analytics']
      },
      {
        id: 3,
        category: 'follow-up',
        title: 'Follow-up Email Response',
        content: 'Sarah responded positively to our follow-up email. She requested a technical demo and mentioned that she will be involving her IT team in the evaluation process. She emphasized the importance of data security and compliance features.',
        author: 'Sales Team',
        date: '2024-01-10',
        tags: ['follow-up', 'demo', 'security']
      },
      {
        id: 4,
        category: 'competitive',
        title: 'Competitive Landscape',
        content: 'Sarah mentioned they are also evaluating Workday and Oracle HCM. Our key differentiators should be: 1) Superior AI-powered analytics, 2) Better user experience, 3) Stronger implementation support, 4) Competitive pricing. She values vendor relationships and long-term partnerships.',
        author: 'Sales Team',
        date: '2024-01-12',
        tags: ['competition', 'differentiators', 'partnership']
      }
    ];
    
    return (
      <div className="p-6 space-y-6">
        {/* Notes List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Observations</h3>
          <div className="space-y-4">
            {sarahNotes.map((note) => (
              <div key={note.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{note.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{note.date}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{note.author}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{note.content}</p>
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Decision Factors</h4>
              <ul className="space-y-1">
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Data security and compliance
                </li>
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Implementation support quality
                </li>
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  AI-powered analytics capabilities
                </li>
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  User experience and adoption
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
              <ul className="space-y-1">
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Schedule technical demo
                </li>
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Include IT team in evaluation
                </li>
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Prepare security compliance documentation
                </li>
                <li className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Develop implementation timeline
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mock notes data for demo
  const notesData = [
    {
      id: 1,
      category: 'meeting',
      title: 'Initial Discovery Call',
      content: 'Had a great initial call with Sarah. She expressed strong interest in our solution and mentioned that they are looking to modernize their current HR systems. Key pain points identified: manual reporting processes, lack of real-time insights, and integration challenges with existing systems.',
      author: 'Kirk Harbaugh',
      date: '2024-01-15T10:30:00Z',
      tags: ['discovery', 'pain-points', 'integration'],
      priority: 'high'
    },
    {
      id: 2,
      category: 'follow-up',
      title: 'Follow-up on Technical Requirements',
      content: 'Sarah requested additional technical documentation and mentioned they need to ensure compliance with SOC 2 and GDPR requirements. She also asked about our integration capabilities with their existing Oracle systems.',
      author: 'Kirk Harbaugh',
      date: '2024-01-16T14:15:00Z',
      tags: ['technical', 'compliance', 'integration'],
      priority: 'medium'
    },
    {
      id: 3,
      category: 'research',
      title: 'ADP Company Research',
      content: 'ADP is a Fortune 500 company with $15.4B in revenue. They have 58,000 employees globally and are a leader in HR technology. Recent news shows they are expanding their European operations and investing heavily in AI-powered analytics.',
      author: 'Kirk Harbaugh',
      date: '2024-01-17T09:45:00Z',
      tags: ['research', 'company-info', 'market'],
      priority: 'low'
    },
    {
      id: 4,
      category: 'strategy',
      title: 'Engagement Strategy',
      content: 'Based on our discovery, Sarah is a decision maker with high influence. She responds well to data-driven approaches and values efficiency. Next steps: schedule technical demo, provide case studies, and arrange reference calls with similar enterprise customers.',
      author: 'Kirk Harbaugh',
      date: '2024-01-18T16:20:00Z',
      tags: ['strategy', 'next-steps', 'engagement'],
      priority: 'high'
    },
    {
      id: 5,
      category: 'competition',
      title: 'Competitive Landscape',
      content: 'ADP is also evaluating Workday and Oracle HCM. Our key differentiators: better integration capabilities, more flexible pricing, and superior customer support. Need to emphasize these points in our next presentation.',
      author: 'Kirk Harbaugh',
      date: '2024-01-19T11:30:00Z',
      tags: ['competition', 'differentiators', 'positioning'],
      priority: 'high'
    }
  ];

  const categories = [
    { id: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
    { id: 'meeting', label: 'Meeting', color: 'bg-blue-100 text-blue-800' },
    { id: 'follow-up', label: 'Follow-up', color: 'bg-green-100 text-green-800' },
    { id: 'research', label: 'Research', color: 'bg-purple-100 text-purple-800' },
    { id: 'strategy', label: 'Strategy', color: 'bg-orange-100 text-orange-800' },
    { id: 'competition', label: 'Competition', color: 'bg-red-100 text-red-800' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c['id'] === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In a real app, this would save to the backend
      console.log('Adding new note:', { content: newNote, category: selectedCategory });
      setNewNote('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Add New Note */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Note</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleAddNote}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes History</h3>
        <div className="space-y-4">
          {notesData.map((note) => (
            <div key={note.id} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(note.category)}`}>
                    {categories.find(c => c['id'] === note.category)?.label}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(note.priority)}`}>
                    {note.priority.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(note.date).toLocaleDateString()} at {new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-2">{note.title}</h4>
              <p className="text-sm text-gray-700 mb-3">{note.content}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {note.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{note.author}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
            <div className="text-sm font-medium text-blue-900">Schedule Meeting</div>
            <div className="text-xs text-blue-600">Book time with Sarah</div>
          </button>
          
          <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
            <div className="text-sm font-medium text-green-900">Send Follow-up</div>
            <div className="text-xs text-green-600">Email or call</div>
          </button>
          
          <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
            <div className="text-sm font-medium text-purple-900">Research Company</div>
            <div className="text-xs text-purple-600">Latest news & updates</div>
          </button>
          
          <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors">
            <div className="text-sm font-medium text-orange-900">Update Strategy</div>
            <div className="text-xs text-orange-600">Engagement plan</div>
          </button>
        </div>
      </div>

      {/* Note Statistics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Note Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{notesData.length}</div>
            <div className="text-sm text-gray-600">Total Notes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {notesData.filter(n => n['category'] === 'meeting').length}
            </div>
            <div className="text-sm text-gray-600">Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {notesData.filter(n => n['category'] === 'follow-up').length}
            </div>
            <div className="text-sm text-gray-600">Follow-ups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {notesData.filter(n => n['priority'] === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
        </div>
      </div>
    </div>
  );
}