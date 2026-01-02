/**
 * Phone Verifier Module
 * 
 * Validates and scores residential phone numbers
 * Uses Twilio Lookup API for carrier verification
 */

class PhoneVerifier {
  constructor(options = {}) {
    this.twilioSid = options.twilioSid || process.env.TWILIO_ACCOUNT_SID;
    this.twilioToken = options.twilioToken || process.env.TWILIO_AUTH_TOKEN;
    this.verifiedCount = 0;
    this.invalidCount = 0;
    this.mobileCount = 0;
    this.landlineCount = 0;
  }

  /**
   * Verify a single phone number
   * @param {string} phone - Phone number to verify
   * @returns {Promise<Object>} - Verification result
   */
  async verifyPhone(phone) {
    if (!phone) {
      return { valid: false, reason: 'No phone number provided' };
    }

    // Clean the phone number
    const cleanPhone = this.cleanPhoneNumber(phone);
    
    if (!this.isValidFormat(cleanPhone)) {
      this.invalidCount++;
      return { 
        valid: false, 
        phone: cleanPhone,
        reason: 'Invalid format' 
      };
    }

    // If Twilio is configured, use carrier lookup
    if (this.twilioSid && this.twilioToken) {
      return await this.twilioLookup(cleanPhone);
    }

    // Basic validation only
    this.verifiedCount++;
    return {
      valid: true,
      phone: cleanPhone,
      formatted: this.formatPhone(cleanPhone),
      type: 'unknown',
      verified: false
    };
  }

  /**
   * Twilio carrier lookup
   * @param {string} phone - Clean phone number
   * @returns {Promise<Object>} - Lookup result
   */
  async twilioLookup(phone) {
    try {
      const fetch = require('node-fetch');
      const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString('base64');
      
      const response = await fetch(
        `https://lookups.twilio.com/v1/PhoneNumbers/${phone}?Type=carrier`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );

      if (!response.ok) {
        this.invalidCount++;
        return { valid: false, phone, reason: 'Lookup failed' };
      }

      const data = await response.json();
      const carrierType = data.carrier?.type || 'unknown';
      
      this.verifiedCount++;
      if (carrierType === 'mobile') this.mobileCount++;
      else if (carrierType === 'landline') this.landlineCount++;

      return {
        valid: true,
        phone: data.phone_number,
        formatted: data.national_format,
        type: carrierType,
        carrier: data.carrier?.name,
        verified: true,
        country: data.country_code
      };
    } catch (error) {
      console.error(`   Phone lookup error: ${error.message}`);
      return { valid: true, phone, type: 'unknown', verified: false };
    }
  }

  /**
   * Verify multiple phones with rate limiting
   * @param {Array} homeowners - Array of homeowners with phone data
   * @returns {Promise<Array>} - Homeowners with verified phone data
   */
  async verifyAll(homeowners) {
    console.log(`\n   Verifying ${homeowners.length} phone numbers...`);
    
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < homeowners.length; i += batchSize) {
      const batch = homeowners.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (homeowner) => {
          const verification = await this.verifyPhone(homeowner.phone);
          
          return {
            ...homeowner,
            phoneVerified: verification.verified,
            phoneType: verification.type,
            phoneCarrier: verification.carrier,
            phoneFormatted: verification.formatted || homeowner.phone
          };
        })
      );
      
      results.push(...batchResults);
      
      // Progress update
      if ((i + batchSize) % 100 === 0 || i + batchSize >= homeowners.length) {
        console.log(`   Progress: ${Math.min(i + batchSize, homeowners.length)}/${homeowners.length} verified`);
      }
      
      // Rate limiting
      if (this.twilioSid && i + batchSize < homeowners.length) {
        await this.delay(500);
      }
    }

    console.log(`   Verification complete!`);
    console.log(`   - Valid: ${this.verifiedCount}`);
    console.log(`   - Invalid: ${this.invalidCount}`);
    console.log(`   - Mobile: ${this.mobileCount}`);
    console.log(`   - Landline: ${this.landlineCount}`);

    return results;
  }

  /**
   * Clean phone number to digits only
   * @param {string} phone - Raw phone number
   * @returns {string} - Cleaned phone number
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    let cleaned = phone.toString().replace(/\D/g, '');
    
    // Add country code if missing (assume US)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    // Add + prefix for E.164 format
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Is valid format
   */
  isValidFormat(phone) {
    // Basic validation: should be 11-12 digits with + prefix
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} - Formatted phone
   */
  formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 11 && digits.startsWith('1')) {
      // US format: (XXX) XXX-XXXX
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone;
  }

  /**
   * Get best phone from multiple options
   * @param {Array} phones - Array of phone objects
   * @returns {Object} - Best phone option
   */
  getBestPhone(phones) {
    if (!phones || phones.length === 0) return null;

    // Preference order: mobile > landline > voip > other
    const typeOrder = ['mobile', 'cell', 'wireless', 'landline', 'home', 'voip', 'other'];
    
    const sorted = [...phones].sort((a, b) => {
      const aType = (a.type || 'other').toLowerCase();
      const bType = (b.type || 'other').toLowerCase();
      const aIndex = typeOrder.findIndex(t => aType.includes(t));
      const bIndex = typeOrder.findIndex(t => bType.includes(t));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return sorted[0];
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get verification statistics
   */
  getStats() {
    return {
      verified: this.verifiedCount,
      invalid: this.invalidCount,
      mobile: this.mobileCount,
      landline: this.landlineCount,
      mobilePercentage: this.verifiedCount > 0 
        ? Math.round((this.mobileCount / this.verifiedCount) * 100)
        : 0
    };
  }
}

module.exports = { PhoneVerifier };

