"use client";

import React, { useState } from 'react';
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";

// Import the ranking function from PipelineTable
function getPersonMasterRank(record: any, fallbackIndex: number): number | string {
  // Partners get excluded from ranking
  if (record['status'] === 'Partner' || record.tags?.includes('partner')) {
    return '-';
  }
  
  // Calculate unified rank based on company importance + person role
  let unifiedScore = 0;
  
  // === COMPANY RANKING FACTORS ===
  // Company size/importance
  const companySize = record.companySize || record.company?.companySize || 0;
  if (companySize >= 1000) unifiedScore += 100;
  else if (companySize >= 500) unifiedScore += 75;
  else if (companySize >= 100) unifiedScore += 50;
  else if (companySize >= 50) unifiedScore += 25;
  
  // Company revenue/value
  const revenue = record.revenue || record.company?.revenue || record.estimatedValue || record.amount || 0;
  if (revenue >= 10000000) unifiedScore += 100; // $10M+
  else if (revenue >= 1000000) unifiedScore += 75;  // $1M+
  else if (revenue >= 500000) unifiedScore += 50;   // $500K+
  else if (revenue >= 100000) unifiedScore += 25;   // $100K+
  
  // Company industry importance
  const industry = record.industry || record.company?.industry || '';
  if (['Technology', 'Finance', 'Healthcare', 'Manufacturing'].includes(industry)) {
    unifiedScore += 30;
  } else if (['Legal', 'Real Estate', 'Construction'].includes(industry)) {
    unifiedScore += 20;
  }
  
  // === PERSON ROLE RANKING FACTORS ===
  // Buyer group role (Decision Makers get highest priority)
  const buyerGroupRole = record.buyerGroupRole || record.role || '';
  if (buyerGroupRole === 'Decision Maker') unifiedScore += 150;
  else if (buyerGroupRole === 'Champion') unifiedScore += 100;
  else if (buyerGroupRole === 'Stakeholder') unifiedScore += 75;
  else if (buyerGroupRole === 'Blocker') unifiedScore += 50; // Blockers need attention
  else if (buyerGroupRole === 'Introducer') unifiedScore += 60;
  
  // Job title/authority level
  const title = record.title || record.jobTitle || '';
  if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('president')) unifiedScore += 100;
  else if (title.toLowerCase().includes('vp') || title.toLowerCase().includes('vice president')) unifiedScore += 80;
  else if (title.toLowerCase().includes('director') || title.toLowerCase().includes('head of')) unifiedScore += 60;
  else if (title.toLowerCase().includes('manager') || title.toLowerCase().includes('lead')) unifiedScore += 40;
  
  // === RECORD TYPE RANKING FACTORS ===
  // Status-based scoring
  const status = record.status?.toLowerCase() || '';
  if (status === 'responded' || status === 'engaged') unifiedScore += 80;
  else if (status === 'contacted') unifiedScore += 50;
  else if (status === 'new' || status === 'uncontacted') unifiedScore += 30;
  
  // Priority scoring
  const priority = record.priority?.toLowerCase() || '';
  if (priority === 'urgent') unifiedScore += 100;
  else if (priority === 'high') unifiedScore += 60;
  else if (priority === 'medium') unifiedScore += 30;
  
  // Record type importance - opportunities get high priority
  if (record.recordType === 'opportunities' || record.stage) unifiedScore += 100; // Active opportunities
  
  // === ACTIVITY RANKING FACTORS ===
  // Recent activity boost
  const lastActivity = record.lastActivityDate || record.lastContactDate || record.updatedAt;
  if (lastActivity) {
    const daysSince = Math.floor((new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) unifiedScore += 20;
    else if (daysSince <= 30) unifiedScore += 10;
  }
  
  // === NEXT ACTION PRIORITY RANKING ===
  const nextActionDate = record.nextActionDate || record.nextFollowUpDate || record.nextActivityDate;
  const lastContactDate = record.lastContactDate || record.lastActionDate || record.lastActivityDate || record.updatedAt;
  
  const daysSinceLastContact = lastContactDate 
    ? Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  const daysUntilNextAction = nextActionDate 
    ? Math.floor((new Date(nextActionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // === ACTION-BASED RANKING LOGIC ===
  let actionPriority = 0;
  
  // Overdue actions get highest priority (rank 1-10)
  if (daysUntilNextAction < 0) {
    actionPriority = Math.abs(daysUntilNextAction) * 50; // More overdue = higher priority
  }
  // Actions due today get high priority (rank 11-20)
  else if (daysUntilNextAction === 0) {
    actionPriority = 100;
  }
  // Actions due tomorrow get medium-high priority (rank 21-30)
  else if (daysUntilNextAction === 1) {
    actionPriority = 80;
  }
  // Actions due this week get medium priority (rank 31-50)
  else if (daysUntilNextAction <= 7) {
    actionPriority = 60 - (daysUntilNextAction * 5);
  }
  // Actions due next week get lower priority (rank 51-70)
  else if (daysUntilNextAction <= 14) {
    actionPriority = 40 - (daysUntilNextAction * 2);
  }
  // No next action set - use last contact timing
  else if (!nextActionDate) {
    if (daysSinceLastContact >= 30) actionPriority = 70; // Haven't contacted in 30+ days
    else if (daysSinceLastContact >= 14) actionPriority = 50; // Haven't contacted in 2+ weeks
    else if (daysSinceLastContact >= 7) actionPriority = 30; // Haven't contacted in 1+ week
    else actionPriority = 10; // Recently contacted
  }
  
  // === COMBINE ACTION PRIORITY WITH COMPANY/PERSON IMPORTANCE ===
  // Action priority is the primary factor, but company/person importance creates sub-ranking
  const finalScore = (actionPriority * 10) + (unifiedScore / 10);
  
  // Convert to rank (higher score = lower rank number, rank 1 is most urgent)
  const rank = Math.max(1, Math.floor(1000 / (finalScore + 1)) + 1);
  
  return rank;
}

interface Opportunity {
  id: string;
  name: string;
  revenue?: number;  // Companies table uses revenue, not amount
  stage?: string;
  status: string;
  account?: {
    name: string;
  };
  assignedUser?: {
    name: string;
  };
  lastAction?: string;
  nextAction?: string;
  industry?: string;
  size?: string;
}

interface OpportunitiesKanbanProps {
  data: Opportunity[];
  onRecordClick: (opportunity: Opportunity) => void;
}

// Dano's deal stages in order - consistent background colors
const DEAL_STAGES = [
  { key: 'qualification', label: 'Qualification', color: 'bg-background border-border' },
  { key: 'discovery', label: 'Discovery', color: 'bg-background border-border' },
  { key: 'proposal', label: 'Proposal', color: 'bg-background border-border' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-background border-border' },
  { key: 'closed-won', label: 'Closed Won', color: 'bg-background border-border' },
  { key: 'closed-lost', label: 'Closed Lost', color: 'bg-background border-border' }
];

export function OpportunitiesKanban({ data, onRecordClick }: OpportunitiesKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<Opportunity | null>(null);


  // Group opportunities by stage and sort by progress within each stage
  const groupedData = DEAL_STAGES.reduce((acc, stage) => {
    const stageOpps = data.filter(opp => {
      const oppStage = opp.stage?.toLowerCase().replace(/\s+/g, '-') || 'qualification';
      return oppStage === stage.key || 
             (stage['key'] === 'discovery' && ['needs-analysis', 'value-proposition'].includes(oppStage)) ||
             (stage['key'] === 'proposal' && ['proposal-price-quote'].includes(oppStage)) ||
             (stage['key'] === 'negotiation' && ['negotiation-review'].includes(oppStage)) ||
             (stage['key'] === 'closed-won' && ['closed-won'].includes(oppStage)) ||
             (stage['key'] === 'closed-lost' && ['closed-lost', 'closed-lost-to-competition'].includes(oppStage));
    });
    
    // Sort by progress (highest first) within each stage
    acc[stage.key] = stageOpps.sort((a, b) => {
      const progressA = getStageProgress(a.stage, a);
      const progressB = getStageProgress(b.stage, b);
      return progressB - progressA; // Highest progress first
    });
    
    return acc;
  }, {} as Record<string, Opportunity[]>);

  // Calculate totals for each stage
  const getStageTotals = (opportunities: Opportunity[]) => {
    const total = opportunities.reduce((sum, opp) => sum + (opp.revenue || 0), 0);
    return {
      count: opportunities.length,
      value: total
    };
  };

  const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
    setDraggedItem(opportunity);
    e['dataTransfer']['effectAllowed'] = 'move';
    e.dataTransfer.setData('text/plain', opportunity.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget['style']['opacity'] = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget['style']['opacity'] = '1';
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e['dataTransfer']['dropEffect'] = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem['stage'] === targetStage) {
      setDraggedItem(null);
      return;
    }

    // Immediately trigger refresh for instant UI update (optimistic)
    console.log(`🔄 Moving ${draggedItem.name} from ${draggedItem.stage} to ${targetStage}`);
    window.dispatchEvent(new CustomEvent('pipeline-data-refresh', { 
      detail: { section: 'opportunities' } 
    }));
    
    // Clear drag state immediately for instant feedback
    setDraggedItem(null);
    
    // Update in background without blocking UI
    try {
      // Get workspace context for API call
      const { workspaceId, userId } = await WorkspaceDataRouter.getApiParams();
      
      const response = await fetch(`/api/opportunities/${draggedItem.id}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: targetStage,
          workspaceId,
          userId
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Successfully moved ${draggedItem.name} to ${targetStage}`);
      } else {
        console.error('❌ Failed to update opportunity stage:', result.error);
        // Refresh again to revert optimistic update on failure
        window.dispatchEvent(new CustomEvent('pipeline-data-refresh', { 
          detail: { section: 'opportunities' } 
        }));
        alert(`Failed to move opportunity: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error updating opportunity stage:', error);
      // Refresh again to revert optimistic update on failure
      window.dispatchEvent(new CustomEvent('pipeline-data-refresh', { 
        detail: { section: 'opportunities' } 
      }));
      alert('Failed to move opportunity. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };


  return (
    <div className="flex gap-6 px-0 py-1 h-full overflow-x-auto">
      {DEAL_STAGES.map((stage) => {
        const opportunities = groupedData[stage.key] || [];
        const totals = getStageTotals(opportunities);

        return (
          <div
            key={stage.key}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            <div className={`bg-background rounded-lg border ${stage.color.replace('border-border', 'border-border').replace('border-gray-400', 'border-border')} h-full flex flex-col`}>
              {/* Stage Header */}
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-foreground mb-2 text-sm uppercase tracking-wide">{stage.label}</h3>
                <div className="flex justify-between text-xs text-muted">
                  <span>{totals.count} {totals['count'] === 1 ? 'opportunity' : 'opportunities'}</span>
                  <span className="font-medium text-foreground">{formatCurrency(totals.value)}</span>
                </div>
              </div>

              {/* Opportunities List */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {opportunities['length'] === 0 ? (
                  <div className="text-center py-8 text-muted">
                    <p className="text-xs">No opportunities</p>
                  </div>
                ) : (
                  opportunities.map((opportunity, index) => (
                    <div
                      key={opportunity.id}
                      className={`bg-background border rounded-sm p-3 hover:bg-hover hover:border-[var(--primary)] transition-colors cursor-pointer relative ${
                        opportunity.stage?.toLowerCase().replace(/\s+/g, '-') === 'closed-lost-to-competition' 
                          ? 'border-error/20 bg-error/10' 
                          : 'border-border'
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, opportunity)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onRecordClick(opportunity)}
                    >
                      {/* Rank Display */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-hover text-foreground text-xs font-medium px-2 py-1 rounded-full">
                          #{getPersonMasterRank(opportunity, index)}
                        </span>
                      </div>
                      
                      <div className="mb-3 pr-8">
                        <h4 className="font-medium text-foreground text-sm leading-tight mb-1 flex items-center gap-1">
                          {opportunity.name}
                          {opportunity.stage?.toLowerCase().replace(/\s+/g, '-') === 'closed-lost-to-competition' && (
                            <span className="text-red-600 text-xs font-medium px-1.5 py-0.5 bg-red-100 rounded" title="Lost to Competition">
                              🏁
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-muted font-medium">
                          {opportunity.account?.name || 'No Account'}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-semibold text-black">
                          {formatCurrency(opportunity.revenue || 0)}
                        </span>
                        <span className="text-muted text-xs">
                          {opportunity.industry || 'No Industry'}
                        </span>
                      </div>

                      {/* Next Action Pill */}
                      <div className="mb-2">
                        {(() => {
                          const nextAction = getOpportunityNextAction(opportunity);
                          return (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${nextAction.timingColor}`}>
                                {nextAction.timing}
                              </span>
                              <span className="text-xs text-muted truncate">
                                {nextAction.action}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {(() => {
                        const progress = getStageProgress(opportunity.stage, opportunity);
                        return progress > 0 && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-muted mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-loading-bg rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })()}

                      {opportunity['assignedUser'] && (
                        <div className="text-xs text-muted border-t border-border pt-2">
                          {opportunity.assignedUser.name}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Progress calculation based on stage and sub-stage indicators
function getStageProgress(stage?: string, opportunity?: Opportunity): number {
  if (!stage) return 0;
  
  const stageLower = stage.toLowerCase().replace(/\s+/g, '-');
  
  // Base progress by stage
  const baseProgress: Record<string, number> = {
    'qualification': 20,
    'discovery': 35,
    'needs-analysis': 40,
    'value-proposition': 45,
    'proposal': 60,
    'proposal-price-quote': 65,
    'negotiation': 80,
    'negotiation-review': 85,
    'closed-won': 100,
    'closed-lost': 0,
    'closed-lost-to-competition': 0
  };
  
  let progress = baseProgress[stageLower] || 20;
  
  // Add progress modifiers based on opportunity data
  if (opportunity) {
    // Recent activity boosts progress within stage
    if (opportunity.expectedCloseDate) {
      const closeDate = new Date(opportunity.expectedCloseDate);
      const now = new Date();
      const daysToClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Closer to close date = higher progress within stage
      if (daysToClose > 0 && daysToClose <= 30) {
        progress += Math.min(15, Math.floor(30 - daysToClose) / 2);
      }
    }
    
    // High-value deals show more progress (sales focus)
    if (opportunity['revenue'] && opportunity.revenue > 100000) {
      progress += 5;
    }
    
    // No probability field in companies table - skip this logic
  }
  
  return Math.min(100, Math.max(0, progress));
}

// Progress bar color based on progress level
function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 40) return 'bg-orange-500';
  if (progress >= 20) return 'bg-yellow-500';
  return 'bg-gray-400';
}

// Helper function to calculate timing from nextActionDate
function getTimingFromDate(nextActionDate?: string): string {
  if (!nextActionDate) return 'TBD';
  
  const actionDate = new Date(nextActionDate);
  const now = new Date();
  const daysDiff = Math.ceil((actionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 'Overdue';
  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Tomorrow';
  if (daysDiff <= 7) return 'This Week';
  if (daysDiff <= 14) return 'Next Week';
  if (daysDiff <= 30) return 'This Month';
  return 'Next Month';
}

// Helper function to get timing color based on nextActionDate
function getTimingColor(nextActionDate?: string): string {
  if (!nextActionDate) return 'bg-hover text-gray-800';
  
  const actionDate = new Date(nextActionDate);
  const now = new Date();
  const daysDiff = Math.ceil((actionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 'bg-red-100 text-red-800'; // Overdue
  if (daysDiff === 0) return 'bg-green-100 text-green-800'; // Today
  if (daysDiff <= 1) return 'bg-yellow-100 text-yellow-800'; // Tomorrow
  if (daysDiff <= 7) return 'bg-blue-100 text-blue-800'; // This Week
  if (daysDiff <= 14) return 'bg-purple-100 text-purple-800'; // Next Week
  return 'bg-hover text-gray-800'; // Default
}

// Get Next Action for opportunities with proper pill formatting
function getOpportunityNextAction(opportunity: any): { timing: string; timingColor: string; action: string } {
  // PRIORITY 1: Use actual nextAction from database if available
  const actualNextAction = opportunity.nextAction;
  if (actualNextAction && actualNextAction !== '-' && actualNextAction.trim() !== '') {
    return {
      timing: getTimingFromDate(opportunity.nextActionDate),
      timingColor: getTimingColor(opportunity.nextActionDate),
      action: actualNextAction
    };
  }
  
  // FALLBACK: Only use stage-based template when no real data exists
  const stage = opportunity.stage?.toLowerCase().replace(/\s+/g, '-') || '';
  const amount = opportunity.revenue || 0;
  const closeDate = opportunity.expectedCloseDate;
  
  // Calculate days to close date for urgency
  let daysToClose = null;
  if (closeDate) {
    const close = new Date(closeDate);
    const now = new Date();
    daysToClose = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Determine timing and action based on stage and urgency
  const getOpportunityTiming = (): { timing: string; color: string } => {
    // High-value deals get priority
    const isHighValue = amount >= 100000;
    
    switch (stage) {
      case 'qualification':
        return { timing: 'This Week', color: 'bg-blue-100 text-blue-800' };
        
      case 'discovery':
      case 'needs-analysis':
        return { timing: 'This Week', color: 'bg-blue-100 text-blue-800' };
        
      case 'proposal':
      case 'proposal-price-quote':
        if (daysToClose && daysToClose <= 7) {
          return { timing: 'Today', color: 'bg-green-100 text-green-800' };
        } else if (daysToClose && daysToClose <= 14) {
          return { timing: 'This Week', color: 'bg-blue-100 text-blue-800' };
        } else {
          return { timing: 'Two Weeks', color: 'bg-purple-100 text-purple-800' };
        }
        
      case 'negotiation':
      case 'negotiation-review':
        return { timing: 'Today', color: 'bg-green-100 text-green-800' };
        
      case 'closed-won':
        return { timing: 'Next Week', color: 'bg-indigo-100 text-indigo-800' };
        
      case 'closed-lost':
      case 'closed-lost-to-competition':
        return { timing: 'Next Month', color: 'bg-hover text-gray-800' };
        
      default:
        if (isHighValue) {
          return { timing: 'This Week', color: 'bg-blue-100 text-blue-800' };
        } else {
          return { timing: 'Two Weeks', color: 'bg-purple-100 text-purple-800' };
        }
    }
  };
  
  const getOpportunityAction = (): string => {
    const name = opportunity.name || 'deal';
    
    switch (stage) {
      case 'qualification':
        return 'Discovery call to uncover needs';
        
      case 'discovery':
      case 'needs-analysis':
        return 'Present tailored solution';
        
      case 'proposal':
      case 'proposal-price-quote':
        return 'Follow up on proposal';
        
      case 'negotiation':
      case 'negotiation-review':
        return 'Push for commitment';
        
      case 'closed-won':
        return 'Schedule onboarding';
        
      case 'closed-lost':
      case 'closed-lost-to-competition':
        return 'Quarterly check-in';
        
      default:
        return 'Advance to next stage';
    }
  };
  
  const timing = getOpportunityTiming();
  const action = getOpportunityAction();
  
  return {
    timing: timing.timing,
    timingColor: timing.color,
    action: action
  };
}
