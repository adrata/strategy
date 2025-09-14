export function isAboveTheLine(title: string): boolean {
  // TODO: Implement above-the-line detection logic
  const executiveTitles = ["ceo", "cto", "cfo", "president", "vp", "director"];
  return executiveTitles.some((exec) => title.toLowerCase().includes(exec));
}

export function inferSeniority(
  title: string,
): "entry" | "mid" | "senior" | "executive" {
  // TODO: Implement seniority inference logic
  const titleLower = title.toLowerCase();

  if (
    titleLower.includes("ceo") ||
    titleLower.includes("president") ||
    titleLower.includes("founder")
  ) {
    return "executive";
  }
  if (
    titleLower.includes("vp") ||
    titleLower.includes("director") ||
    titleLower.includes("head")
  ) {
    return "senior";
  }
  if (titleLower.includes("manager") || titleLower.includes("lead")) {
    return "mid";
  }

  return "entry";
}

export function scorePersonForRole(
  person: any,
  role: string,
): { score: number; rationale: string } {
  // TODO: Implement person scoring logic
  let score = 0;
  const reasons: string[] = [];

  if (person['title'] && person.title.toLowerCase().includes(role.toLowerCase())) {
    score += 50;
    reasons.push("Title matches role");
  }

  if (person['influence'] && person.influence > 0.7) {
    score += 30;
    reasons.push("High influence score");
  }

  if (person['decisionPower'] && person.decisionPower > 0.6) {
    score += 20;
    reasons.push("Strong decision-making power");
  }

  return {
    score: Math.min(score, 100),
    rationale: reasons.length > 0 ? reasons.join(", ") : "No clear indicators",
  };
}

export function inferDepartment(title: string, company?: any): string {
  // TODO: Implement department inference logic
  const titleLower = title.toLowerCase();

  if (
    titleLower.includes("engineer") ||
    titleLower.includes("developer") ||
    titleLower.includes("technical")
  ) {
    return "Engineering";
  }
  if (titleLower.includes("sales") || titleLower.includes("account")) {
    return "Sales";
  }
  if (titleLower.includes("marketing") || titleLower.includes("brand")) {
    return "Marketing";
  }
  if (
    titleLower.includes("hr") ||
    titleLower.includes("people") ||
    titleLower.includes("talent")
  ) {
    return "Human Resources";
  }

  return "General";
}

export interface TeamMapping {
  businessUnit: string;
  department: string;
  team: string;
  subTeam?: string;
  specialization?: string;
  teamSize?: "small" | "medium" | "large";
  teamType?: "operational" | "strategic" | "support" | "revenue";
}

export interface TeamPattern {
  pattern: RegExp;
  team: string;
  subTeam?: string;
  specialization?: string;
  businessUnit?: string;
  teamType?: "operational" | "strategic" | "support" | "revenue";
}

/**
 * Enhanced team inference with business unit, team, and sub-team detection
 */
export function inferTeam(person: any): string {
  // Keep backward compatibility - return team name
  const teamMapping = enhancedTeamInference(person);
  return teamMapping.team;
}

/**
 * Comprehensive team mapping for organizational intelligence
 */
export function enhancedTeamInference(person: any): TeamMapping {
  const title = (person.title || '').toLowerCase();
  const department = person.department || inferDepartment(person.title);
  const company = person.company || person.companyName || '';
  
  // Step 1: Detect business unit
  const businessUnit = detectBusinessUnit(company, title);
  
  // Step 2: Extract team from title patterns
  const teamInfo = extractTeamFromTitle(title, department);
  
  // Step 3: Determine team characteristics
  const teamSize = estimateTeamSize(title);
  const teamType = classifyTeamType(department, teamInfo.team);
  
  return {
    businessUnit,
    department,
    team: teamInfo.team,
    subTeam: teamInfo.subTeam,
    specialization: teamInfo.specialization,
    teamSize,
    teamType
  };
}

/**
 * Detect business unit from company name and title context
 */
