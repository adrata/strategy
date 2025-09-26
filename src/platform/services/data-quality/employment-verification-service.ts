/**
 * 🔍 EMPLOYMENT VERIFICATION SERVICE
 * 
 * Comprehensive service for verifying and correcting people-company assignments
 */

import { PrismaClient } from '@prisma/client';

export interface EmploymentVerificationResult {
  personId: string;
  name: string;
  currentAssignment: string | null;
  correctAssignment: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  source: 'coresignal' | 'enriched' | 'email_domain' | 'manual' | 'none';
  verificationDate: Date;
  needsUpdate: boolean;
}

export interface DataQualityReport {
  totalPeople: number;
  verifiedAssignments: number;
  needsCorrection: number;
  noEmploymentData: number;
  highConfidenceFixes: EmploymentVerificationResult[];
  mediumConfidenceFixes: EmploymentVerificationResult[];
  lowConfidenceFixes: EmploymentVerificationResult[];
  noDataPeople: EmploymentVerificationResult[];
}

export class EmploymentVerificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 🔍 VERIFY ALL PEOPLE-COMPANY ASSIGNMENTS
   * 
   * Comprehensive verification of all people records
   */
  async verifyAllAssignments(workspaceId: string): Promise<DataQualityReport> {
    console.log('🔍 [EMPLOYMENT VERIFICATION] Starting comprehensive verification...');

    const people = await this.prisma.people.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        company: true
      }
    });

    const verificationResults: EmploymentVerificationResult[] = [];
    const noDataPeople: EmploymentVerificationResult[] = [];

    for (const person of people) {
      const verification = await this.verifyPersonAssignment(person);
      verificationResults.push(verification);
      
      if (verification.confidence === 'none') {
        noDataPeople.push(verification);
      }
    }

    const highConfidenceFixes = verificationResults.filter(v => v.confidence === 'high' && v.needsUpdate);
    const mediumConfidenceFixes = verificationResults.filter(v => v.confidence === 'medium' && v.needsUpdate);
    const lowConfidenceFixes = verificationResults.filter(v => v.confidence === 'low' && v.needsUpdate);

    const report: DataQualityReport = {
      totalPeople: people.length,
      verifiedAssignments: verificationResults.filter(v => v.confidence !== 'none').length,
      needsCorrection: verificationResults.filter(v => v.needsUpdate).length,
      noEmploymentData: noDataPeople.length,
      highConfidenceFixes,
      mediumConfidenceFixes,
      lowConfidenceFixes,
      noDataPeople
    };

    console.log('✅ [EMPLOYMENT VERIFICATION] Verification complete:', {
      totalPeople: report.totalPeople,
      needsCorrection: report.needsCorrection,
      noEmploymentData: report.noEmploymentData
    });

    return report;
  }

  /**
   * 🔍 VERIFY SINGLE PERSON ASSIGNMENT
   * 
   * Verify if a person is correctly assigned to their company
   */
  private async verifyPersonAssignment(person: any): Promise<EmploymentVerificationResult> {
    const coresignalData = person.customFields?.coresignalData;
    const enrichedData = person.customFields?.enrichedData;
    const assignedCompany = person.company?.name;
    const email = person.email;

    // Priority 1: CoreSignal data (most reliable)
    if (coresignalData?.active_experience_company_name) {
      const actualCompany = coresignalData.active_experience_company_name;
      const needsUpdate = actualCompany !== assignedCompany;
      
      return {
        personId: person.id,
        name: person.fullName,
        currentAssignment: assignedCompany,
        correctAssignment: actualCompany,
        confidence: 'high',
        source: 'coresignal',
        verificationDate: new Date(),
        needsUpdate
      };
    }

    // Priority 2: Enriched data
    if (enrichedData?.career?.currentCompany) {
      const actualCompany = enrichedData.career.currentCompany;
      const needsUpdate = actualCompany !== assignedCompany;
      
      return {
        personId: person.id,
        name: person.fullName,
        currentAssignment: assignedCompany,
        correctAssignment: actualCompany,
        confidence: 'medium',
        source: 'enriched',
        verificationDate: new Date(),
        needsUpdate
      };
    }

    // Priority 3: Email domain analysis
    if (email) {
      const emailDomain = this.extractEmailDomain(email);
      const inferredCompany = this.inferCompanyFromEmail(email);
      
      if (inferredCompany && inferredCompany !== assignedCompany) {
        return {
          personId: person.id,
          name: person.fullName,
          currentAssignment: assignedCompany,
          correctAssignment: inferredCompany,
          confidence: 'low',
          source: 'email_domain',
          verificationDate: new Date(),
          needsUpdate: true
        };
      }
    }

    // No employment data available
    return {
      personId: person.id,
      name: person.fullName,
      currentAssignment: assignedCompany,
      correctAssignment: null,
      confidence: 'none',
      source: 'manual',
      verificationDate: new Date(),
      needsUpdate: false
    };
  }

  /**
   * 🔧 APPLY HIGH CONFIDENCE FIXES
   * 
   * Automatically apply high confidence corrections
   */
  async applyHighConfidenceFixes(workspaceId: string): Promise<{ updated: number; errors: string[] }> {
    console.log('🔧 [EMPLOYMENT VERIFICATION] Applying high confidence fixes...');

    const report = await this.verifyAllAssignments(workspaceId);
    const highConfidenceFixes = report.highConfidenceFixes;
    
    let updated = 0;
    const errors: string[] = [];

    for (const fix of highConfidenceFixes) {
      try {
        // Find the correct company
        const correctCompany = await this.prisma.companies.findFirst({
          where: { 
            workspaceId,
            name: fix.correctAssignment,
            deletedAt: null
          }
        });

        if (correctCompany) {
          await this.prisma.people.update({
            where: { id: fix.personId },
            data: { companyId: correctCompany.id }
          });
          
          console.log(`✅ [FIX APPLIED] ${fix.name}: ${fix.currentAssignment} → ${fix.correctAssignment}`);
          updated++;
        } else {
          console.log(`⚠️ [COMPANY NOT FOUND] ${fix.name}: ${fix.correctAssignment}`);
          errors.push(`Company not found: ${fix.correctAssignment} for ${fix.name}`);
        }
      } catch (error) {
        console.error(`❌ [FIX FAILED] ${fix.name}:`, error);
        errors.push(`Failed to update ${fix.name}: ${error.message}`);
      }
    }

    console.log(`✅ [EMPLOYMENT VERIFICATION] Applied ${updated} high confidence fixes`);
    return { updated, errors };
  }

  /**
   * 📊 GENERATE DATA QUALITY REPORT
   * 
   * Generate comprehensive data quality report
   */
  async generateDataQualityReport(workspaceId: string): Promise<DataQualityReport> {
    const report = await this.verifyAllAssignments(workspaceId);
    
    console.log('📊 [DATA QUALITY REPORT]');
    console.log('========================');
    console.log(`Total People: ${report.totalPeople}`);
    console.log(`Verified Assignments: ${report.verifiedAssignments}`);
    console.log(`Needs Correction: ${report.needsCorrection}`);
    console.log(`No Employment Data: ${report.noEmploymentData}`);
    console.log(`High Confidence Fixes: ${report.highConfidenceFixes.length}`);
    console.log(`Medium Confidence Fixes: ${report.mediumConfidenceFixes.length}`);
    console.log(`Low Confidence Fixes: ${report.lowConfidenceFixes.length}`);
    
    return report;
  }

  /**
   * 🔍 EXTRACT EMAIL DOMAIN
   */
  private extractEmailDomain(email: string): string | null {
    if (!email || typeof email !== 'string') return null;
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : null;
  }

  /**
   * 🏢 INFER COMPANY FROM EMAIL
   */
  private inferCompanyFromEmail(email: string): string | null {
    const domain = this.extractEmailDomain(email);
    if (!domain) return null;
    
    // Remove common TLDs and convert to company name
    const companyName = domain
      .replace(/\.(com|org|net|gov|edu)$/, '')
      .replace(/[^a-z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return companyName;
  }

  /**
   * 🧹 CLEANUP
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}
