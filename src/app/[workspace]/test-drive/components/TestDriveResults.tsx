"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import { Check, Copy, RotateCcw } from 'lucide-react';
import type { BuyerGroupResult } from '../types';

interface TestDriveResultsProps {
  result: BuyerGroupResult;
  onReset: () => void;
}

export function TestDriveResults({ result, onReset }: TestDriveResultsProps) {
  const [copied, setCopied] = useState(false);

  const formatBuyerGroupText = (): string => {
    if (!result.buyerGroup || !result.company) {
      return 'No buyer group data available.';
    }

    const { company, buyerGroup } = result;
    let text = `Buyer Group Intelligence for ${company.name}\n\n`;

    // Group members by role
    const decisionMakers = buyerGroup.members.filter((m) => m.role === 'decision_maker');
    const champions = buyerGroup.members.filter((m) => m.role === 'champion');
    const stakeholders = buyerGroup.members.filter((m) => m.role === 'stakeholder');
    const blockers = buyerGroup.members.filter((m) => m.role === 'blocker');
    const introducers = buyerGroup.members.filter((m) => m.role === 'introducer');

    if (decisionMakers.length > 0) {
      text += 'Decision Makers:\n';
      decisionMakers.forEach((member) => {
        text += `- ${member.name}, ${member.title}\n`;
        if (member.email) text += `  Email: ${member.email}\n`;
        if (member.phone) text += `  Phone: ${member.phone}\n`;
        if (member.linkedin) text += `  LinkedIn: ${member.linkedin}\n`;
        text += '\n';
      });
    }

    if (champions.length > 0) {
      text += 'Champions:\n';
      champions.forEach((member) => {
        text += `- ${member.name}, ${member.title}\n`;
        if (member.email) text += `  Email: ${member.email}\n`;
        if (member.phone) text += `  Phone: ${member.phone}\n`;
        if (member.linkedin) text += `  LinkedIn: ${member.linkedin}\n`;
        text += '\n';
      });
    }

    if (stakeholders.length > 0) {
      text += 'Stakeholders:\n';
      stakeholders.forEach((member) => {
        text += `- ${member.name}, ${member.title}\n`;
        if (member.email) text += `  Email: ${member.email}\n`;
        if (member.phone) text += `  Phone: ${member.phone}\n`;
        if (member.linkedin) text += `  LinkedIn: ${member.linkedin}\n`;
        text += '\n';
      });
    }

    if (blockers.length > 0) {
      text += 'Blockers:\n';
      blockers.forEach((member) => {
        text += `- ${member.name}, ${member.title}\n`;
        if (member.email) text += `  Email: ${member.email}\n`;
        if (member.phone) text += `  Phone: ${member.phone}\n`;
        if (member.linkedin) text += `  LinkedIn: ${member.linkedin}\n`;
        text += '\n';
      });
    }

    if (introducers.length > 0) {
      text += 'Introducers:\n';
      introducers.forEach((member) => {
        text += `- ${member.name}, ${member.title}\n`;
        if (member.email) text += `  Email: ${member.email}\n`;
        if (member.phone) text += `  Phone: ${member.phone}\n`;
        if (member.linkedin) text += `  LinkedIn: ${member.linkedin}\n`;
        text += '\n';
      });
    }

    // Summary statistics
    text += '\n---\n\n';
    text += `Summary:\n`;
    text += `Total Members: ${buyerGroup.totalMembers}\n`;
    if (result.qualityMetrics) {
      text += `Quality Score: ${result.qualityMetrics.overallScore.toFixed(1)}%\n`;
      text += `Average Confidence: ${result.qualityMetrics.averageConfidence.toFixed(1)}%\n`;
    }
    if (result.processingTime) {
      text += `Processing Time: ${(result.processingTime / 1000).toFixed(1)}s\n`;
    }

    return text;
  };

  const handleCopy = async () => {
    const text = formatBuyerGroupText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!result.success || !result.buyerGroup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discovery Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">
            {result.error || 'Failed to discover buyer group'}
          </p>
          <Button onClick={onReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { company, buyerGroup } = result;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Buyer Group Intelligence Results</CardTitle>
              <p className="text-sm text-muted mt-2">
                {company.name} - {buyerGroup.totalMembers} members discovered
              </p>
            </div>
            <div className="flex gap-2">
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
              <Button onClick={onReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          {result.qualityMetrics && (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted">Total Members</div>
                <div className="text-2xl font-bold text-foreground">
                  {buyerGroup.totalMembers}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted">Quality Score</div>
                <div className="text-2xl font-bold text-foreground">
                  {result.qualityMetrics.overallScore.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted">Avg Confidence</div>
                <div className="text-2xl font-bold text-foreground">
                  {result.qualityMetrics.averageConfidence.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Buyer Group Members by Role */}
          <div className="space-y-6">
            {/* Decision Makers */}
            {buyerGroup.members.filter((m) => m.role === 'decision_maker').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Decision Makers
                </h3>
                <div className="space-y-3">
                  {buyerGroup.members
                    .filter((m) => m.role === 'decision_maker')
                    .map((member, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border rounded-lg bg-background"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">
                              {member.name}
                            </div>
                            <div className="text-sm text-muted mt-1">
                              {member.title}
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                              {member.email && (
                                <div className="text-foreground">
                                  <span className="text-muted">Email:</span> {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="text-foreground">
                                  <span className="text-muted">Phone:</span> {member.phone}
                                </div>
                              )}
                              {member.linkedin && (
                                <div className="text-foreground">
                                  <span className="text-muted">LinkedIn:</span>{' '}
                                  <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {member.linkedin}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-xs text-muted">Confidence</div>
                            <div className="text-sm font-semibold text-foreground">
                              {member.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Champions */}
            {buyerGroup.members.filter((m) => m.role === 'champion').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Champions
                </h3>
                <div className="space-y-3">
                  {buyerGroup.members
                    .filter((m) => m.role === 'champion')
                    .map((member, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border rounded-lg bg-background"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">
                              {member.name}
                            </div>
                            <div className="text-sm text-muted mt-1">
                              {member.title}
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                              {member.email && (
                                <div className="text-foreground">
                                  <span className="text-muted">Email:</span> {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="text-foreground">
                                  <span className="text-muted">Phone:</span> {member.phone}
                                </div>
                              )}
                              {member.linkedin && (
                                <div className="text-foreground">
                                  <span className="text-muted">LinkedIn:</span>{' '}
                                  <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {member.linkedin}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-xs text-muted">Confidence</div>
                            <div className="text-sm font-semibold text-foreground">
                              {member.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Other Roles */}
            {['stakeholder', 'blocker', 'introducer'].map((role) => {
              const roleMembers = buyerGroup.members.filter((m) => m.role === role);
              if (roleMembers.length === 0) return null;

              return (
                <div key={role}>
                  <h3 className="text-lg font-semibold text-foreground mb-3 capitalize">
                    {role.replace('_', ' ')}s
                  </h3>
                  <div className="space-y-3">
                    {roleMembers.map((member, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border rounded-lg bg-background"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">
                              {member.name}
                            </div>
                            <div className="text-sm text-muted mt-1">
                              {member.title}
                            </div>
                            <div className="mt-3 space-y-1 text-sm">
                              {member.email && (
                                <div className="text-foreground">
                                  <span className="text-muted">Email:</span> {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="text-foreground">
                                  <span className="text-muted">Phone:</span> {member.phone}
                                </div>
                              )}
                              {member.linkedin && (
                                <div className="text-foreground">
                                  <span className="text-muted">LinkedIn:</span>{' '}
                                  <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {member.linkedin}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-xs text-muted">Confidence</div>
                            <div className="text-sm font-semibold text-foreground">
                              {member.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plain Text Preview (for copy) */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="text-xs text-muted mb-2">Preview (what will be copied):</div>
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
              {formatBuyerGroupText()}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

