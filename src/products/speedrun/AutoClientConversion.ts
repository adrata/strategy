/**
 * 🏆 AUTO CUSTOMER CONVERSION SYSTEM
 * 
 * Automatically converts closed won deals into customer records.
 * When any person at a company reaches "Closed Won" stage:
 * 1. Convert entire company to customer status
 * 2. Update all people at that company to customer records
 * 3. Create customer account with full company data
 * 4. Generate customer success handoff information
 */

import { TodayActivityTracker } from "./TodayActivityTracker";
import type { SpeedrunPerson } from "./context/SpeedrunProvider";
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';

export interface CustomerConversionResult {
  success: boolean;
  companyName: string;
  convertedPeople: number;
  customerAccountId: string;
  revenue: number;
  conversionDate: Date;
  originalProspectId: string;
  handoffNotes: string[];
}

export interface CustomerAccount {
  id: string;
  companyName: string;
  domain: string;
  industry: string;
  size: string;
  revenue: number;
  dealValue: number;
  conversionDate: Date;
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  decisionMakers: Array<{
    name: string;
    title: string;
    email: string;
    role: string;
  }>;
  stakeholders: Array<{
    name: string;
    title: string;
    email: string;
    department: string;
  }>;
  contractDetails: {
    startDate: Date;
    value: number;
    term: number; // months
    renewalDate: Date;
  };
  successMetrics: {
    onboardingStatus: "not_started" | "in_progress" | "completed";
    healthScore: number; // 0-100
    lastActivity: Date;
    nextMilestone: string;
  };
}

export class AutoClientConversion {
  
  /**
   * 🏆 Main function: Detect closed won and trigger conversion
   */
  static async detectAndConvertClosedWon(prospect: SpeedrunPerson): Promise<CustomerConversionResult | null> {
    // Check if prospect status indicates closed won
    if (!this.isClosedWon(prospect)) {
      return null;
    }

    console.log(`🏆 AutoClientConversion: Detecting closed won for ${prospect.name} at ${prospect.company}`);
    
    // Get all people at the same company
    const companyPeople = await this.getCompanyPeople(prospect.company);
    
    // Create customer account
    const customerAccount = await this.createCustomerAccount(prospect, companyPeople);
    
    // Convert all company people to clients
    const conversionResults = await this.convertCompanyToCustomers(companyPeople, customerAccount);
    
    // Generate handoff notes for customer success
    const handoffNotes = this.generateHandoffNotes(prospect, companyPeople, customerAccount);
    
    // Record the conversion activity
    await this.recordCustomerConversion(prospect, customerAccount, conversionResults);
    
    return {
      success: true,
      companyName: prospect.company,
      convertedPeople: conversionResults.convertedCount,
      customerAccountId: customerAccount.id,
      revenue: customerAccount.dealValue,
      conversionDate: new Date(),
      originalProspectId: prospect.id.toString(),
      handoffNotes
    };
  }

  /**
   * 🎯 Check if prospect status indicates closed won
   */
  private static isClosedWon(prospect: SpeedrunPerson): boolean {
    const status = (prospect.status || "").toLowerCase();
    const closedWonIndicators = [
      "closed won",
      "won",
      "customer",
      "signed",
      "contract signed",
      "deal closed",
      "closed-won"
    ];
    
    return closedWonIndicators.some(indicator => status.includes(indicator));
  }

