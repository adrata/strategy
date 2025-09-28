import React from 'react';

interface UniversalNewsTabProps {
  record: any;
  recordType: string;
}

export function UniversalNewsTab({ record, recordType }: UniversalNewsTabProps) {
  if (!record) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-500">No record data available</div>
          </div>
        </div>
      </div>
    );
  }

  const companyUpdates = record?.companyUpdates || [];
  const companyName = record?.name || 'Company';

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatEngagement = (update: any) => {
    const reactions = update.reactions_count || 0;
    const comments = update.comments_count || 0;
    const followers = update.followers || 0;
    
    return {
      reactions,
      comments,
      followers: followers.toLocaleString()
    };
  };

  if (companyUpdates.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">No Recent News</div>
              <div className="text-sm">No company updates available for {companyName}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {companyUpdates.slice(0, 50).map((update: any, index: number) => {
          const engagement = formatEngagement(update);
          const isReshare = update.reshared_post_author;
          
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-700 font-semibold text-sm">
                      {companyName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {isReshare ? `${companyName} (via ${update.reshared_post_author})` : companyName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(update.date)} • {engagement.followers} followers
                      {update.type && ` • ${update.type}`}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  #{index + 1}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-800 leading-relaxed">
                  {update.description && update.description.length > 0 
                    ? update.description 
                    : 'No description available for this activity update.'}
                </p>
              </div>

              {isReshare && update.reshared_post_description && (
                <div className="bg-gray-50 border-l-4 border-blue-200 p-3 mb-4">
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>Original post by {update.reshared_post_author}:</strong>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {update.reshared_post_description}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  {engagement.reactions > 0 && (
                    <span className="flex items-center space-x-1">
                      <span className="text-red-500">❤️</span>
                      <span>{engagement.reactions.toLocaleString()} reactions</span>
                    </span>
                  )}
                  {engagement.comments > 0 && (
                    <span className="flex items-center space-x-1">
                      <span className="text-blue-500">💬</span>
                      <span>{engagement.comments.toLocaleString()} comments</span>
                    </span>
                  )}
                  {engagement.reactions === 0 && engagement.comments === 0 && (
                    <span className="text-gray-400">No engagement data</span>
                  )}
                </div>
                <div className="text-xs">
                  {update.reshared_post_date && `Reshared ${update.reshared_post_date}`}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {companyUpdates.length > 50 && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-sm text-gray-500">
              Showing first 50 of {companyUpdates.length} updates
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
