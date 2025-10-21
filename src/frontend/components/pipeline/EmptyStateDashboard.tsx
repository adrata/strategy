import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { getCategoryColors } from '@/platform/config/color-palette';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';

interface EmptyStateDashboardProps {
  section: string;
  onAddRecord: () => void;
  onAddAction?: () => void;
}

export function EmptyStateDashboard({ section, onAddRecord, onAddAction }: EmptyStateDashboardProps) {
  const getSectionInfo = () => {
    switch (section.toLowerCase()) {
      case 'prospects':
        return {
          title: 'No prospects yet',
          subtitle: 'Start building your pipeline by adding your first prospect',
          suggestions: [
            'Import contacts from your CRM',
            'Add prospects manually',
            'Connect your email to auto-discover contacts'
          ]
        };
      case 'leads':
        return {
          title: 'No leads yet',
          subtitle: 'Convert prospects into qualified leads',
          suggestions: [
            'Qualify existing prospects',
            'Import leads from marketing campaigns',
            'Set up lead scoring rules'
          ]
        };
      case 'opportunities':
        return {
          title: 'No opportunities yet',
          subtitle: 'Create your first sales opportunity',
          suggestions: [
            'Convert qualified leads',
            'Import opportunities from CRM',
            'Set up opportunity stages'
          ]
        };
      default:
        return {
          title: `No ${section.toLowerCase()} yet`,
          subtitle: `Start by adding your first ${section.toLowerCase()}`,
          suggestions: [
            'Add your first record',
            'Import data from external sources',
            'Set up automation rules'
          ]
        };
    }
  };

  const sectionInfo = getSectionInfo();

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header matching other pipeline pages */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] capitalize">
              {section}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {section === 'prospects' ? 'Cold relationships' : 
               section === 'leads' ? 'Warm relationships' :
               section === 'opportunities' ? 'Real pipeline' :
               'Manage your data'}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAddRecord}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: getCategoryColors(section).primary,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getCategoryColors(section).dark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = getCategoryColors(section).primary;
              }}
            >
              Add {section.slice(0, -1)}
            </button>
            {onAddAction && (
              <button
                onClick={onAddAction}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: getCategoryColors(section).bg,
                  color: getCategoryColors(section).primary,
                  border: `1px solid ${getCategoryColors(section).border}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getCategoryColors(section).bgHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getCategoryColors(section).bg;
                }}
              >
                Add Action ({getCommonShortcut('SUBMIT')})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Pills */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--muted)]">Active:</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--muted)]">Companies:</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--muted)]">Overdue:</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--muted)]">Recent:</span>
            <span className="text-sm font-semibold text-blue-600">0</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={`Search ${section.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button className="px-3 py-2 text-sm text-[var(--muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] disabled:opacity-50" disabled>
            Filter
          </button>
          <button className="px-3 py-2 text-sm text-[var(--muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] disabled:opacity-50" disabled>
            Sort
          </button>
          <button className="px-3 py-2 text-sm text-[var(--muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] disabled:opacity-50" disabled>
            Columns
          </button>
        </div>
      </div>

      {/* Main Empty State Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          
          {/* Title and Subtitle */}
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            {sectionInfo.title}
          </h3>
          <p className="text-[var(--muted)] mb-8">
            {sectionInfo.subtitle}
          </p>
          
          {/* Action Button */}
          <button
            onClick={onAddRecord}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-6 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Your First {section.slice(0, -1)}
          </button>
          
          {/* Suggestions */}
          <div className="mt-8 text-left">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Quick Start Ideas:</h4>
            <ul className="space-y-2">
              {sectionInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
