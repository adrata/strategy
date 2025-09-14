/**
 * 🧠 SMART LOCAL NUMBER SERVICE
 * Intelligent local number selection using multiple data points
 * Goes beyond area codes to find the best local presence
 */

import { prisma } from "@/platform/prisma";

export interface SmartNumberSelection {
  phoneNumber: string;
  confidence: number;
  matchType:
    | "exact_location"
    | "company_location"
    | "area_code"
    | "region"
    | "fallback";
  reasoning: string;
  location: {
    city?: string;
    state?: string;
    region?: string;
  };
}

export interface ContactLocationData {
  phone: string;
  company?: string;
  jobTitle?: string;
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
  };
  linkedInUrl?: string;
  email?: string;
}

export class SmartLocalNumberService {
  // Your available phone numbers with their locations
  private phoneNumbers = [
    {
      number: "+16025669750",
      city: "Phoenix",
      state: "AZ",
      region: "Southwest",
      areaCode: "602",
    },
    {
      number: "+14159658498",
      city: "San Francisco",
      state: "CA",
      region: "West Coast",
      areaCode: "415",
    },
    {
      number: "+15108008652",
      city: "Oakland",
      state: "CA",
      region: "West Coast",
      areaCode: "510",
    },
    {
      number: "+14085123536",
      city: "San Jose",
      state: "CA",
      region: "West Coast",
      areaCode: "408",
    },
    {
      number: "+13128001301",
      city: "Chicago",
      state: "IL",
      region: "Midwest",
      areaCode: "312",
    },
    {
      number: "+13025922685",
      city: "Wilmington",
      state: "DE",
      region: "East Coast",
      areaCode: "302",
    },
    {
      number: "+18889130475",
      city: "National",
      state: "US",
      region: "National",
      areaCode: "888",
    },
  ];

  // Company headquarters locations (enriched data)
  private companyLocations = new Map([
    ["Google", { city: "Mountain View", state: "CA" }],
    ["Apple", { city: "Cupertino", state: "CA" }],
    ["Microsoft", { city: "Redmond", state: "WA" }],
    ["Amazon", { city: "Seattle", state: "WA" }],
    ["Meta", { city: "Menlo Park", state: "CA" }],
    ["Tesla", { city: "Austin", state: "TX" }],
    ["Salesforce", { city: "San Francisco", state: "CA" }],
    ["Oracle", { city: "Austin", state: "TX" }],
    ["Intel", { city: "Santa Clara", state: "CA" }],
    ["IBM", { city: "Armonk", state: "NY" }],
    ["Cisco", { city: "San Jose", state: "CA" }],
    ["Adobe", { city: "San Jose", state: "CA" }],
    ["Netflix", { city: "Los Gatos", state: "CA" }],
    ["Uber", { city: "San Francisco", state: "CA" }],
    ["Airbnb", { city: "San Francisco", state: "CA" }],
    ["Stripe", { city: "San Francisco", state: "CA" }],
    ["Zoom", { city: "San Jose", state: "CA" }],
    ["Slack", { city: "San Francisco", state: "CA" }],
    ["Dropbox", { city: "San Francisco", state: "CA" }],
    ["Square", { city: "San Francisco", state: "CA" }],
  ]);

  // Area code to city/state mapping
  private areaCodeLocations = new Map([
    ["602", { city: "Phoenix", state: "AZ", region: "Southwest" }],
    ["480", { city: "Phoenix", state: "AZ", region: "Southwest" }],
    ["623", { city: "Phoenix", state: "AZ", region: "Southwest" }],
    ["415", { city: "San Francisco", state: "CA", region: "West Coast" }],
    ["510", { city: "Oakland", state: "CA", region: "West Coast" }],
    ["408", { city: "San Jose", state: "CA", region: "West Coast" }],
    ["650", { city: "Palo Alto", state: "CA", region: "West Coast" }],
    ["312", { city: "Chicago", state: "IL", region: "Midwest" }],
    ["773", { city: "Chicago", state: "IL", region: "Midwest" }],
    ["302", { city: "Wilmington", state: "DE", region: "East Coast" }],
    ["212", { city: "New York", state: "NY", region: "East Coast" }],
    ["646", { city: "New York", state: "NY", region: "East Coast" }],
    ["917", { city: "New York", state: "NY", region: "East Coast" }],
    ["206", { city: "Seattle", state: "WA", region: "West Coast" }],
    ["425", { city: "Seattle", state: "WA", region: "West Coast" }],
    ["512", { city: "Austin", state: "TX", region: "Southwest" }],
    ["214", { city: "Dallas", state: "TX", region: "Southwest" }],
    ["713", { city: "Houston", state: "TX", region: "Southwest" }],
    ["305", { city: "Miami", state: "FL", region: "Southeast" }],
    ["404", { city: "Atlanta", state: "GA", region: "Southeast" }],
    ["617", { city: "Boston", state: "MA", region: "East Coast" }],
    ["303", { city: "Denver", state: "CO", region: "Mountain" }],
    ["503", { city: "Portland", state: "OR", region: "West Coast" }],
    ["702", { city: "Las Vegas", state: "NV", region: "Southwest" }],
  ]);

