import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalHistoryTabProps {
  recordType: string;
  record?: any;
}

export function UniversalHistoryTab({ recordType, record: recordProp }: UniversalHistoryTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-muted">No record data available</div>
      </div>
    );
  }

  // Use real data from record
  const historyData = record?.history || record?.customFields?.history || [];
  
  if (historyData.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-muted">
          <div className="text-lg font-medium mb-2">No History Available</div>
          <div className="text-sm">No interaction history found for this record</div>
        </div>
      </div>
    );
  }

  // Helper functions
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email': return '📧';
      case 'call': return '📞';
      case 'meeting': return '🤝';
      case 'demo': return '🎯';
      case 'proposal': return '📄';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-hover text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Interaction Timeline */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Interaction Timeline</h3>
        <div className="space-y-4">
          {historyData.map((activity: any, index: number) => (
            <div key={activity.id || index} className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-hover rounded-full flex items-center justify-center">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{activity.subject || 'Activity'}</h4>
                      <p className="text-sm text-muted">{activity.type || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted">
                        {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(activity.status)}`}>
                      {activity.status || 'Unknown'}
                    </span>
                    {activity.duration && (
                      <span className="text-sm text-muted">Duration: {activity.duration}</span>
                    )}
                  </div>
                  
                  {activity.outcome && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Outcome: </span>
                      <span className="text-sm text-muted">{activity.outcome}</span>
                    </div>
                  )}
                  
                  {activity.participants && activity.participants.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Participants: </span>
                      <span className="text-sm text-muted">{activity.participants.join(', ')}</span>
                    </div>
                  )}
                  
                  {activity.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notes: </span>
                      <span className="text-sm text-muted">{activity.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Summary */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Contact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Total Interactions</h4>
            <div className="text-2xl font-semibold text-foreground">
              {historyData.length}
            </div>
            <div className="text-sm text-muted">
              {historyData.filter((a: any) => a.status === 'Completed').length} completed
            </div>
          </div>
          
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Last Activity</h4>
            <div className="text-sm text-muted">
              {historyData.length > 0 ? new Date(historyData[0].date).toLocaleDateString() : 'No activity'}
            </div>
            <div className="text-sm text-muted">
              {historyData.length > 0 ? new Date(historyData[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </div>
          
          <div className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Activity Types</h4>
            <div className="text-sm text-muted">
              {[...new Set(historyData.map((a: any) => a.type))].join(', ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}