  /**
   * 👥 Get all people at the same company
   */
  private static async getCompanyPeople(companyName: string): Promise<SpeedrunPerson[]> {
    try {
      // Get workspace context
      const { workspaceId, userId } = await this.getWorkspaceContext();
      
      // Fetch all leads/contacts from the same company
      const response = await fetch(`/api/data/leads/by-company?workspaceId=${workspaceId}&userId=${userId}&company=${encodeURIComponent(companyName)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch company people: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.leads || [];
      
    } catch (error) {
      console.error("❌ AutoClientConversion: Failed to get company people:", error);
      return [];
    }
  }

  /**
   * 🏢 Create customer account record
   */
  private static async createCustomerAccount(
    originalProspect: SpeedrunPerson, 
    companyPeople: SpeedrunPerson[]
  ): Promise<CustomerAccount> {
    
    // Find decision makers and primary contact
    const decisionMakers = companyPeople.filter(person => 
      (person.relationship || "").toLowerCase().includes("decision") ||
      (person.title || "").toLowerCase().includes("cto") ||
      (person.title || "").toLowerCase().includes("ceo") ||
      (person.title || "").toLowerCase().includes("vp")
    );
    
    const primaryContact = decisionMakers[0] || originalProspect;
    
    // Estimate deal value based on company size and industry
    const dealValue = this.estimateDealValue(originalProspect, companyPeople.length);
    
    const customerAccount: CustomerAccount = {
      id: `customer_${Date.now()}_${originalProspect.company.replace(/\s+/g, '_').toLowerCase()}`,
      companyName: originalProspect.company,
      domain: this.extractDomain(primaryContact.email),
      industry: originalProspect.customFields?.monacoEnrichment?.companyIntelligence?.industry || "Technology",
      size: this.categorizeCompanySize(companyPeople.length),
      revenue: this.estimateCompanyRevenue(originalProspect, companyPeople.length),
      dealValue,
      conversionDate: new Date(),
      primaryContact: {
        name: primaryContact.name,
        title: primaryContact.title || "Contact",
        email: primaryContact.email,
        phone: primaryContact.phone || ""
      },
      decisionMakers: decisionMakers.map(person => ({
        name: person.name,
        title: person.title || "Decision Maker",
        email: person.email,
        role: person.relationship || "Decision Maker"
      })),
      stakeholders: companyPeople.filter(person => !decisionMakers.includes(person)).map(person => ({
        name: person.name,
        title: person.title || "Stakeholder",
        email: person.email,
        department: this.inferDepartment(person.title || "")
      })),
      contractDetails: {
        startDate: new Date(),
        value: dealValue,
        term: 12, // Default 12 months
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      successMetrics: {
        onboardingStatus: "not_started",
        healthScore: 85, // Start with high score for new customer
        lastActivity: new Date(),
        nextMilestone: "Kickoff meeting and onboarding"
      }
    };

    // Save customer account to database
    await this.saveCustomerAccount(customerAccount);
    
    return customerAccount;
  }

  /**
   * 🔄 Convert all company people to customer status
   */
  private static async convertCompanyToCustomers(
    companyPeople: SpeedrunPerson[], 
    customerAccount: CustomerAccount
  ): Promise<{ convertedCount: number; errors: string[] }> {
    let convertedCount = 0;
    const errors: string[] = [];
    
    for (const person of companyPeople) {
      try {
        // Update person status to customer
        await this.updatePersonToCustomer(person, customerAccount);
        convertedCount++;
        
        console.log(`✅ Converted ${person.name} to customer status`);
        
      } catch (error) {
        const errorMsg = `Failed to convert ${person.name}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    return { convertedCount, errors };
  }

  /**
   * 📝 Generate handoff notes for customer success team
   */
  private static generateHandoffNotes(
    originalProspect: SpeedrunPerson,
    companyPeople: SpeedrunPerson[],
    customerAccount: CustomerAccount
  ): string[] {
    const notes = [
      `🎉 New customer: ${customerAccount.companyName}`,
      `💰 Deal value: $${customerAccount.dealValue.toLocaleString()}`,
      `👤 Primary contact: ${customerAccount.primaryContact.name} (${customerAccount.primaryContact.title})`,
      `📧 Primary email: ${customerAccount.primaryContact.email}`,
      `🏢 Company size: ${customerAccount.size} (${companyPeople.length} contacts)`,
      `🏭 Industry: ${customerAccount.industry}`,
      `📅 Contract start: ${customerAccount.contractDetails.startDate.toLocaleDateString()}`,
      `🔄 Renewal date: ${customerAccount.contractDetails.renewalDate.toLocaleDateString()}`,
      "",
      "👥 Key stakeholders:",
      ...customerAccount.decisionMakers.map(dm => `  • ${dm.name} - ${dm.title} (${dm.role})`),
      "",
      "📋 Next steps:",
      "  • Schedule kickoff meeting",
      "  • Send onboarding materials", 
      "  • Set up implementation timeline",
      "  • Assign customer success manager",
      "",
      `🔗 Original prospect: ${originalProspect.name} (ID: ${originalProspect.id})`
    ];
    
    return notes;
  }

  /**
   * 💾 Save customer account to database
   */
  private static async saveCustomerAccount(customerAccount: CustomerAccount): Promise<void> {
    try {
      const { workspaceId, userId } = await this.getWorkspaceContext();
      
      const response = await fetch('/api/data/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          userId,
          customerAccount,
          createdAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save customer account: ${response.statusText}`);
      }

      console.log(`✅ Customer account saved: ${customerAccount.companyName}`);
      
    } catch (error) {
      console.error("❌ Failed to save customer account:", error);
      throw error;
    }
  }

  /**
   * 👤 Update individual person to customer status
   */
  private static async updatePersonToCustomer(
    person: SpeedrunPerson, 
    customerAccount: CustomerAccount
  ): Promise<void> {
    try {
      const { workspaceId, userId } = await this.getWorkspaceContext();
      
      const response = await fetch('/api/data/leads/convert-to-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          userId,
          leadId: person.id,
          customerAccountId: customerAccount.id,
          conversionDate: new Date().toISOString(),
          newStatus: "customer"
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update person: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to update ${person.name} to customer:`, error);
      throw error;
    }
  }

  /**
   * 📊 Record conversion activity
   */
  private static async recordCustomerConversion(
    originalProspect: SpeedrunPerson,
    customerAccount: CustomerAccount,
    conversionResults: { convertedCount: number; errors: string[] }
  ): Promise<void> {
    // Record in activity tracker
    TodayActivityTracker.recordActivity({
      leadId: originalProspect.id.toString(),
      prospectName: originalProspect.name,
      company: originalProspect.company,
      activityType: "message",
      timestamp: new Date(),
      outcome: `Customer conversion: ${conversionResults.convertedCount} people converted, $${customerAccount.dealValue.toLocaleString()} deal value`
    });

    console.log(`🏆 AutoClientConversion: Successfully converted ${customerAccount.companyName} to customer status`);
  }

  /**
   * 🔧 Helper functions
   */
  private static extractDomain(email: string): string {
    return email.split('@')[1] || 'unknown.com';
  }

  private static categorizeCompanySize(peopleCount: number): string {
    if (peopleCount >= 50) return "Enterprise";
    if (peopleCount >= 20) return "Mid-Market"; 
    if (peopleCount >= 5) return "Small Business";
    return "Startup";
  }

  private static estimateDealValue(prospect: SpeedrunPerson, peopleCount: number): number {
    // Base value calculation
    let baseValue = 25000; // Base deal size
    
    // Company size multiplier
    if (peopleCount >= 50) baseValue *= 4; // Enterprise
    else if (peopleCount >= 20) baseValue *= 2.5; // Mid-Market
    else if (peopleCount >= 5) baseValue *= 1.5; // Small Business
    
    // Industry multiplier
    const industry = (prospect.customFields?.monacoEnrichment?.companyIntelligence?.industry || "").toLowerCase();
    if (industry.includes("finance") || industry.includes("banking")) baseValue *= 1.8;
    else if (industry.includes("healthcare")) baseValue *= 1.5;
    else if (industry.includes("technology")) baseValue *= 1.3;
    
    return Math.round(baseValue);
  }

  private static estimateCompanyRevenue(prospect: SpeedrunPerson, peopleCount: number): number {
    // Rough revenue estimation
    const avgRevenuePerEmployee = 200000; // $200k per employee average
    return peopleCount * avgRevenuePerEmployee;
  }

  private static inferDepartment(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("engineer") || titleLower.includes("developer") || titleLower.includes("tech")) return "Engineering";
    if (titleLower.includes("sales") || titleLower.includes("business development")) return "Sales";
    if (titleLower.includes("marketing")) return "Marketing";
    if (titleLower.includes("hr") || titleLower.includes("people")) return "Human Resources";
    if (titleLower.includes("finance") || titleLower.includes("accounting")) return "Finance";
    if (titleLower.includes("operations") || titleLower.includes("ops")) return "Operations";
    if (titleLower.includes("product")) return "Product";
    if (titleLower.includes("design")) return "Design";
    if (titleLower.includes("security")) return "Security";
    return "Other";
  }

  private static async getWorkspaceContext(): Promise<{ workspaceId: string; userId: string }> {
    try {
      return await WorkspaceDataRouter.getApiParams();
    } catch (error) {
      console.warn("Could not get workspace context:", error);
      return { workspaceId: "", userId: "" };
    }
  }
}
