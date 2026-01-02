"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import {
  Download,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  TrendingUp,
  Clock,
  Target,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { PullIntelligenceResult } from '../types';

interface PullIntelligenceResultsProps {
  result: PullIntelligenceResult;
  onReset: () => void;
}

export function PullIntelligenceResults({ result, onReset }: PullIntelligenceResultsProps) {
  const [copied, setCopied] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [showStrategy, setShowStrategy] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 border-green-500/20';
    if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 30) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('HIGH') || category === 'PULL') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (category.includes('CONSIDERATION')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getVerdict = () => {
    const score = result.pullScore;
    if (score >= 70) return { text: 'PURSUE NOW', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (score >= 50) return { text: 'HIGH PRIORITY', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (score >= 30) return { text: 'MONITOR', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { text: 'SKIP', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const handleCopy = async () => {
    const text = formatResultText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadPDF = () => {
    // Open the HTML report URL if available
    if (result.htmlReportUrl) {
      window.open(result.htmlReportUrl, '_blank');
    } else {
      // Fallback: print the current view
      window.print();
    }
  };

  const formatResultText = () => {
    let text = `PULL Intelligence Report: ${result.company}\n`;
    text += `${'='.repeat(50)}\n\n`;
    text += `PULL Score: ${result.pullScore}/100\n`;
    text += `Classification: ${result.classification.category}\n`;
    text += `Buying Probability: ${result.predictions?.buyingProbability || 'N/A'}%\n\n`;

    if (result.champion?.name) {
      text += `CHAMPION:\n`;
      text += `- Name: ${result.champion.name}\n`;
      text += `- Title: ${result.champion.title}\n`;
      text += `- Tenure: ${result.champion.tenure}\n`;
      text += `- Window Remaining: ${result.champion.windowRemaining} days\n`;
      if (result.champion.previousCompany) {
        text += `- Previous Company: ${result.champion.previousCompany}\n`;
      }
      text += '\n';
    }

    text += `TENSIONS:\n`;
    text += `- Ratio: ${result.tensions.ratio.score}/100 - ${result.tensions.ratio.implication}\n`;
    text += `- Leadership: ${result.tensions.leadership.score}/100 - ${result.tensions.leadership.implication}\n`;
    text += `- Growth: ${result.tensions.growth.score}/100 - ${result.tensions.growth.implication}\n`;
    text += `- Resource: ${result.tensions.resource.score}/100 - ${result.tensions.resource.implication}\n`;
    text += `- Reporting: ${result.tensions.reporting.score}/100 - ${result.tensions.reporting.implication}\n`;

    return text;
  };

  const verdict = getVerdict();

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">
            {result.error || 'Failed to analyze company'}
          </p>
          <Button onClick={onReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4" ref={reportRef}>
      {/* Header with Score */}
      <Card className={`overflow-hidden ${getScoreBgColor(result.pullScore)}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Score Circle */}
              <div className="relative">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/20"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={getScoreColor(result.pullScore)}
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - result.pullScore / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(result.pullScore)}`}>
                    {result.pullScore}
                  </span>
                  <span className="text-xs text-muted">PULL</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">{result.company}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getCategoryIcon(result.classification.category)}
                  <span className="text-sm font-medium text-muted">
                    {result.classification.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full ${verdict.bg}`}>
                  <span className={`font-bold ${verdict.color}`}>{verdict.text}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopy} variant="outline" size="sm">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={onReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>

          {/* Buying Probability */}
          {result.predictions?.buyingProbability && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Estimated Buying Probability</span>
                <span className="text-2xl font-bold text-foreground">
                  {Math.round(result.predictions.buyingProbability)}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${result.predictions.buyingProbability}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Executive Summary */}
      {result.executiveSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted leading-relaxed whitespace-pre-wrap">
              {result.executiveSummary.replace(/\*\*/g, '')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Champion */}
      {result.champion?.name && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-indigo-500" />
              Identified Champion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {result.champion.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">{result.champion.name}</h3>
                <p className="text-indigo-400">{result.champion.title}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted uppercase">Tenure</p>
                    <p className="font-semibold text-foreground">{result.champion.tenure}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted uppercase">Window Remaining</p>
                    <p className="font-semibold text-foreground">{result.champion.windowRemaining} days</p>
                  </div>
                  {result.champion.previousCompany && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted uppercase">Previous Company</p>
                      <p className="font-semibold text-foreground">{result.champion.previousCompany}</p>
                    </div>
                  )}
                  {result.champion.urgencyLevel && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted uppercase">Urgency Level</p>
                      <p className="font-semibold text-foreground">{result.champion.urgencyLevel}/100</p>
                    </div>
                  )}
                </div>

                {result.champion.insight && (
                  <div className="mt-4 p-4 bg-indigo-500/10 border-l-4 border-indigo-500 rounded-r-lg">
                    <p className="text-sm text-muted italic">"{result.champion.insight}"</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizational Tensions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Organizational Tensions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { key: 'ratio', label: 'Staffing Ratio', data: result.tensions.ratio },
              { key: 'leadership', label: 'Leadership Dynamics', data: result.tensions.leadership },
              { key: 'growth', label: 'Growth Pressure', data: result.tensions.growth },
              { key: 'resource', label: 'Resource Constraints', data: result.tensions.resource },
              { key: 'reporting', label: 'Reporting Structure', data: result.tensions.reporting },
            ].map(({ key, label, data }) => (
              <div key={key} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className={`font-bold ${getScoreColor(data.score)}`}>
                    {data.score}/100
                  </span>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${
                      data.score >= 70 ? 'bg-green-500' :
                      data.score >= 50 ? 'bg-yellow-500' :
                      data.score >= 30 ? 'bg-orange-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <p className="text-sm text-muted">{data.implication}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Windows */}
      {result.predictions?.actionWindow?.windows && result.predictions.actionWindow.windows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-indigo-500" />
              Action Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.predictions.actionWindow.windows.map((window, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    window.urgency === 'high'
                      ? 'bg-red-500/10 border-red-500/30'
                      : window.urgency === 'moderate'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground capitalize">
                      {window.type.replace(/_/g, ' ')}
                    </span>
                    {window.daysRemaining && (
                      <span className={`text-sm font-bold ${
                        window.urgency === 'high' ? 'text-red-500' : 'text-muted'
                      }`}>
                        {window.daysRemaining} days
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-1">{window.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Section */}
      {result.strategy && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowStrategy(!showStrategy)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-indigo-500" />
                Recommended Strategy
              </CardTitle>
              {showStrategy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          {showStrategy && (
            <CardContent>
              <div className="space-y-4">
                {result.strategy.pitchAngle?.openingAngle && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-500 font-medium uppercase mb-1">Opening Angle</p>
                    <p className="text-foreground">{result.strategy.pitchAngle.openingAngle}</p>
                  </div>
                )}

                {result.strategy.pitchAngle?.primary && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted font-medium uppercase mb-1">Primary Message</p>
                    <p className="text-foreground">{result.strategy.pitchAngle.primary.message}</p>
                    <p className="text-sm text-muted mt-1">Audience: {result.strategy.pitchAngle.primary.audience}</p>
                  </div>
                )}

                {result.strategy.pitchAngle?.avoid && result.strategy.pitchAngle.avoid.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-500 font-medium uppercase mb-1">Avoid</p>
                    <ul className="list-disc list-inside text-muted space-y-1">
                      {result.strategy.pitchAngle.avoid.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.strategy.objections && result.strategy.objections.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Anticipated Objections</p>
                    <div className="space-y-2">
                      {result.strategy.objections.map((obj, i) => (
                        <div key={i} className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-foreground">
                            <strong>{obj.source}:</strong> "{obj.objection}"
                          </p>
                          <p className="text-sm text-muted mt-1">
                            Response: {obj.response}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Internal Dialogue */}
      {result.internalDialogue && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowDialogue(!showDialogue)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Simulated Internal Dialogue
              </CardTitle>
              {showDialogue ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          {showDialogue && (
            <CardContent>
              <p className="text-sm text-muted mb-3">
                Based on organizational tensions, this is the conversation likely happening inside {result.company}:
              </p>
              <div className="bg-[#0D1117] rounded-lg p-4 font-mono text-sm text-gray-300 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {result.internalDialogue}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
