/**
 * Contact Verifier Module for Buyer Groups
 * 
 * Verifies email and phone for sampled employees
 * Focuses on top candidates for cost efficiency
 */

const fetch = require('node-fetch');

class ContactVerifier {
  constructor(emailVerifier) {
    this.emailVerifier = emailVerifier;
  }

  /**
   * Verify contacts for top candidate companies
   * @param {Array} companies - Scored companies
   * @param {number} topCount - Number of top companies to verify (default 20)
   * @returns {Array} Companies with verified contacts
   */
  async verifyTopCandidates(companies, topCount = 20) {
    const enrichedCompanies = [];
    
    for (const company of companies.slice(0, topCount)) {
      try {
        if (!company.buyerGroupQuality || !company.buyerGroupQuality.sample_employees) {
          enrichedCompanies.push(company);
          continue;
        }
        
        const sampleEmployees = company.buyerGroupQuality.sample_employees || [];
        const companyDomain = this.extractDomain(company.company_website);
        
        console.log(`   📧📞 Verifying contacts for ${company.company_name} (${sampleEmployees.length} employees)...`);
        
        const verifiedEmployees = [];
        const stats = {
          emailsVerified: 0,
          phonesVerified: 0,
          emailCost: 0,
          phoneCost: 0
        };
        
        for (const employee of sampleEmployees.slice(0, 5)) {
          const result = await this.verifyEmployee(employee, company, companyDomain);
          verifiedEmployees.push({
            ...employee,
            ...result.contact
          });
          
          stats.emailsVerified += result.stats.emailsVerified;
          stats.phonesVerified += result.stats.phonesVerified;
          stats.emailCost += result.stats.emailCost;
          stats.phoneCost += result.stats.phoneCost;
          
          await this.delay(200);
        }
        
        enrichedCompanies.push({
          ...company,
          buyerGroupQuality: {
            ...company.buyerGroupQuality,
            verified_contacts: verifiedEmployees
          },
          verificationStats: stats
        });
        
      } catch (error) {
        console.error(`   ⚠️ Failed to verify contacts for ${company.company_name}:`, error.message);
        enrichedCompanies.push(company);
      }
    }
    
    // Add remaining companies without verification
    enrichedCompanies.push(...companies.slice(topCount));
    
    return enrichedCompanies;
  }

  async verifyEmployee(employee, company, companyDomain) {
    const verifiedContact = {
      email: null,
      emailVerified: false,
      emailConfidence: 0,
      phone: null,
      phoneVerified: false,
      phoneConfidence: 0,
      phoneType: 'unknown'
    };
    
    const stats = {
      emailsVerified: 0,
      phonesVerified: 0,
      emailCost: 0,
      phoneCost: 0
    };
    
    // Verify/discover email
    if (employee.email && employee.email.includes('@')) {
      try {
        const verification = await this.emailVerifier.verifyEmailMultiLayer(
          employee.email,
          employee.full_name || employee.name,
          companyDomain
        );
        
        if (verification.valid) {
          verifiedContact.email = employee.email;
          verifiedContact.emailVerified = true;
          verifiedContact.emailConfidence = verification.confidence;
          stats.emailsVerified++;
          stats.emailCost += 0.003;
        }
      } catch (error) {
        console.log(`   ⚠️ Email verification error: ${error.message}`);
      }
    } else if (companyDomain && process.env.PROSPEO_API_KEY) {
      const emailResult = await this.discoverEmail(employee, companyDomain);
      if (emailResult) {
        verifiedContact.email = emailResult.email;
        verifiedContact.emailVerified = true;
        verifiedContact.emailConfidence = emailResult.confidence;
        stats.emailsVerified++;
        stats.emailCost += emailResult.cost;
      }
    }
    
    // Verify/discover phone
    if (employee.linkedin_url && process.env.LUSHA_API_KEY) {
      const phoneResult = await this.discoverPhone(employee.linkedin_url);
      if (phoneResult) {
        verifiedContact.phone = phoneResult.phone;
        verifiedContact.phoneVerified = true;
        verifiedContact.phoneConfidence = phoneResult.confidence;
        verifiedContact.phoneType = phoneResult.phoneType;
        stats.phonesVerified++;
        stats.phoneCost += phoneResult.cost;
      }
    }
    
    return { contact: verifiedContact, stats };
  }

  async discoverEmail(employee, companyDomain) {
    try {
      const nameParts = (employee.full_name || employee.name || '').trim().split(' ');
      const response = await fetch('https://api.prospeo.io/email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': process.env.PROSPEO_API_KEY.trim()
        },
        body: JSON.stringify({
          first_name: nameParts[0] || '',
          last_name: nameParts[nameParts.length - 1] || '',
          company_domain: companyDomain
        }),
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.email && data.email.email) {
          return { email: data.email.email, confidence: 85, cost: 0.0198 };
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Email discovery error: ${error.message}`);
    }
    return null;
  }

  async discoverPhone(linkedinUrl) {
    try {
      const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
        method: 'GET',
        headers: {
          'api_key': process.env.LUSHA_API_KEY.trim(),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.contact?.data?.phoneNumbers?.length > 0) {
          const phones = data.contact.data.phoneNumbers;
          const best = phones.find(p => p.phoneType === 'direct') || phones.find(p => p.phoneType === 'mobile') || phones[0];
          return { phone: best.number, confidence: 75, phoneType: best.phoneType, cost: 0.01 };
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Phone discovery error: ${error.message}`);
    }
    return null;
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { ContactVerifier };