  async getSmartLocalNumber(
    contact: ContactLocationData,
  ): Promise<SmartNumberSelection> {
    console.log(`🧠 Smart number selection for: ${contact.phone}`);

    // 1. Try explicit location data first (highest confidence)
    if (contact.location?.city && contact.location?.state) {
      const locationMatch = this.findByLocation(
        contact.location.city,
        contact.location.state,
      );
      if (locationMatch) {
        return {
          phoneNumber: locationMatch.number,
          confidence: 0.95,
          matchType: "exact_location",
          reasoning: `Contact is in ${contact.location.city}, ${contact.location.state}`,
          location: { city: locationMatch.city, state: locationMatch.state },
        };
      }
    }

    // 2. Try company location intelligence (high confidence)
    if (contact.company) {
      const companyLocation = this.getCompanyLocation(contact.company);
      if (companyLocation) {
        const companyMatch = this.findByLocation(
          companyLocation.city,
          companyLocation.state,
        );
        if (companyMatch) {
          return {
            phoneNumber: companyMatch.number,
            confidence: 0.85,
            matchType: "company_location",
            reasoning: `${contact.company} is headquartered in ${companyLocation.city}, ${companyLocation.state}`,
            location: { city: companyMatch.city, state: companyMatch.state },
          };
        }
      }
    }

    // 3. Enhanced area code analysis with location intelligence
    const areaCode = this.extractAreaCode(contact.phone);
    if (areaCode) {
      const areaCodeLocation = this.areaCodeLocations.get(areaCode);
      if (areaCodeLocation) {
        // Check if we have a number in that exact location
        const exactMatch = this.findByLocation(
          areaCodeLocation.city,
          areaCodeLocation.state,
        );
        if (exactMatch) {
          return {
            phoneNumber: exactMatch.number,
            confidence: 0.75,
            matchType: "area_code",
            reasoning: `Area code ${areaCode} is from ${areaCodeLocation.city}, ${areaCodeLocation.state}`,
            location: { city: exactMatch.city, state: exactMatch.state },
          };
        }

        // Try regional match
        const regionalMatch = this.findByRegion(areaCodeLocation.region);
        if (regionalMatch) {
          return {
            phoneNumber: regionalMatch.number,
            confidence: 0.65,
            matchType: "region",
            reasoning: `Area code ${areaCode} is in ${areaCodeLocation.region} region`,
            location: {
              city: regionalMatch.city,
              state: regionalMatch.state,
              region: areaCodeLocation.region,
            },
          };
        }
      }
    }

    // 4. Email domain intelligence (medium confidence)
    if (contact.email) {
      const emailMatch = await this.analyzeEmailDomain(contact.email);
      if (emailMatch) {
        return emailMatch;
      }
    }

    // 5. Job title location hints (lower confidence)
    if (contact.jobTitle) {
      const titleMatch = this.analyzeJobTitle(contact.jobTitle);
      if (titleMatch) {
        return titleMatch;
      }
    }

    // 6. Fallback to toll-free
    return {
      phoneNumber: "+18889130475",
      confidence: 0.3,
      matchType: "fallback",
      reasoning: "No location intelligence available, using toll-free number",
      location: { city: "National", state: "US" },
    };
  }

  private findByLocation(city: string, state: string) {
    return this.phoneNumbers.find(
      (num) =>
        num.city.toLowerCase() === city.toLowerCase() &&
        num.state.toLowerCase() === state.toLowerCase(),
    );
  }

  private findByRegion(region: string) {
    return this.phoneNumbers.find(
      (num) => num.region.toLowerCase() === region.toLowerCase(),
    );
  }

