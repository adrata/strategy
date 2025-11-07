/**
 * Contact Verifier Module
 * 
 * Verifies and discovers email and phone information for people
 * Uses multi-source verification system
 */

const fetch = require('node-fetch');

class ContactVerifier {
  constructor(emailVerifier) {
    this.emailVerifier = emailVerifier;
  }

  /**
   * Verify contact information for a person
   * @param {object} person - Database person record
   * @param {object} profileData - Coresignal profile data
   * @param {object} company - Company record (for domain)
   * @returns {object} Verified contact data with statistics
   */
  async verifyContact(person, profileData, company) {
    const verifiedContact = {
      email: person.email,
      emailVerified: false,
      emailConfidence: 0,
      phone: person.phone,
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
    
    const companyDomain = company?.website ? this.extractDomain(company.website) : null;
    
    // Verify/discover email
    const existingEmail = profileData.email || person.email;
    if (existingEmail && existingEmail.includes('@')) {
      try {
        const verification = await this.emailVerifier.verifyEmailMultiLayer(
          existingEmail,
          person.name || profileData.full_name,
          companyDomain
        );
        
        if (verification.valid) {
          verifiedContact.email = existingEmail;
          verifiedContact.emailVerified = true;
          verifiedContact.emailConfidence = verification.confidence;
          stats.emailsVerified++;
          stats.emailCost += 0.003;
        }
      } catch (error) {
        console.log(`   ⚠️ Email verification error: ${error.message}`);
      }
    } else if (companyDomain && process.env.PROSPEO_API_KEY) {
      // Discover email using Prospeo
      const emailResult = await this.discoverEmail(person, profileData, companyDomain);
      if (emailResult) {
        verifiedContact.email = emailResult.email;
        verifiedContact.emailVerified = true;
        verifiedContact.emailConfidence = emailResult.confidence;
        stats.emailsVerified++;
        stats.emailCost += emailResult.cost;
      }
    }
    
    // Verify/discover phone
    const linkedinUrl = profileData.linkedin_url || person.linkedinUrl;
    if (linkedinUrl && process.env.LUSHA_API_KEY) {
      const phoneResult = await this.discoverPhone(linkedinUrl);
      if (phoneResult) {
        verifiedContact.phone = phoneResult.phone;
        verifiedContact.phoneVerified = true;
        verifiedContact.phoneConfidence = phoneResult.confidence;
        verifiedContact.phoneType = phoneResult.phoneType;
        stats.phonesVerified++;
        stats.phoneCost += phoneResult.cost;
      }
    }
    
    await this.delay(200);
    
    return { contact: verifiedContact, stats };
  }

  async discoverEmail(person, profileData, companyDomain) {
    try {
      const nameParts = (person.name || profileData.full_name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      
      const response = await fetch('https://api.prospeo.io/email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': process.env.PROSPEO_API_KEY.trim()
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          company_domain: companyDomain
        }),
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.email && data.email.email) {
          return {
            email: data.email.email,
            confidence: 85,
            cost: 0.0198
          };
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
        if (data.contact && data.contact.data && data.contact.data.phoneNumbers && data.contact.data.phoneNumbers.length > 0) {
          const phones = data.contact.data.phoneNumbers;
          const directDial = phones.find(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
          const mobile = phones.find(p => p.phoneType === 'mobile');
          const work = phones.find(p => p.phoneType === 'work' || p.phoneType === 'office');
          
          const bestPhone = directDial || mobile || work || phones[0];
          
          return {
            phone: bestPhone.number,
            confidence: 75,
            phoneType: bestPhone.phoneType,
            cost: 0.01
          };
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

