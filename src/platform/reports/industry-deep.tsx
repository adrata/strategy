import React, { useState, useEffect } from "react";
import { AIReportGenerator } from "@/platform/services/ai-report-generator";
import { useUnifiedAuth } from "@/platform/auth";

export interface IndustryDeepReportProps {
  company: string;
  title?: string;
  industry?: string;
  companySize?: string;
  employeeCount?: number;
  companyType?: string;
  website?: string;
  location?: string;
  data?: any;
  onBack?: () => void;
}

export function IndustryDeepReport({
  company,
  title = "Industry Analysis",
  industry,
  companySize,
  employeeCount,
  companyType,
  website,
  location,
  data,
  onBack,
}: IndustryDeepReportProps) {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUnifiedAuth();

  useEffect(() => {
    generateReport();
  }, [company]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const reportGenerator = new AIReportGenerator();
      const generatedReport = await reportGenerator.generateCompanyReport(
        company,
        'industry',
        user?.workspaceId || '',
        undefined
      );
      
      setReport(generatedReport);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Back to Reports
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--foreground)] mx-auto mb-4"></div>
              <p className="text-[var(--muted)]">Generating comprehensive industry analysis...</p>
              <p className="text-sm text-[var(--muted)] mt-2">This may take a few moments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Back to Reports
              </button>
            )}
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Generating Report</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
            <p className="text-[var(--muted)] mt-1">Comprehensive industry analysis for {company}</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Back to Reports
            </button>
          )}
        </div>

        {/* Company Overview */}
        <div className="bg-[var(--background)] rounded-lg p-6 border border-[var(--border)] dark:border-[var(--border)] mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-[var(--muted)]">Company:</span>
              <p className="font-medium text-[var(--foreground)]">{company}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--muted)]">Industry:</span>
              <p className="font-medium text-[var(--foreground)]">{industry || 'Manufacturing'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--muted)]">Size:</span>
              <p className="font-medium text-[var(--foreground)]">{companySize || '501-1000 employees'}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--muted)]">Type:</span>
              <p className="font-medium text-[var(--foreground)]">{companyType || 'Public Company'}</p>
            </div>
          </div>
        </div>

        {/* AI Generated Report */}
        <div className="bg-[var(--background)] rounded-lg p-6 border border-[var(--border)] dark:border-[var(--border)]">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-[var(--foreground)]">
              {report}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndustryDeepReport;
