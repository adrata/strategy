/**
 * 📊 EXCEL IMPORT SERVICE
 * 
 * Intelligent Excel file processing with smart column mapping,
 * deduplication, and automatic connection point generation
 */

import { prisma } from '@/lib/prisma';

export interface ExcelImportOptions {
  userIntent?: string;
  autoCreateCompanies?: boolean;
  defaultStatus?: 'LEAD' | 'PROSPECT' | 'CUSTOMER';
  createConnectionPoints?: boolean;
  skipDuplicates?: boolean;
}

export interface ExcelImportResults {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  importType: 'people' | 'companies' | 'mixed';
  columnMapping: Record<string, string>;
  preview: any[];
  recommendations: string[];
  confidence: number;
  createdPeople: any[];
  createdCompanies: any[];
  createdActions: any[];
}

export class ExcelImportService {
  private workspaceId: string;
  private userId: string;
  private results: ExcelImportResults;

  constructor(workspaceId: string, userId: string) {
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.results = {
      totalRecords: 0,
      importedRecords: 0,
      skippedRecords: 0,
      errors: [],
      importType: 'people',
      columnMapping: {},
      preview: [],
      recommendations: [],
      confidence: 0,
      createdPeople: [],
      createdCompanies: [],
      createdActions: []
    };
  }

  async processExcelFile(file: File, options: ExcelImportOptions = {}): Promise<ExcelImportResults> {
    try {
      console.log('📊 [EXCEL IMPORT SERVICE] Starting Excel processing...');
      
      // Parse Excel file
      const { UniversalDocumentParser } = await import('@/platform/services/universal-document-parser');
      const parsedData = await UniversalDocumentParser.parseExcelData(file);
      
      if (!parsedData.tables || parsedData.tables.length === 0) {
        throw new Error('No data tables found in Excel file');
      }
      
      // Use first sheet as primary data
      const data = parsedData.tables[0];
      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];
      
      this.results.totalRecords = rows.length;
      console.log(`📋 [EXCEL IMPORT SERVICE] Found ${rows.length} records with headers:`, headers);
      
      // Intelligent column mapping
      this.results.columnMapping = this.mapColumns(headers);
      console.log('🔗 [EXCEL IMPORT SERVICE] Column mapping:', this.results.columnMapping);
      
      // Detect import type
      this.results.importType = this.detectImportType(headers, rows.slice(0, 5));
      console.log(`🎯 [EXCEL IMPORT SERVICE] Detected import type: ${this.results.importType}`);
      
      // Generate preview and recommendations
      this.generatePreviewAndRecommendations(headers, rows, options);
      
      // Process data based on import type
      if (this.results.importType === 'people' || this.results.importType === 'mixed') {
        await this.processPeopleData(rows, options);
      }
      
      if (this.results.importType === 'companies' || this.results.importType === 'mixed') {
        await this.processCompaniesData(rows, options);
      }
      
      // Calculate confidence score
      this.results.confidence = this.calculateConfidence();
      
      console.log('✅ [EXCEL IMPORT SERVICE] Processing completed:', this.results);
      return this.results;
      
    } catch (error) {
      console.error('❌ [EXCEL IMPORT SERVICE] Error:', error);
      this.results.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private mapColumns(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    // Define column patterns for fuzzy matching
    const columnPatterns = {
      // People fields
      firstName: ['first', 'fname', 'given', 'forename'],
      lastName: ['last', 'lname', 'surname', 'family'],
      fullName: ['name', 'full', 'complete', 'contact'],
      email: ['email', 'e-mail', 'mail', 'address'],
      phone: ['phone', 'tel', 'mobile', 'cell', 'telephone'],
      jobTitle: ['title', 'position', 'role', 'job', 'designation'],
      company: ['company', 'organization', 'org', 'firm', 'business'],
      department: ['dept', 'division', 'team', 'unit'],
      
      // Company fields
      companyName: ['company', 'organization', 'org', 'firm', 'business'],
      website: ['website', 'url', 'web', 'site'],
      industry: ['industry', 'sector', 'vertical', 'domain'],
      size: ['size', 'employees', 'headcount', 'staff'],
      
      // Address fields
      address: ['address', 'street', 'location'],
      city: ['city', 'town', 'municipality'],
      state: ['state', 'province', 'region'],
      country: ['country', 'nation'],
      postalCode: ['zip', 'postal', 'code', 'postcode'],
      
      // Status and engagement
      status: ['status', 'stage', 'phase', 'state'],
      priority: ['priority', 'importance', 'level'],
      source: ['source', 'origin', 'referral'],
      lastContact: ['last', 'contact', 'touch', 'reach'],
      nextAction: ['next', 'action', 'follow', 'up']
    };
    
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      let mappedField = '';
      
      // Direct match first
      for (const [field, patterns] of Object.entries(columnPatterns)) {
        if (patterns.some(pattern => normalizedHeader.includes(pattern))) {
          mappedField = field;
          break;
        }
      }
      
      // Fuzzy matching for close matches
      if (!mappedField) {
        for (const [field, patterns] of Object.entries(columnPatterns)) {
          if (patterns.some(pattern => this.calculateSimilarity(normalizedHeader, pattern) > 0.7)) {
            mappedField = field;
            break;
          }
        }
      }
      
      if (mappedField) {
        mapping[header] = mappedField;
      }
    });
    
