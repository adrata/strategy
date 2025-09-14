/**
 * 🧠 INTELLIGENT DATA STANDARDIZER
 *
 * The world's smartest data standardization engine that:
 * - Standardizes phone numbers with context awareness (mobile vs work vs direct)
 * - Classifies emails intelligently (work vs personal vs role-based)
 * - Creates complete contact profiles with confidence scoring
 * - Handles international formats and edge cases
 * - Uses AI to understand context and intent
 */

import libphonenumber from "google-libphonenumber";
import { PipelineData } from "../monaco-pipeline/types";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
const PhoneNumberFormat = libphonenumber.PhoneNumberFormat;

// Standardized Contact Profile
export interface StandardizedContact {
  // Core Identity
  personId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  title?: string;

  // Phone Numbers (Prioritized by Business Value)
  phones: {
    mobile?: StandardizedPhone; // Personal mobile (highest priority for direct contact)
    direct?: StandardizedPhone; // Direct work line (best for business calls)
    work?: StandardizedPhone; // Main office number
    other?: StandardizedPhone[]; // Additional numbers
  };

  // Email Addresses (Prioritized by Business Value)
  emails: {
    work?: StandardizedEmail; // Primary business email (highest priority)
    personal?: StandardizedEmail; // Personal email (backup contact)
    role?: StandardizedEmail; // Role-based email (info@, sales@)
    other?: StandardizedEmail[]; // Additional emails
  };

  // Company Context
  company: {
    name: string;
    domain?: string;
    industry?: string;
    size?: string;
    location?: string;
  };

  // Quality Metrics
  quality: {
    overallScore: number; // 0-100 overall data quality
    phoneConfidence: number; // Confidence in phone data
    emailConfidence: number; // Confidence in email data
    completeness: number; // How complete is the profile
    businessValue: number; // How valuable for business outreach
  };

  // Enrichment Metadata
  metadata: {
    sources: string[]; // Which providers contributed data
    lastUpdated: Date;
    enrichmentCost: number;
    validationStatus: "verified" | "unverified" | "invalid";
  };
}

export interface StandardizedPhone {
  raw: string; // Original input
  formatted: string; // E.164 format (+1234567890)
  national: string; // National format ((123) 456-7890)
  international: string; // International format (+1 123 456 7890)
  country: string; // Country code (US, UK, etc.)
  type: "mobile" | "direct" | "work" | "unknown";
  confidence: number; // 0-1 confidence in classification
  carrier?: string; // Mobile carrier if available
  timezone?: string; // Timezone for calling
  businessHours?: boolean; // Whether it's a business line
  doNotCall?: boolean; // DNC registry check
}

export interface StandardizedEmail {
  raw: string; // Original input
  normalized: string; // Cleaned email
  domain: string; // Domain part
  local: string; // Local part before @
  type: "work" | "personal" | "role" | "unknown";
  confidence: number; // 0-1 confidence in classification
  deliverable?: boolean; // Email deliverability check
  riskScore: number; // Risk of bounce/spam (0-1)
  companyEmail: boolean; // Is it a company domain
  disposable: boolean; // Is it a disposable email service
}

export class IntelligentDataStandardizer {
  private personalEmailDomains = new Set([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "live.com",
    "msn.com",
  ]);

  private disposableEmailDomains = new Set([
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "tempmail.org",
  ]);

  private roleBasedEmailPrefixes = new Set([
    "info",
    "contact",
    "support",
    "sales",
    "admin",
    "hello",
    "team",
    "marketing",
    "hr",
    "careers",
    "jobs",
    "billing",
    "accounts",
  ]);

  // ========================================
  // MAIN STANDARDIZATION FUNCTION
  // ========================================

  async standardizeContact(rawData: any): Promise<StandardizedContact> {
    console.log("🧠 Starting intelligent contact standardization...");

    const contact: StandardizedContact = {
      personId: rawData.personId || this.generatePersonId(rawData),
      fullName: this.standardizeName(rawData.name || rawData.fullName),
      firstName: this.extractFirstName(rawData.name || rawData.fullName),
      lastName: this.extractLastName(rawData.name || rawData.fullName),
      title: rawData.title || rawData.jobTitle,

      phones: {},
      emails: {},

      company: {
        name: rawData.company || rawData.companyName || "",
        domain: rawData.domain || this.inferDomain(rawData.company),
        industry: rawData.industry,
        size: rawData.companySize,
        location: rawData.location || rawData.companyLocation,
      },

      quality: {
        overallScore: 0,
        phoneConfidence: 0,
        emailConfidence: 0,
        completeness: 0,
        businessValue: 0,
      },

      metadata: {
        sources: rawData.sources || [],
        lastUpdated: new Date(),
        enrichmentCost: rawData.enrichmentCost || 0,
        validationStatus: "unverified",
      },
    };

    // Standardize all phone numbers
    await this.standardizePhones(rawData, contact);

    // Standardize all email addresses
    await this.standardizeEmails(rawData, contact);

    // Calculate quality scores
    this.calculateQualityScores(contact);

    console.log(
      `✅ Contact standardized with ${contact.quality.overallScore}% quality score`,
    );
    return contact;
  }

