"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { deepValueReportService, DeepValueReport } from "@/platform/services/deep-value-report-service";

interface ValueTabProps {
  record: any;
  recordType: string;
  onReportClick?: (report: DeepValueReport) => void;
}

interface ReportCardProps {
  report: DeepValueReport;
  onClick: () => void;
}

function ReportCard({ report, onClick }: ReportCardProps) {
  const getIcon = () => {
    switch (report.type) {
      case 'company':
        return <BuildingOfficeIcon className="w-6 h-6" />;
      case 'role':
        return <UserGroupIcon className="w-6 h-6" />;
      case 'industry':
        return <ChartBarIcon className="w-6 h-6" />;
      case 'buyer-group':
        return <UserGroupIcon className="w-6 h-6" />;
      default:
        return <DocumentTextIcon className="w-6 h-6" />;
    }
  };

  const getStatusIcon = () => {
    if (report.isGenerating) {
      return <ClockIcon className="w-4 h-4 text-blue-500 animate-spin" />;
    } else if (report.content) {
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    } else {
      return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (report.isGenerating) {
      return 'Generating...';
    } else if (report.content) {
      return 'Ready';
    } else {
      return 'Failed';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent)] hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[var(--accent-bg)] text-[var(--accent)] rounded-lg group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--foreground)] truncate">
              {report.title}
            </h3>
            {getStatusIcon()}
          </div>
          <p className="text-sm text-[var(--muted)] mb-2 line-clamp-2">
            {report.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted)] bg-[var(--panel-background)] px-2 py-1 rounded">
              {report.category}
            </span>
            <span className="text-xs text-[var(--muted)]">
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValueTab({ record, recordType, onReportClick }: ValueTabProps) {
  const [reports, setReports] = useState<DeepValueReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get workspace and user info (would come from context in real implementation)
  const workspaceId = 'workspace-id'; // TODO: Get from context
  const userId = 'user-id'; // TODO: Get from context

  const generateReports = useCallback(async () => {
    if (!record || !workspaceId || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const generatedReports = await deepValueReportService.generateAllReports(
        record,
        recordType,
        workspaceId,
        userId
      );
      setReports(generatedReports);
    } catch (error) {
      console.error('Failed to generate reports:', error);
      setError('Failed to generate reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [record, recordType, workspaceId, userId]);

  useEffect(() => {
    generateReports();
  }, [generateReports]);

  const handleReportClick = (report: DeepValueReport) => {
    if (onReportClick) {
      onReportClick(report);
    }
  };

  const handleRegenerateAll = () => {
    generateReports();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-[var(--muted)]">Generating deep value reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Failed to Generate Reports</h3>
          <p className="text-[var(--muted)] mb-4">{error}</p>
          <button
            onClick={handleRegenerateAll}
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Group reports by category
  const reportsByCategory = reports.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, DeepValueReport[]>);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">
            Deep Value Reports
          </h2>
          <p className="text-[var(--muted)]">
            AI-generated intelligence reports for {record.fullName || record.name || record.companyName || 'this record'}
          </p>
        </div>
        <button
          onClick={handleRegenerateAll}
          className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
        >
          Regenerate All
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(reportsByCategory).map(([category, categoryReports]) => (
          <div key={category}>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => handleReportClick(report)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Reports Available</h3>
          <p className="text-[var(--muted)] mb-4">
            We couldn't generate any reports for this record. Please try again.
          </p>
          <button
            onClick={handleRegenerateAll}
            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Generate Reports
          </button>
        </div>
      )}
    </div>
  );
}
