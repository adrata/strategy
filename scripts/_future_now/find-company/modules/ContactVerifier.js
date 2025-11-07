/**
 * Contact Verifier Module
 * 
 * Verifies email and phone information for discovered contacts
 * Uses multi-source verification system
 */

const fetch = require('node-fetch');

class ContactVerifier {
  constructor(emailVerifier, options = {}) {
    this.emailVerifier = emailVerifier;
    this.delayMs = options.delayMs || 200;
  }

  /**
   * Verify contact information for multiple contacts
   * @param {Array} contacts - Array of contacts to verify
   * @param {object} company - Company record for domain extraction
   * @returns {object} Verified contacts and statistics
   */
  async verifyContacts(contacts, company) {
    if (contacts.length === 0) {
      return { 
        contacts: [], 
        stats: { emailsVerified: 0, phonesVerified: 0, emailCost: 0, phoneCost: 0 }
      };
    }
    
    console.log(`   📧📞 Verifying contact information for ${contacts.length} contacts...`);
    
    const verifiedContacts = [];
    const stats = {
      emailsVerified: 0,
      phonesVerified: 0,
      emailCost: 0,
      phoneCost: 0
    };
    
    const companyDomain = this.extractDomain(company.website);
    
    for (const contact of contacts) {
      try {
        const contactData = {
          name: contact.full_name || contact.name,
          title: contact.active_experience_title || contact.title,
          department: contact.active_experience_department || contact.department,
          linkedinUrl: contact.linkedin_url,
          email: null,
          phone: null
        };
        
        // Verify/discover email
        const emailResult = await this.verifyOrDiscoverEmail(contact, companyDomain);
        if (emailResult) {
          contactData.email = emailResult.email;
          contactData.emailVerified = emailResult.verified;
          contactData.emailConfidence = emailResult.confidence;
          stats.emailsVerified += emailResult.verified ? 1 : 0;
          stats.emailCost += emailResult.cost || 0;
        }
        
        // Verify/discover phone
        const phoneResult = await this.verifyOrDiscoverPhone(contact, company.name);
        if (phoneResult) {
          contactData.phone = phoneResult.phone;
          contactData.phoneVerified = phoneResult.verified;
          contactData.phoneConfidence = phoneResult.confidence;
          contactData.phoneType = phoneResult.phoneType;
          stats.phonesVerified += phoneResult.verified ? 1 : 0;
          stats.phoneCost += phoneResult.cost || 0;
        }
        
        verifiedContacts.push(contactData);
        
        // Rate limiting
        await this.delay(this.delayMs);
        
      } catch (error) {
        console.error(`   ⚠️ Failed to verify contact: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Verified ${verifiedContacts.length} contacts (${stats.emailsVerified} emails, ${stats.phonesVerified} phones)`);
    
    return { contacts: verifiedContacts, stats };
  }

  /**
   * Verify or discover email for a contact
   * @param {object} contact - Contact data
   * @param {string} companyDomain - Company domain for verification
   * @returns {object|null} Email verification result
   */
  async verifyOrDiscoverEmail(contact, companyDomain) {
    const existingEmail = contact.primary_professional_email || contact.professional_emails_collection?.[0]?.professional_email;
    
    if (existingEmail && existingEmail.includes('@')) {
      // Verify existing email
      try {
        const verification = await this.emailVerifier.verifyEmailMultiLayer(
          existingEmail,
          contact.full_name || contact.name,
          companyDomain
        );
        
        if (verification.valid) {
          return {
            email: existingEmail,
            verified: true,
            confidence: verification.confidence,
            cost: 0.003
          };
        }
      } catch (error) {
        console.log(`   ⚠️ Email verification error: ${error.message}`);
      }
    }
    
    // Try to discover email using Prospeo
    if (process.env.PROSPEO_API_KEY && companyDomain) {
      try {
        const nameParts = (contact.full_name || contact.name || '').trim().split(' ');
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
              verified: true,
              confidence: 85,
              cost: 0.0198
            };
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Email discovery error: ${error.message}`);
      }
    }
    
    return null;
  }

  /**
   * Verify or discover phone for a contact
   * @param {object} contact - Contact data
   * @param {string} companyName - Company name
   * @returns {object|null} Phone verification result
   */
  async verifyOrDiscoverPhone(contact, companyName) {
    // Try to discover phone using Lusha LinkedIn enrichment
    if (process.env.LUSHA_API_KEY && contact.linkedin_url) {
      try {
        const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(contact.linkedin_url)}`, {
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
              verified: true,
              confidence: 75,
              phoneType: bestPhone.phoneType,
              cost: 0.01
            };
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Phone discovery error: ${error.message}`);
      }
    }
    
    return null;
  }

  /**
   * Extract domain from website URL
   * @param {string} website - Website URL
   * @returns {string|null} Clean domain
   */
  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { ContactVerifier };

