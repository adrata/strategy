"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/platform/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import {
  TrendingUp,
  Download,
  ChevronDown,
  ChevronUp,
  Trophy,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  RotateCcw,
  Filter,
} from 'lucide-react';
import type { IndustryRankingResult, IndustryRankingCompany } from '../types';

interface IndustryRankingResultsProps {
  result: IndustryRankingResult;
  onReset: () => void;
}

type SortField = 'rank' | 'pullScore' | 'company';
type SortDirection = 'asc' | 'desc';
type FilterCategory = 'all' | 'HIGH_PULL' | 'PULL' | 'HIGH_CONSIDERATION' | 'CONSIDERATION' | 'LOW_PRIORITY';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HIGH_PULL: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  PULL: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  HIGH_CONSIDERATION: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  CONSIDERATION: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  LOW_PRIORITY: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  NOT_IN_MARKET: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

export function IndustryRankingResults({ result, onReset }: IndustryRankingResultsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');

  const toggleRow = (rank: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'pullScore' ? 'desc' : 'asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let data = [...result.rankings];

    // Filter
    if (filterCategory !== 'all') {
      data = data.filter((r) => r.classification.category === filterCategory);
    }

    // Sort
    data.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'pullScore':
          comparison = a.pullScore - b.pullScore;
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [result.rankings, filterCategory, sortField, sortDirection]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    result.rankings.forEach((r) => {
      counts[r.classification.category] = (counts[r.classification.category] || 0) + 1;
    });
    return counts;
  }, [result.rankings]);

  const exportToCSV = () => {
    const headers = ['Rank', 'Company', 'Domain', 'PULL Score', 'Category', 'Champion', 'Quick Insight'];
    const rows = result.rankings.map((r) => [
      r.rank,
      r.company,
      r.domain || '',
      r.pullScore,
      r.classification.category,
      r.champion ? `${r.champion.name} (${r.champion.title})` : '',
      r.quickInsight,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pull-ranking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (!result.success) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Scan Failed</h3>
          <p className="text-muted mb-4">{result.error || 'An error occurred during the scan'}</p>
          <Button onClick={onReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-6 h-6 text-emerald-400" />
                PULL Ranking Complete
              </h2>
              <p className="text-muted mt-1">
                Scanned {result.totalScanned} companies, deep analysis on {result.totalAnalyzed}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-muted">Scan time</p>
                <p className="text-lg font-semibold text-foreground">{formatDuration(result.scanDuration)}</p>
              </div>
              {result.costUsed && (
                <div className="text-right">
                  <p className="text-sm text-muted">Credits used</p>
                  <p className="text-lg font-semibold text-foreground">{result.costUsed.coresignalCredits}</p>
                </div>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(categoryCounts).map(([category, count]) => {
              const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.CONSIDERATION;
              return (
                <span
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}
                >
                  {category.replace('_', ' ')}: {count}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
            className="px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm"
          >
            <option value="all">All Categories</option>
            <option value="HIGH_PULL">High PULL Only</option>
            <option value="PULL">PULL</option>
            <option value="HIGH_CONSIDERATION">High Consideration</option>
            <option value="CONSIDERATION">Consideration</option>
            <option value="LOW_PRIORITY">Low Priority</option>
          </select>
          <span className="text-sm text-muted">
            Showing {filteredAndSorted.length} of {result.rankings.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            New Scan
          </Button>
        </div>
      </div>

      {/* Rankings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th
                    className="px-4 py-3 text-left text-sm font-medium text-muted cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center gap-1">
                      #
                      {sortField === 'rank' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium text-muted cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center gap-1">
                      Company
                      {sortField === 'company' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-medium text-muted cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('pullScore')}
                  >
                    <div className="flex items-center gap-1">
                      PULL Score
                      {sortField === 'pullScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Champion</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Quick Insight</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((company) => {
                  const colors = CATEGORY_COLORS[company.classification.category] || CATEGORY_COLORS.CONSIDERATION;
                  const isExpanded = expandedRows.has(company.rank);

                  return (
                    <React.Fragment key={company.rank}>
                      <tr
                        className={`border-b border-border hover:bg-muted/20 cursor-pointer ${isExpanded ? 'bg-muted/10' : ''}`}
                        onClick={() => toggleRow(company.rank)}
                      >
                        <td className="px-4 py-3">
                          <span className={`font-bold ${company.rank <= 3 ? 'text-emerald-400' : 'text-foreground'}`}>
                            {company.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{company.company}</p>
                            {company.domain && (
                              <a
                                href={`https://${company.domain.replace(/^https?:\/\//, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted hover:text-primary flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {company.domain.replace(/^https?:\/\//, '')}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${company.pullScore >= 70 ? 'bg-emerald-500' : company.pullScore >= 50 ? 'bg-teal-500' : company.pullScore >= 35 ? 'bg-yellow-500' : 'bg-gray-500'}`}
                                style={{ width: `${company.pullScore}%` }}
                              />
                            </div>
                            <span className="font-semibold text-foreground">{company.pullScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {company.classification.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {company.champion ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted" />
                              <div>
                                <p className="text-sm text-foreground">{company.champion.name}</p>
                                <p className="text-xs text-muted">{company.champion.title}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-muted truncate max-w-[200px]">{company.quickInsight}</p>
                        </td>
                        <td className="px-4 py-3">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-muted/5">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Classification */}
                              <div className="p-4 bg-background rounded-lg border border-border">
                                <h4 className="text-sm font-medium text-muted mb-2">Classification</h4>
                                <p className="text-foreground">{company.classification.description}</p>
                                {company.analyzed && (
                                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                                    <CheckCircle className="w-3 h-3" />
                                    Full OBP analysis completed
                                  </div>
                                )}
                              </div>

                              {/* Champion Details */}
                              {company.champion && (
                                <div className="p-4 bg-background rounded-lg border border-border">
                                  <h4 className="text-sm font-medium text-muted mb-2">Champion Profile</h4>
                                  <p className="text-foreground font-medium">{company.champion.name}</p>
                                  <p className="text-sm text-muted">{company.champion.title}</p>
                                  {company.champion.tenure && (
                                    <div className="mt-2 flex items-center gap-1 text-sm">
                                      <Clock className="w-3 h-3 text-muted" />
                                      <span className="text-muted">Tenure: {company.champion.tenure}</span>
                                    </div>
                                  )}
                                  {company.champion.windowRemaining && (
                                    <p className="text-sm text-teal-400 mt-1">
                                      {typeof company.champion.windowRemaining === 'number'
                                        ? `${company.champion.windowRemaining} days remaining in action window`
                                        : company.champion.windowRemaining}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Tensions Preview */}
                              {company.tensions && (
                                <div className="p-4 bg-background rounded-lg border border-border">
                                  <h4 className="text-sm font-medium text-muted mb-2">Top Tensions</h4>
                                  <div className="space-y-2">
                                    {Object.entries(company.tensions)
                                      .filter(([, tension]) => tension && tension.score > 50)
                                      .slice(0, 3)
                                      .map(([key, tension]) => (
                                        <div key={key} className="flex items-center justify-between">
                                          <span className="text-sm capitalize text-foreground">{key}</span>
                                          <span className={`text-sm font-medium ${tension.score >= 70 ? 'text-emerald-400' : tension.score >= 50 ? 'text-yellow-400' : 'text-muted'}`}>
                                            {tension.score}/100
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Pre-screen Factors (for non-analyzed companies) */}
                              {!company.analyzed && company.preScreenFactors && (
                                <div className="p-4 bg-background rounded-lg border border-border">
                                  <h4 className="text-sm font-medium text-muted mb-2">Signal Factors</h4>
                                  <div className="space-y-1">
                                    {company.preScreenFactors.slice(0, 4).map((factor, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-muted capitalize">{factor.factor.replace(/_/g, ' ')}</span>
                                        <span className={`font-medium ${factor.impact > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                          {factor.impact > 0 ? '+' : ''}{factor.impact}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted">
        <p>
          Powered by Organizational Behavioral Physics (OBP) • PULL Detection System
        </p>
      </div>
    </div>
  );
}
