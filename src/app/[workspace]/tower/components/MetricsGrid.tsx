/**
 * MetricsGrid Component
 * 
 * Responsive grid layout for monitoring cards with category grouping
 */

"use client";

import React from 'react';
import { MonitoringCard } from './MonitoringCard';
import { MonitoringCard as MonitoringCardType } from '../types';

interface MetricsGridProps {
  cards: MonitoringCardType[];
  onCardClick?: (cardId: string) => void;
}

export function MetricsGrid({ cards, onCardClick }: MetricsGridProps) {
  const groupCardsByCategory = (cards: MonitoringCardType[]) => {
    const grouped = {
      system: [] as MonitoringCardType[],
      performance: [] as MonitoringCardType[],
      data: [] as MonitoringCardType[],
      infrastructure: [] as MonitoringCardType[]
    };

    cards.forEach(card => {
      if (grouped[card.category]) {
        grouped[card.category].push(card);
      }
    });

    return grouped;
  };

  const groupedCards = groupCardsByCategory(cards);

  const categoryTitles = {
    system: 'System Health',
    performance: 'Performance',
    data: 'Data Quality',
    infrastructure: 'Infrastructure'
  };

  const categoryDescriptions = {
    system: 'Core system status and health indicators',
    performance: 'Performance metrics and response times',
    data: 'Data quality and completeness metrics',
    infrastructure: 'Infrastructure and resource utilization'
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {Object.entries(groupedCards).map(([category, categoryCards]) => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {categoryTitles[category as keyof typeof categoryTitles]}
              </h2>
              <p className="text-sm text-gray-600">
                {categoryDescriptions[category as keyof typeof categoryDescriptions]}
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryCards.map((card) => (
                <MonitoringCard
                  key={card.id}
                  card={card}
                  onClick={() => onCardClick?.(card.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {cards.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No metrics available</h3>
            <p className="text-gray-500">Unable to load monitoring data. Please check your connection and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
