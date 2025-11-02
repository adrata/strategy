"use client";

import React from "react";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useWorkspacePipelineStages } from "@/platform/services/database-only-data-layer";

interface PipelineKanbanViewProps {
  activeSection: string;
}

export function PipelineKanbanView({ activeSection }: PipelineKanbanViewProps) {
  const { ui, data, user } = useRevenueOS();
  // PREVENT DEFAULT WORKSPACE POLLUTION: No fallback to 'default'
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  
  // Don't render if no valid workspace
  if (!workspaceId) {
    return null;
  }
  
  // Get pipeline stages from database
  const { stages: pipelineStages, loading: stagesLoading } = useWorkspacePipelineStages(
    workspaceId, 
    activeSection as 'opportunities' | 'clients' | 'leads' | 'partners'
  );

  // Get current view data
  const getCurrentViewData = () => {
    switch (activeSection) {
      case 'opportunities': return data.acquireData.opportunities || [];
      case 'clients': return data.acquireData.clients || [];
      case 'partners': return data.acquireData.partnerships || [];
      default: return [];
    }
  };

  const currentData = getCurrentViewData();

  // Calculate stage data with counts
  const stageData = pipelineStages.map(stage => ({
    ...stage,
    count: currentData.filter((item: any) => {
      const itemStage = item.stage?.toLowerCase() || '';
      const stageId = stage.id.toLowerCase();
      return itemStage.includes(stageId) || stageId.includes(itemStage);
    }).length,
    items: currentData.filter((item: any) => {
      const itemStage = item.stage?.toLowerCase() || '';
      const stageId = stage.id.toLowerCase();
      return itemStage.includes(stageId) || stageId.includes(itemStage);
    })
  }));

  // Only show loading if actively loading stages AND no data available
  if (stagesLoading && currentData['length'] === 0) {
    return null;
  }

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-6 px-6 min-w-max">
        {stageData.map((stage) => (
          <div key={stage.id} className="w-72 flex-shrink-0">
            {/* Stage Header */}
            <div className="flex items-center justify-between mb-4 w-72">
              <h3 className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                {stage.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted flex-shrink-0">
                {activeSection === 'opportunities' ? (
                  <>
                    <span>
                      ${stage['items'] && stage.items.length > 0 ? 
                        stage.items.reduce((total: number, item: any) => {
                          const amount = item.amount ? Number(item.amount) : 0;
                          return total + amount;
                        }, 0).toLocaleString() : '0'
                      }
                    </span>
                    <span>•</span>
                    <span>{stage.count}</span>
                  </>
                ) : (
                  <span>{stage.count}</span>
                )}
              </div>
            </div>

            {/* Stage Content Area */}
            <div className="min-h-[600px] bg-background rounded-lg p-4 border-2 border-dashed border-border">
              <div className="space-y-3 pb-4">
                {stage['items'] && stage.items.length > 0 ? (
                  stage.items.map((item: any, index: number) => (
                    <div 
                      key={`${activeSection}_${stage.id}_${item.id || index}`}
                      className="bg-background p-4 rounded-lg border border-border hover:border-border cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={() => ui.handleRecordClick?.(item, activeSection)}
                    >
                      <div className="space-y-2">
                        {/* Item Name */}
                        <h4 className="text-sm font-semibold text-foreground">
                          {activeSection === 'opportunities' ? item.name || item.companyName || item.company || 'Unknown Opportunity' :
                           activeSection === 'clients' ? item.company || item.name || 'Customer' :
                           activeSection === 'partners' ? item.name || item.partnerName || item.company || 'Unknown Partner' :
                           'Unknown'}
                        </h4>
                        
                        {/* Owner */}
                        <p className="text-xs text-muted font-medium">
                          {item.assignedTo || item.owner || 'Unassigned'}
                        </p>
                        
                        {/* Company Name */}
                        {((activeSection === 'opportunities' && (item.account?.name || item.accountName || item.company)) ||
                          (activeSection === 'clients' && item.company) ||
                          (activeSection === 'partners' && item.company)) && (
                          <p className="text-xs text-muted">
                            {activeSection === 'opportunities' ? (item.account?.name || item.accountName || item.company) :
                             activeSection === 'clients' ? item.company :
                             activeSection === 'partners' ? item.company : ''}
                          </p>
                        )}
                        
                        {/* Amount */}
                        <p className="text-xs text-muted">
                          {activeSection === 'opportunities' ? (item.amount ? '$' + Number(item.amount).toLocaleString() : 'No amount') :
                           activeSection === 'clients' ? (item.contractValue ? '$' + Number(item.contractValue).toLocaleString() : '') :
                           activeSection === 'partners' ? (item.partnershipValue ? '$' + Number(item.partnershipValue).toLocaleString() : '') :
                           'No amount'}
                        </p>
                        
                        {/* Close Date with Color Coding */}
                        {activeSection === 'opportunities' && item['expectedCloseDate'] && (
                          (() => {
                            const closeDate = new Date(item.expectedCloseDate);
                            const today = new Date();
                            const daysUntilClose = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            
                            let dateColor = 'text-muted';
                            if (daysUntilClose < 0) {
                              dateColor = 'text-red-500';
                            } else if (daysUntilClose <= 30) {
                              dateColor = 'text-orange-500';
                            }
                            
                            return (
                              <p className={`text-xs ${dateColor}`}>
                                Close: {closeDate.toLocaleDateString()}
                              </p>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted">
                    <p className="text-sm">
                      No {activeSection} in {stage.name}
                    </p>
                    <p className="text-xs mt-1 text-muted">
                      Drag and drop items here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