    return mapping;
  }

  private detectImportType(headers: string[], sampleRows: any[][]): 'people' | 'companies' | 'mixed' {
    const headerText = headers.join(' ').toLowerCase();
    
    // Check for company-specific indicators
    const companyIndicators = ['revenue', 'employees', 'industry', 'website', 'founded', 'headquarters'];
    const hasCompanyIndicators = companyIndicators.some(indicator => headerText.includes(indicator));
    
    // Check for people-specific indicators
    const peopleIndicators = ['first', 'last', 'email', 'phone', 'title', 'name'];
    const hasPeopleIndicators = peopleIndicators.some(indicator => headerText.includes(indicator));
    
    if (hasCompanyIndicators && hasPeopleIndicators) {
      return 'mixed';
    } else if (hasCompanyIndicators) {
      return 'companies';
    } else {
      return 'people';
    }
  }

  private generatePreviewAndRecommendations(headers: string[], rows: any[][], options: ExcelImportOptions) {
    // Generate preview of first 5 rows
    this.results.preview = rows.slice(0, 5).map((row, index) => {
      const previewRow: any = {};
      headers.forEach((header, colIndex) => {
        previewRow[header] = row[colIndex] || '';
      });
      return previewRow;
    });
    
    // Generate recommendations
    this.results.recommendations = [];
    
    if (this.results.importType === 'people') {
      this.results.recommendations.push('Detected people data - will create person records');
      if (options.autoCreateCompanies !== false) {
        this.results.recommendations.push('Companies will be created automatically if not found');
      }
    }
    
    if (this.results.importType === 'companies') {
      this.results.recommendations.push('Detected company data - will create company records');
    }
    
    if (this.results.importType === 'mixed') {
      this.results.recommendations.push('Detected mixed data - will create both people and companies');
    }
    
    if (options.createConnectionPoints !== false) {
      this.results.recommendations.push('Connection points will be created automatically');
    }
  }

  private async processPeopleData(rows: any[][], options: ExcelImportOptions) {
    console.log('👥 [EXCEL IMPORT SERVICE] Processing people data...');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowData = this.mapRowData(row);
      
      try {
        // Skip if no essential data
        if (!rowData.email && !rowData.fullName) {
          this.results.skippedRecords++;
          continue;
        }
        
        // Find or create company
        let company = null;
        if (rowData.company) {
          company = await this.findOrCreateCompany(rowData.company, options);
        }
        
        // Check for duplicates
        if (options.skipDuplicates !== false) {
          const existingPerson = await this.findExistingPerson(rowData);
          if (existingPerson) {
            this.results.skippedRecords++;
            continue;
          }
        }
        
        // Create person
        const person = await this.createPerson(rowData, company?.id, options);
        this.results.createdPeople.push(person);
        this.results.importedRecords++;
        
        // Create connection points
        if (options.createConnectionPoints !== false) {
          await this.createConnectionPoints(person, rowData, options);
        }
        
      } catch (error) {
        console.error(`❌ [EXCEL IMPORT SERVICE] Error processing row ${i + 1}:`, error);
        this.results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: rowData
        });
      }
    }
  }

  private async processCompaniesData(rows: any[][], options: ExcelImportOptions) {
    console.log('🏢 [EXCEL IMPORT SERVICE] Processing companies data...');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowData = this.mapRowData(row);
      
      try {
        if (!rowData.companyName) {
          this.results.skippedRecords++;
          continue;
        }
        
        // Check for duplicates
        if (options.skipDuplicates !== false) {
          const existingCompany = await this.findExistingCompany(rowData.companyName);
          if (existingCompany) {
            this.results.skippedRecords++;
            continue;
          }
        }
        
        // Create company
        const company = await this.createCompany(rowData, options);
        this.results.createdCompanies.push(company);
        this.results.importedRecords++;
        
      } catch (error) {
        console.error(`❌ [EXCEL IMPORT SERVICE] Error processing row ${i + 1}:`, error);
        this.results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: rowData
        });
      }
    }
  }

  private mapRowData(row: any[]): any {
    const rowData: any = {};
    const headers = Object.keys(this.results.columnMapping);
    
    headers.forEach((header, index) => {
      const mappedField = this.results.columnMapping[header];
      if (mappedField && row[index] !== undefined && row[index] !== null && row[index] !== '') {
        rowData[mappedField] = String(row[index]).trim();
      }
    });
    
    return rowData;
  }

  private async findOrCreateCompany(companyName: string, options: ExcelImportOptions) {
    // Try to find existing company
    const existingCompany = await this.findExistingCompany(companyName);
    if (existingCompany) {
      return existingCompany;
    }
    
    // Create new company if auto-create is enabled
    if (options.autoCreateCompanies !== false) {
      return await this.createCompany({ companyName }, options);
    }
    
    return null;
  }

  private async findExistingCompany(companyName: string) {
    return await prisma.companies.findFirst({
      where: {
        name: {
          contains: companyName,
          mode: 'insensitive'
        },
        workspaceId: this.workspaceId
      }
    });
  }

  private async findExistingPerson(rowData: any) {
    const whereConditions: any = {
      workspaceId: this.workspaceId
    };
    
    if (rowData.email) {
      whereConditions.OR = [
        { email: rowData.email },
        { workEmail: rowData.email },
        { personalEmail: rowData.email }
      ];
    } else if (rowData.fullName) {
      whereConditions.fullName = {
        contains: rowData.fullName,
        mode: 'insensitive'
      };
    } else {
      return null;
    }
    
    return await prisma.people.findFirst({
      where: whereConditions
    });
  }

  private async createPerson(rowData: any, companyId: string | null, options: ExcelImportOptions) {
    const fullName = rowData.fullName || `${rowData.firstName || ''} ${rowData.lastName || ''}`.trim();
    const status = this.determinePersonStatus(rowData, options);
    
    return await prisma.people.create({
      data: {
        workspaceId: this.workspaceId,
        companyId: companyId,
        firstName: rowData.firstName || fullName.split(' ')[0] || '',
        lastName: rowData.lastName || fullName.split(' ').slice(1).join(' ') || '',
        fullName: fullName,
        email: rowData.email,
        phone: rowData.phone,
        jobTitle: rowData.jobTitle,
        department: rowData.department,
        city: rowData.city,
        state: rowData.state,
        country: rowData.country || 'United States',
        status: status,
        priority: this.determinePersonPriority(rowData),
        source: 'excel_import',
        customFields: {
          importSource: 'excel_import',
          originalData: rowData,
          importedAt: new Date().toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private async createCompany(rowData: any, options: ExcelImportOptions) {
    return await prisma.companies.create({
      data: {
        workspaceId: this.workspaceId,
        name: rowData.companyName,
        website: rowData.website,
        industry: rowData.industry,
        hqCity: rowData.city,
        hqState: rowData.state,
        hqCountryIso2: rowData.country || 'US', // Use ISO2 country code instead of hqCountry
        status: 'ACTIVE',
        sources: ['excel_import'], // Use sources array instead of source field
        customFields: {
          importSource: 'excel_import',
          originalData: rowData,
          importedAt: new Date().toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  private determinePersonStatus(rowData: any, options: ExcelImportOptions): 'LEAD' | 'PROSPECT' | 'CUSTOMER' {
    if (options.defaultStatus) {
      return options.defaultStatus;
    }
    
    // AI-based status determination
    const dataString = JSON.stringify(rowData).toLowerCase();
    
    // Check for customer indicators
    if (dataString.includes('customer') || dataString.includes('client') || 
        dataString.includes('revenue') || dataString.includes('purchase')) {
      return 'CUSTOMER';
    }
    
    // Check for prospect indicators
    if (rowData.lastContact || rowData.nextAction || 
        dataString.includes('meeting') || dataString.includes('demo') ||
        dataString.includes('proposal') || dataString.includes('quote')) {
      return 'PROSPECT';
    }
    
    // Check job title for seniority
    if (rowData.jobTitle) {
      const title = rowData.jobTitle.toLowerCase();
      if (title.includes('ceo') || title.includes('president') || 
          title.includes('founder') || title.includes('owner')) {
        return 'PROSPECT';
      }
    }
    
    return 'LEAD';
  }

  private determinePersonPriority(rowData: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (rowData.jobTitle) {
      const title = rowData.jobTitle.toLowerCase();
      if (title.includes('ceo') || title.includes('president') || 
          title.includes('founder') || title.includes('owner') ||
          title.includes('vp') || title.includes('director')) {
        return 'HIGH';
      }
    }
    
    // Check data completeness
    const fields = ['email', 'phone', 'jobTitle', 'company'];
    const completedFields = fields.filter(field => rowData[field]);
    
    if (completedFields.length >= 3) {
      return 'HIGH';
    } else if (completedFields.length >= 2) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private async createConnectionPoints(person: any, rowData: any, options: ExcelImportOptions) {
    const actions = [];
    
    // Always create import activity
    const importAction = await prisma.actions.create({
      data: {
        workspaceId: this.workspaceId,
        userId: this.userId,
        personId: person.id,
        companyId: person.companyId,
        type: 'NOTE',
        subject: 'Imported from Excel',
        description: `Person imported from Excel file with data: ${JSON.stringify(rowData)}`,
        status: 'COMPLETED',
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    actions.push(importAction);
    
    // Create historical activities from date columns
    if (rowData.lastContact) {
      const lastContactAction = await prisma.actions.create({
        data: {
          workspaceId: this.workspaceId,
          userId: this.userId,
          personId: person.id,
          companyId: person.companyId,
          type: 'CALL',
          subject: 'Last Contact',
          description: `Last contact recorded in Excel: ${rowData.lastContact}`,
          status: 'COMPLETED',
          completedAt: new Date(rowData.lastContact),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      actions.push(lastContactAction);
    }
    
    // Create next action if specified
    if (rowData.nextAction) {
      const nextAction = await prisma.actions.create({
        data: {
          workspaceId: this.workspaceId,
          userId: this.userId,
          personId: person.id,
          companyId: person.companyId,
          type: 'CALL',
          subject: 'Next Action',
          description: `Next action from Excel: ${rowData.nextAction}`,
          status: 'PLANNED',
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      actions.push(nextAction);
    }
    
    this.results.createdActions.push(...actions);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateConfidence(): number {
    let confidence = 0;
    
    // Base confidence on column mapping quality
    const mappedColumns = Object.keys(this.results.columnMapping).length;
    const totalColumns = Object.keys(this.results.columnMapping).length;
    confidence += (mappedColumns / Math.max(totalColumns, 1)) * 40;
    
    // Confidence based on data completeness
    const avgCompleteness = this.results.preview.reduce((sum, row) => {
      const fields = Object.values(row).filter(value => value && value.toString().trim() !== '');
      return sum + (fields.length / Object.keys(row).length);
    }, 0) / this.results.preview.length;
    confidence += avgCompleteness * 30;
    
    // Confidence based on import success rate
    const successRate = this.results.totalRecords > 0 ? 
      this.results.importedRecords / this.results.totalRecords : 0;
    confidence += successRate * 30;
    
    return Math.round(confidence);
  }
}
