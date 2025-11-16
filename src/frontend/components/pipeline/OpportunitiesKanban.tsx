"use client";

import React, { useState } from 'react';
import { OpportunityContextMenu } from './OpportunityContextMenu';
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
  opportunityAmount?: number;  // Standardized deal value field - USE THIS
  amount?: number;
  dealValue?: number;
  stage?: string;
  opportunityStage?: string;  // Database field for opportunity stage
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
  description?: string;
  descriptionEnriched?: string;
  summary?: string;
  opportunitySummary?: string;  // Claude-generated summary for the opportunity
  expectedCloseDate?: string | Date;
  opportunityProbability?: number;
  lastActionDate?: string | Date;
  nextActionDate?: string | Date;
  company?: string | {
    name?: string;
    description?: string;
    descriptionEnriched?: string;
  };
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
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false); // Track if we're actively dragging
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; opportunity: Opportunity } | null>(null);
  const [localData, setLocalData] = useState<Opportunity[]>(data);

  // Update local data when prop data changes
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Group opportunities by stage and sort by progress within each stage
  const groupedData = DEAL_STAGES.reduce((acc, stage) => {
    const stageOpps = localData.filter(opp => {
      // Normalize stage from database (could be QUALIFICATION, qualification, etc.)
      // Check both stage and opportunityStage fields
      const oppStage = (opp.stage || opp.opportunityStage || 'qualification')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/_/g, '-');
      return oppStage === stage.key || 
             (stage['key'] === 'discovery' && ['needs-analysis', 'value-proposition'].includes(oppStage)) ||
             (stage['key'] === 'proposal' && ['proposal-price-quote'].includes(oppStage)) ||
             (stage['key'] === 'negotiation' && ['negotiation-review'].includes(oppStage)) ||
             (stage['key'] === 'closed-won' && ['closed-won', 'closed_won'].includes(oppStage)) ||
             (stage['key'] === 'closed-lost' && ['closed-lost', 'closed_lost', 'closed-lost-to-competition'].includes(oppStage));
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
    const total = opportunities.reduce((sum, opp) => {
      // Use opportunityAmount field which is the standardized deal value field
      const value = Number(opp.opportunityAmount || opp.amount || opp.revenue || opp.dealValue || 0);
      return sum + value;
    }, 0);
    return {
      count: opportunities.length,
      value: total
    };
  };
  
  // Helper function to convert index to letter (0 -> A, 1 -> B, etc.) - matching Stacks format
  const getLetterSuffix = (index: number): string => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
  };

  const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
    setIsDragging(true);
    setDraggedItem(opportunity);
    e['dataTransfer']['effectAllowed'] = 'move';
    e.dataTransfer.setData('text/plain', opportunity.id);
    // Prevent click event from firing during drag
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Small delay to prevent click event from firing after drag
    setTimeout(() => {
      setIsDragging(false);
      setDraggedItem(null);
      setDragOverColumn(null);
      setDragOverIndex(null);
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e['dataTransfer']['dropEffect'] = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItem) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we're actually leaving the column (not just moving to a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string, dropIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if already in target stage
    const currentStage = (draggedItem?.opportunityStage || draggedItem?.stage || 'qualification')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
    if (!draggedItem || currentStage === targetStage) {
      setIsDragging(false);
      setDraggedItem(null);
      setDragOverColumn(null);
      setDragOverIndex(null);
      return;
    }

    // Prevent click event from firing
    setIsDragging(true);

    // Immediately trigger refresh for instant UI update (optimistic)
    console.log(`🔄 Moving ${draggedItem.name} from ${draggedItem.stage} to ${targetStage}`);
    
    // Update local data immediately for instant feedback
    const updatedData = localData.map(opp => 
      opp.id === draggedItem.id 
        ? { ...opp, opportunityStage: targetStage.toUpperCase().replace(/-/g, '_'), stage: targetStage }
        : opp
    );
    setLocalData(updatedData);
    
    // Clear drag state
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
    
    // Update in background without blocking UI
    try {
      // Get workspace context for API call
      const { workspaceId, userId } = await WorkspaceDataRouter.getApiParams();
      
      // Map stage key to opportunityStage value (normalize to uppercase, handle hyphenated stages)
      // DEAL_STAGES keys: 'qualification', 'discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
      // Database expects: 'QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'
      const stageMapping: Record<string, string> = {
        'qualification': 'QUALIFICATION',
        'discovery': 'DISCOVERY',
        'proposal': 'PROPOSAL',
        'negotiation': 'NEGOTIATION',
        'closed-won': 'CLOSED_WON',
        'closed-lost': 'CLOSED_LOST'
      };
      const normalizedStage = stageMapping[targetStage] || targetStage.toUpperCase().replace(/-/g, '_');
      
      // Use companies API since opportunities are stored in companies table
      const response = await fetch(`/api/v1/companies/${draggedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          opportunityStage: normalizedStage
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ API returned non-JSON response:', text.substring(0, 200));
        throw new Error(`API returned ${response.status}: ${text.substring(0, 100)}`);
      }

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, opportunity: Opportunity) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      opportunity
    });
  };

  const reorderOpportunityInStage = (opportunity: Opportunity, newIndex: number) => {
    const stage = opportunity.stage?.toLowerCase().replace(/\s+/g, '-') || 'qualification';
    
    // Get all opportunities in the same stage
    const stageOpps = localData.filter(opp => {
      const oppStage = opp.stage?.toLowerCase().replace(/\s+/g, '-') || 'qualification';
      return oppStage === stage;
    });
    
    // Get other opportunities (not in this stage)
    const otherOpps = localData.filter(opp => {
      const oppStage = opp.stage?.toLowerCase().replace(/\s+/g, '-') || 'qualification';
      return oppStage !== stage;
    });
    
    // Remove opportunity from its current position
    const stageOppsWithoutTarget = stageOpps.filter(opp => opp.id !== opportunity.id);
    
    // Insert at new position
    const newStageOpps = [
      ...stageOppsWithoutTarget.slice(0, newIndex),
      opportunity,
      ...stageOppsWithoutTarget.slice(newIndex)
    ];
    
    // Rebuild localData with reordered stage opportunities
    setLocalData([...otherOpps, ...newStageOpps]);
  };

  const handleMoveToTop = () => {
    if (!contextMenu) return;
    const opportunity = contextMenu.opportunity;
    const stage = (opportunity.opportunityStage || opportunity.stage || 'qualification')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
    const stageOpps = groupedData[stage] || [];
    const currentIndex = stageOpps.findIndex(opp => opp.id === opportunity.id);
    
    if (currentIndex <= 0) {
      setContextMenu(null);
      return;
    }

    reorderOpportunityInStage(opportunity, 0);
    setContextMenu(null);
  };

  const handleMoveUp = () => {
    if (!contextMenu) return;
    const opportunity = contextMenu.opportunity;
    const stage = (opportunity.opportunityStage || opportunity.stage || 'qualification')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
    const stageOpps = groupedData[stage] || [];
    const currentIndex = stageOpps.findIndex(opp => opp.id === opportunity.id);
    
    if (currentIndex <= 0) {
      setContextMenu(null);
      return;
    }

    reorderOpportunityInStage(opportunity, currentIndex - 1);
    setContextMenu(null);
  };

  const handleMoveDown = () => {
    if (!contextMenu) return;
    const opportunity = contextMenu.opportunity;
    const stage = (opportunity.opportunityStage || opportunity.stage || 'qualification')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
    const stageOpps = groupedData[stage] || [];
    const currentIndex = stageOpps.findIndex(opp => opp.id === opportunity.id);
    
    if (currentIndex >= stageOpps.length - 1) {
      setContextMenu(null);
      return;
    }

    reorderOpportunityInStage(opportunity, currentIndex + 1);
    setContextMenu(null);
  };

  const handleMoveToBottom = () => {
    if (!contextMenu) return;
    const opportunity = contextMenu.opportunity;
    const stage = (opportunity.opportunityStage || opportunity.stage || 'qualification')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
    const stageOpps = groupedData[stage] || [];
    const currentIndex = stageOpps.findIndex(opp => opp.id === opportunity.id);
    
    if (currentIndex >= stageOpps.length - 1) {
      setContextMenu(null);
      return;
    }

    const stageOppsCount = stageOpps.length;
    reorderOpportunityInStage(opportunity, stageOppsCount - 1);
    setContextMenu(null);
  };

  const handleDelete = async () => {
    if (!contextMenu) return;
    const opportunity = contextMenu.opportunity;
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${opportunity.name || 'this opportunity'}"? This action cannot be undone.`)) {
      setContextMenu(null);
      return;
    }

    try {
      // Get workspace context for API call
      const { workspaceId, userId } = await WorkspaceDataRouter.getApiParams();
      
      const response = await fetch('/api/v1/deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'soft_delete',
          entityType: 'companies', // Opportunities are stored in companies table
          entityId: opportunity.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Successfully deleted opportunity ${opportunity.name}`);
        // Remove from local data
        setLocalData(prevData => prevData.filter(opp => opp.id !== opportunity.id));
        // Trigger refresh for other components
        window.dispatchEvent(new CustomEvent('pipeline-data-refresh', { 
          detail: { section: 'opportunities' } 
        }));
      } else {
        console.error('❌ Failed to delete opportunity:', result.error);
        alert(`Failed to delete opportunity: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error deleting opportunity:', error);
      alert('Failed to delete opportunity. Please try again.');
    }
    
    setContextMenu(null);
  };


  return (
    <div className="flex gap-6 px-0 py-1 h-full overflow-x-auto">
      {DEAL_STAGES.map((stage) => {
        const opportunities = groupedData[stage.key] || [];
        const totals = getStageTotals(opportunities);

        const isDragOver = dragOverColumn === stage.key;
        
        return (
          <div
            key={stage.key}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, stage.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            <div className={`bg-background rounded-lg border transition-all duration-200 ${
              isDragOver 
                ? 'ring-2 ring-primary border-2 border-primary' 
                : 'border-border'
            } h-full flex flex-col`}>
              {/* Stage Header */}
              <div className={`p-4 border-b transition-colors duration-200 ${
                isDragOver 
                  ? 'border-primary/50 bg-hover/30' 
                  : 'border-border'
              }`}>
                <h3 className="font-medium text-foreground mb-2 text-sm uppercase tracking-wide">{stage.label}</h3>
                <div className="flex justify-between text-xs text-muted">
                  <span>{totals.count} {totals['count'] === 1 ? 'opportunity' : 'opportunities'}</span>
                  <span className="font-medium text-foreground">{formatCurrency(totals.value)}</span>
                </div>
              </div>

              {/* Opportunities List */}
              <div className={`flex-1 p-4 space-y-2.5 overflow-y-auto transition-colors duration-200 ${
                isDragOver ? 'bg-hover/20' : ''
              }`}>
                {opportunities['length'] === 0 ? (
                  <div className={`text-center py-8 text-muted transition-colors duration-200 ${
                    isDragOver ? 'border-2 border-dashed border-primary rounded-lg bg-primary/5 flex flex-col items-center justify-center min-h-[120px]' : ''
                  }`}>
                    {isDragOver ? (
                      <span className="text-sm text-primary font-medium">Drop here</span>
                    ) : (
                      <p className="text-xs">No opportunities</p>
                    )}
                  </div>
                ) : (
                  <>
                    {opportunities.map((opportunity, index) => {
                      // Calculate rank in Stacks format: columnNumber + letter (e.g., 1A, 2A, 3B)
                      const columnNumber = DEAL_STAGES.findIndex(s => s.key === stage.key) + 1;
                      const letterSuffix = getLetterSuffix(index);
                      const displayRank = `${columnNumber}${letterSuffix}`;
                      const oppStage = opportunity.stage?.toLowerCase().replace(/\s+/g, '-') || 'qualification';
                      const isDragOverHere = dragOverColumn === stage.key && dragOverIndex === index;
                      const isSameColumn = draggedItem?.stage === opportunity.stage;
                      
                      return (
                        <React.Fragment key={`fragment-${opportunity.id}`}>
                          {/* Drop zone before card */}
                          {isSameColumn && draggedItem && draggedItem.id !== opportunity.id && (
                            <div
                              className={`h-2 transition-all ${
                                isDragOverHere ? 'h-8 bg-primary/20 border-2 border-dashed border-primary rounded' : ''
                              }`}
                            />
                          )}
                          <div
                            key={opportunity.id}
                            className={`relative bg-background border border-border rounded-lg p-3 hover:border-primary transition-colors cursor-pointer ${
                              draggedItem?.id === opportunity.id ? 'opacity-50' : ''
                            } ${
                              opportunity.stage?.toLowerCase().replace(/\s+/g, '-') === 'closed-lost-to-competition' 
                                ? 'border-error/20 bg-error/10' 
                                : ''
                            }`}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, opportunity)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              // Prevent click if we just finished dragging
                              if (!isDragging) {
                                onRecordClick(opportunity);
                              }
                            }}
                            onContextMenu={(e) => handleContextMenu(e, opportunity)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const draggedStage = draggedItem?.opportunityStage || draggedItem?.stage;
                              const currentStage = opportunity.opportunityStage || opportunity.stage;
                              if (draggedItem && draggedStage === currentStage && draggedItem.id !== opportunity.id) {
                                setDragOverIndex(index);
                                setDragOverColumn(oppStage);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                      {/* Rank Badge - Top left (like Stacks with 1A, 2A format) */}
                      <div className="absolute top-2 left-2 w-6 h-6 bg-panel-background text-foreground rounded-[12px] flex items-center justify-center text-xs font-bold flex-shrink-0 shrink-0">
                        {displayRank}
                      </div>
                      
                      {/* Deal Value - Top right as pill (like Stacks points) */}
                      {(() => {
                        const dealValue = Number(opportunity.opportunityAmount || 0);
                        return dealValue > 0 ? (
                          <div className="absolute top-2 right-2">
                            <span className="bg-panel-background text-foreground px-2 py-1 rounded-md text-xs font-semibold">
                              {formatCurrency(dealValue)}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      
                      {/* Card Content - Following Stephen Few's principles: essential data only */}
                      <div className="mb-2 ml-8 mr-20">
                        {/* Opportunity Name - Primary identifier */}
                        <h4 className="font-medium text-foreground text-sm leading-tight mb-1">
                          {opportunity.name || 
                           opportunity.account?.name || 
                           (typeof opportunity.company === 'string' ? opportunity.company : opportunity.company?.name) || 
                           'Unnamed Opportunity'}
                        </h4>
                        
                        {/* Key Metrics Row - Probability and Close Date (critical indicators) */}
                        <div className="flex items-center gap-2 mb-1.5 text-xs">
                          {opportunity.opportunityProbability !== undefined && opportunity.opportunityProbability !== null && (
                            <span className="text-muted">
                              {Math.round(opportunity.opportunityProbability)}% prob
                            </span>
                          )}
                          {opportunity.expectedCloseDate && (
                            <span className="text-muted">
                              {formatDate(opportunity.expectedCloseDate)}
                            </span>
                          )}
                        </div>
                        
                        {/* Summary - Only if available, keep concise (Stephen Few: minimize cognitive load) */}
                        {(() => {
                          const summaryText = opportunity.opportunitySummary || 
                                             opportunity.descriptionEnriched || 
                                             opportunity.description || '';
                          
                          if (!summaryText || summaryText.trim() === '') return null;
                          
                          const firstSentence = summaryText.match(/^[^.!?]+[.!?]/)?.[0] || summaryText.split('.')[0] || summaryText;
                          const displayText = firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;
                          
                          return (
                            <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                              {displayText}
                            </p>
                          );
                        })()}
                      </div>
                      
                      {/* Bottom Bar - Last Contact (engagement tracking) - Always show */}
                      <div className="flex items-center text-xs text-muted border-t border-border/30 pt-2 mt-2">
                        <span className="text-xs text-muted">
                          Last: {opportunity.lastActionDate 
                            ? formatDate(opportunity.lastActionDate) 
                            : opportunity.createdAt 
                              ? formatDate(opportunity.createdAt) 
                              : 'Never'}
                        </span>
                      </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Context Menu */}
      {contextMenu && (
        <OpportunityContextMenu
          isVisible={!!contextMenu}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onMoveToTop={handleMoveToTop}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onMoveToBottom={handleMoveToBottom}
          onDelete={handleDelete}
        />
      )}
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
