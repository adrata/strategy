"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useRouter } from 'next/navigation';
import { PresentationView } from './PresentationView';
import { PitchRegularView } from './PitchRegularView';

interface ChronicleReport {
  id: string;
  title: string;
  reportDate: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PITCH';
  content: any;
  createdAt: string;
  isRead?: boolean;
  lastReadAt?: string | null;
  shares: Array<{
    id: string;
    shareToken: string;
    shareUrl: string;
    viewCount: number;
    createdAt: string;
  }>;
}

interface ChronicleListEnhancedProps {
  onReportSelect?: (report: ChronicleReport) => void;
}

export function ChronicleListEnhanced({ onReportSelect }: ChronicleListEnhancedProps) {
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const router = useRouter();
  const [reports, setReports] = useState<ChronicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('🔍 [ChronicleListEnhanced] Current state:', { reports, loading, error, reportsLength: reports.length });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPitchPresentation, setShowPitchPresentation] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;

  useEffect(() => {
    if (!workspaceId) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        console.log('🔍 [ChronicleList] Fetching reports for workspace:', workspaceId);
        const response = await fetch(`/api/v1/chronicle/reports?workspaceId=${workspaceId}&limit=20`, {
          credentials: 'include'
        });
        
        console.log('🔍 [ChronicleList] API response status:', response.status);
        
        if (!response.ok) {
          // No fallback - use real data only
          console.log('🔍 [ChronicleList] API failed, status:', response.status);
          console.log('🔍 [ChronicleList] API failed, no fallback data available');
          // For all other users/workspaces, just set empty array instead of throwing error
          console.log('🔍 [ChronicleList] API failed for non-Ryan Serrato user, setting empty reports');
          setReports([]);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('🔍 [ChronicleList] API response data:', data);
        console.log('🔍 [ChronicleList] Reports from API:', data.data?.reports);
        console.log('🔍 [ChronicleList] Reports count:', data.data?.reports?.length || 0);
        setReports(data.data.reports || []);
      } catch (err) {
        console.error('🔍 [ChronicleList] Error fetching Chronicle reports:', err);
        
        // No fallback - use real data only
        console.log('🔍 [ChronicleList] Error occurred, no fallback data available');
        setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [workspaceId]);


  const markReportAsRead = async (reportId: string) => {
    try {
      const response = await fetch('/api/v1/chronicle/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reportId })
      });

      if (response.ok) {
        // Update local state to mark report as read
        setReports(prevReports => 
          prevReports.map(report => 
            report.id === reportId 
              ? { ...report, isRead: true, lastReadAt: new Date().toISOString() }
              : report
          )
        );
        console.log('📖 [ChronicleListEnhanced] Report marked as read:', reportId);
      } else {
        console.error('Failed to mark report as read');
      }
    } catch (error) {
      console.error('Error marking report as read:', error);
    }
  };

  const handleReportClick = (report: ChronicleReport) => {
    // Mark report as read when clicked
    if (!report.isRead) {
      markReportAsRead(report.id);
    }

    if (report.reportType === 'PITCH') {
      // Handle pitch report inline
      setShowPitchPresentation(true);
      setIsPresentationMode(false);
    } else if (onReportSelect) {
      onReportSelect(report);
    } else {
      // Navigate to report detail page
      router.push(`/chronicle/${report.id}`);
    }
  };

  const handlePresent = () => {
    setIsPresentationMode(true);
  };

  const handleClosePresentation = () => {
    setIsPresentationMode(false);
  };

  const handleBackToChronicle = () => {
    setShowPitchPresentation(false);
    setIsPresentationMode(false);
  };

  const getReportTypeLabel = (type: string) => {
    if (type === 'PITCH') return 'Fortnightly';
    return type === 'DAILY' ? 'Daily' : type === 'WEEKLY' ? 'Weekly' : 'Monthly';
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'DAILY':
        return 'bg-blue-100 text-blue-800';
      case 'WEEKLY':
        return 'bg-green-100 text-green-800';
      case 'MONTHLY':
        return 'bg-purple-100 text-purple-800';
      case 'PITCH':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeLabel = (dateString: string, reportType: string) => {
    // For mock data, return specific labels based on report type
    if (reportType === 'PITCH') {
      return 'Future';
    } else if (reportType === 'WEEKLY') {
      return 'Now';
    } else if (reportType === 'DAILY') {
      return 'This Morning';
    }
    
    // Fallback for other types
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const reportDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check if it's in the future
    if (reportDate > today) {
      const diffTime = reportDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Tomorrow';
      } else if (diffDays <= 7) {
        return 'Next Week';
      } else if (diffDays <= 14) {
        return 'Next Week';
      } else if (diffDays <= 30) {
        return 'Next Month';
      } else {
        return formatDate(dateString);
      }
    }
    
    // Check if it's today
    if (reportDate.getTime() === today.getTime()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    if (reportDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    // Check if it's within the last week
    if (reportDate >= lastWeek) {
      return 'Last week';
    }
    
    // Check if it's within the last month
    if (reportDate >= lastMonth) {
      return 'Last month';
    }
    
    // Otherwise show the formatted date
    return formatDate(dateString);
  };

  // Filter reports based on search and type
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.content?.summary?.weekProgress?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || report.reportType === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    // Custom sort order: Future (PITCH) -> Now (WEEKLY) -> This Morning (DAILY)
    const order = { 'PITCH': 0, 'WEEKLY': 1, 'DAILY': 2, 'MONTHLY': 3 };
    const orderA = order[a.reportType] ?? 999;
    const orderB = order[b.reportType] ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If same type, sort by date
    return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
  });

  // Show loading state while waiting for workspace
  if (!workspaceId) {
    return (
      <div className="p-6">
        <div className="text-center text-muted">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full w-full">
        {/* Reports List */}
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-background rounded-lg border border-border p-6 animate-pulse">
                <div className="h-4 bg-loading-bg rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-loading-bg rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-loading-bg rounded w-full mb-2"></div>
                <div className="h-3 bg-loading-bg rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // Get pitch report data
  const pitchReport = reports.find(report => report.reportType === 'PITCH');

  // Show pitch presentation if selected
  if (showPitchPresentation && pitchReport) {
    return (
      <div className="h-full w-full">
        {isPresentationMode ? (
          <PresentationView 
            slideData={pitchReport.content} 
            onClose={handleClosePresentation}
          />
        ) : (
          <PitchRegularView 
            slideData={pitchReport.content} 
            onPresent={handlePresent}
            onBack={handleBackToChronicle}
            hideHeader={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* Search and Filters */}
      <div className="p-6 border-b border-border">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="PITCH">Pitch</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="p-6 overflow-y-auto invisible-scrollbar">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No reports found</h3>
            <p className="text-muted mb-4">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Reports are automatically generated daily and weekly.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleReportClick(report)}
                className="bg-background rounded-lg border border-border p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col gap-2">
                  {/* Pill at top */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {getTimeLabel(report.reportDate, report.reportType)}
                    </span>
                    <div className="flex items-center gap-2">
                      {!report.isRead && (
                        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                      <div className="text-xs text-foreground font-medium">
                        {formatTime(report.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Title and description */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-blue-700 transition-colors mb-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-muted line-clamp-1">
                      {report.content?.summary?.weekProgress || 
                       report.content?.summary?.executiveSummary || 
                       'Report generated automatically'}
                    </p>
                  </div>
                  
                  {/* Metrics at bottom */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-foreground">
                          {report.content?.activityMetrics?.callsCompleted || 0}
                        </div>
                        <div className="text-muted">Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">
                          {report.content?.activityMetrics?.emailsCompleted || 0}
                        </div>
                        <div className="text-muted">Emails</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">
                          {report.content?.conversionFunnel?.prospects || 0}
                        </div>
                        <div className="text-muted">Prospects</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">
                          {report.content?.conversionFunnel?.opportunities || 0}
                        </div>
                        <div className="text-muted">Opps</div>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-muted group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
