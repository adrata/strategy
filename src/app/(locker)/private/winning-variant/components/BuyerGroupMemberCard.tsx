"use client";

import React, { useState } from 'react';

interface BuyerGroupMemberCardProps {
  member: {
    name: string;
    title: string;
    role: 'Decision Maker' | 'Champion' | 'Stakeholder' | 'Blocker' | 'Introducer';
    archetype: {
      id: string;
      name: string;
      role: string;
      description: string;
      characteristics: {
        motivations: string[];
        concerns: string[];
        decisionMakingStyle: string;
        communicationStyle: string;
        keyNeeds: string[];
      };
    };
    personalizedStrategy: {
      situation: string;
      complication: string;
      futureState: string;
    };
    contactInfo: {
      email?: string;
      phone?: string;
      linkedin?: string;
    };
    influenceScore: number;
    confidence: number;
  };
}

export function BuyerGroupMemberCard({ member }: BuyerGroupMemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Decision Maker': return 'bg-red-100 text-red-800 border-red-200';
      case 'Champion': return 'bg-green-100 text-green-800 border-green-200';
      case 'Stakeholder': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Blocker': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Introducer': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInfluenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
              {member.role}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{member.title}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className={`font-medium ${getInfluenceColor(member.influenceScore)}`}>
              Influence: {member.influenceScore}%
            </span>
            <span>Confidence: {member.confidence}%</span>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Archetype Badge */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
          {member.archetype.name}
        </div>
        <p className="text-xs text-gray-600 mt-1">{member.archetype.description}</p>
      </div>

      {/* Contact Information */}
      <div className="flex items-center gap-4 mb-4">
        {member.contactInfo.email && (
          <a 
            href={`mailto:${member.contactInfo.email}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </a>
        )}
        {member.contactInfo.linkedin && (
          <a 
            href={member.contactInfo.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
        )}
        {member.contactInfo.phone && (
          <a 
            href={`tel:${member.contactInfo.phone}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone
          </a>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Personalized Strategy */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Personalized Strategy</h4>
            <div className="space-y-3">
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-1">Situation</h5>
                <p className="text-sm text-gray-600">{member.personalizedStrategy.situation}</p>
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-1">Complication</h5>
                <p className="text-sm text-gray-600">{member.personalizedStrategy.complication}</p>
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-1">Future State</h5>
                <p className="text-sm text-gray-600">{member.personalizedStrategy.futureState}</p>
              </div>
            </div>
          </div>

          {/* Archetype Characteristics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Archetype Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-2">Motivations</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {member.archetype.characteristics.motivations.map((motivation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                      {motivation}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-2">Key Needs</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {member.archetype.characteristics.keyNeeds.map((need, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      {need}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Communication Style */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Communication Style</h4>
            <p className="text-sm text-gray-600 mb-2">{member.archetype.characteristics.communicationStyle}</p>
            <h5 className="text-xs font-medium text-gray-700 mb-1">Decision Making Style</h5>
            <p className="text-sm text-gray-600">{member.archetype.characteristics.decisionMakingStyle}</p>
          </div>
        </div>
      )}
    </div>
  );
}
