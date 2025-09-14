/**
 * 🏢 MULTI-TENANT WORKSPACE SERVICE
 * Enterprise-grade multi-tenancy with company and workspace isolation
 * URL Pattern: action.adrata.com/company/workspace
 *
 * Examples:
 * - action.adrata.com/dell/sales
 * - action.adrata.com/microsoft/enterprise-sales
 * - action.adrata.com/salesforce/customer-success
 */

import { prisma } from "@/platform/prisma";
import { CustomerSegmentationService } from "./customer-segmentation-service";

// Enterprise tenant structure
export interface CompanyTenant {
  id: string;
  slug: string; // URL-friendly: 'dell', 'microsoft'
  name: string; // Display name: 'Dell Technologies'
  domain?: string; // Email domain: 'dell.com'
  industry?: string; // 'Technology', 'Healthcare'
  size: "startup" | "smb" | "mid-market" | "enterprise";

  // Subscription & billing
  subscriptionTier: "trial" | "starter" | "professional" | "enterprise";
  subscriptionStatus: "active" | "trial" | "expired" | "cancelled";
  billingEmail: string;

  // Enterprise features
  ssoEnabled: boolean;
  customBranding: boolean;
  dataResidency?: string; // 'US', 'EU', 'APAC'
  complianceLevel: "standard" | "hipaa" | "sox" | "iso27001";
  ipWhitelist?: string[]; // IP addresses/ranges for enterprise security

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Relations
  workspaces: WorkspaceTenant[];
  primaryContact: CompanyContact;
}

export interface WorkspaceTenant {
  id: string;
  companyId: string;
  slug: string; // URL-friendly: 'sales', 'customer-success'
  name: string; // Display name: 'Enterprise Sales'
  department: string; // 'sales', 'marketing', 'customer-success'

  // Workspace configuration
  purpose:
    | "sales"
    | "marketing"
    | "customer-success"
    | "hr"
    | "operations"
    | "engineering"
    | "finance";
  isDefault: boolean; // Default workspace for new users
  isActive: boolean;

  // Access control
  visibility: "private" | "company" | "public";
  joinMode: "invite-only" | "domain-restricted" | "open";

  // Features enabled
  featuresEnabled: string[];
  integrations: string[];

