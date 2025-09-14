/**
 * 📊 PDF GENERATION SERVICE
 * 
 * Robust PDF generation with error handling and fallbacks
 * Handles metrics reports, charts, and other content types
 */

export interface PDFGenerationOptions {
  title: string;
  subtitle?: string;
  content: PDFContent[];
  branding?: {
    logo?: string;
    companyName?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  };
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export interface PDFContent {
  type: 'text' | 'table' | 'chart' | 'image' | 'spacer';
  data: any;
  style?: {
    fontSize?: number;
    color?: string;
    alignment?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
  };
}

export class PDFGenerationService {
  private static instance: PDFGenerationService;
  private jsPDF: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PDFGenerationService {
    if (!PDFGenerationService.instance) {
      PDFGenerationService['instance'] = new PDFGenerationService();
    }
    return PDFGenerationService.instance;
  }

  /**
   * Initialize jsPDF library
   */
  private async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      const jsPDFModule = await import('jspdf');
      this['jsPDF'] = jsPDFModule.default;
      this['isInitialized'] = true;
      console.log('✅ [PDF Service] jsPDF initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [PDF Service] Failed to initialize jsPDF:', error);
      return false;
    }
  }

  /**
   * Generate PDF from options
   */
  async generatePDF(options: PDFGenerationOptions): Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'PDF library not available' };
      }

      console.log('📊 [PDF Service] Generating PDF:', options.title);

      // Create new document
      const doc = new this.jsPDF();
      
      // Set default font
      try {
        doc.setFont('helvetica');
      } catch (error) {
        console.warn('⚠️ [PDF Service] Font setting failed, using default');
      }

      let yPosition = 30;

      // Header
      yPosition = this.addHeader(doc, options.title, yPosition);
      
      // Subtitle
      if (options.subtitle) {
        yPosition = this.addSubtitle(doc, options.subtitle, yPosition);
      }

      // Content
      yPosition = this.addContent(doc, options.content, yPosition);

      // Footer
      this.addFooter(doc, options.branding);

      // Generate buffer
      const buffer = doc.output('arraybuffer');
      
      console.log('✅ [PDF Service] PDF generated successfully');
      return { success: true, buffer };

    } catch (error) {
      console.error('❌ [PDF Service] PDF generation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Add header to PDF
   */
  private addHeader(doc: any, title: string, yPosition: number): number {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, yPosition);
    return yPosition + 20;
  }

  /**
   * Add subtitle to PDF
   */
  private addSubtitle(doc: any, subtitle: string, yPosition: number): number {
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 20, yPosition);
    return yPosition + 15;
  }

  /**
   * Add content to PDF
   */
  private addContent(doc: any, content: PDFContent[], startY: number): number {
    let yPosition = startY;

    for (const item of content) {
      switch (item.type) {
        case 'text':
          yPosition = this.addText(doc, item.data, item.style, yPosition);
          break;
        case 'table':
          yPosition = this.addTable(doc, item.data, yPosition);
          break;
        case 'spacer':
          yPosition += item.data.height || 10;
          break;
        default:
          console.warn(`⚠️ [PDF Service] Unsupported content type: ${item.type}`);
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
    }

    return yPosition;
  }

  /**
   * Add text content
   */
  private addText(doc: any, text: string, style: any = {}, yPosition: number): number {
    const fontSize = style.fontSize || 12;
    const color = style.color || '#000000';
    const alignment = style.alignment || 'left';
    const bold = style.bold || false;
    const italic = style.italic || false;

    doc.setFontSize(fontSize);
    doc.setTextColor(...this.hexToRgb(color));
    
    if (bold) doc.setFont('helvetica', 'bold');
    if (italic) doc.setFont('helvetica', 'italic');

    // Handle text wrapping
    const maxWidth = 170; // Page width minus margins
    const lines = this.wrapText(text, maxWidth, doc);
    
    // Calculate x position based on alignment
    let xPosition = 20; // Default left alignment
    if (alignment === 'center') {
      xPosition = 105; // Center of page
    } else if (alignment === 'right') {
      xPosition = 190; // Right margin
    }

    // Add each line
    for (const line of lines) {
      if (alignment === 'center') {
        doc.text(line, xPosition, yPosition, { align: 'center' });
      } else if (alignment === 'right') {
        doc.text(line, xPosition, yPosition, { align: 'right' });
      } else {
        doc.text(line, xPosition, yPosition);
      }
      yPosition += fontSize * 0.4; // Line height
    }

    // Reset font
    doc.setFont('helvetica', 'normal');
    
    return yPosition + 5;
  }

  /**
   * Add table content
   */
  private addTable(doc: any, tableData: any, yPosition: number): number {
    const { headers, rows } = tableData;
    const colWidths = [60, 60, 50]; // Adjust based on content
    
    // Headers
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    let xPos = 20;
    headers.forEach((header: string, index: number) => {
      doc.text(header, xPos, yPosition);
      xPos += colWidths[index] || 60;
    });
    
    yPosition += 15;
    
    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    rows.forEach((row: any[]) => {
      xPos = 20;
      row.forEach((cell: string, index: number) => {
        doc.text(cell.toString(), xPos, yPosition);
        xPos += colWidths[index] || 60;
      });
      yPosition += 12;
    });
    
    return yPosition + 10;
  }

  /**
   * Add footer
   */
  private addFooter(doc: any, branding?: any): void {
    const companyName = branding?.companyName || 'Adrata Corporation';
    const currentDate = new Date().toLocaleDateString();
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by ${companyName}`, 20, 280);
    doc.text(`Date: ${currentDate}`, 20, 290);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  /**
   * Wrap text to fit within width
   */
  private wrapText(text: string, maxWidth: number, doc: any): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }

  /**
   * Generate metrics report PDF
   */
  async generateMetricsReport(metrics: any, options: { username: string; workspaceId: string }): Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }> {
    const pdfOptions: PDFGenerationOptions = {
      title: 'Pipeline Metrics Report',
      subtitle: `Generated for ${options.username} on ${new Date().toLocaleDateString()}`,
      content: [
        // Header with company branding
        {
          type: 'text',
          data: 'Adrata Pipeline Intelligence',
          style: { fontSize: 18, bold: true, color: '#1f2937', alignment: 'center' }
        },
        { type: 'spacer', data: { height: 20 } },
        
        // Pipeline Health Section
        {
          type: 'text',
          data: 'Pipeline Health Overview',
          style: { fontSize: 16, bold: true, color: '#059669' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `Total Pipeline Value: $${(metrics.totalPipelineValue || 0).toLocaleString()}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Open Deals: ${metrics.openDeals || 0}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Win Rate: ${(metrics.winRate || 0).toFixed(1)}%`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Average Deal Size: $${(metrics.averageDealSize || 0).toLocaleString()}`,
          style: { fontSize: 12, color: '#374151' }
        },
        { type: 'spacer', data: { height: 15 } },
        
        // Sales Performance Section
        {
          type: 'text',
          data: 'Sales Performance Metrics',
          style: { fontSize: 16, bold: true, color: '#059669' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `Sales Velocity: ${metrics.salesVelocity || 0} days`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Pipeline Coverage: ${metrics.pipelineCoverage || 0}:1`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Monthly Growth: ${(metrics.monthlyGrowth || 0).toFixed(1)}%`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Quarterly Growth: ${(metrics.quarterlyGrowth || 0).toFixed(1)}%`,
          style: { fontSize: 12, color: '#374151' }
        },
        { type: 'spacer', data: { height: 15 } },
        
        // Lead Generation Section
        {
          type: 'text',
          data: 'Lead Generation & Conversion',
          style: { fontSize: 16, bold: true, color: '#059669' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `Total Leads: ${metrics.totalLeads || 0}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Lead Conversion Rate: ${(metrics.leadConversionRate || 0).toFixed(1)}%`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Marketing Qualified Leads: ${metrics.mqlCount || 0}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Sales Qualified Leads: ${metrics.sqlCount || 0}`,
          style: { fontSize: 12, color: '#374151' }
        },
        { type: 'spacer', data: { height: 15 } },
        
        // Deal Pipeline Section
        {
          type: 'text',
          data: 'Deal Pipeline Stages',
          style: { fontSize: 16, bold: true, color: '#059669' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `Prospecting: ${metrics.prospectingCount || 0} deals`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Qualification: ${metrics.qualificationCount || 0} deals`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Proposal: ${metrics.proposalCount || 0} deals`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Negotiation: ${metrics.negotiationCount || 0} deals`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Closed Won: ${metrics.closedWonCount || 0} deals`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Closed Lost: ${metrics.closedLostCount || 0} deals`,
          style: { fontSize: 12, color: '#374151' }
        },
        { type: 'spacer', data: { height: 15 } },
        
        // Revenue Metrics Section
        {
          type: 'text',
          data: 'Revenue & Financial Metrics',
          style: { fontSize: 16, bold: true, color: '#059669' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `Total Revenue: $${(metrics.totalRevenue || 0).toLocaleString()}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Average Revenue Per Deal: $${(metrics.averageRevenuePerDeal || 0).toLocaleString()}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Revenue Growth Rate: ${(metrics.revenueGrowthRate || 0).toFixed(1)}%`,
          style: { fontSize: 12, color: '#374151' }
        },
        { type: 'spacer', data: { height: 15 } },
        
        // Activity Metrics Section
        {
          type: 'text',
          data: 'Activity & Engagement Metrics',
          style: { fontSize: 16, bold: true, color: '#059669' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `Total Activities: ${metrics.totalActivities || 0}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Average Activities Per Deal: ${(metrics.averageActivitiesPerDeal || 0).toFixed(1)}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Response Time: ${metrics.averageResponseTime || 0} hours`,
          style: { fontSize: 12, color: '#374151' }
        },
        { type: 'spacer', data: { height: 15 } },
        
        // Team Performance Section
        {
          type: 'text',
          data: 'Team Performance Metrics',
          style: { fontSize: 16, bold: true, color: '#059669' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `Active Sales Reps: ${metrics.activeSalesReps || 0}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Average Deals Per Rep: ${(metrics.averageDealsPerRep || 0).toFixed(1)}`,
          style: { fontSize: 12, color: '#374151' }
        },
        {
          type: 'text',
          data: `Top Performer: ${metrics.topPerformer || 'N/A'}`,
          style: { fontSize: 12, color: '#374151' }
        },
        { type: 'spacer', data: { height: 20 } },
        
        // Summary Section
        {
          type: 'text',
          data: 'Report Summary',
          style: { fontSize: 14, bold: true, color: '#1f2937' }
        },
        { type: 'spacer', data: { height: 10 } },
        {
          type: 'text',
          data: `This report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          style: { fontSize: 10, color: '#6b7280', italic: true }
        },
        {
          type: 'text',
          data: `Workspace: ${options.workspaceId}`,
          style: { fontSize: 10, color: '#6b7280', italic: true }
        }
      ],
      branding: {
        companyName: 'Adrata Pipeline Intelligence',
        colors: {
          primary: '#059669',
          secondary: '#6b7280',
          accent: '#1f2937'
        }
      }
    };

    try {
      // Generate the PDF using the existing generatePDF method
      const result = await this.generatePDF(pdfOptions);
      
      if (result['success'] && result.buffer) {
        return {
          success: true,
          buffer: result.buffer
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to generate PDF'
        };
      }
    } catch (error) {
      console.error('Error generating metrics report PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