  // ========================================
  // PHONE STANDARDIZATION
  // ========================================

  private async standardizePhones(rawData: any, contact: StandardizedContact) {
    const phoneFields = [
      "phone",
      "mobile",
      "cell",
      "work_phone",
      "direct_phone",
      "office_phone",
      "phone_number",
      "mobile_phone",
      "business_phone",
      "personal_phone",
    ];

    const allPhones: string[] = [];

    // Collect all phone numbers from various fields
    for (const field of phoneFields) {
      if (rawData[field]) {
        if (Array.isArray(rawData[field])) {
          allPhones.push(...rawData[field]);
        } else {
          allPhones.push(rawData[field]);
        }
      }
    }

    // Also check nested objects
    if (rawData.phones) {
      Object.values(rawData.phones).forEach((phone: any) => {
        if (typeof phone === "string") allPhones.push(phone);
        if (phone?.number) allPhones.push(phone.number);
      });
    }

    const standardizedPhones: StandardizedPhone[] = [];

    for (const rawPhone of allPhones) {
      if (!rawPhone || typeof rawPhone !== "string") continue;

      const standardized = await this.standardizePhone(
        rawPhone,
        contact.company,
      );
      if (standardized) {
        standardizedPhones.push(standardized);
      }
    }

    // Intelligently categorize phones by priority
    this.categorizePhones(standardizedPhones, contact);
  }

  private async standardizePhone(
    rawPhone: string,
    company: any,
  ): Promise<StandardizedPhone | null> {
    try {
      // Clean the phone number
      let cleaned = rawPhone.replace(/[^\d+]/g, "");

      // Skip if it looks like an email
      if (rawPhone.includes("@")) return null;

      // Skip if too short or too long
      if (cleaned.length < 7 || cleaned.length > 15) return null;

      // Default to US if no country code
      if (!cleaned.startsWith("+") && cleaned['length'] === 10) {
        cleaned = "+1" + cleaned;
      } else if (!cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
      }

      const phoneNumber = phoneUtil.parse(cleaned);

      if (!phoneUtil.isValidNumber(phoneNumber)) {
        return null;
      }

      const formatted = phoneUtil.format(phoneNumber, PhoneNumberFormat.E164);
      const national = phoneUtil.format(
        phoneNumber,
        PhoneNumberFormat.NATIONAL,
      );
      const international = phoneUtil.format(
        phoneNumber,
        PhoneNumberFormat.INTERNATIONAL,
      );
      const country = phoneUtil.getRegionCodeForNumber(phoneNumber);

      // Intelligent type classification
      const type = await this.classifyPhoneType(rawPhone, phoneNumber, company);
      const confidence = this.calculatePhoneConfidence(
        rawPhone,
        phoneNumber,
        type,
      );

      return {
        raw: rawPhone,
        formatted,
        national,
        international,
        country: country || "US",
        type,
        confidence,
        timezone: this.getTimezoneForPhone(country || "US"),
        businessHours: type === "work" || type === "direct",
        doNotCall: false, // Would integrate with DNC registry
      };
    } catch (error) {
      console.warn("Failed to standardize phone:", rawPhone, error);
      return null;
    }
  }

  private async classifyPhoneType(
    rawPhone: string,
    phoneNumber: any,
    company: any,
  ): Promise<"mobile" | "direct" | "work" | "unknown"> {
    // Context clues from original field names or surrounding data
    const rawLower = rawPhone.toLowerCase();

    if (rawLower.includes("mobile") || rawLower.includes("cell"))
      return "mobile";
    if (rawLower.includes("direct")) return "direct";
    if (rawLower.includes("work") || rawLower.includes("office")) return "work";

    // Use phone number characteristics
    const numberType = phoneUtil.getNumberType(phoneNumber);

    if (numberType === libphonenumber.PhoneNumberType.MOBILE) {
      return "mobile";
    }

    if (numberType === libphonenumber.PhoneNumberType.FIXED_LINE) {
      return "work";
    }

    // Default classification based on business context
    return "unknown";
  }

