"use client";

import React from 'react';

interface ActionCardProps {
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  isActive?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  color,
  onClick,
  isActive = false
}) => {
  const getActionType = () => {
    if (title.includes('Find')) return { label: 'Discovery', bg: 'bg-blue-100', text: 'text-blue-700' };
    if (title.includes('Enrich')) return { label: 'Enhancement', bg: 'bg-green-100', text: 'text-green-700' };
    if (title.includes('Update')) return { label: 'Maintenance', bg: 'bg-orange-100', text: 'text-orange-700' };
    if (title.includes('Enlighten')) return { label: 'Strategic', bg: 'bg-purple-100', text: 'text-purple-700' };
    if (title.includes('Monitor')) return { label: 'Continuous', bg: 'bg-cyan-100', text: 'text-cyan-700' };
    return { label: 'Intelligence', bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const getActionIcon = () => {
    if (title.includes('Find')) return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    );
    if (title.includes('Enrich')) return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
    if (title.includes('Update')) return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    );
    if (title.includes('Enlighten')) return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
    if (title.includes('Monitor')) return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getActionBenefits = () => {
    if (title.includes('Find')) return ['Discover hidden opportunities', 'Expand your addressable market', 'Identify new target segments'];
    if (title.includes('Enrich')) return ['Add intelligence layers', 'Increase conversion rates', 'Improve deal velocity'];
    if (title.includes('Update')) return ['Keep data current', 'Prevent wasted effort', 'Maintain accuracy'];
    if (title.includes('Enlighten')) return ['Strategic insights', 'Competitive advantage', 'Better positioning'];
    if (title.includes('Monitor')) return ['Real-time alerts', 'Never miss opportunities', 'Continuous intelligence'];
    return ['Strategic value', 'Intelligence insights', 'Competitive advantage'];
  };

  const actionType = getActionType();
  const icon = getActionIcon();
  const benefits = getActionBenefits();

  return (
    <button
      onClick={onClick}
      className={`w-full bg-white border border-border rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200 shadow-sm text-left group ${
        isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
    >
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white border border-border rounded-lg flex items-center justify-center text-foreground">
            {icon}
          </div>
          <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        </div>
      </div>
      
      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-muted leading-relaxed">{description}</p>
      </div>

      {/* Benefits List */}
      <div className="mb-4">
        <div className="text-xs font-medium text-foreground mb-2">Key Benefits:</div>
        <ul className="space-y-1">
          {benefits.map((benefit, index) => (
            <li key={index} className="text-xs text-foreground flex items-center gap-2">
              <span className="w-1 h-1 bg-foreground rounded-full"></span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Type Badge */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${actionType.bg} ${actionType.text}`}>
            {actionType.label}
          </span>
          <div className="text-xs text-foreground group-hover:text-blue-600 transition-colors">
            Click to view →
          </div>
        </div>
      </div>
    </button>
  );
};
