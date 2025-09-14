import { getUnifiedAuthUser } from "@/platform/api-auth";

// Base API configuration
const API_BASE =
  process['env']['NODE_ENV'] === "development" ? "http://localhost:3000" : "";

// API Service class for Action Platform database access
export class DatabaseAPIService {
  private static instance: DatabaseAPIService;
  private authToken: string | null = null;

  private constructor() {}

  static getInstance(): DatabaseAPIService {
    if (!DatabaseAPIService.instance) {
      DatabaseAPIService['instance'] = new DatabaseAPIService();
    }
    return DatabaseAPIService.instance;
  }

  // Initialize authentication
  async initialize() {
    try {
      // For now, use a simple token - in production this would be proper JWT
      this['authToken'] = "database-api-token";
      console.log("✅ [DATABASE_API] Initialized with auth token");
    } catch (error) {
      console.error("❌ [DATABASE_API] Failed to initialize:", error);
      throw error;
    }
  }

  // Generic API call helper
  private async apiCall(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    if (!this.authToken) {
      await this.initialize();
    }

    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  // ===== LEADS API =====
  async getLeads(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      company?: string;
      status?: string;
      industry?: string;
      priority?: string;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const result = await this.apiCall(`/leads?${queryParams}`);
    console.log("✅ [LEADS_API] Retrieved leads:", {
      count: result.leads?.length,
      total: result.pagination?.total,
    });
    return result;
  }

  async createLead(leadData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    notes?: string;
    status?: string;
    priority?: string;
    source?: string;
  }) {
    const result = await this.apiCall("/leads", {
      method: "POST",
      body: JSON.stringify(leadData),
    });
    console.log("✅ [LEADS_API] Created lead:", {
      id: result.lead?.id,
      name: result.lead?.fullName,
    });
    return result;
  }

  async getLead(id: string) {
    const result = await this.apiCall(`/leads/${id}`);
    console.log("✅ [LEADS_API] Retrieved lead details:", {
      id,
      name: result.lead?.fullName,
    });
    return result;
  }