function detectBusinessUnit(company: string, title: string): string {
  const companyLower = company.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Dell Technologies business units
  if (companyLower.includes('dell')) {
    if (companyLower.includes('emc') || titleLower.includes('infrastructure') || titleLower.includes('storage')) {
      return 'Dell EMC';
    }
    if (companyLower.includes('vmware') || titleLower.includes('virtualization') || titleLower.includes('cloud platform')) {
      return 'VMware';
    }
    if (companyLower.includes('secureworks') || titleLower.includes('security') || titleLower.includes('cybersecurity')) {
      return 'SecureWorks';
    }
    if (companyLower.includes('boomi') || titleLower.includes('integration')) {
      return 'Boomi';
    }
    return 'Dell Technologies';
  }
  
  // Microsoft business units
  if (companyLower.includes('microsoft')) {
    if (titleLower.includes('azure') || titleLower.includes('cloud')) {
      return 'Microsoft Azure';
    }
    if (titleLower.includes('office') || titleLower.includes('365') || titleLower.includes('teams')) {
      return 'Microsoft 365';
    }
    if (titleLower.includes('dynamics') || titleLower.includes('crm')) {
      return 'Microsoft Dynamics';
    }
    if (titleLower.includes('surface') || titleLower.includes('hardware')) {
      return 'Microsoft Devices';
    }
    return 'Microsoft';
  }
  
  // Salesforce business units
  if (companyLower.includes('salesforce')) {
    if (titleLower.includes('slack') || titleLower.includes('collaboration')) {
      return 'Slack';
    }
    if (titleLower.includes('tableau') || titleLower.includes('analytics')) {
      return 'Tableau';
    }
    if (titleLower.includes('mulesoft') || titleLower.includes('integration')) {
      return 'MuleSoft';
    }
    return 'Salesforce';
  }
  
  // Default to company name
  return company || 'Unknown Company';
}

/**
 * Extract team and sub-team from title patterns
 */
function extractTeamFromTitle(title: string, department: string): {
  team: string;
  subTeam?: string;
  specialization?: string;
} {
  const teamPatterns: TeamPattern[] = [
    // Sales Teams
    { pattern: /enterprise.*sales/i, team: "Enterprise Sales Team", teamType: "revenue" },
    { pattern: /inside.*sales/i, team: "Inside Sales Team", teamType: "revenue" },
    { pattern: /field.*sales/i, team: "Field Sales Team", teamType: "revenue" },
    { pattern: /channel.*partner/i, team: "Channel Partner Team", teamType: "revenue" },
    { pattern: /sales.*development/i, team: "Sales Development Team", subTeam: "Lead Generation", teamType: "revenue" },
    { pattern: /account.*management/i, team: "Account Management Team", teamType: "revenue" },
    { pattern: /customer.*success/i, team: "Customer Success Team", teamType: "revenue" },
    
    // Sales Operations Teams
    { pattern: /sales.*operations/i, team: "Sales Operations Team", teamType: "operational" },
    { pattern: /revenue.*operations/i, team: "Revenue Operations Team", teamType: "operational" },
    { pattern: /sales.*enablement/i, team: "Sales Enablement Team", subTeam: "Training & Tools", teamType: "support" },
    { pattern: /sales.*intelligence/i, team: "Sales Intelligence Team", subTeam: "Data & Analytics", teamType: "operational" },
    { pattern: /sales.*engineering/i, team: "Sales Engineering Team", subTeam: "Technical Sales", teamType: "support" },
    
    // Marketing Teams
    { pattern: /digital.*marketing/i, team: "Digital Marketing Team", teamType: "operational" },
    { pattern: /product.*marketing/i, team: "Product Marketing Team", teamType: "strategic" },
    { pattern: /field.*marketing/i, team: "Field Marketing Team", teamType: "operational" },
    { pattern: /marketing.*operations/i, team: "Marketing Operations Team", teamType: "operational" },
    { pattern: /marketing.*analytics/i, team: "Marketing Analytics Team", subTeam: "Data & Insights", teamType: "operational" },
    { pattern: /demand.*generation/i, team: "Demand Generation Team", teamType: "operational" },
    { pattern: /content.*marketing/i, team: "Content Marketing Team", subTeam: "Content Strategy", teamType: "operational" },
    { pattern: /event.*marketing/i, team: "Event Marketing Team", subTeam: "Events & Conferences", teamType: "operational" },
    
    // Customer Success Teams
    { pattern: /customer.*success.*operations/i, team: "Customer Success Operations Team", teamType: "operational" },
    { pattern: /customer.*onboarding/i, team: "Customer Onboarding Team", teamType: "operational" },
    { pattern: /customer.*support/i, team: "Customer Support Team", teamType: "support" },
    { pattern: /technical.*account/i, team: "Technical Account Management Team", teamType: "support" },
    
    // Engineering Teams
    { pattern: /cloud.*platform/i, team: "Cloud Platform Team", subTeam: "Infrastructure", teamType: "operational" },
    { pattern: /(ai|ml|machine.*learning)/i, team: "AI/ML Research Team", subTeam: "Data Science", teamType: "strategic" },
    { pattern: /data.*engineering/i, team: "Data Engineering Team", subTeam: "Data Infrastructure", teamType: "operational" },
    { pattern: /security.*engineering/i, team: "Security Engineering Team", subTeam: "Platform Security", teamType: "operational" },
    { pattern: /devops/i, team: "DevOps Team", subTeam: "Infrastructure Automation", teamType: "operational" },
    
    // Specialized Teams
    { pattern: /business.*intelligence/i, team: "Business Intelligence Team", subTeam: "Analytics & Reporting", teamType: "operational" },
    { pattern: /integration.*team/i, team: "Integration Team", subTeam: "Systems Integration", teamType: "operational" },
    { pattern: /automation.*team/i, team: "Automation Team", subTeam: "Process Automation", teamType: "operational" },
    { pattern: /innovation.*team/i, team: "Innovation Team", subTeam: "R&D", teamType: "strategic" },
  ];
  
  // Find matching team pattern
  for (const pattern of teamPatterns) {
    if (pattern.pattern.test(title)) {
      return {
        team: pattern.team,
        subTeam: pattern.subTeam,
        specialization: extractSpecialization(title)
      };
    }
  }
  
  // Department-based fallback
  const departmentTeams: Record<string, string> = {
    "Sales": "Sales Team",
    "Marketing": "Marketing Team", 
    "Customer Success": "Customer Success Team",
    "Engineering": "Engineering Team",
    "Product": "Product Team",
    "Operations": "Operations Team",
    "Finance": "Finance Team",
    "Legal": "Legal Team",
    "Human Resources": "HR Team",
    "IT": "IT Team"
  };
  
  return {
    team: departmentTeams[department] || `${department} Team`,
    specialization: extractSpecialization(title)
  };
}

