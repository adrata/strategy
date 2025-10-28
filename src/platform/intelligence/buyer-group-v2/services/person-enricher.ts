/**
 * PERSON ENRICHER SERVICE
 * 
 * Enriches person data using Coresignal API with email and LinkedIn direct matching
 */

import { prisma } from '@/platform/database/prisma-client';
import type {
  PersonEnrichmentOptions,
  PersonEnrichmentResult,
  EnrichedPersonData
} from '../types';

export class PersonEnricher {
  private coresignalApiKey: string;
  private delayBetweenRequests = 1000;
  private delayBetweenBatches = 3000;
  private batchSize = 5;

  constructor() {
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY || '';

    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
  }

  /**
   * Enrich a single person using direct matching strategies
   */
  async enrichPerson(options: PersonEnrichmentOptions): Promise<PersonEnrichmentResult> {
    const { personId, email, linkedinUrl, workspaceId } = options;

    console.log(`🔍 [PERSON ENRICHER] Enriching person: ${email || linkedinUrl || personId}`);

    try {
      // Get person from database if ID provided
      let person = null;
      if (personId && workspaceId) {
        person = await prisma.people.findFirst({
          where: {
            id: personId,
            workspaceId,
            deletedAt: null
          }
        });
      }

      const searchEmail = person?.email || email;
      const searchLinkedIn = person?.linkedinUrl || linkedinUrl;

      if (!searchEmail && !searchLinkedIn) {
        throw new Error('Email or LinkedIn URL is required for enrichment');
      }

      // Try direct matching strategies
      const enrichmentData = await this.searchWithDirectMatching(searchEmail, searchLinkedIn);

      if (!enrichmentData) {
        return {
          success: false,
          message: 'No enrichment data found using direct matching',
          creditsUsed: { search: 2, collect: 0 }
        };
      }

      // Update person in database if person ID provided
      if (personId && workspaceId) {
        await this.updatePersonInDatabase(personId, enrichmentData);
      }

      return {
        success: true,
        enrichedData: enrichmentData,
        creditsUsed: { search: 2, collect: 0 }
      };

    } catch (error: any) {
      console.error(`❌ [PERSON ENRICHER] Failed to enrich person:`, error.message);
      return {
        success: false,
        message: error.message,
        creditsUsed: { search: 2, collect: 0 }
      };
    }
  }

