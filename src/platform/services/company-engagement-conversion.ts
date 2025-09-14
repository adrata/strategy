/**
 * Company Engagement Conversion Service
 * 
 * Handles automatic conversion of entire companies from leads to prospects
 * when any individual within the company becomes engaged.
 */

import { PrismaClient } from '@prisma/client';
import { engagementClassifier, type ContactData } from './engagement-classification-service';

const prisma = new PrismaClient();

export interface CompanyConversionResult {
  companyName: string;
  leadIds: string[];
  prospectIds: string[];
  engagedPersonName: string;
  conversionReason: string;
}

export class CompanyEngagementConversionService {
  
  /**
   * Check all leads and convert company-level groups to prospects
   * when any individual becomes engaged
   */
  public async processCompanyEngagementConversions(workspaceId: string): Promise<CompanyConversionResult[]> {
    console.log('🔄 Processing company engagement conversions for workspace:', workspaceId);
    
    try {
      await prisma.$connect();
      
      // Get all leads grouped by company
      const leads = await prisma.leads.findMany({
        where: {
          workspaceId,
          status: { not: 'converted' },
          deletedAt: null // Only active leads
        },
        include: {
          activities: true,
          emailTracking: true
        }
      });
      
      // Group leads by company
      const companiesByName = new Map<string, any[]>();
      leads.forEach(lead => {
        const company = lead.company || 'Unknown Company';
        if (!companiesByName.has(company)) {
          companiesByName.set(company, []);
        }
        companiesByName.get(company)!.push(lead);
      });
      
      const conversions: CompanyConversionResult[] = [];
      
      // Process each company
      for (const [companyName, companyLeads] of companiesByName) {
        const conversionResult = await this.evaluateCompanyForConversion(
          companyName, 
          companyLeads, 
          workspaceId
        );
        
        if (conversionResult) {
          conversions.push(conversionResult);
        }
      }
      
      console.log(`✅ Processed ${conversions.length} company conversions`);
      return conversions;
      
    } catch (error) {
      console.error('❌ Error processing company engagement conversions:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  /**
   * Evaluate a single company for lead-to-prospect conversion
   */
  private async evaluateCompanyForConversion(
    companyName: string,
    companyLeads: any[],
    workspaceId: string
  ): Promise<CompanyConversionResult | null> {
    
    // Classify engagement for each person in the company
    const engagementResults = companyLeads.map(lead => {
      const contactData: ContactData = {
        id: lead.id,
        name: lead.fullName,
        email: lead.workEmail || lead.personalEmail,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        priority: lead.priority,
        source: lead.source,
        activities: lead.activities || [],
        emailTracking: lead.emailTracking || [],
        createdAt: lead.createdAt,
        lastContactDate: lead.lastContactDate,
        estimatedValue: lead.estimatedValue,
        notes: lead.notes,
        engagementLevel: lead.engagementLevel
      };
      
      const classification = engagementClassifier.classifyEngagement(contactData);
      
      return {
        lead,
        classification,
        isEngaged: ['HOT', 'ENGAGED'].includes(classification.category)
      };
    });
    
    // Check if any person in the company is engaged
    const engagedPeople = engagementResults.filter(result => result.isEngaged);
    
    if (engagedPeople['length'] === 0) {
      // No one is engaged, keep as leads
      return null;
    }
    
    // At least one person is engaged - convert entire company to prospects
    console.log(`🎯 Converting company "${companyName}" to prospects - ${engagedPeople.length} engaged people found`);
    
    const leadIds: string[] = [];
    const prospectIds: string[] = [];
    
    // Convert all leads in this company to prospects
    for (const { lead, classification } of engagementResults) {
      leadIds.push(lead.id);
      
      // Create prospect record
      const prospect = await prisma.prospects.create({
        data: {
          workspaceId,
          assignedUserId: lead.assignedUserId,
          fullName: lead.fullName,
          firstName: lead.firstName,
          lastName: lead.lastName,
          company: lead.company,
          email: lead.workEmail || lead.personalEmail || '',
          phone: lead.phone || '',
          jobTitle: lead.jobTitle || '',
          source: lead.source,
          status: classification['category'] === 'HOT' ? 'hot' : 
                  classification['category'] === 'ENGAGED' ? 'engaged' : 'nurturing',
          priority: classification['category'] === 'HOT' ? 'high' : 
                    classification['category'] === 'ENGAGED' ? 'high' : 'medium',
          tags: [...(lead.tags || []), 'converted-from-lead', 'company-engagement'],
          notes: `${lead.notes || ''}\n\nConverted from lead due to company engagement. Classification: ${classification.category} (Score: ${classification.score}). Reason: ${classification.reason}`,
          customFields: {
            ...(lead.customFields || {}),
            originalLeadId: lead.id,
            conversionReason: 'company-engagement',
            engagementCategory: classification.category,
            engagementScore: classification.score,
            conversionDate: new Date().toISOString()
          },
          engagementLevel: classification.category.toLowerCase(),
          estimatedValue: lead.estimatedValue,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      prospectIds.push(prospect.id);
      
      // Update original lead status
      await prisma.leads.update({
        where: { id: lead.id },
        data: {
          status: 'converted',
          notes: `${lead.notes || ''}\n\nConverted to prospect (${prospect.id}) due to company engagement.`,
          updatedAt: new Date()
        }
      });
    }
    
    const primaryEngagedPerson = engagedPeople[0];
    
    return {
      companyName,
      leadIds,
      prospectIds,
      engagedPersonName: primaryEngagedPerson.lead.fullName,
      conversionReason: `Company converted because ${primaryEngagedPerson.lead.fullName} became ${primaryEngagedPerson.classification.category} (Score: ${primaryEngagedPerson.classification.score}). ${primaryEngagedPerson.classification.reason}`
    };
  }
  
  /**
   * Process a single lead for potential company conversion
   * (Can be called when individual lead data is updated)
   */
  public async processLeadEngagementUpdate(leadId: string, workspaceId: string): Promise<CompanyConversionResult | null> {
    console.log('🔄 Processing lead engagement update:', leadId);
    
    try {
      await prisma.$connect();
      
      // Get the updated lead
      const lead = await prisma.leads.findFirst({
        where: { id: leadId, workspaceId },
        include: {
          activities: true,
          emailTracking: true
        }
      });
      
      if (!lead || lead['status'] === 'converted') {
        return null;
      }
      
      // Get all leads from the same company
      const companyLeads = await prisma.leads.findMany({
        where: { 
          workspaceId,
          company: lead.company,
          status: { not: 'converted' },
          deletedAt: null 
        },
        include: {
          activities: true,
          emailTracking: true
        }
      });
      
      return await this.evaluateCompanyForConversion(
        lead.company || 'Unknown Company',
        companyLeads,
        workspaceId
      );
      
    } catch (error) {
      console.error('❌ Error processing lead engagement update:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  /**
   * Get conversion statistics
   */
  public async getConversionStats(workspaceId: string): Promise<{
    totalCompaniesEvaluated: number;
    companiesConverted: number;
    leadsConverted: number;
    prospectsCreated: number;
  }> {
    await prisma.$connect();
    
    try {
      const leads = await prisma.leads.findMany({
        where: { workspaceId , deletedAt: null},
        select: { company: true, status: true }
      });
      
      const prospects = await prisma.prospects.findMany({
        where: { 
          workspaceId,
          customFields: {
            path: ['conversionReason'],
            equals: 'company-engagement'
          },
          deletedAt: null 
        }
      });
      
      const companies = new Set(leads.map(l => l.company));
      const convertedLeads = leads.filter(l => l['status'] === 'converted');
      
      return {
        totalCompaniesEvaluated: companies.size,
        companiesConverted: new Set(prospects.map(p => p.company)).size,
        leadsConverted: convertedLeads.length,
        prospectsCreated: prospects.length
      };
      
    } finally {
      await prisma.$disconnect();
    }
  }
}

export const companyEngagementConverter = new CompanyEngagementConversionService();