/**
 * Extract specialization from title
 */
function extractSpecialization(title: string): string | undefined {
  const specializations = [
    { pattern: /cloud.*infrastructure/i, spec: "Cloud Infrastructure" },
    { pattern: /marketing.*automation/i, spec: "Marketing Automation" },
    { pattern: /sales.*automation/i, spec: "Sales Automation" },
    { pattern: /data.*analytics/i, spec: "Data Analytics" },
    { pattern: /machine.*learning/i, spec: "Machine Learning" },
    { pattern: /artificial.*intelligence/i, spec: "Artificial Intelligence" },
    { pattern: /cybersecurity/i, spec: "Cybersecurity" },
    { pattern: /integration/i, spec: "Systems Integration" },
    { pattern: /automation/i, spec: "Process Automation" },
    { pattern: /analytics/i, spec: "Analytics" },
    { pattern: /intelligence/i, spec: "Business Intelligence" }
  ];
  
  for (const { pattern, spec } of specializations) {
    if (pattern.test(title)) return spec;
  }
  
  return undefined;
}

/**
 * Estimate team size based on title and role
 */
function estimateTeamSize(title: string): "small" | "medium" | "large" {
  if (/\b(vp|vice.*president|director)\b/i.test(title)) {
    return "large"; // VPs and Directors typically manage large teams
  }
  if (/\b(manager|lead|head)\b/i.test(title)) {
    return "medium"; // Managers typically have medium-sized teams
  }
  return "small"; // Individual contributors or small teams
}

/**
 * Classify team type based on function
 */
function classifyTeamType(department: string, team: string): "operational" | "strategic" | "support" | "revenue" {
  const revenue = ["Sales", "Customer Success", "Business Development"];
  const strategic = ["Product", "Strategy", "Innovation", "Research"];
  const support = ["Legal", "Finance", "Human Resources", "IT"];
  
  if (revenue.includes(department) || team.toLowerCase().includes("sales") || team.toLowerCase().includes("revenue")) {
    return "revenue";
  }
  if (strategic.includes(department) || team.toLowerCase().includes("strategy") || team.toLowerCase().includes("innovation")) {
    return "strategic";
  }
  if (support.includes(department)) {
    return "support";
  }
  return "operational";
}

export function inferPersonality(person: any): string[] {
  // TODO: Implement personality inference logic
  const personalities = [];

  if (
    person.title?.toLowerCase().includes("lead") ||
    person.title?.toLowerCase().includes("manager")
  ) {
    personalities.push("Leadership-oriented");
  }

  if (person['influence'] && person.influence > 0.8) {
    personalities.push("Highly influential");
  }

  return personalities.length > 0 ? personalities : ["Professional"];
}

export function calculateInfluenceScore(person: any): number {
  // TODO: Implement influence score calculation
  let score = 0;

  if (person['title'] && isAboveTheLine(person.title)) {
    score += 40;
  }

  if (person['connections'] && person.connections > 500) {
    score += 20;
  }

  if (person['yearsExperience'] && person.yearsExperience > 10) {
    score += 20;
  }

  return Math.min(score + 20, 100); // Base score of 20
}
