/**
 * 📞 LUSHA PHONE ENRICHMENT SERVICE
 * 
 * Enhanced phone number enrichment using Lusha API v2
 * Supports multiple phone types: direct dial, mobile, work, etc.
 */

export interface LushaPhoneNumber {
  number: string;
  type: 'direct' | 'mobile' | 'work' | 'office' | 'main' | 'home' | 'fax' | 'other';
  country?: string;
  verified?: boolean;
  extension?: string;
}

export interface LushaPersonResponse {
  fullName: string;
  jobTitle?: {
    title: string;
  };
  companyName?: string;
  emailAddresses?: Array<{
    email: string;
    type?: string;
  }>;
  phoneNumbers?: LushaPhoneNumber[];
  linkedinUrl?: string;
}

export interface EnrichedPhoneData {
  phone1?: string;
  phone1Type?: string;
  phone1Verified?: boolean;
  phone1Extension?: string;
  
  phone2?: string;
  phone2Type?: string;
  phone2Verified?: boolean;
  phone2Extension?: string;
  
  directDialPhone?: string;
  mobilePhone?: string;
  workPhone?: string;
  mobilePhoneVerified?: boolean;
  workPhoneVerified?: boolean;
  
  phoneEnrichmentSource: string;
  phoneEnrichmentDate: Date;
  phoneDataQuality: number;
}

/**
 * 📞 Extract and organize phone numbers from Lusha response
 */
export function extractPhoneData(lushaResponse: LushaPersonResponse): EnrichedPhoneData {
  const phones = lushaResponse.phoneNumbers || [];
  
  if (phones['length'] === 0) {
    return {
      phoneEnrichmentSource: 'lusha_v2_api',
      phoneEnrichmentDate: new Date(),
      phoneDataQuality: 0
    };
  }
  
  // Prioritize phone types by business value
  const directDial = phones.find(p => p['type'] === 'direct');
  const mobile = phones.find(p => p['type'] === 'mobile');
  const work = phones.find(p => p['type'] === 'work' || p['type'] === 'office');
  const main = phones.find(p => p['type'] === 'main');
  
  // Get the two most valuable phone numbers
  const prioritizedPhones = [directDial, mobile, work, main].filter(Boolean);
  
  const result: EnrichedPhoneData = {
    phoneEnrichmentSource: 'lusha_v2_api',
    phoneEnrichmentDate: new Date(),
    phoneDataQuality: calculatePhoneQuality(phones)
  };
  
  // Set phone1 (highest priority)
  if (prioritizedPhones[0]) {
    result.phone1 = prioritizedPhones[0].number;
    result.phone1Type = prioritizedPhones[0].type;
    result.phone1Verified = prioritizedPhones[0].verified || false;
    result.phone1Extension = prioritizedPhones[0].extension;
  }
  
  // Set phone2 (second highest priority)
  if (prioritizedPhones[1]) {
    result.phone2 = prioritizedPhones[1].number;
    result.phone2Type = prioritizedPhones[1].type;
    result.phone2Verified = prioritizedPhones[1].verified || false;
    result.phone2Extension = prioritizedPhones[1].extension;
  }
  
  // Set specific phone type fields for quick access
  if (directDial) {
    result['directDialPhone'] = directDial.number;
  }
  
  if (mobile) {
    result['mobilePhone'] = mobile.number;
    result['mobilePhoneVerified'] = mobile.verified || false;
  }
  
  if (work) {
    result['workPhone'] = work.number;
    result['workPhoneVerified'] = work.verified || false;
  }
  
  return result;
}

/**
 * 🎯 Calculate phone data quality score (0-100)
 */
function calculatePhoneQuality(phones: LushaPhoneNumber[]): number {
  if (phones['length'] === 0) return 0;
  
  let quality = 30; // Base score for having any phone
  
  // Bonus for phone types (business value)
  const hasDirectDial = phones.some(p => p['type'] === 'direct');
  const hasMobile = phones.some(p => p['type'] === 'mobile');
  const hasWork = phones.some(p => p['type'] === 'work' || p['type'] === 'office');
  
  if (hasDirectDial) quality += 30; // Direct dial is most valuable
  if (hasMobile) quality += 20;     // Mobile is very valuable
  if (hasWork) quality += 15;       // Work phone is valuable
  
  // Bonus for verification
  const verifiedPhones = phones.filter(p => p.verified).length;
  quality += verifiedPhones * 5; // 5 points per verified phone
  
  // Bonus for multiple phone numbers
  if (phones.length >= 2) quality += 10;
  if (phones.length >= 3) quality += 5;
  
  return Math.min(quality, 100);
}

/**
 * 🔍 Enrich contact with Lusha phone data
 */
export async function enrichContactWithLushaPhones(
  companyDomain: string,
  jobTitle: string,
  apiKey: string
): Promise<EnrichedPhoneData | null> {
  try {
    console.log(`   📞 Lusha Phone Enrichment: ${jobTitle} at ${companyDomain}...`);
    
    const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_domain: companyDomain,
        job_title: jobTitle,
        seniority: getSeniorityForRole(jobTitle)
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data['data'] && data.data.length > 0) {
        const person = data['data'][0];
        const phoneData = extractPhoneData(person);
        
        console.log(`   ✅ Lusha Phone: Found ${person.phoneNumbers?.length || 0} phones for ${person.fullName}`);
        
        if (phoneData.phone1) {
          console.log(`      📞 Phone 1: ${phoneData.phone1} (${phoneData.phone1Type})`);
        }
        if (phoneData.phone2) {
          console.log(`      📞 Phone 2: ${phoneData.phone2} (${phoneData.phone2Type})`);
        }
        if (phoneData.directDialPhone) {
          console.log(`      🎯 Direct Dial: ${phoneData.directDialPhone}`);
        }
        
        return phoneData;
      } else {
        console.log(`   ⚠️ Lusha Phone: No results for ${jobTitle} at ${companyDomain}`);
      }
    } else {
      console.log(`   ⚠️ Lusha Phone API error: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`   ⚠️ Lusha Phone error:`, error.message);
  }
  
  return null;
}

/**
 * 🎯 Get seniority level for Lusha filtering
 */
function getSeniorityForRole(role: string): string[] {
  const roleLower = role.toLowerCase();
  
  if (['ceo', 'cfo', 'coo', 'president', 'owner'].some(r => roleLower.includes(r))) {
    return ['executive', 'c_level'];
  }
  
  if (['vp', 'vice president', 'director'].some(r => roleLower.includes(r))) {
    return ['director', 'vp'];
  }
  
  if (['manager', 'head of'].some(r => roleLower.includes(r))) {
    return ['manager', 'senior'];
  }
  
  return ['manager', 'senior', 'director'];
}

/**
 * 📊 Get phone enrichment summary for reporting
 */
export function getPhoneEnrichmentSummary(phoneData: EnrichedPhoneData): string {
  const phones = [];
  
  if (phoneData.phone1) {
    phones.push(`${phoneData.phone1} (${phoneData.phone1Type})`);
  }
  
  if (phoneData.phone2) {
    phones.push(`${phoneData.phone2} (${phoneData.phone2Type})`);
  }
  
  if (phones['length'] === 0) {
    return 'No phones found';
  }
  
  return `${phones.length} phone${phones.length > 1 ? 's' : ''}: ${phones.join(', ')} [Quality: ${phoneData.phoneDataQuality}/100]`;
}
