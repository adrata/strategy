"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import {
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Building2,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import type { IndustryComparisonResult, IndustryComparisonResultItem, IndustryScoring } from '../types';

interface IndustryComparisonResultsProps {
  result: IndustryComparisonResult;
  onReset: () => void;
}

const ACTION_CONFIG = {
  PRIORITIZE: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: Trophy,
    description: 'Top priority - highest PULL concentration'
  },
  FOCUS: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: Target,
    description: 'Strong opportunity - worth dedicated effort'
  },
  TEST: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Zap,
    description: 'Potential - run targeted experiments'
  },
  DEPRIORITIZE: {
    color: 'text-muted',
    bgColor: 'bg-muted/10',
    borderColor: 'border-muted/30',
    icon: XCircle,
    description: 'Low opportunity - focus elsewhere'
  }
};

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  pullConcentration: Zap,
  marketSize: Building2,
  growthRate: TrendingUp,
  competitiveIntensity: Shield,
  dealVelocity: Clock,
  accessibility: Users,
  regulatoryPressure: AlertTriangle
};

const DIMENSION_LABELS: Record<string, string> = {
  pullConcentration: 'PULL Concentration',
  marketSize: 'Market Size',
  growthRate: 'Growth Rate',
  competitiveIntensity: 'Competition',
  dealVelocity: 'Deal Velocity',
  accessibility: 'Accessibility',
  regulatoryPressure: 'Regulatory'
};

export function IndustryComparisonResults({ result, onReset }: IndustryComparisonResultsProps) {
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(
    result.topRecommendation?.industry || null
  );

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderDimensionBar = (dimension: { score: number; weight: number; interpretation: string }, key: string) => {
    const Icon = DIMENSION_ICONS[key] || BarChart3;
    return (
      <div key={key} className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Icon className="w-3 h-3 text-muted" />
            <span className="text-muted">{DIMENSION_LABELS[key] || key}</span>
            <span className="text-muted-foreground/50">({dimension.weight}%)</span>
          </div>
          <span className={`font-medium ${getScoreColor(dimension.score)}`}>
            {dimension.score}
          </span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={`h-full ${getScoreBgColor(dimension.score)} transition-all duration-500`}
            style={{ width: `${dimension.score}%` }}
          />
        </div>
        <p className="text-xs text-muted truncate" title={dimension.interpretation}>
          {dimension.interpretation}
        </p>
      </div>
    );
  };

  const renderIndustryCard = (item: IndustryComparisonResultItem, index: number) => {
    const isExpanded = expandedIndustry === item.industry;
    const isTop = result.topRecommendation?.industry === item.industry;
    const action = item.recommendation?.action || 'TEST';
    const actionConfig = ACTION_CONFIG[action];
    const ActionIcon = actionConfig.icon;

    return (
      <Card
        key={item.industry}
        className={`transition-all ${
          isTop
            ? 'border-2 border-green-500/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5'
            : 'border-border'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Rank Badge */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isTop ? 'bg-green-500/20' : 'bg-muted/30'
              }`}>
                {isTop ? (
                  <Trophy className="w-5 h-5 text-green-400" />
                ) : (
                  <span className={`text-lg font-bold ${
                    item.rank && item.rank <= 3 ? 'text-amber-400' : 'text-muted'
                  }`}>
                    #{item.rank || index + 1}
                  </span>
                )}
              </div>

              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {item.industry}
                  {isTop && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      TOP PICK
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${actionConfig.bgColor} ${actionConfig.color}`}>
                    <ActionIcon className="w-3 h-3" />
                    {action}
                  </span>
                  {item.scoring && (
                    <span className="text-xs text-muted">
                      {item.scoring.companiesWithPull}/{item.scoring.companiesScanned} with PULL
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total Score */}
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(item.scoring?.totalScore || 0)}`}>
                {item.scoring?.totalScore || 0}
              </div>
              <p className="text-xs text-muted">Total Score</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Quick Rationale */}
          {item.recommendation?.rationale && (
            <p className="text-sm text-muted mb-4">
              {item.recommendation.rationale}
            </p>
          )}

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedIndustry(isExpanded ? null : item.industry)}
            className="w-full justify-between"
          >
            <span className="text-sm text-muted">
              {isExpanded ? 'Hide details' : 'Show scoring breakdown'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {/* Expanded Details */}
          {isExpanded && item.scoring && (
            <div className="mt-4 space-y-6 pt-4 border-t border-border">
              {/* Dimension Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Scoring Dimensions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(item.scoring.dimensions).map(([key, dim]) =>
                    renderDimensionBar(dim, key)
                  )}
                </div>
              </div>

              {/* Top Targets */}
              {item.scoring.highPullCompanies && item.scoring.highPullCompanies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Top PULL Companies
                  </h4>
                  <div className="space-y-2">
                    {item.scoring.highPullCompanies.slice(0, 5).map((company, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted/20 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted" />
                          <span className="text-sm text-foreground">{company.company}</span>
                          {company.champion && (
                            <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              {company.champion}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(company.pullScore)}`}>
                          {company.pullScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {item.recommendation?.insights && item.recommendation.insights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    {item.recommendation.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {item.error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                {item.error}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 mb-4">
          <BarChart3 className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Industry Comparison Complete
        </h2>
        <p className="text-muted">
          Analyzed {result.industriesCompared} industries • {result.tier} tier • {formatDuration(result.comparisonDuration)}
        </p>
      </div>

      {/* Top Recommendation Highlight */}
      {result.topRecommendation && result.topRecommendation.scoring && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {result.topRecommendation.industry}
                </h3>
                <p className="text-sm text-muted mt-1">
                  Highest opportunity score with {result.topRecommendation.scoring.companiesWithPull} companies showing PULL signals
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400">
                  {result.topRecommendation.scoring.totalScore}
                </div>
                <p className="text-xs text-muted">Total Score</p>
              </div>
            </div>
            {result.topRecommendation.recommendation?.rationale && (
              <div className="mt-4 p-3 bg-green-500/5 rounded-lg">
                <p className="text-sm text-foreground">
                  {result.topRecommendation.recommendation.rationale}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Industry Rankings */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Full Rankings
        </h3>
        <div className="space-y-4">
          {result.results
            .sort((a, b) => (a.rank || 99) - (b.rank || 99))
            .map((item, index) => renderIndustryCard(item, index))}
        </div>
      </div>

      {/* Stats Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-amber-400">{result.industriesCompared}</p>
              <p className="text-xs text-muted">Industries Compared</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-orange-400">{result.estimatedCreditsUsed}</p>
              <p className="text-xs text-muted">Credits Used</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{formatDuration(result.comparisonDuration)}</p>
              <p className="text-xs text-muted">Total Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={onReset} variant="outline" className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" />
          Compare Different Industries
        </Button>
        {result.topRecommendation && (
          <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
            <ArrowRight className="w-4 h-4 mr-2" />
            Scan {result.topRecommendation.industry}
          </Button>
        )}
      </div>
    </div>
  );
}
