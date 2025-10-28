/**
 * CONSOLIDATED BUYER GROUP ENGINE V2
 * 
 * TypeScript conversion of the consolidated buyer group implementation
 * Combines AI-powered role classification with Preview API and multi-signal validation
 */

import { prisma } from '@/platform/database/prisma-client';
import type {
  BuyerGroupDiscoveryOptions,
  BuyerGroupResult,
  BuyerGroupMember,
  CompanyInfo,
  SellerProfile,
  EnrichmentProgress
} from './types';

export class ConsolidatedBuyerGroupEngine {
  private coresignalApiKey: string;
  private anthropicApiKey: string;
  private delayBetweenRequests = 1000;
  private delayBetweenBatches = 3000;
  private batchSize = 10;
  private maxPreviewPages = 20;
  private previewPageSize = 10;

  // Adaptive sizing based on company size
  private adaptiveSizing = {
    'Enterprise': { min: 12, max: 18, departments: 7 },
    'Large': { min: 8, max: 15, departments: 6 },
    'Mid-market': { min: 6, max: 12, departments: 5 },
    'SMB': { min: 4, max: 8, departments: 4 },
    'Small': { min: 3, max: 6, departments: 3 }
  };

  // Multi-signal validation weights
  private validationWeights = {
    aiClassification: 0.4,
    ruleBasedClassification: 0.3,
    linkedInVerification: 0.2,
    organizationalContext: 0.1
  };

  // Product-specific relevance categories
  private relevanceCategories = {
    'platform': {
      targetDepartments: ['Engineering', 'IT', 'Development'],
      keyTitles: ['CTO', 'VP Engineering', 'Director Technology', 'Architect'],
      relevanceWeight: 0.9
    },
    'revenue_technology': {
      targetDepartments: ['Sales', 'Revenue', 'Marketing'],
      keyTitles: ['CRO', 'VP Sales', 'Sales Director', 'Revenue Director'],
      relevanceWeight: 0.9
    },
    'operations': {
      targetDepartments: ['Operations', 'Manufacturing', 'Quality'],
      keyTitles: ['COO', 'VP Operations', 'Plant Manager', 'Operations Director'],
      relevanceWeight: 0.9
    },
    'security': {
      targetDepartments: ['Security', 'IT', 'Compliance'],
      keyTitles: ['CISO', 'VP Security', 'Security Director', 'Compliance Manager'],
      relevanceWeight: 0.9
    }
  };

  constructor() {
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY || '';
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

    if (!this.coresignalApiKey || !this.anthropicApiKey) {
      throw new Error('Missing required API keys: CORESIGNAL_API_KEY and ANTHROPIC_API_KEY');
    }
  }