  // Analytics
  userCount: number;
  activeUsers: number;
  dataSize: number; // MB

  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyContact {
  id: string;
  companyId: string;
  name: string;
  email: string;
  title: string;
  role: "admin" | "billing" | "technical" | "executive";
  isPrimary: boolean;
}

// Department suggestions from Monaco pipeline
export interface DepartmentSuggestion {
  name: string;
  slug: string;
  purpose: WorkspaceTenant["purpose"];
  description: string;
  suggestedApps: string[];
  estimatedUsers: number;
  priority: "high" | "medium" | "low";
  monacoConfidence: number; // 0-1 confidence from analysis
}

export class MultiTenantWorkspaceService {
  /**
   * 🔍 RESOLVE TENANT FROM URL
   * Parse action.adrata.com/company/workspace URLs
   */
  static parseTenantUrl(pathname: string): {
    companySlug?: string;
    workspaceSlug?: string;
  } {
    // Remove leading slash and split
    const parts = pathname.replace(/^\//, "").split("/");

    if (parts['length'] === 0) return {};
    if (parts['length'] === 1) return parts[0] ? { companySlug: parts[0] } : {};
    if (parts.length >= 2)
      return {
        ...(parts[0] && { companySlug: parts[0] }),
        ...(parts[1] && { workspaceSlug: parts[1] }),
      };

    return {};
  }

  /**
   * 🏢 COMPANY TENANT MANAGEMENT
   */
  static async createCompanyTenant(data: {
    name: string;
    slug: string;
    domain?: string;
    industry?: string;
    size: CompanyTenant["size"];
    primaryContact: {
      name: string;
      email: string;
      title: string;
    };
    subscriptionTier?: CompanyTenant["subscriptionTier"];
  }): Promise<CompanyTenant> {
    // Validate slug availability
    const existingCompany = await prisma.accounts.findFirst({
      where: { name: data.slug }, // Using name field as slug for now
    });

    if (existingCompany) {
      throw new Error(`Company slug '${data.slug}' is already taken`);
    }

    // Create company tenant
    const company = await prisma.accounts.create({
      data: {
        name: data.name,
        // In production, you'd add fields for:
        // slug: data.slug,
        // domain: data.domain,
        // industry: data.industry,
        // size: data.size,
        // subscriptionTier: data.subscriptionTier || 'trial',
        // subscriptionStatus: 'trial',
        // billingEmail: data.primaryContact.email,
        // ssoEnabled: false,
        // customBranding: false,
        // complianceLevel: 'standard',
      },
    });

    // Create default workspace
    const defaultWorkspace = await this.createWorkspaceTenant({
      companyId: company.id,
      name: "General",
      slug: "general",
      department: "general",
      purpose: "sales",
      isDefault: true,
      visibility: "company",
      joinMode: "domain-restricted",
    });

    // Analyze company with Monaco to suggest departments
    const departmentSuggestions = await this.analyzeCompanyDepartments(data);

    return {
      id: company.id,
      slug: data.slug,
      name: data.name,
      ...(data['domain'] && { domain: data.domain }),
      ...(data['industry'] && { industry: data.industry }),
      size: data.size,
      subscriptionTier: data.subscriptionTier || "trial",
      subscriptionStatus: "trial",
      billingEmail: data.primaryContact.email,
      ssoEnabled: false,
      customBranding: false,
      complianceLevel: "standard",
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      workspaces: [defaultWorkspace],
      primaryContact: {
        id: "contact_" + company.id,
        companyId: company.id,
        name: data.primaryContact.name,
        email: data.primaryContact.email,
        title: data.primaryContact.title,
        role: "admin",
        isPrimary: true,
      },
    };
  }

  /**
   * 🏢 WORKSPACE TENANT MANAGEMENT
   */
  static async createWorkspaceTenant(data: {
    companyId: string;
    name: string;
    slug: string;
    department: string;
    purpose: WorkspaceTenant["purpose"];
    isDefault?: boolean;
    visibility?: WorkspaceTenant["visibility"];
    joinMode?: WorkspaceTenant["joinMode"];
  }): Promise<WorkspaceTenant> {
    // Create workspace in database
    const workspace = await prisma.workspace.create({
      data: {
        name: data.name,
        slug: `${data.companyId}_${data.slug}`, // Ensure uniqueness
        description: `${data.name} workspace`,
        companyId: data.companyId,
        // In production, you'd add fields for:
        // department: data.department,
        // purpose: data.purpose,
        // isDefault: data.isDefault || false,
        // visibility: data.visibility || 'company',
        // joinMode: data.joinMode || 'invite-only',
      },
    });

    return {
      id: workspace.id,
      companyId: data.companyId,
      slug: data.slug,
      name: data.name,
      department: data.department,
      purpose: data.purpose,
      isDefault: data.isDefault || false,
      isActive: true,
      visibility: data.visibility || "company",
      joinMode: data.joinMode || "invite-only",
      featuresEnabled: this.getDefaultFeatures(data.purpose),
      integrations: [],
      userCount: 0,
      activeUsers: 0,
      dataSize: 0,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  /**
   * 🔍 TENANT RESOLUTION
   */
  static async resolveCompanyTenant(
    companySlug: string,
  ): Promise<CompanyTenant | null> {
    const company = await prisma.accounts.findFirst({
      where: { name: companySlug }, // Using name as slug for now
      include: {
        workspaces: true,
      },
    });

    if (!company) return null;

    // Convert to CompanyTenant format
    return {
      id: company.id,
      slug: companySlug,
      name: company.name,
      subscriptionTier: "trial",
      subscriptionStatus: "active",
      billingEmail: "contact@company.com",
      ssoEnabled: false,
      customBranding: false,
      size: "enterprise",
      complianceLevel: "standard",
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      workspaces: company.workspaces.map((ws) => ({
        id: ws.id,
        companyId: company.id,
        slug: ws.slug.split("_")[1] || ws.slug,
        name: ws.name,
        department: "general",
        purpose: "sales" as const,
        isDefault: true,
        isActive: true,
        visibility: "company" as const,
        joinMode: "invite-only" as const,
        featuresEnabled: ["aos", "analytics"],
        integrations: [],
        userCount: 0,
        activeUsers: 0,
        dataSize: 0,
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt,
      })),
      primaryContact: {
        id: "contact_" + company.id,
        companyId: company.id,
        name: "Primary Contact",
        email: "contact@company.com",
        title: "Admin",
        role: "admin",
        isPrimary: true,
      },
    };
  }

  static async resolveWorkspaceTenant(
    companySlug: string,
    workspaceSlug: string,
  ): Promise<WorkspaceTenant | null> {
    const company = await this.resolveCompanyTenant(companySlug);
    if (!company) return null;

    return company.workspaces.find((ws) => ws['slug'] === workspaceSlug) || null;
  }

  /**
   * 🧠 MONACO DEPARTMENT ANALYSIS
   * Use Monaco pipeline to suggest optimal workspace structure
   */
  static async analyzeCompanyDepartments(companyData: {
    name: string;
    domain?: string;
    industry?: string;
    size: CompanyTenant["size"];
  }): Promise<DepartmentSuggestion[]> {
    // Simulate Monaco analysis based on company characteristics
    const suggestions: DepartmentSuggestion[] = [];

    // Base departments for all companies
    suggestions.push({
      name: "Sales",
      slug: "sales",
      purpose: "sales",
      description: "Revenue generation and client acquisition",
              suggestedApps: ["aos", "Speedrun", "pipeline"],
      estimatedUsers: this.estimateUsers(companyData.size, 0.3),
      priority: "high",
      monacoConfidence: 0.95,
    });

    suggestions.push({
      name: "Customer Success",
      slug: "customer-success",
      purpose: "customer-success",
      description: "Client retention and growth",
      suggestedApps: ["harmony", "pulse", "analytics"],
      estimatedUsers: this.estimateUsers(companyData.size, 0.2),
      priority: "high",
      monacoConfidence: 0.9,
    });

    // Industry-specific suggestions
    if (companyData['industry'] === "Technology") {
      suggestions.push({
        name: "Engineering",
        slug: "engineering",
        purpose: "engineering",
        description: "Product development and technical operations",
        suggestedApps: ["laboratory", "systems", "tower"],
        estimatedUsers: this.estimateUsers(companyData.size, 0.4),
        priority: "medium",
        monacoConfidence: 0.85,
      });
    }

    // Size-specific suggestions
    if (companyData['size'] === "enterprise") {
      suggestions.push({
        name: "Marketing",
        slug: "marketing",
        purpose: "marketing",
        description: "Brand management and demand generation",
        suggestedApps: ["campaigns", "social", "inspire"],
        estimatedUsers: this.estimateUsers(companyData.size, 0.15),
        priority: "medium",
        monacoConfidence: 0.8,
      });

      suggestions.push({
        name: "Operations",
        slug: "operations",
        purpose: "operations",
        description: "Business operations and process optimization",
        suggestedApps: ["orchestrate", "optimization", "vitals"],
        estimatedUsers: this.estimateUsers(companyData.size, 0.1),
        priority: "low",
        monacoConfidence: 0.75,
      });
    }

    return suggestions.sort((a, b) => {
      // Sort by priority then confidence
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.monacoConfidence - a.monacoConfidence;
    });
  }

  /**
   * 👥 USER WORKSPACE MANAGEMENT
   */
  static async addUserToWorkspace(
    userId: string,
    companySlug: string,
    workspaceSlug: string,
    role: "admin" | "member" | "guest" = "member",
  ): Promise<void> {
    const workspace = await this.resolveWorkspaceTenant(
      companySlug,
      workspaceSlug,
    );
    if (!workspace) {
      throw new Error(`Workspace ${companySlug}/${workspaceSlug} not found`);
    }

    await prisma.workspaceUser.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role,
      },
    });
  }

