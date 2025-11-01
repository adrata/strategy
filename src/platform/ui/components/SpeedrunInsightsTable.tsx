"use client";

import React, { useState, useEffect } from 'react';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
import { 
  FunnelIcon, 
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { SpeedrunInsightsService, SpeedrunInsight, InsightFilters } from '@/platform/services/speedrun-insights-service';

interface SpeedrunInsightsTableProps {
  className?: string;
}

export function SpeedrunInsightsTable({ className = '' }: SpeedrunInsightsTableProps) {
  const [insights, setInsights] = useState<SpeedrunInsight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<SpeedrunInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InsightFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const insightsService = SpeedrunInsightsService.getInstance();

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [insights, filters, searchTerm]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await insightsService.getInsights();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...insights];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(insight =>
        insight.title.toLowerCase().includes(searchLower) ||
        insight.description.toLowerCase().includes(searchLower) ||
        insight.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply other filters
    if (filters.category) {
      filtered = filtered.filter(insight => insight['category'] === filters.category);
    }

    if (filters.urgency) {
      filtered = filtered.filter(insight => insight['urgency'] === filters.urgency);
    }

    if (filters['tags'] && filters.tags.length > 0) {
      filtered = filtered.filter(insight =>
        filters.tags!.some(tag => insight.tags.includes(tag))
      );
    }

    setFilteredInsights(filtered);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'industry':
        return ChartBarIcon;
      case 'competitive':
        return ExclamationTriangleIcon;
      case 'opportunity':
        return LightBulbIcon;
      case 'trend':
        return ClockIcon;
      case 'tactical':
        return TagIcon;
      default:
        return LightBulbIcon;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-[var(--hover)] text-gray-800 border-[var(--border)]';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'industry':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'competitive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'opportunity':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trend':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tactical':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-[var(--hover)] text-gray-800 border-[var(--border)]';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <PipelineSkeleton message="Loading insights..." />
        <span className="ml-2 text-sm text-[var(--muted)]">Loading insights...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Expert Insights</h3>
          <span className="text-sm text-[var(--muted)]">({filteredInsights.length} of {insights.length})</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-[var(--background)] border-[var(--border)] text-gray-700 hover:bg-[var(--panel-background)]'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-[var(--panel-background)] p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="industry">Industry</option>
                <option value="competitive">Competitive</option>
                <option value="opportunity">Opportunity</option>
                <option value="trend">Trend</option>
                <option value="tactical">Tactical</option>
              </select>
            </div>

            {/* Urgency filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={filters.urgency || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Urgency Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Clear filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
                className="w-full px-3 py-2 bg-[var(--loading-bg)] text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insights table */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[var(--panel-background)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Insight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Relevance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--background)] divide-y divide-gray-200">
              {filteredInsights.map((insight) => {
                const CategoryIcon = getCategoryIcon(insight.category);
                return (
                  <tr key={insight.id} className="hover:bg-[var(--panel-background)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-[var(--foreground)]">{insight.title}</h4>
                        <p className="text-sm text-[var(--muted)] line-clamp-2">{insight.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-[var(--muted)]">
                          <span>{formatDate(insight.createdAt)}</span>
                          {insight['expiresAt'] && (
                            <>
                              <span>•</span>
                              <span>Expires {formatDate(insight.expiresAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(insight.category)}`}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {insight.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(insight.urgency)}`}>
                        {insight.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[var(--loading-bg)] rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${insight.relevance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-[var(--muted)]">{insight.relevance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {insight.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[var(--hover)] text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {insight.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[var(--hover)] text-[var(--muted)]">
                            +{insight.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[var(--muted)]">{insight.source}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredInsights['length'] === 0 && (
          <div className="text-center py-8">
            <LightBulbIcon className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No insights found</h3>
            <p className="text-sm text-[var(--muted)]">
              Try adjusting your search or filters to find relevant insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
