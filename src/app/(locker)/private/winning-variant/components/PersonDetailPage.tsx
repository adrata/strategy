"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Linkedin, AlertTriangle, TrendingUp, Target, Users } from 'lucide-react';

interface PersonDetailPageProps {
  person: {
    name: string;
    title: string;
    company: string;
    email: string;
    phone: string;
    linkedin: string;
    archetype: {
      id: string;
      name: string;
      role: string;
      description: string;
    };
    winningVariantStrategy: {
      situation: string;
      complication: string;
      futureState: string;
      keyMessage: string;
      tailoredApproach: string;
    };
    painPoints: string[];
    influenceScore: number;
    confidence: number;
    flightRisk: {
      score: number;
      category: string;
      reasoning: string;
    };
    workHistory?: string[];
    aiInsights?: string[];
    recentMoves?: string[];
    boardPressure?: string[];
    competitiveThreats?: string[];
    budgetAuthority?: string;
    decisionTimeline?: string;
  };
  companySlug: string;
}

export default function PersonDetailPage({ person, companySlug }: PersonDetailPageProps) {
  const getFlightRiskColor = (score: number) => {
    if (score <= 20) return 'text-green-600 bg-green-50';
    if (score <= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getInfluenceColor = (score: number) => {
    if (score >= 90) return 'text-purple-600 bg-purple-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/private/winning-variant/${companySlug}`}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {person.company}
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link 
                href="/private/winning-variant" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Overview
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Person Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">{person.name}</h1>
              <p className="text-lg text-gray-600 mb-1">{person.title}</p>
              <p className="text-sm text-gray-500">{person.company}</p>
            </div>
            
            <div className="flex space-x-3">
              <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {person.influenceScore}% Influence
              </div>
              <div className={`px-3 py-1.5 rounded-md text-sm font-medium ${getFlightRiskColor(person.flightRisk.score)}`}>
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {person.flightRisk.score}% Risk
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a 
              href={`mailto:${person.email}`}
              className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">{person.email}</span>
            </a>
            <a 
              href={`tel:${person.phone}`}
              className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">{person.phone}</span>
            </a>
            <a 
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Linkedin className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">LinkedIn</span>
            </a>
          </div>
        </div>

        {/* Intelligence Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Archetype & Strategy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-gray-600" />
              Buyer Group Archetype
            </h2>
            
            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-1">{person.archetype.name}</h3>
                <p className="text-gray-600 text-sm mb-1">{person.archetype.role}</p>
                <p className="text-gray-600 text-sm">{person.archetype.description}</p>
              </div>
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-3">Winning Variant Strategy</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Situation</h4>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{person.winningVariantStrategy.situation}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Complication</h4>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{person.winningVariantStrategy.complication}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Future State</h4>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{person.winningVariantStrategy.futureState}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Key Message</h4>
                <p className="text-gray-600 text-sm bg-gray-100 p-3 rounded-md border border-gray-200">{person.winningVariantStrategy.keyMessage}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Tailored Approach</h4>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{person.winningVariantStrategy.tailoredApproach}</p>
              </div>
            </div>
          </div>

          {/* Pain Points & Flight Risk */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-gray-600" />
              Pain Points & Risk Analysis
            </h2>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3 text-sm">Current Pain Points</h3>
              <ul className="space-y-2">
                {person.painPoints.map((pain, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2 mt-1">•</span>
                    <span className="text-gray-600 text-sm">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3 text-sm">Flight Risk Analysis</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900">{person.flightRisk.category}</span>
                  <span className="font-semibold text-sm text-gray-900">{person.flightRisk.score}%</span>
                </div>
                <p className="text-sm text-gray-600">{person.flightRisk.reasoning}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3 text-sm">Engagement Confidence</h3>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${person.confidence}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{person.confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Intelligence */}
        {(person.workHistory || person.aiInsights || person.recentMoves || person.boardPressure || person.competitiveThreats) && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-600" />
              Strategic Intelligence
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {person.workHistory && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">Career Trajectory</h3>
                  <ul className="space-y-2">
                    {person.workHistory.map((role, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {role}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {person.aiInsights && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">AI/ML Focus</h3>
                  <ul className="space-y-2">
                    {person.aiInsights.map((insight, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {person.recentMoves && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">Recent Strategic Moves</h3>
                  <ul className="space-y-2">
                    {person.recentMoves.map((move, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {move}</li>
                    ))}
                  </ul>
                </div>
              )}

              {person.boardPressure && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">Board Pressure Points</h3>
                  <ul className="space-y-2">
                    {person.boardPressure.map((pressure, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {pressure}</li>
                    ))}
                  </ul>
                </div>
              )}

              {person.competitiveThreats && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">Competitive Landscape</h3>
                  <ul className="space-y-2">
                    {person.competitiveThreats.map((threat, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {threat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Decision Context */}
            {(person.budgetAuthority || person.decisionTimeline) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3 text-sm">Decision Context</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {person.budgetAuthority && (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">Budget Authority</h4>
                      <p className="text-gray-600 text-sm">{person.budgetAuthority}</p>
                    </div>
                  )}
                  {person.decisionTimeline && (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">Decision Timeline</h4>
                      <p className="text-gray-600 text-sm">{person.decisionTimeline}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