  static async getUserWorkspaces(
    userId: string,
  ): Promise<Array<{ company: CompanyTenant; workspace: WorkspaceTenant }>> {
    const workspaceUsers = await prisma.workspaceUser.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            company: true,
          },
        },
      },
    });

    return workspaceUsers.map((wu) => ({
      company: {
        id: wu.workspace.company?.id || "",
        slug: wu.workspace.company?.name || "",
        name: wu.workspace.company?.name || "",
        subscriptionTier: "trial" as const,
        subscriptionStatus: "active" as const,
        billingEmail: "contact@company.com",
        ssoEnabled: false,
        customBranding: false,
        size: "enterprise" as const,
        complianceLevel: "standard" as const,
        createdAt: wu.workspace.company?.createdAt || new Date(),
        updatedAt: wu.workspace.company?.updatedAt || new Date(),
        workspaces: [],
        primaryContact: {
          id: "contact",
          companyId: wu.workspace.company?.id || "",
          name: "Contact",
          email: "contact@company.com",
          title: "Admin",
          role: "admin",
          isPrimary: true,
        },
      },
      workspace: {
        id: wu.workspace.id,
        companyId: wu.workspace.company?.id || "",
        slug: wu.workspace.slug,
        name: wu.workspace.name,
        department: "general",
        purpose: "sales" as const,
        isDefault: true,
        isActive: true,
        visibility: "company" as const,
        joinMode: "invite-only" as const,
        featuresEnabled: ["aos"],
        integrations: [],
        userCount: 0,
        activeUsers: 0,
        dataSize: 0,
        createdAt: wu.workspace.createdAt,
        updatedAt: wu.workspace.updatedAt,
      },
    }));
  }

  /**
   * 📊 TENANT ANALYTICS
   * Integrate with customer segmentation
   */
  static async getTenantAnalytics(companySlug: string): Promise<{
    company: CompanyTenant;
    analytics: any;
    workspaceBreakdown: Array<{ workspace: WorkspaceTenant; metrics: any }>;
  }> {
    const company = await this.resolveCompanyTenant(companySlug);
    if (!company) {
      throw new Error(`Company ${companySlug} not found`);
    }

    // Get overall company analytics
    const analytics = await CustomerSegmentationService.getSegmentedAnalytics();

    // Get workspace-specific metrics
    const workspaceBreakdown = await Promise.all(
      company.workspaces.map(async (workspace) => {
        const workspaceAnalytics =
          await CustomerSegmentationService.getCustomerProfile(workspace.id);
        return {
          workspace,
          metrics: {
            users: workspace.userCount,
            activeUsers: workspace.activeUsers,
            engagementScore: workspaceAnalytics.engagementScore,
            healthScore: workspaceAnalytics.healthScore,
            dataSize: workspace.dataSize,
          },
        };
      }),
    );

    return {
      company,
      analytics,
      workspaceBreakdown,
    };
  }

  /**
   * 🛠️ UTILITY METHODS
   */
  private static estimateUsers(
    size: CompanyTenant["size"],
    percentage: number,
  ): number {
    const sizeMultipliers = {
      startup: 10,
      smb: 50,
      "mid-market": 200,
      enterprise: 1000,
    };
    return Math.round(sizeMultipliers[size] * percentage);
  }

  private static getDefaultFeatures(
    purpose: WorkspaceTenant["purpose"],
  ): string[] {
    const featureMap = {
      sales: ["aos", "Speedrun", "pipeline", "analytics"],
      marketing: ["campaigns", "social", "inspire", "analytics"],
      "customer-success": ["harmony", "pulse", "analytics", "support"],
      hr: ["harmony", "recruit", "analytics"],
      operations: ["orchestrate", "optimization", "vitals", "analytics"],
      engineering: ["laboratory", "systems", "tower", "analytics"],
      finance: ["analytics", "reports", "audit"],
    };
    return featureMap[purpose] || ["analytics"];
  }

  /**
   * 🌐 URL GENERATION
   */
  static generateWorkspaceUrl(
    companySlug: string,
    workspaceSlug: string,
  ): string {
    return `https://action.adrata.com/${companySlug}/${workspaceSlug}`;
  }

  static generateCompanyUrl(companySlug: string): string {
    return `https://action.adrata.com/${companySlug}`;
  }
}
