"use client";

import React, { useState } from 'react';
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  stage: string;
  account?: {
    name: string;
  };
  assignedUser?: {
    name: string;
  };
  expectedCloseDate?: string;
  probability?: number;
}

interface OpportunitiesKanbanProps {
  data: Opportunity[];
  onRecordClick: (opportunity: Opportunity) => void;
}

// Dano's deal stages in order - minimal black/white/gray design
const DEAL_STAGES = [
  { key: 'qualification', label: 'Qualification', color: 'bg-white border-gray-300' },
  { key: 'discovery', label: 'Discovery', color: 'bg-gray-50 border-gray-300' },
  { key: 'proposal', label: 'Proposal', color: 'bg-white border-gray-300' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-gray-50 border-gray-300' },
  { key: 'closed-won', label: 'Closed Won', color: 'bg-gray-100 border-gray-400' },
  { key: 'closed-lost', label: 'Closed Lost', color: 'bg-gray-200 border-gray-400' }
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
    const total = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
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
    <div className="flex gap-6 px-0 py-6 h-full overflow-x-auto">
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
            <div className={`bg-white rounded-lg border ${stage.color.replace('border-gray-300', 'border-gray-200').replace('border-gray-400', 'border-gray-300')} h-full flex flex-col`}>
              {/* Stage Header */}
              <div className="p-4 border-b border-gray-300">
                <h3 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">{stage.label}</h3>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{totals.count} {totals['count'] === 1 ? 'opportunity' : 'opportunities'}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(totals.value)}</span>
                </div>
              </div>

              {/* Opportunities List */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {opportunities['length'] === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-xs">No opportunities</p>
                  </div>
                ) : (
                  opportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className={`bg-white border rounded-sm p-3 hover:border-gray-300 transition-colors cursor-pointer relative ${
                        opportunity.stage?.toLowerCase().replace(/\s+/g, '-') === 'closed-lost-to-competition' 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200'
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, opportunity)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onRecordClick(opportunity)}
                    >
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1 flex items-center gap-1">
                          {opportunity.name}
                          {opportunity.stage?.toLowerCase().replace(/\s+/g, '-') === 'closed-lost-to-competition' && (
                            <span className="text-red-600 text-xs font-medium px-1.5 py-0.5 bg-red-100 rounded" title="Lost to Competition">
                              🏁
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-600 font-medium">
                          {opportunity.account?.name || 'No Account'}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-semibold text-black">
                          {formatCurrency(opportunity.amount || 0)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatDate(opportunity.expectedCloseDate)}
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
                              <span className="text-xs text-gray-600 truncate">
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
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })()}

                      {opportunity['assignedUser'] && (
                        <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
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
    if (opportunity['amount'] && opportunity.amount > 100000) {
      progress += 5;
    }
    
    // Probability can fine-tune progress within stage
    if (opportunity['probability'] && opportunity.probability > progress) {
      progress = Math.min(100, Math.max(progress, opportunity.probability));
    }
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

// Get Next Action for opportunities with proper pill formatting
function getOpportunityNextAction(opportunity: any): { timing: string; timingColor: string; action: string } {
  const stage = opportunity.stage?.toLowerCase().replace(/\s+/g, '-') || '';
  const amount = opportunity.amount || 0;
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
        return { timing: 'Next Month', color: 'bg-gray-100 text-gray-800' };
        
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