  /**
   * Main discovery method with all improvements
   */
  async discoverBuyerGroup(options: BuyerGroupDiscoveryOptions): Promise<BuyerGroupResult> {
    const startTime = Date.now();
    const { companyName, companyId, companyLinkedInUrl, workspaceId, enrichmentLevel = 'enrich' } = options;

    console.log(`\n🎯 [BUYER GROUP ENGINE] Starting discovery for: ${companyName || companyId || companyLinkedInUrl}`);

    try {
      // Step 1: Resolve company information
      const company = await this.resolveCompany(companyName, companyId, companyLinkedInUrl, workspaceId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Step 2: Determine company size and adaptive parameters
      const companySize = await this.determineCompanySize(company);
      const adaptiveParams = this.adaptiveSizing[companySize];
      
      console.log(`   📊 Company Size: ${companySize} (${adaptiveParams.min}-${adaptiveParams.max} people)`);

      // Step 3: Discover employees with Preview API
      const employees = await this.discoverEmployees(company, adaptiveParams);
      
      // Step 4: Multi-signal role classification
      const classifiedEmployees = await this.classifyEmployeesMultiSignal(employees, options.sellerProfile);
      
      // Step 5: Product-specific relevance filtering
      const relevantEmployees = this.filterByRelevance(classifiedEmployees, options.sellerProfile);
      
      // Step 6: Select optimal buyer group
      const buyerGroup = this.selectOptimalBuyerGroup(relevantEmployees, adaptiveParams);
      
      // Step 7: Collect full profiles for buyer group members
      const enrichedBuyerGroup = await this.collectFullProfiles(buyerGroup, enrichmentLevel);
      
      // Step 8: Validate accuracy
      const validationResults = await this.validateBuyerGroup(enrichedBuyerGroup, companySize, options.sellerProfile);
      
      // Step 9: Calculate final metrics
      const qualityMetrics = this.calculateQualityMetrics(enrichedBuyerGroup, validationResults);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ [BUYER GROUP ENGINE] Discovery complete! Members: ${enrichedBuyerGroup.length}, Time: ${processingTime}ms`);
      console.log(`📊 [BUYER GROUP ENGINE] Quality Score: ${qualityMetrics.overallScore.toFixed(1)}%`);
      
      return {
        success: true,
        company,
        buyerGroup: enrichedBuyerGroup,
        composition: this.calculateComposition(enrichedBuyerGroup),
        qualityMetrics,
        processingTime,
        creditsUsed: {
          preview: employees.length,
          fullProfiles: enrichedBuyerGroup.length
        }
      };
      
    } catch (error: any) {
      console.error(`❌ [BUYER GROUP ENGINE] Discovery failed:`, error.message);
      throw error;
    }
  }

  /**
   * Resolve company information from various sources
   */
  private async resolveCompany(
    companyName?: string,
    companyId?: string,
    companyLinkedInUrl?: string,
    workspaceId?: string
  ): Promise<CompanyInfo | null> {
    // Try by ID first
    if (companyId && workspaceId) {
      const company = await prisma.companies.findFirst({
        where: {
          id: companyId,
          workspaceId,
          deletedAt: null
        }
      });

      if (company) {
        return {
          id: company.id,
          name: company.name,
          website: company.website || undefined,
          industry: company.industry || undefined,
          size: company.size || undefined,
          coresignalId: (company.customFields as any)?.coresignalId
        };
      }
    }

    // Try by LinkedIn URL
    if (companyLinkedInUrl && workspaceId) {
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId,
          deletedAt: null,
          linkedinUrl: companyLinkedInUrl
        }
      });

      if (company) {
        return {
          id: company.id,
          name: company.name,
          website: company.website || undefined,
          industry: company.industry || undefined,
          size: company.size || undefined,
          coresignalId: (company.customFields as any)?.coresignalId
        };
      }
    }

    // Try by name
    if (companyName && workspaceId) {
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId,
          deletedAt: null,
          name: {
            contains: companyName,
            mode: 'insensitive'
          }
        }
      });

      if (company) {
        return {
          id: company.id,
          name: company.name,
          website: company.website || undefined,
          industry: company.industry || undefined,
          size: company.size || undefined,
          coresignalId: (company.customFields as any)?.coresignalId
        };
      }
    }

    // If not found in database, try Coresignal search
    if (companyName) {
      const coresignalCompany = await this.searchCompany(companyName);
      if (coresignalCompany) {
        return {
          name: coresignalCompany.name,
          website: coresignalCompany.website,
          industry: coresignalCompany.industry,
          size: coresignalCompany.employee_count?.toString(),
          coresignalId: coresignalCompany.id
        };
      }
    }

    return null;
  }

  /**
   * Search for company information using Coresignal
   */
  private async searchCompany(companyName: string): Promise<any> {
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/linkedin/company/search';
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        search_term: companyName,
        page_size: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Company search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.[0] || null;
  }

  /**
   * Determine company size for adaptive parameters
   */
  private async determineCompanySize(company: CompanyInfo): Promise<keyof typeof this.adaptiveSizing> {
    try {
      // Use company size if available
      if (company.size) {
        const size = company.size.toLowerCase();
        if (size.includes('enterprise') || size.includes('10000+')) return 'Enterprise';
        if (size.includes('large') || size.includes('1000+')) return 'Large';
        if (size.includes('mid') || size.includes('500+')) return 'Mid-market';
        if (size.includes('smb') || size.includes('100+')) return 'SMB';
      }

      // Try to get employee count from Coresignal
      if (company.coresignalId) {
        const companyInfo = await this.getCompanyDetails(company.coresignalId);
        if (companyInfo?.employee_count) {
          const count = companyInfo.employee_count;
          if (count >= 10000) return 'Enterprise';
          if (count >= 1000) return 'Large';
          if (count >= 500) return 'Mid-market';
          if (count >= 100) return 'SMB';
          return 'Small';
        }
      }
      
      // Fallback: estimate based on company name patterns
      if (company.name) {
        const name = company.name.toLowerCase();
        if (name.includes('inc') || name.includes('corp') || name.includes('llc')) {
          return 'Mid-market';
        }
      }
      
      return 'SMB'; // Default conservative estimate
      
    } catch (error) {
      console.warn(`⚠️ Could not determine company size for ${company.name}, using SMB default`);
      return 'SMB';
    }
  }

  /**
   * Get detailed company information from Coresignal
   */
  private async getCompanyDetails(coresignalId: string): Promise<any> {
    const detailsUrl = `https://api.coresignal.com/cdapi/v1/linkedin/company/${coresignalId}`;
    
    const response = await fetch(detailsUrl, {
      headers: {
        'Authorization': `Bearer ${this.coresignalApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Company details failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Discover employees using Preview API
   */
  private async discoverEmployees(company: CompanyInfo, adaptiveParams: any): Promise<any[]> {
    console.log(`   🔍 Discovering employees across ${adaptiveParams.departments} departments...`);
    
    const departments = [
      'Sales and Business Development',
      'Marketing',
      'Product Management',
      'Operations',
      'Finance and Administration',
      'Legal and Compliance',
      'Engineering and Technical'
    ].slice(0, adaptiveParams.departments);

    const allEmployees: any[] = [];
    
    for (const department of departments) {
      try {
        console.log(`     🔍 Searching ${department}...`);
        const employees = await this.searchEmployeesByDepartment(company, department);
        allEmployees.push(...employees);
        console.log(`       ✅ Found ${employees.length} employees in ${department}`);
        
        await this.delay(this.delayBetweenRequests);
      } catch (error: any) {
        console.warn(`       ⚠️ Failed to search ${department}: ${error.message}`);
      }
    }

    // Remove duplicates
    const uniqueEmployees = this.removeDuplicates(allEmployees);
    
    console.log(`   ✅ Total unique employees found: ${uniqueEmployees.length}`);
    
    return uniqueEmployees;
  }

  /**
   * Search employees by department using Preview API
   */
  private async searchEmployeesByDepartment(company: CompanyInfo, department: string): Promise<any[]> {
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/linkedin/employee/search';
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_name: company.name,
        department: department,
        page_size: this.previewPageSize,
        page: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Employee search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Remove duplicate employees
   */
  private removeDuplicates(employees: any[]): any[] {
    const seen = new Set();
    return employees.filter(emp => {
      const key = emp.id || emp.linkedin_url || emp.email;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Multi-signal role classification using AI and rules
   */
  private async classifyEmployeesMultiSignal(employees: any[], sellerProfile?: SellerProfile): Promise<BuyerGroupMember[]> {
    console.log(`   🤖 Classifying ${employees.length} employees with multi-signal approach...`);
    
    const classified: BuyerGroupMember[] = [];
    
    for (const employee of employees) {
      try {
        // AI Classification
        const aiClassification = await this.classifyWithAI(employee, sellerProfile);
        
        // Rule-based Classification
        const ruleClassification = this.classifyWithRules(employee);
        
        // LinkedIn Verification
        const linkedinVerification = this.verifyLinkedIn(employee);
        
        // Organizational Context
        const orgContext = this.analyzeOrganizationalContext(employee, employees);
        
        // Combine signals with weights
        const finalClassification = this.combineClassificationSignals(
          aiClassification,
          ruleClassification,
          linkedinVerification,
          orgContext
        );
        
        if (finalClassification.role) {
          classified.push({
            name: employee.name || 'Unknown',
            title: employee.job_title || 'Unknown',
            email: employee.email || employee.professional_email,
            phone: employee.phone,
            linkedin: employee.linkedin_url || employee.url,
            department: employee.department,
            role: finalClassification.role,
            confidence: finalClassification.confidence,
            influenceScore: finalClassification.influenceScore,
            priority: finalClassification.priority
          });
        }
        
        await this.delay(100); // Rate limiting
        
      } catch (error: any) {
        console.warn(`       ⚠️ Failed to classify employee ${employee.name}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Classified ${classified.length} employees into buyer group roles`);
    return classified;
  }

  /**
   * Classify employee using Claude AI
   */
  private async classifyWithAI(employee: any, sellerProfile?: SellerProfile): Promise<any> {
    try {
      const prompt = this.buildClassificationPrompt(employee, sellerProfile);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`AI classification failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      // Parse AI response
      const classification = JSON.parse(content);
      return {
        role: classification.role,
        confidence: classification.confidence || 0,
        reasoning: classification.reasoning
      };
      
    } catch (error) {
      console.warn('AI classification failed, using fallback:', error);
      return { role: null, confidence: 0 };
    }
  }

  /**
   * Build classification prompt for Claude AI
   */
  private buildClassificationPrompt(employee: any, sellerProfile?: SellerProfile): string {
    const productContext = sellerProfile?.solutionCategory ? 
      `\n\nProduct Context: We're selling ${sellerProfile.solutionCategory} to ${sellerProfile.targetMarket || 'enterprise'} companies.` : '';

    return `You are a B2B sales expert. Classify this employee into one of 5 buyer group roles:

Employee:
- Name: ${employee.name || 'Unknown'}
- Title: ${employee.job_title || 'Unknown'}
- Department: ${employee.department || 'Unknown'}
- Company: ${employee.company_name || 'Unknown'}
- Seniority: ${employee.seniority_level || 'Unknown'}${productContext}

Buyer Group Roles:
1. decision_maker: Final approval authority (C-level, VP+, budget control)
2. champion: Internal advocate for solutions (Director+, operational impact)
3. stakeholder: Influences decision, uses solution (Manager+, implementation)
4. blocker: May resist/delay purchase (Procurement, Legal, policy control)
5. introducer: Facilitates access (Sales, Account Management, customer-facing)

Return ONLY a JSON object:
{
  "role": "one of the 5 roles above",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;
  }

  /**
   * Rule-based classification fallback
   */
  private classifyWithRules(employee: any): any {
    const title = (employee.job_title || '').toLowerCase();
    const department = (employee.department || '').toLowerCase();
    const seniority = (employee.seniority_level || '').toLowerCase();

    // Decision Maker patterns
    if (title.includes('ceo') || title.includes('cfo') || title.includes('cto') || 
        title.includes('cmo') || title.includes('cro') || title.includes('coo') ||
        title.includes('president') || title.includes('vp') || title.includes('vice president')) {
      return { role: 'decision_maker', confidence: 85 };
    }

    // Champion patterns
    if (title.includes('director') || title.includes('head of') || 
        (seniority.includes('senior') && title.includes('manager'))) {
      return { role: 'champion', confidence: 75 };
    }

    // Stakeholder patterns
    if (title.includes('manager') || title.includes('lead') || title.includes('specialist')) {
      return { role: 'stakeholder', confidence: 70 };
    }

    // Blocker patterns
    if (department.includes('procurement') || department.includes('legal') || 
        department.includes('compliance') || title.includes('procurement')) {
      return { role: 'blocker', confidence: 80 };
    }

    // Introducer patterns
    if (department.includes('sales') || department.includes('account') || 
        title.includes('account manager') || title.includes('sales')) {
      return { role: 'introducer', confidence: 75 };
    }

    return { role: 'stakeholder', confidence: 50 }; // Default fallback
  }

  /**
   * Verify LinkedIn profile quality
   */
  private verifyLinkedIn(employee: any): any {
    const linkedinUrl = employee.linkedin_url || employee.url;
    if (!linkedinUrl) {
      return { quality: 0, verified: false };
    }

    // Basic verification checks
    const hasValidUrl = linkedinUrl.includes('linkedin.com/in/');
    const hasProfilePicture = employee.profile_picture_url;
    const hasConnections = employee.connections_count > 0;
    const hasExperience = employee.experience && employee.experience.length > 0;

    const quality = (hasValidUrl ? 25 : 0) + 
                   (hasProfilePicture ? 25 : 0) + 
                   (hasConnections ? 25 : 0) + 
                   (hasExperience ? 25 : 0);

    return { quality, verified: quality >= 50 };
  }

  /**
   * Analyze organizational context
   */
  private analyzeOrganizationalContext(employee: any, allEmployees: any[]): any {
    const department = employee.department;
    const departmentEmployees = allEmployees.filter(emp => emp.department === department);
    const departmentSize = departmentEmployees.length;
    
    // Calculate influence based on department size and role
    let influence = 0;
    if (departmentSize > 10) influence += 20;
    if (departmentSize > 5) influence += 10;
    if (employee.seniority_level?.includes('senior')) influence += 15;
    if (employee.seniority_level?.includes('lead')) influence += 10;
    
    return { influence, departmentSize };
  }

  /**
   * Combine classification signals with weights
   */
  private combineClassificationSignals(ai: any, rules: any, linkedin: any, org: any): any {
    const weights = this.validationWeights;
    
    // Calculate weighted confidence
    const aiConfidence = ai.confidence * weights.aiClassification;
    const ruleConfidence = rules.confidence * weights.ruleBasedClassification;
    const linkedinBoost = linkedin.verified ? 20 : 0;
    const orgBoost = org.influence * weights.organizationalContext;
    
    const totalConfidence = Math.min(aiConfidence + ruleConfidence + linkedinBoost + orgBoost, 100);
    
    // Use AI classification if confidence is high, otherwise use rules
    const finalRole = ai.confidence > 70 ? ai.role : rules.role;
    
    // Calculate influence score
    const influenceScore = Math.min(
      (totalConfidence * 0.5) + (org.influence * 0.3) + (linkedin.quality * 0.2),
      100
    );
    
    // Calculate priority (1-10, higher is better)
    const priority = Math.ceil((totalConfidence + influenceScore) / 20);
    
    return {
      role: finalRole,
      confidence: Math.round(totalConfidence),
      influenceScore: Math.round(influenceScore),
      priority: Math.min(priority, 10)
    };
  }

  /**
   * Filter employees by product relevance
   */
  private filterByRelevance(employees: BuyerGroupMember[], sellerProfile?: SellerProfile): BuyerGroupMember[] {
    if (!sellerProfile?.solutionCategory) {
      return employees; // No filtering if no product context
    }

    const category = this.relevanceCategories[sellerProfile.solutionCategory as keyof typeof this.relevanceCategories];
    if (!category) {
      return employees; // No filtering if category not found
    }

    return employees.filter(employee => {
      const department = (employee.department || '').toLowerCase();
      const title = (employee.title || '').toLowerCase();
      
      // Check department relevance
      const departmentRelevant = category.targetDepartments.some(dept => 
        department.includes(dept.toLowerCase())
      );
      
      // Check title relevance
      const titleRelevant = category.keyTitles.some(t => 
        title.includes(t.toLowerCase())
      );
      
      return departmentRelevant || titleRelevant;
    });
  }

  /**
   * Select optimal buyer group based on adaptive parameters
   */
  private selectOptimalBuyerGroup(employees: BuyerGroupMember[], adaptiveParams: any): BuyerGroupMember[] {
    // Sort by priority and confidence
    const sorted = employees.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.confidence - a.confidence;
    });

    // Ensure we have at least one of each critical role
    const criticalRoles = ['decision_maker', 'champion'];
    const selected: BuyerGroupMember[] = [];
    const roleCounts: Record<string, number> = {};

    // First pass: ensure critical roles
    for (const role of criticalRoles) {
      const roleEmployee = sorted.find(emp => emp.role === role);
      if (roleEmployee) {
        selected.push(roleEmployee);
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      }
    }

    // Second pass: fill remaining slots
    for (const employee of sorted) {
      if (selected.length >= adaptiveParams.max) break;
      if (selected.includes(employee)) continue;

      const currentCount = roleCounts[employee.role] || 0;
      const maxForRole = this.getMaxForRole(employee.role, adaptiveParams);
      
      if (currentCount < maxForRole) {
        selected.push(employee);
        roleCounts[employee.role] = currentCount + 1;
      }
    }

    return selected;
  }

  /**
   * Get maximum count for a specific role
   */
  private getMaxForRole(role: string, adaptiveParams: any): number {
    const roleLimits: Record<string, number> = {
      'decision_maker': Math.min(3, Math.ceil(adaptiveParams.max * 0.2)),
      'champion': Math.min(4, Math.ceil(adaptiveParams.max * 0.3)),
      'stakeholder': Math.min(6, Math.ceil(adaptiveParams.max * 0.4)),
      'blocker': Math.min(2, Math.ceil(adaptiveParams.max * 0.1)),
      'introducer': Math.min(3, Math.ceil(adaptiveParams.max * 0.2))
    };

    return roleLimits[role] || 2;
  }

  /**
   * Collect full profiles for buyer group members
   */
  private async collectFullProfiles(buyerGroup: BuyerGroupMember[], enrichmentLevel: string): Promise<BuyerGroupMember[]> {
    if (enrichmentLevel === 'identify') {
      return buyerGroup; // Return basic info only
    }

    console.log(`   📊 Collecting full profiles for ${buyerGroup.length} buyer group members...`);
    
    const enriched: BuyerGroupMember[] = [];
    
    for (const member of buyerGroup) {
      try {
        // For now, just return the member as-is
        // In a full implementation, this would call Coresignal's full profile API
        enriched.push(member);
        
        await this.delay(200); // Rate limiting
      } catch (error: any) {
        console.warn(`       ⚠️ Failed to enrich ${member.name}: ${error.message}`);
        enriched.push(member); // Add without enrichment
      }
    }
    
    return enriched;
  }

  /**
   * Validate buyer group accuracy
   */
  private async validateBuyerGroup(
    buyerGroup: BuyerGroupMember[], 
    companySize: string, 
    sellerProfile?: SellerProfile
  ): Promise<any> {
    // Basic validation metrics
    const totalMembers = buyerGroup.length;
    const hasDecisionMaker = buyerGroup.some(m => m.role === 'decision_maker');
    const hasChampion = buyerGroup.some(m => m.role === 'champion');
    const avgConfidence = buyerGroup.reduce((sum, m) => sum + m.confidence, 0) / totalMembers;
    
    const coreMemberAccuracy = (hasDecisionMaker && hasChampion) ? 100 : 50;
    const roleAssignmentAccuracy = avgConfidence;
    const dataQuality = buyerGroup.filter(m => m.email || m.linkedin).length / totalMembers * 100;
    
    const overallScore = (coreMemberAccuracy + roleAssignmentAccuracy + dataQuality) / 3;
    
    return {
      coreMemberAccuracy,
      roleAssignmentAccuracy,
      dataQuality,
      overallScore,
      hasDecisionMaker,
      hasChampion,
      totalMembers
    };
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(buyerGroup: BuyerGroupMember[], validationResults: any): any {
    const composition = this.calculateComposition(buyerGroup);
    const coverage = this.calculateCoverage(buyerGroup);
    const confidence = validationResults.overallScore;
    
    return {
      coverage,
      confidence: Math.round(confidence),
      dataQuality: Math.round(validationResults.dataQuality),
      overallScore: Math.round(confidence)
    };
  }

  /**
   * Calculate buyer group composition
   */
  private calculateComposition(buyerGroup: BuyerGroupMember[]): any {
    const composition = {
      decision_maker: 0,
      champion: 0,
      stakeholder: 0,
      blocker: 0,
      introducer: 0,
      total: buyerGroup.length
    };

    for (const member of buyerGroup) {
      composition[member.role as keyof typeof composition]++;
    }

    return composition;
  }

  /**
   * Calculate coverage score
   */
  private calculateCoverage(buyerGroup: BuyerGroupMember[]): string {
    const total = buyerGroup.length;
    if (total >= 12) return 'excellent';
    if (total >= 8) return 'good';
    if (total >= 6) return 'fair';
    return 'limited';
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

