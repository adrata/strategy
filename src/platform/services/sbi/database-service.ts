/**
 * 🏢 SBI DATABASE SERVICE
 * 
 * Service for saving company analysis results to the database
 * Integrates with your existing Prisma schema
 */

import { PrismaClient } from '@prisma/client';
import { CompanyAnalysisResult, DatabaseSaveResult } from './types';

export class DatabaseService {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  /**
   * 💾 SAVE COMPANY ANALYSIS
   * 
   * Save the complete company analysis result to the database
   */
  async saveCompanyAnalysis(
    analysis: CompanyAnalysisResult
  ): Promise<DatabaseSaveResult> {
    try {
      console.log(`💾 Saving company analysis for: ${analysis.company.name}`);
      
      // Start transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Save or update company
        const company = await this.saveCompany(tx, analysis.company);
        
        // 2. Save people (executives)
        const peopleIds = await this.savePeople(tx, analysis.roles, company.id);
        
        // 3. Save opportunities (if any)
        const opportunitiesIds = await this.saveOpportunities(tx, analysis, company.id, peopleIds);
        
        return {
          companyId: company.id,
          peopleIds,
          opportunitiesIds
        };
      });
      
      console.log(`✅ Company analysis saved successfully: ${result.companyId}`);
      
      return {
        success: true,
        companyId: result.companyId,
        peopleIds: result.peopleIds,
        opportunitiesIds: result.opportunitiesIds
      };
      
    } catch (error) {
      console.error(`❌ Database save failed for ${analysis.company.name}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }
  
  /**
   * 🏢 SAVE COMPANY
   * 
   * Save or update company information
   */
  private async saveCompany(tx: any, company: any) {
    const companyData = {
      name: company.name,
      domain: company.domain,
      website: company.website,
      industry: company.industry,
      employeeCount: company.size ? parseInt(company.size) : null, // Use employeeCount instead of size
      hqLocation: company.location, // Use hqLocation instead of location
      // SBI-specific fields
      status: company.status,
      parentCompanyName: company.parentCompany?.name,
      parentCompanyDomain: company.parentCompany?.domain,
      acquisitionDate: company.acquisitionDate,
      confidence: company.confidence,
      sources: company.sources,
      lastVerified: company.lastVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Try to find existing company
    const existingCompany = await tx.companies.findFirst({
      where: {
        OR: [
          { domain: company.domain },
          { name: company.name }
        ]
      }
    });
    
    if (existingCompany) {
      // Update existing company
      return await tx.companies.update({
        where: { id: existingCompany.id },
        data: companyData
      });
    } else {
      // Create new company
      return await tx.companies.create({
        data: companyData
      });
    }
  }
  
  /**
   * 👥 SAVE PEOPLE
   * 
   * Save executive contacts
   */
  private async savePeople(tx: any, roles: any, companyId: string): Promise<string[]> {
    const peopleIds: string[] = [];
    
    // Save each executive role
    for (const [role, executive] of Object.entries(roles)) {
      if (executive && typeof executive === 'object' && 'name' in executive) {
        try {
          const personData = {
            name: executive.name,
            title: executive.title,
            email: executive.email,
            phone: executive.phone,
            linkedin: executive.linkedin,
            role: role.toUpperCase(),
            companyId: companyId,
            confidence: executive.confidence,
            sources: executive.sources,
            lastVerified: executive.lastVerified
          };
          
          // Try to find existing person
          const existingPerson = await tx.people.findFirst({
            where: {
              name: executive.name,
              companyId: companyId
            }
          });
          
          let person;
          if (existingPerson) {
            // Update existing person
            person = await tx.people.update({
              where: { id: existingPerson.id },
              data: personData
            });
          } else {
            // Create new person
            person = await tx.people.create({
              data: personData
            });
          }
          
          peopleIds.push(person.id);
          
        } catch (error) {
          console.error(`❌ Failed to save person ${executive.name}:`, error);
        }
      }
    }
    
    return peopleIds;
  }
  
  /**
   * 🎯 SAVE OPPORTUNITIES
   * 
   * Create opportunities for high-confidence executives
   */
  private async saveOpportunities(
    tx: any, 
    analysis: CompanyAnalysisResult, 
    companyId: string, 
    peopleIds: string[]
  ): Promise<string[]> {
    const opportunitiesIds: string[] = [];
    
    // Only create opportunities for high-confidence executives
    if (analysis.overallConfidence >= 70 && peopleIds.length > 0) {
      try {
        const opportunityData = {
          companyId: companyId,
          peopleIds: peopleIds,
          confidence: analysis.overallConfidence,
          status: 'new',
          source: 'sbi_bulk_analysis',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const opportunity = await tx.opportunity.create({
          data: opportunityData
        });
        
        opportunitiesIds.push(opportunity.id);
        
      } catch (error) {
        console.error(`❌ Failed to save opportunity:`, error);
      }
    }
    
    return opportunitiesIds;
  }
  
  /**
   * 📊 GET ANALYSIS STATISTICS
   * 
   * Get statistics about saved analyses
   */
  async getAnalysisStatistics(): Promise<{
    totalCompanies: number;
    totalPeople: number;
    totalOpportunities: number;
    averageConfidence: number;
  }> {
    try {
    const [totalCompanies, totalPeople, totalOpportunities, avgConfidence] = await Promise.all([
      this.prisma.companies.count(),
      this.prisma.people.count(),
      this.prisma.opportunities.count(),
      this.prisma.companies.aggregate({
        _avg: {
          confidence: true
        }
      })
    ]);
      
      return {
        totalCompanies,
        totalPeople,
        totalOpportunities,
        averageConfidence: avgConfidence._avg.confidence || 0
      };
      
    } catch (error) {
      console.error('❌ Failed to get analysis statistics:', error);
      return {
        totalCompanies: 0,
        totalPeople: 0,
        totalOpportunities: 0,
        averageConfidence: 0
      };
    }
  }
  
  /**
   * 🔍 SEARCH COMPANIES
   * 
   * Search for companies by name or domain
   */
  async searchCompanies(query: string): Promise<any[]> {
    try {
      return await this.prisma.companies.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { domain: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          people: true,
          opportunities: true
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to search companies:', error);
      return [];
    }
  }
  
  /**
   * 🏢 GET COMPANY BY ID
   * 
   * Retrieve a specific company by ID
   */
  async getCompanyById(id: string): Promise<any> {
    try {
      return await this.prisma.companies.findUnique({
        where: { id },
        include: {
          people: true,
          opportunities: true
        }
      });
    } catch (error) {
      console.error('❌ Failed to get company by ID:', error);
      return null;
    }
  }

  /**
   * 🔄 UPDATE COMPANY
   * 
   * Update company information
   */
  async updateCompany(id: string, data: any): Promise<any> {
    try {
      return await this.prisma.companies.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Failed to update company:', error);
      throw error;
    }
  }

  /**
   * 🗑️ DELETE COMPANY
   * 
   * Delete a company and related data
   */
  async deleteCompany(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete related people
        await tx.people.deleteMany({
          where: { companyId: id }
        });

        // Delete related opportunities
        await tx.opportunities.deleteMany({
          where: { companyId: id }
        });

        // Delete the company
        await tx.companies.delete({
          where: { id }
        });
      });
    } catch (error) {
      console.error('❌ Failed to delete company:', error);
      throw error;
    }
  }

  /**
   * 📊 GET COMPANIES WITH PAGINATION
   * 
   * Get companies with pagination support
   */
  async getCompanies(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      return await this.prisma.companies.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          people: true,
          opportunities: true
        }
      });
    } catch (error) {
      console.error('❌ Failed to get companies:', error);
      return [];
    }
  }

  /**
   * 🗑️ CLEANUP OLD ANALYSES
   * 
   * Remove old or low-confidence analyses
   */
  async cleanupOldAnalyses(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const deleted = await this.prisma.companies.deleteMany({
        where: {
          AND: [
            { createdAt: { lt: cutoffDate } },
            { confidence: { lt: 50 } }
          ]
        }
      });
      
      console.log(`🗑️ Cleaned up ${deleted.count} old analyses`);
      return deleted.count;
      
    } catch (error) {
      console.error('❌ Failed to cleanup old analyses:', error);
      return 0;
    }
  }
}
