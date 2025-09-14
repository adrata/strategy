import { jsPDF } from 'jspdf';

/**
 * Simple PDF Generation Service for Metrics
 * Uses jsPDF v3 with proper TypeScript support
 */
export class SimplePdfService {
  private static instance: SimplePdfService;

  private constructor() {}

  public static getInstance(): SimplePdfService {
    if (!SimplePdfService.instance) {
      SimplePdfService['instance'] = new SimplePdfService();
    }
    return SimplePdfService.instance;
  }

  /**
   * Generate metrics report PDF with all metrics included
   */
  async generateMetricsReport(metrics: any, options: { username: string; workspaceId: string }): Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }> {
    try {
      console.log('📊 [Simple PDF Service] Generating metrics report for:', options.username);

      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let yPosition = 30;

      // Header with company branding
      yPosition = this.addHeader(doc, 'Adrata Pipeline Intelligence', yPosition);
      yPosition += 5;
      
      // Subtitle
      yPosition = this.addSubtitle(doc, `Generated for ${options.username} on ${new Date().toLocaleDateString()}`, yPosition);
      yPosition += 15;

      // Pipeline Health Section
      yPosition = this.addSectionHeader(doc, 'Pipeline Health Overview', yPosition);
      yPosition = this.addMetric(doc, 'Total Pipeline Value', `$${(metrics.totalPipelineValue || 0).toLocaleString()}`, yPosition);
      yPosition = this.addMetric(doc, 'Open Deals', `${metrics.openDeals || 0}`, yPosition);
      yPosition = this.addMetric(doc, 'Win Rate', `${(metrics.winRate || 0).toFixed(1)}%`, yPosition);
      yPosition = this.addMetric(doc, 'Average Deal Size', `$${(metrics.averageDealSize || 0).toLocaleString()}`, yPosition);
      yPosition += 10;

      // Sales Performance Section
      yPosition = this.addSectionHeader(doc, 'Sales Performance Metrics', yPosition);
      yPosition = this.addMetric(doc, 'Sales Velocity', `${metrics.salesVelocity || 0} days`, yPosition);
      yPosition = this.addMetric(doc, 'Pipeline Coverage', `${metrics.pipelineCoverage || 0}:1`, yPosition);
      yPosition = this.addMetric(doc, 'Monthly Growth', `${(metrics.monthlyGrowth || 0).toFixed(1)}%`, yPosition);
      yPosition = this.addMetric(doc, 'Quarterly Growth', `${(metrics.quarterlyGrowth || 0).toFixed(1)}%`, yPosition);
      yPosition += 10;

      // Lead Generation Section
      yPosition = this.addSectionHeader(doc, 'Lead Generation & Conversion', yPosition);
      yPosition = this.addMetric(doc, 'Total Leads', `${metrics.totalLeads || 0}`, yPosition);
      yPosition = this.addMetric(doc, 'Lead Conversion Rate', `${(metrics.leadConversionRate || 0).toFixed(1)}%`, yPosition);
      yPosition = this.addMetric(doc, 'Marketing Qualified Leads', `${metrics.mqlCount || 0}`, yPosition);
      yPosition = this.addMetric(doc, 'Sales Qualified Leads', `${metrics.sqlCount || 0}`, yPosition);
      yPosition += 10;

      // Deal Pipeline Section
      yPosition = this.addSectionHeader(doc, 'Deal Pipeline Stages', yPosition);
      yPosition = this.addMetric(doc, 'Prospecting', `${metrics.prospectingCount || 0} deals`, yPosition);
      yPosition = this.addMetric(doc, 'Qualification', `${metrics.qualificationCount || 0} deals`, yPosition);
      yPosition = this.addMetric(doc, 'Proposal', `${metrics.proposalCount || 0} deals`, yPosition);
      yPosition = this.addMetric(doc, 'Negotiation', `${metrics.negotiationCount || 0} deals`, yPosition);
      yPosition = this.addMetric(doc, 'Closed Won', `${metrics.closedWonCount || 0} deals`, yPosition);
      yPosition = this.addMetric(doc, 'Closed Lost', `${metrics.closedLostCount || 0} deals`, yPosition);
      yPosition += 10;

      // Revenue Metrics Section
      yPosition = this.addSectionHeader(doc, 'Revenue & Financial Metrics', yPosition);
      yPosition = this.addMetric(doc, 'Total Revenue', `$${(metrics.totalRevenue || 0).toLocaleString()}`, yPosition);
      yPosition = this.addMetric(doc, 'Average Revenue Per Deal', `$${(metrics.averageRevenuePerDeal || 0).toLocaleString()}`, yPosition);
      yPosition = this.addMetric(doc, 'Revenue Growth Rate', `${(metrics.revenueGrowthRate || 0).toFixed(1)}%`, yPosition);
      yPosition += 10;

      // Activity Metrics Section
      yPosition = this.addSectionHeader(doc, 'Activity & Engagement Metrics', yPosition);
      yPosition = this.addMetric(doc, 'Total Activities', `${metrics.totalActivities || 0}`, yPosition);
      yPosition = this.addMetric(doc, 'Average Activities Per Deal', `${(metrics.averageActivitiesPerDeal || 0).toFixed(1)}`, yPosition);
      yPosition = this.addMetric(doc, 'Response Time', `${metrics.averageResponseTime || 0} hours`, yPosition);
      yPosition += 10;

      // Team Performance Section
      yPosition = this.addSectionHeader(doc, 'Team Performance Metrics', yPosition);
      yPosition = this.addMetric(doc, 'Active Sales Reps', `${metrics.activeSalesReps || 0}`, yPosition);
      yPosition = this.addMetric(doc, 'Average Deals Per Rep', `${(metrics.averageDealsPerRep || 0).toFixed(1)}`, yPosition);
      yPosition = this.addMetric(doc, 'Top Performer', `${metrics.topPerformer || 'N/A'}`, yPosition);
      yPosition += 15;

      // Summary Section
      yPosition = this.addSectionHeader(doc, 'Report Summary', yPosition);
      yPosition = this.addSummaryText(doc, `This report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, yPosition);
      yPosition = this.addSummaryText(doc, `Workspace: ${options.workspaceId}`, yPosition);

      // Footer
      this.addFooter(doc, pageHeight);

      // Generate buffer
      const buffer = doc.output('arraybuffer');
      
      console.log('✅ [Simple PDF Service] PDF generated successfully');
      return { success: true, buffer };

    } catch (error) {
      console.error('❌ [Simple PDF Service] PDF generation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Add header to PDF
   */
  private addHeader(doc: jsPDF, title: string, yPosition: number): number {
    doc.setFillColor(5, 150, 105); // Adrata green
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPosition);
    
    return yPosition + 15;
  }

  /**
   * Add subtitle to PDF
   */
  private addSubtitle(doc: jsPDF, subtitle: string, yPosition: number): number {
    doc.setTextColor(107, 114, 128); // Gray
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, yPosition);
    
    return yPosition + 10;
  }

  /**
   * Add section header
   */
  private addSectionHeader(doc: jsPDF, title: string, yPosition: number): number {
    doc.setTextColor(5, 150, 105); // Adrata green
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPosition);
    
    return yPosition + 8;
  }

  /**
   * Add metric with label and value
   */
  private addMetric(doc: jsPDF, label: string, value: string, yPosition: number): number {
    // Label
    doc.setTextColor(55, 65, 81); // Dark gray
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 20, yPosition);
    
    // Value
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 120, yPosition);
    
    return yPosition + 6;
  }

  /**
   * Add summary text
   */
  private addSummaryText(doc: jsPDF, text: string, yPosition: number): number {
    doc.setTextColor(107, 114, 128); // Gray
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(text, 20, yPosition);
    
    return yPosition + 5;
  }

  /**
   * Add footer
   */
  private addFooter(doc: jsPDF, pageHeight: number): void {
    const footerY = pageHeight - 20;
    
    // Add a subtle line above footer
    doc.setDrawColor(5, 150, 105); // Adrata green
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 5, 190, footerY - 5);
    
    // Footer text
    doc.setTextColor(107, 114, 128); // Gray
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Adrata Pipeline Intelligence', 20, footerY);
    
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    doc.text(`Date: ${currentDate} at ${currentTime}`, 190, footerY, { align: 'right' });
  }
}