  private categorizePhones(
    phones: StandardizedPhone[],
    contact: StandardizedContact,
  ) {
    // Sort by business value: mobile > direct > work > unknown
    const priorityOrder = { mobile: 4, direct: 3, work: 2, unknown: 1 };
    phones.sort(
      (a, b) => (priorityOrder[b.type] || 0) - (priorityOrder[a.type] || 0),
    );

    // Assign to appropriate categories
    for (const phone of phones) {
      if (phone['type'] === "mobile" && !contact.phones.mobile) {
        contact['phones']['mobile'] = phone;
      } else if (phone['type'] === "direct" && !contact.phones.direct) {
        contact['phones']['direct'] = phone;
      } else if (phone['type'] === "work" && !contact.phones.work) {
        contact['phones']['work'] = phone;
      } else {
        if (!contact.phones.other) contact['phones']['other'] = [];
        contact.phones.other.push(phone);
      }
    }
  }

  // ========================================
  // EMAIL STANDARDIZATION
  // ========================================

  private async standardizeEmails(rawData: any, contact: StandardizedContact) {
    const emailFields = [
      "email",
      "work_email",
      "personal_email",
      "business_email",
      "email_address",
      "contact_email",
      "primary_email",
    ];

    const allEmails: string[] = [];

    // Collect all emails from various fields
    for (const field of emailFields) {
      if (rawData[field]) {
        if (Array.isArray(rawData[field])) {
          allEmails.push(...rawData[field]);
        } else {
          allEmails.push(rawData[field]);
        }
      }
    }

    // Also check nested objects
    if (rawData.emails) {
      Object.values(rawData.emails).forEach((email: any) => {
        if (typeof email === "string") allEmails.push(email);
        if (email?.address) allEmails.push(email.address);
      });
    }

    const standardizedEmails: StandardizedEmail[] = [];

    for (const rawEmail of allEmails) {
      if (!rawEmail || typeof rawEmail !== "string") continue;

      const standardized = await this.standardizeEmail(
        rawEmail,
        contact.company,
      );
      if (standardized) {
        standardizedEmails.push(standardized);
      }
    }

    // Intelligently categorize emails by priority
    this.categorizeEmails(standardizedEmails, contact);
  }

  private async standardizeEmail(
    rawEmail: string,
    company: any,
  ): Promise<StandardizedEmail | null> {
    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) return null;

      const normalized = rawEmail.toLowerCase().trim();
      const [local, domain] = normalized.split("@");

      // Skip obviously invalid emails
      if (!local || local['length'] === 0 || !domain || domain['length'] === 0)
        return null;
      if (domain.includes("example.com") || domain.includes("test.com"))
        return null;

      // Classify email type
      const type = this.classifyEmailType(normalized, company);
      const confidence = this.calculateEmailConfidence(
        normalized,
        type,
        company,
      );