  private getCompanyLocation(company: string) {
    // Try exact match first
    const exact = this.companyLocations.get(company);
    if (exact) return exact;

    // Try partial matches for subsidiaries
    for (const [companyName, location] of this.companyLocations.entries()) {
      if (
        company.toLowerCase().includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(company.toLowerCase())
      ) {
        return location;
      }
    }

    return null;
  }

  private extractAreaCode(phone: string): string | null {
    // Handle various phone formats
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned['length'] === 11 && cleaned.startsWith("1")) {
      return cleaned.substring(1, 4);
    } else if (cleaned['length'] === 10) {
      return cleaned.substring(0, 3);
    }
    return null;
  }

  private async analyzeEmailDomain(
    email: string,
  ): Promise<SmartNumberSelection | null> {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return null;

    // Company domain to location mapping
    const domainLocations = new Map([
      ["google.com", { city: "Mountain View", state: "CA" }],
      ["apple.com", { city: "Cupertino", state: "CA" }],
      ["microsoft.com", { city: "Redmond", state: "WA" }],
      ["amazon.com", { city: "Seattle", state: "WA" }],
      ["meta.com", { city: "Menlo Park", state: "CA" }],
      ["facebook.com", { city: "Menlo Park", state: "CA" }],
      ["salesforce.com", { city: "San Francisco", state: "CA" }],
      ["oracle.com", { city: "Austin", state: "TX" }],
      ["intel.com", { city: "Santa Clara", state: "CA" }],
      ["cisco.com", { city: "San Jose", state: "CA" }],
      ["adobe.com", { city: "San Jose", state: "CA" }],
      ["netflix.com", { city: "Los Gatos", state: "CA" }],
      ["uber.com", { city: "San Francisco", state: "CA" }],
      ["airbnb.com", { city: "San Francisco", state: "CA" }],
      ["stripe.com", { city: "San Francisco", state: "CA" }],
    ]);

    const location = domainLocations.get(domain);
    if (location) {
      const match = this.findByLocation(location.city, location.state);
      if (match) {
        return {
          phoneNumber: match.number,
          confidence: 0.8,
          matchType: "company_location",
          reasoning: `Email domain ${domain} indicates ${location.city}, ${location.state}`,
          location: { city: match.city, state: match.state },
        };
      }
    }

    return null;
  }

  private analyzeJobTitle(jobTitle: string): SmartNumberSelection | null {
    const title = jobTitle.toLowerCase();

    // Tech job titles often indicate Silicon Valley
    const techKeywords = [
      "engineer",
      "developer",
      "architect",
      "devops",
      "sre",
      "cto",
      "vp engineering",
    ];
    if (techKeywords.some((keyword) => title.includes(keyword))) {
      const siliconValley = this.findByLocation("San Jose", "CA");
      if (siliconValley) {
        return {
          phoneNumber: siliconValley.number,
          confidence: 0.5,
          matchType: "region",
          reasoning: `Tech job title "${jobTitle}" suggests Silicon Valley location`,
          location: { city: "San Jose", state: "CA", region: "West Coast" },
        };
      }
    }

    return null;
  }

  // Get analytics on number selection performance
  async getSelectionAnalytics() {
    const leads = await prisma.leads.findMany({
      where: { workspaceId: "adrata" , deletedAt: null},
      select: { phone: true, company: true, jobTitle: true, email: true },
    });

    const analytics = {
      totalLeads: leads.length,
      selectionTypes: {
        exact_location: 0,
        company_location: 0,
        area_code: 0,
        region: 0,
        fallback: 0,
      },
      averageConfidence: 0,
      numberUsage: new Map<string, number>(),
    };

    let totalConfidence = 0;

    for (const lead of leads) {
      if (lead.phone) {
        const selection = await this.getSmartLocalNumber({
          phone: lead.phone,
          ...(lead['company'] && { company: lead.company }),
          ...(lead['jobTitle'] && { jobTitle: lead.jobTitle }),
          ...(lead['email'] && { email: lead.email }),
        });

        analytics['selectionTypes'][selection.matchType]++;
        totalConfidence += selection.confidence;

        const currentCount =
          analytics.numberUsage.get(selection.phoneNumber) || 0;
        analytics.numberUsage.set(selection.phoneNumber, currentCount + 1);
      }
    }

    analytics['averageConfidence'] = totalConfidence / leads.length;

    return analytics;
  }
}

export const smartLocalNumberService = new SmartLocalNumberService();