  /**
   * Enrich multiple people in batches
   */
  async enrichPeopleBatch(options: {
    workspaceId: string;
    personIds?: string[];
    maxPeople?: number;
    skipEnriched?: boolean;
  }): Promise<{
    success: boolean;
    processed: number;
    enriched: number;
    failed: number;
    creditsUsed: { search: number; collect: number };
  }> {
    const { workspaceId, personIds, maxPeople = 50, skipEnriched = true } = options;

    console.log(`🚀 [PERSON ENRICHER] Starting batch enrichment for workspace: ${workspaceId}`);

    try {
      // Get people to process
      const people = await this.getPeopleToEnrich(workspaceId, personIds, maxPeople, skipEnriched);
      
      console.log(`📊 Found ${people.length} people to enrich`);

      if (people.length === 0) {
        return {
          success: true,
          processed: 0,
          enriched: 0,
          failed: 0,
          creditsUsed: { search: 0, collect: 0 }
        };
      }

      let processed = 0;
      let enriched = 0;
      let failed = 0;
      let totalCreditsUsed = { search: 0, collect: 0 };

      // Process in batches
      const totalBatches = Math.ceil(people.length / this.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, people.length);
        const batch = people.slice(startIndex, endIndex);
        
        console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
        
        for (const person of batch) {
          try {
            const result = await this.enrichPerson({
              personId: person.id,
              email: person.email,
              linkedinUrl: person.linkedinUrl,
              workspaceId
            });
            
            processed++;
            if (result.success) {
              enriched++;
            } else {
              failed++;
            }
            
            totalCreditsUsed.search += result.creditsUsed.search;
            totalCreditsUsed.collect += result.creditsUsed.collect;
            
            await this.delay(this.delayBetweenRequests);
            
          } catch (error: any) {
            console.warn(`⚠️ Failed to enrich ${person.name}: ${error.message}`);
            failed++;
          }
        }
        
        if (batchIndex < totalBatches - 1) {
          await this.delay(this.delayBetweenBatches);
        }
      }

      console.log(`✅ Batch enrichment completed: ${enriched} enriched, ${failed} failed`);

      return {
        success: true,
        processed,
        enriched,
        failed,
        creditsUsed: totalCreditsUsed
      };

    } catch (error: any) {
      console.error(`❌ [PERSON ENRICHER] Batch enrichment failed:`, error.message);
      throw error;
    }
  }

  /**
   * Search for people at a specific company
   */
  async searchPeopleAtCompany(options: {
    companyName: string;
    companyId?: string;
    roles?: string[];
    departments?: string[];
    maxResults?: number;
  }): Promise<{
    success: boolean;
    people: EnrichedPersonData[];
    creditsUsed: { search: number; collect: number };
  }> {
    const { companyName, companyId, roles = [], departments = [], maxResults = 50 } = options;

    console.log(`🔍 [PERSON ENRICHER] Searching people at company: ${companyName}`);

    try {
      const searchQuery = this.buildPersonSearchQuery(companyName, roles, departments);
      
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: companyName,
          page_size: maxResults,
          page: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Person search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const people = (data.data || []).map((person: any) => this.formatEnrichedPersonData(person));

      return {
        success: true,
        people,
        creditsUsed: { search: 1, collect: 0 }
      };

    } catch (error: any) {
      console.error(`❌ [PERSON ENRICHER] Company search failed:`, error.message);
      return {
        success: false,
        people: [],
        creditsUsed: { search: 1, collect: 0 }
      };
    }
  }

  /**
   * Search using direct matching strategies
   */
  private async searchWithDirectMatching(email?: string, linkedinUrl?: string): Promise<EnrichedPersonData | null> {
    // Strategy 1: Direct email matching (highest confidence)
    if (email) {
      try {
        console.log(`   📧 Trying direct email matching: ${email}`);
        const result = await this.searchPersonByEmail(email);
        if (result) {
          console.log(`   ✅ Found match with email strategy`);
          return this.formatEnrichedPersonData(result);
        }
      } catch (error: any) {
        console.warn(`   ⚠️ Email search failed: ${error.message}`);
      }
    }

    // Strategy 2: Direct LinkedIn URL matching
    if (linkedinUrl) {
      try {
        console.log(`   🔗 Trying direct LinkedIn matching: ${linkedinUrl}`);
        const result = await this.searchPersonByLinkedIn(linkedinUrl);
        if (result) {
          console.log(`   ✅ Found match with LinkedIn strategy`);
          return this.formatEnrichedPersonData(result);
        }
      } catch (error: any) {
        console.warn(`   ⚠️ LinkedIn search failed: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Search person by email
   */
  private async searchPersonByEmail(email: string): Promise<any> {
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/linkedin/employee/search';
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        page_size: 1,
        page: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Email search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.[0] || null;
  }

  /**
   * Search person by LinkedIn URL
   */
  private async searchPersonByLinkedIn(linkedinUrl: string): Promise<any> {
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/linkedin/employee/search';
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        linkedin_url: linkedinUrl,
        page_size: 1,
        page: 1
      })
    });

    if (!response.ok) {
      throw new Error(`LinkedIn search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.[0] || null;
  }

  /**
   * Build person search query for company search
   */
  private buildPersonSearchQuery(companyName: string, roles: string[], departments: string[]): any {
    const query: any = {
      company_name: companyName,
      page_size: 50,
      page: 1
    };

    if (roles.length > 0) {
      query.job_title = roles.join(' OR ');
    }

    if (departments.length > 0) {
      query.department = departments.join(' OR ');
    }

    return query;
  }

  /**
   * Format enriched person data for storage
   */
  private formatEnrichedPersonData(data: any): EnrichedPersonData {
    return {
      coresignalId: data.id,
      name: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email || data.professional_email,
      phone: data.phone,
      linkedinUrl: data.linkedin_url || data.url,
      jobTitle: data.job_title,
      department: data.department,
      seniorityLevel: data.seniority_level,
      companyName: data.company_name,
      companyId: data.company_id,
      location: data.location,
      profilePicture: data.profile_picture_url,
      summary: data.summary,
      experience: data.experience || [],
      education: data.education || [],
      skills: data.skills || [],
      languages: data.languages || [],
      certifications: data.certifications || [],
      publications: data.publications || [],
      awards: data.awards || [],
      volunteerExperience: data.volunteer_experience || [],
      recommendations: data.recommendations || [],
      connections: data.connections_count || 0,
      followers: data.followers_count || 0,
      customFields: {
        coresignalId: data.id,
        lastEnrichedAt: new Date().toISOString(),
        enrichmentSource: 'coresignal'
      }
    };
  }

  /**
   * Update person in database with enriched data
   */
  private async updatePersonInDatabase(personId: string, enrichedData: EnrichedPersonData): Promise<void> {
    await prisma.people.update({
      where: { id: personId },
      data: {
        name: enrichedData.name || undefined,
        firstName: enrichedData.firstName || undefined,
        lastName: enrichedData.lastName || undefined,
        email: enrichedData.email || undefined,
        phone: enrichedData.phone || undefined,
        linkedinUrl: enrichedData.linkedinUrl || undefined,
        jobTitle: enrichedData.jobTitle || undefined,
        department: enrichedData.department || undefined,
        seniorityLevel: enrichedData.seniorityLevel || undefined,
        companyName: enrichedData.companyName || undefined,
        location: enrichedData.location || undefined,
        profilePicture: enrichedData.profilePicture || undefined,
        summary: enrichedData.summary || undefined,
        experience: enrichedData.experience || [],
        education: enrichedData.education || [],
        skills: enrichedData.skills || [],
        languages: enrichedData.languages || [],
        certifications: enrichedData.certifications || [],
        publications: enrichedData.publications || [],
        awards: enrichedData.awards || [],
        volunteerExperience: enrichedData.volunteerExperience || [],
        recommendations: enrichedData.recommendations || [],
        connections: enrichedData.connections || 0,
        followers: enrichedData.followers || 0,
        customFields: enrichedData.customFields || {}
      }
    });
  }

  /**
   * Get people that need enrichment
   */
  private async getPeopleToEnrich(
    workspaceId: string,
    personIds?: string[],
    maxPeople?: number,
    skipEnriched?: boolean
  ): Promise<any[]> {
    const where: any = {
      workspaceId,
      deletedAt: null,
      OR: [
        { email: { not: null } },
        { linkedinUrl: { not: null } }
      ]
    };

    // Filter by specific person IDs if provided
    if (personIds && personIds.length > 0) {
      where.id = { in: personIds };
    }

    // Skip already enriched people if requested
    if (skipEnriched) {
      where.AND = [
        {
          OR: [
            { customFields: { path: ['coresignalId'], equals: null } },
            { customFields: { path: ['coresignalId'], equals: undefined } },
            { customFields: { path: ['coresignalId'], equals: '' } }
          ]
        }
      ];
    }

    return await prisma.people.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: maxPeople
    });
  }

  /**
   * Check if person is already enriched
   */
  private isPersonEnriched(person: any): boolean {
    const customFields = person.customFields as any;
    return !!(customFields?.coresignalId);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