  async updateLead(id: string, updates: any) {
    const result = await this.apiCall(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    console.log("✅ [LEADS_API] Updated lead:", {
      id,
      status: result.lead?.status,
    });
    return result;
  }

  async deleteLead(id: string) {
    const result = await this.apiCall(`/leads/${id}`, {
      method: "DELETE",
    });
    console.log("✅ [LEADS_API] Deleted lead:", { id });
    return result;
  }

  // ===== CONTACTS API =====
  async getContacts(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      company?: string;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const result = await this.apiCall(`/contacts?${queryParams}`);
    console.log("✅ [CONTACTS_API] Retrieved contacts:", {
      count: result.contacts?.length,
    });
    return result;
  }

  async createContact(contactData: {
    firstName: string;
    lastName: string;
    email?: string;
    jobTitle?: string;
    phone?: string;
    accountId?: string;
    notes?: string;
  }) {
    const result = await this.apiCall("/contacts", {
      method: "POST",
      body: JSON.stringify(contactData),
    });
    console.log("✅ [CONTACTS_API] Created contact:", {
      id: result.contact?.id,
      name: result.contact?.fullName,
    });
    return result;
  }

  // ===== OPPORTUNITIES API =====
  async getOpportunities(
    params: {
      page?: number;
      limit?: number;
      stage?: string;
      priority?: string;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const result = await this.apiCall(`/opportunities?${queryParams}`);
    console.log("✅ [OPPORTUNITIES_API] Retrieved opportunities:", {
      count: result.opportunities?.length,
    });
    return result;
  }

  async createOpportunity(opportunityData: {
    name: string;
    description?: string;
    amount?: number;
    leadId?: string;
    accountId?: string;
    stage?: string;
    priority?: string;
    expectedCloseDate?: string;
    notes?: string;
  }) {
    const result = await this.apiCall("/opportunities", {
      method: "POST",
      body: JSON.stringify(opportunityData),
    });
    console.log("✅ [OPPORTUNITIES_API] Created opportunity:", {
      id: result.opportunity?.id,
      name: result.opportunity?.name,
    });
    return result;
  }

  // ===== ACTIVITIES API =====
  async getActivities(
    params: {
      page?: number;
      limit?: number;
      type?: string;
      leadId?: string;
      opportunityId?: string;
      accountId?: string;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const result = await this.apiCall(`/activities?${queryParams}`);
    console.log("✅ [ACTIVITIES_API] Retrieved activities:", {
      count: result.activities?.length,
    });
    return result;
  }

  async createActivity(activityData: {
    type: string;
    subject: string;
    description?: string;
    leadId?: string;
    opportunityId?: string;
    accountId?: string;
    contactId?: string;
    scheduledAt?: string;
    duration?: number;
    status?: string;
  }) {
    const result = await this.apiCall("/activities", {
      method: "POST",
      body: JSON.stringify(activityData),
    });
    console.log("✅ [ACTIVITIES_API] Created activity:", {
      id: result.activity?.id,
      type: result.activity?.type,
    });
    return result;
  }

  // ===== NOTES API =====
  async getNotes(
    params: {
      page?: number;
      limit?: number;
      leadId?: string;
      opportunityId?: string;
      accountId?: string;
      contactId?: string;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const result = await this.apiCall(`/notes?${queryParams}`);
    console.log("✅ [NOTES_API] Retrieved notes:", {
      count: result.notes?.length,
    });
    return result;
  }

  async createNote(noteData: {
    content: string;
    title?: string;
    type?: string;
    leadId?: string;
    opportunityId?: string;
    accountId?: string;
    contactId?: string;
    isPrivate?: boolean;
  }) {
    const result = await this.apiCall("/notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    });
    console.log("✅ [NOTES_API] Created note:", {
      id: result.note?.id,
      type: result.note?.type,
    });
    return result;
  }

  // ===== SEARCH API =====
  async search(params: {
    q: string;
    type?:
      | "all"
      | "leads"
      | "contacts"
      | "opportunities"
      | "accounts"
      | "notes"
      | "activities";
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const result = await this.apiCall(`/search?${queryParams}`);
    console.log("✅ [SEARCH_API] Search completed:", {
      query: params['q'],
      total: result.results?.total,
    });
    return result;
  }

  // ===== ANALYTICS API =====
  async getAnalytics(
    params: {
      timeframe?: "7d" | "30d" | "90d" | "1y";
      details?: boolean;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const result = await this.apiCall(`/analytics?${queryParams}`);
    console.log("✅ [ANALYTICS_API] Retrieved analytics:", {
      timeframe: params['timeframe'],
      totalLeads: result.analytics?.summary?.totalLeads,
    });
    return result;
  }

  // ===== INTELLIGENCE REPORTS API =====
  async getIntelligenceReports(
    params: {
      type?:
        | "all"
        | "lead-intelligence"
        | "account-intelligence"
        | "market-intelligence";
      limit?: number;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== "") {
        queryParams.append(key, String(value));
      }
    });

    const result = await this.apiCall(`/intelligence-reports?${queryParams}`);
    console.log("✅ [INTELLIGENCE_API] Retrieved reports:", {
      count: result.reports?.length,
    });
    return result;
  }

  async generateIntelligenceReport(reportData: {
    leadId?: string;
    accountId?: string;
    type?: string;
    prompt?: string;
  }) {
    const result = await this.apiCall("/intelligence-reports", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
    console.log("✅ [INTELLIGENCE_API] Generated report:", {
      type: result.intelligence?.type,
    });
    return result;
  }

  // ===== AI INTEGRATION METHODS =====

  // Quick AI-driven lead creation from natural language
  async createLeadFromAI(input: string) {
    const words = input.split(" ");
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const phoneRegex =
      /(\+?1?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{4})/;

    const email = input.match(emailRegex)?.[1];
    const phone = input.match(phoneRegex)?.[1];

    // Try to extract name and company from context
    const nameMatch = input.match(
      /(?:add|create|new).*?(?:lead|contact|person)\s+(?:for\s+)?([A-Za-z\s]+?)(?:\s+at\s+([A-Za-z\s&]+?))?(?:\s|$|,|\.|@)/i,
    );

    if (nameMatch && nameMatch[1]) {
      const fullName = nameMatch[1].trim();
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "Unknown";
      const company = nameMatch[2]?.trim();

      const leadData: any = {
        firstName,
        lastName,
        notes: `Created via AI from: "${input}"`,
        source: "ai_assistant",
      };

      if (email) leadData['email'] = email;
      if (phone) leadData['phone'] = phone;
      if (company) leadData['company'] = company;

      return await this.createLead(leadData);
    }

    throw new Error("Could not extract lead information from input");
  }

  // AI-driven smart search
  async intelligentSearch(query: string) {
    // Determine search intent
    const intent = this.determineSearchIntent(query);

    return await this.search({
      q: query,
      type: intent.type,
      limit: intent.limit,
    });
  }

  private determineSearchIntent(query: string): { type: any; limit: number } {
    const lower = query.toLowerCase();

    if (lower.includes("lead") || lower.includes("prospect")) {
      return { type: "leads", limit: 20 };
    }
    if (lower.includes("contact") || lower.includes("person")) {
      return { type: "contacts", limit: 20 };
    }
    if (lower.includes("opportunity") || lower.includes("deal")) {
      return { type: "opportunities", limit: 15 };
    }
    if (lower.includes("account") || lower.includes("company")) {
      return { type: "accounts", limit: 15 };
    }
    if (lower.includes("note") || lower.includes("comment")) {
      return { type: "notes", limit: 10 };
    }
    if (lower.includes("activity") || lower.includes("interaction")) {
      return { type: "activities", limit: 15 };
    }

    return { type: "all", limit: 30 };
  }

  // AI analytics for dashboard
  async getAIDashboard() {
    const [analytics, recentLeads, recentOpportunities, topActivities] =
      await Promise.all([
        this.getAnalytics({ timeframe: "30d", details: true }),
        this.getLeads({ limit: 10, page: 1 }),
        this.getOpportunities({ limit: 10, page: 1 }),
        this.getActivities({ limit: 10, page: 1 }),
      ]);

    return {
      analytics: analytics.analytics,
      recentLeads: recentLeads.leads,
      recentOpportunities: recentOpportunities.opportunities,
      topActivities: topActivities.activities,
      summary: {
        totalEntities:
          (analytics.analytics?.summary?.totalLeads || 0) +
          (analytics.analytics?.summary?.totalContacts || 0) +
          (analytics.analytics?.summary?.totalOpportunities || 0),
        pipelineValue: analytics.analytics?.summary?.totalPipelineValue || 0,
        conversionRate: analytics.analytics?.summary?.conversionRate || 0,
      },
    };
  }
}

// Export singleton instance
export const databaseAPI = DatabaseAPIService.getInstance();
