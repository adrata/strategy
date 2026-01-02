"use client";

import React from 'react';
<<<<<<< Updated upstream
=======
import { Rocket, LayoutGrid, Zap, TrendingUp, BarChart3 } from 'lucide-react';
>>>>>>> Stashed changes
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import { RocketLaunchIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

interface ModeSelectionProps {
  onSelectRun1: () => void;
  onSelectRunMany: () => void;
  onSelectPullIntelligence?: () => void;
  onSelectIndustryRanking?: () => void;
  onSelectIndustryComparison?: () => void;
}

export function ModeSelection({ onSelectRun1, onSelectRunMany, onSelectPullIntelligence, onSelectIndustryRanking, onSelectIndustryComparison }: ModeSelectionProps) {
  return (
<<<<<<< Updated upstream
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Run 1 Card */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <RocketLaunchIcon className="w-6 h-6 text-primary" />
=======
    <div className="space-y-6">
      {/* PULL Intelligence Card - Featured */}
      {onSelectPullIntelligence && (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">PULL Intelligence</CardTitle>
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">Organizational Behavioral Physics</span>
              </div>
>>>>>>> Stashed changes
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-4">
              Analyze organizational structure to predict buying behavior. Identifies champions in their 90-day window,
              calculates tension scores, and simulates internal conversations happening at the target company.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full">Champion Detection</span>
              <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full">Tension Analysis</span>
              <span className="px-2 py-1 bg-pink-500/10 text-pink-400 text-xs rounded-full">Internal Dialogue</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">PDF Report</span>
            </div>
            <Button
              onClick={onSelectPullIntelligence}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              size="lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Analyze PULL Signals
            </Button>
          </CardContent>
        </Card>
      )}

<<<<<<< Updated upstream
      {/* Run Many Card */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Squares2X2Icon className="w-6 h-6 text-primary" />
=======
      {/* Industry PULL Ranking Card */}
      {onSelectIndustryRanking && (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Industry PULL Ranking</CardTitle>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Market Prioritization</span>
              </div>
>>>>>>> Stashed changes
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-4">
              Scan an entire industry and rank companies by PULL score. Find the hottest opportunities
              based on organizational tensions and champion signals.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">Industry Scan</span>
              <span className="px-2 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-full">PULL Ranking</span>
              <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full">Territory Planning</span>
            </div>
            <Button
              onClick={onSelectIndustryRanking}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              size="lg"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Scan Industry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Industry Comparison Card */}
      {onSelectIndustryComparison && (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Industry Comparison</CardTitle>
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">Find Your Best Market</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-4">
              Compare 2-5 industries side-by-side to find where PULL is highest.
              Uses 7 scoring dimensions to recommend your optimal target market.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">Multi-Industry</span>
              <span className="px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-full">7D Scoring</span>
              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">Market Recs</span>
            </div>
            <Button
              onClick={onSelectIndustryComparison}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Compare Industries
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Run 1 Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Buyer Group</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-6">
              Process a single target company to discover their buyer group. Perfect for quick demonstrations and one-off research.
            </p>
            <Button onClick={onSelectRun1} className="w-full" size="lg">
              Single Company Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Run Many Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Batch Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-6">
              Process multiple companies at once. Upload an Excel file or paste a list of companies to discover buyer groups in bulk.
            </p>
            <Button onClick={onSelectRunMany} className="w-full" size="lg" variant="outline">
              Start Batch Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

