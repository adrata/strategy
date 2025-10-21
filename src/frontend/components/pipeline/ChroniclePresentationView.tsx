"use client";

import React, { useState, useEffect } from 'react';
import { ChartContainer, ChartTooltip } from '@/frontend/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ChroniclePresentationViewProps {
  report: any;
  onClose: () => void;
}

export function ChroniclePresentationView({ report, onClose }: ChroniclePresentationViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showGoodLuck, setShowGoodLuck] = useState(true);

  // Auto-dismiss good luck message
  useEffect(() => {
    if (showGoodLuck) {
      const timer = setTimeout(() => {
        setShowGoodLuck(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showGoodLuck]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };


  // Performance data
  const performanceData = [
    {
      metric: "Leads to Prospects",
      actual: report.content?.performanceVsTargets?.leadsToProspects?.actual || 0,
      target: report.content?.performanceVsTargets?.leadsToProspects?.target || 0,
      percentage: Math.round(((report.content?.performanceVsTargets?.leadsToProspects?.actual || 0) / (report.content?.performanceVsTargets?.leadsToProspects?.target || 1)) * 100),
    },
    {
      metric: "Prospects to Opportunities",
      actual: report.content?.performanceVsTargets?.prospectsToOpportunities?.actual || 0,
      target: report.content?.performanceVsTargets?.prospectsToOpportunities?.target || 0,
      percentage: Math.round(((report.content?.performanceVsTargets?.prospectsToOpportunities?.actual || 0) / (report.content?.performanceVsTargets?.prospectsToOpportunities?.target || 1)) * 100),
    },
    {
      metric: "Opportunities to Clients",
      actual: report.content?.performanceVsTargets?.opportunitiesToClients?.actual || 0,
      target: report.content?.performanceVsTargets?.opportunitiesToClients?.target || 0,
      percentage: Math.round(((report.content?.performanceVsTargets?.opportunitiesToClients?.actual || 0) / (report.content?.performanceVsTargets?.opportunitiesToClients?.target || 1)) * 100),
    },
  ];

  const slides = [
    {
      title: "Cover",
      component: () => (
        <div className="h-full w-full flex items-center justify-center bg-white">
          <div className="w-full max-w-6xl mx-8">
            <div className="p-24 text-center">
              <div className="space-y-20">
                <div className="space-y-8">
                  <div className="w-32 h-1.5 bg-black mx-auto"></div>
                  <h1 className="text-8xl font-light text-black tracking-tight leading-tight">
                    {report.title}
                  </h1>
                  <h2 className="text-3xl text-gray-600 font-light tracking-wide leading-loose">
                    Weekly Chronicle Report
                  </h2>
                </div>
                
                <div className="space-y-6 pt-16">
                  <div className="w-20 h-1 bg-gray-300 mx-auto"></div>
                  <p className="text-xl text-gray-500 font-light leading-loose">
                    {formatDate(report.reportDate)}
                  </p>
                  <p className="text-lg text-gray-400 font-light leading-loose">
                    Generated at {formatTime(report.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Purpose",
      component: () => (
        <div className="h-full w-full flex items-center justify-center bg-white">
          <div className="w-full max-w-6xl mx-8">
            <div className="p-24">
              <div className="space-y-20">
                <div className="text-center">
                  <div className="w-24 h-1.5 bg-black mx-auto mb-10"></div>
                  <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                    Our Purpose
                  </h1>
                </div>
                
                <div className="text-center">
                  <div className="inline-block bg-gray-100 px-16 py-10 border-l-[6px] border-black shadow-sm">
                    <p className="text-4xl font-light text-black leading-loose">
                      {report.content.purpose}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Week Progress",
      component: () => (
        <div className="h-full w-full flex items-center justify-center bg-white">
          <div className="w-full max-w-6xl mx-8">
            <div className="p-24">
              <div className="space-y-20">
                <div className="text-center">
                  <div className="w-24 h-1.5 bg-black mx-auto mb-10"></div>
                  <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                    Week Progress
                  </h1>
                </div>
                
                <div className="text-center">
                  <div className="inline-block bg-gray-100 px-16 py-10 border-l-[6px] border-black shadow-sm">
                    <p className="text-3xl font-light text-black leading-loose">
                      {report.content.summary.weekProgress}
                    </p>
                  </div>
                </div>
                
                <div className="text-center max-w-5xl mx-auto">
                  <p className="text-2xl text-gray-600 leading-loose font-light">
                    {report.content.summary.executiveSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Performance vs Targets",
      component: () => (
        <div className="h-full w-full flex items-center justify-center bg-white">
          <div className="w-full max-w-7xl mx-8">
            <div className="p-24">
              <div className="space-y-20">
                <div className="text-center">
                  <div className="w-24 h-1.5 bg-black mx-auto mb-10"></div>
                  <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                    Performance vs Targets
                  </h1>
                </div>
                
                <div className="space-y-12">
                  {performanceData.map((item, index) => (
                    <div key={index} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-light text-black tracking-wide">
                          {item.metric}
                        </h3>
                        <span className="text-xl text-gray-600">
                          {item.actual} / {item.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            item.percentage >= 90 ? 'bg-green-600' : 
                            item.percentage >= 70 ? 'bg-gray-500' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-light ${
                          item.percentage >= 90 ? 'text-green-600' : 
                          item.percentage >= 70 ? 'text-gray-600' : 'text-red-600'
                        }`}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Key Wins",
      component: () => (
        <div className="h-full w-full flex items-center justify-center bg-white">
          <div className="w-full max-w-6xl mx-8">
            <div className="p-24">
              <div className="space-y-20">
                <div className="text-center">
                  <div className="w-24 h-1.5 bg-black mx-auto mb-10"></div>
                  <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                    Key Wins
                  </h1>
                </div>
                
                <div className="space-y-10">
                  {report.content.keyWins.map((win: string, index: number) => (
                    <div key={index} className="bg-gray-100 p-10 border-l-[6px] border-black shadow-sm">
                      <div className="flex items-start space-x-8">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-black text-white flex items-center justify-center text-xl font-light">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700 leading-loose text-xl font-light">
                            {win}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Activity Metrics",
      component: () => (
        <div className="h-full w-full flex items-center justify-center bg-white">
          <div className="w-full max-w-7xl mx-8">
            <div className="p-24">
              <div className="space-y-20">
                <div className="text-center">
                  <div className="w-24 h-1.5 bg-black mx-auto mb-10"></div>
                  <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                    Activity Metrics
                  </h1>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {[
                    { label: "Calls Completed", value: report.content.activityMetrics.callsCompleted },
                    { label: "Emails Completed", value: report.content.activityMetrics.emailsCompleted },
                    { label: "Meetings Completed", value: report.content.activityMetrics.meetingsCompleted },
                    { label: "New Leads", value: report.content.activityMetrics.newLeads },
                    { label: "New Clients", value: report.content.activityMetrics.newProspects },
                    { label: "New Clients", value: report.content.activityMetrics.newOpportunities }
                  ].map((metric, index) => (
                    <div key={index} className="bg-gray-100 p-10 border-l-[6px] border-black shadow-sm">
                      <div className="text-center space-y-6">
                        <div className="text-5xl font-light text-black">
                          {metric.value || 0}
                        </div>
                        <div className="text-lg text-gray-600 font-light tracking-wide">
                          {metric.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Success Message at Top */}
      {showGoodLuck && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-white text-black text-center py-3 px-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Good luck. Exit by press "Esc"</span>
          </div>
        </div>
      )}

      {/* Slide Counter */}
      <div className="absolute top-16 right-4 z-20 bg-white text-black px-4 py-2 rounded-lg shadow-lg">
        <span className="text-sm font-medium">
          {currentSlide + 1} / {slides.length}
        </span>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
        disabled={currentSlide === 0}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white text-black p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))}
        disabled={currentSlide === slides.length - 1}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white text-black p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Current Slide */}
      <div className="h-full w-full">
        {slides[currentSlide] && (() => {
          const CurrentSlide = slides[currentSlide].component;
          return <CurrentSlide />;
        })()}
      </div>
    </div>
  );
}