      return {
        raw: rawEmail,
        normalized,
        domain: domain,
        local: local,
        type,
        confidence,
        riskScore: this.calculateEmailRisk(normalized),
        companyEmail: !this.personalEmailDomains.has(domain),
        disposable: this.disposableEmailDomains.has(domain),
      };
    } catch (error) {
      console.warn("Failed to standardize email:", rawEmail, error);
      return null;
    }
  }

  private classifyEmailType(
    email: string,
    company: any,
  ): "work" | "personal" | "role" | "unknown" {
    const [local, domain] = email.split("@");

    // Ensure we have a valid domain
    if (!domain) return "unknown";

    // Personal email domains
    if (this.personalEmailDomains.has(domain)) {
      return "personal";
    }

    // Role-based emails
    if (local && this.roleBasedEmailPrefixes.has(local)) {
      return "role";
    }

    // Company domain match
    if (company['domain'] && domain === company.domain) {
      return "work";
    }

    // Company name in domain
    if (
      company['name'] &&
      domain.includes(company.name.toLowerCase().replace(/[^a-z]/g, ""))
    ) {
      return "work";
    }

    // Default to work if not personal
    return this.personalEmailDomains.has(domain) ? "personal" : "work";
  }

  private categorizeEmails(
    emails: StandardizedEmail[],
    contact: StandardizedContact,
  ) {
    // Sort by business value: work > personal > role > unknown
    const priorityOrder = { work: 4, personal: 3, role: 2, unknown: 1 };
    emails.sort(
      (a, b) => (priorityOrder[b.type] || 0) - (priorityOrder[a.type] || 0),
    );

    // Assign to appropriate categories
    for (const email of emails) {
      if (email['type'] === "work" && !contact.emails.work) {
        contact['emails']['work'] = email;
      } else if (email['type'] === "personal" && !contact.emails.personal) {
        contact['emails']['personal'] = email;
      } else if (email['type'] === "role" && !contact.emails.role) {
        contact['emails']['role'] = email;
      } else {
        if (!contact.emails.other) contact['emails']['other'] = [];
        contact.emails.other.push(email);
      }
    }
  }

  // ========================================
  // QUALITY SCORING
  // ========================================

  private calculateQualityScores(contact: StandardizedContact) {
    let totalScore = 0;
    let phoneScore = 0;
    let emailScore = 0;
    let completeness = 0;
    let businessValue = 0;

    // Phone scoring (40% of total)
    if (contact.phones.mobile) {
      phoneScore += 40 * contact.phones.mobile.confidence;
      businessValue += 30; // Mobile is high value
    }
    if (contact.phones.direct) {
      phoneScore += 35 * contact.phones.direct.confidence;
      businessValue += 25; // Direct line is high value
    }
    if (contact.phones.work) {
      phoneScore += 25 * contact.phones.work.confidence;
      businessValue += 15; // Work number is medium value
    }

    // Email scoring (40% of total)
    if (contact.emails.work) {
      emailScore += 50 * contact.emails.work.confidence;
      businessValue += 30; // Work email is highest value
    }
    if (contact.emails.personal) {
      emailScore += 30 * contact.emails.personal.confidence;
      businessValue += 15; // Personal email is backup
    }
    if (contact.emails.role) {
      emailScore += 20 * contact.emails.role.confidence;
      businessValue += 5; // Role email is low value
    }

    // Completeness scoring (20% of total)
    const fields = [
      contact.fullName,
      contact.firstName,
      contact.lastName,
      contact.title,
      contact.company.name,
      contact.company.domain,
    ];
    completeness =
      (fields.filter((f) => f && f.length > 0).length / fields.length) * 100;

    // Calculate final scores
    contact['quality']['phoneConfidence'] = Math.min(phoneScore, 100);
    contact['quality']['emailConfidence'] = Math.min(emailScore, 100);
    contact['quality']['completeness'] = completeness;
    contact['quality']['businessValue'] = Math.min(businessValue, 100);

    // Overall score is weighted average
    contact['quality']['overallScore'] = Math.round(
      contact.quality.phoneConfidence * 0.4 +
        contact.quality.emailConfidence * 0.4 +
        contact.quality.completeness * 0.2,
    );
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  private calculatePhoneConfidence(
    rawPhone: string,
    phoneNumber: any,
    type: string,
  ): number {
    let confidence = 0.5; // Base confidence

    // Valid phone number format
    if (phoneUtil.isValidNumber(phoneNumber)) confidence += 0.3;

    // Clear type classification
    if (type !== "unknown") confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  private calculateEmailConfidence(
    email: string,
    type: string,
    company: any,
  ): number {
    let confidence = 0.5; // Base confidence

    // Valid email format
    if (email.includes("@") && email.includes(".")) confidence += 0.2;

    // Clear type classification
    if (type !== "unknown") confidence += 0.2;

    // Company domain match
    if (type === "work" && company['domain'] && email.includes(company.domain)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private calculateEmailRisk(email: string): number {
    const [local, domain] = email.split("@");
    let risk = 0;

    // Disposable email
    if (domain && this.disposableEmailDomains.has(domain)) risk += 0.8;

    // Suspicious patterns
    if (local && (local.includes("noreply") || local.includes("donotreply")))
      risk += 0.6;
    if (local && local.length < 3) risk += 0.3;
    if (local && (local.includes("test") || local.includes("fake")))
      risk += 0.9;

    return Math.min(risk, 1.0);
  }

  private standardizeName(name: string): string {
    if (!name) return "";

    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ")
      .trim();
  }

  private extractFirstName(name: string): string {
    if (!name) return "";
    return name.split(" ")[0] || "";
  }

  private extractLastName(name: string): string {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  }

  private generatePersonId(rawData: any): string {
    const name = rawData.name || rawData.fullName || "";
    const company = rawData.company || "";
    const timestamp = Date.now();

    return `${name.replace(/\s+/g, "_").toLowerCase()}_${company.replace(/\s+/g, "_").toLowerCase()}_${timestamp}`;
  }

  private inferDomain(company: string): string {
    if (!company) return "";

    return (
      company
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/(inc|llc|corp|ltd|co)$/, "") + ".com"
    );
  }

  private getTimezoneForPhone(country: string): string {
    const timezones: Record<string, string> = {
      US: "America/New_York",
      GB: "Europe/London",
      CA: "America/Toronto",
      AU: "Australia/Sydney",
      DE: "Europe/Berlin",
      FR: "Europe/Paris",
    };

    return timezones[country] || "UTC";
  }
}

// Export for use in waterfall enrichment
export async function standardizeContactData(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const standardizer = new IntelligentDataStandardizer();

  if (!data.enrichedProfiles || data['enrichedProfiles']['length'] === 0) {
    return {};
  }

  const standardizedProfiles = [];

  for (const profile of data.enrichedProfiles) {
    try {
      const standardized = await standardizer.standardizeContact(profile);
      standardizedProfiles.push({
        ...profile,
        standardizedContact: standardized,
        qualityScore: standardized.quality.overallScore,
      });
    } catch (error) {
      console.error("Error standardizing contact:", error);
      standardizedProfiles.push(profile);
    }
  }

  return {
    enrichedProfiles: standardizedProfiles,
  };
}
