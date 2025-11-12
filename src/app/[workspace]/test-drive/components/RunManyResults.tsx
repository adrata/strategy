"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import { Check, Copy, RotateCcw } from 'lucide-react';
import type { RunManyResult, CompanyInput } from '../types';

interface RunManyResultsProps {
  yourCompany: CompanyInput;
  results: RunManyResult[];
  onReset: () => void;
}

export function RunManyResults({ yourCompany, results, onReset }: RunManyResultsProps) {
  const [copiedCompanies, setCopiedCompanies] = useState<Set<string>>(new Set());
  const [allCopied, setAllCopied] = useState(false);

  const formatBuyerGroupText = (result: RunManyResult): string => {
    if (!result.result?.buyerGroup || !result.result?.company) {
      return '';
    }

    const { company, buyerGroup } = result.result;
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
    if (result.result.qualityMetrics) {
      text += `Quality Score: ${result.result.qualityMetrics.overallScore.toFixed(1)}%\n`;
      text += `Average Confidence: ${result.result.qualityMetrics.averageConfidence.toFixed(1)}%\n`;
    }
    if (result.result.processingTime) {
      text += `Processing Time: ${(result.result.processingTime / 1000).toFixed(1)}s\n`;
    }

    return text;
  };

  const getCompanyId = (result: RunManyResult): string => {
    return result.company.id || 
           result.company.name || 
           result.company.website || 
           result.company.linkedinUrl || 
           `company-${results.indexOf(result)}`;
  };

  const handleCopyCompany = async (result: RunManyResult) => {
    const text = formatBuyerGroupText(result);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      const companyId = getCompanyId(result);
      setCopiedCompanies(prev => new Set(prev).add(companyId));
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyAll = async () => {
    const successfulResults = results.filter(r => r.result?.success);
    if (successfulResults.length === 0) return;

    let allText = '';
    successfulResults.forEach((result, index) => {
      const text = formatBuyerGroupText(result);
      if (text) {
        if (index > 0) {
          allText += '\n\n' + '='.repeat(50) + '\n\n';
        }
        allText += text;
      }
    });

    try {
      await navigator.clipboard.writeText(allText);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
      
      // Mark all successful companies as copied
      const allIds = successfulResults.map(r => getCompanyId(r));
      setCopiedCompanies(new Set(allIds));
    } catch (error) {
      console.error('Failed to copy all:', error);
    }
  };

  const successfulResults = results.filter(r => r.result?.success);
  const failedResults = results.filter(r => !r.result?.success);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Batch Buyer Group Intelligence Results</CardTitle>
              <p className="text-sm text-muted mt-2">
                Processed {results.length} {results.length === 1 ? 'company' : 'companies'} • {successfulResults.length} successful • {failedResults.length} failed
              </p>
            </div>
            <div className="flex gap-2">
              {successfulResults.length > 0 && (
                <Button onClick={handleCopyAll} variant="outline" size="sm">
                  {allCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      All Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </>
                  )}
                </Button>
              )}
              <Button onClick={onReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted">Total Processed</div>
              <div className="text-2xl font-bold text-foreground">{results.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Successful</div>
              <div className="text-2xl font-bold text-green-600">{successfulResults.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Failed</div>
              <div className="text-2xl font-bold text-destructive">{failedResults.length}</div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {results.map((result, index) => {
              const companyId = getCompanyId(result);
              const isCopied = copiedCompanies.has(companyId);
              const companyName = result.company.name || 
                                 result.company.website || 
                                 result.company.linkedinUrl || 
                                 `Company ${index + 1}`;

              if (!result.result?.success) {
                return (
                  <Card key={index} className="border-destructive/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{companyName}</h3>
                          <p className="text-sm text-destructive">{result.error || 'Failed to discover buyer group'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              const { company, buyerGroup } = result.result;

              return (
                <Card key={index} className={isCopied ? 'border-green-200 bg-green-50/30' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{company.name || companyName}</h3>
                          {isCopied && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted">
                          {buyerGroup.totalMembers} members • Quality: {result.result.qualityMetrics?.overallScore.toFixed(1) || 'N/A'}%
                        </p>
                      </div>
                      <Button
                        onClick={() => handleCopyCompany(result)}
                        variant="outline"
                        size="sm"
                        className={isCopied ? 'border-green-500 text-green-700' : ''}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Buyer Group Members Preview */}
                    <div className="space-y-3">
                      {buyerGroup.members.slice(0, 3).map((member, memberIndex) => (
                        <div key={memberIndex} className="p-3 border border-border rounded-lg bg-background">
                          <div className="font-medium text-foreground">{member.name}</div>
                          <div className="text-sm text-muted">{member.title}</div>
                          <div className="text-xs text-muted mt-1 capitalize">{member.role.replace('_', ' ')}</div>
                        </div>
                      ))}
                      {buyerGroup.members.length > 3 && (
                        <p className="text-xs text-muted text-center">
                          ... and {buyerGroup.members.length - 3} more members
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

