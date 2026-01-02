/**
 * Arizona Phone Filter Module
 * 
 * Filters homeowners to only include those with Arizona phone numbers.
 * This ensures leads can be contacted via local Arizona numbers.
 * 
 * Arizona Area Codes: 480, 520, 602, 623, 928
 */

class ArizonaPhoneFilter {
  constructor() {
    // Arizona area codes
    this.arizonaAreaCodes = ['480', '520', '602', '623', '928'];
    
    // Stats
    this.stats = {
      total: 0,
      arizonaPhones: 0,
      nonArizonaPhones: 0,
      noPhone: 0
    };
  }

  /**
   * Extract area code from a phone number
   * @param {string} phone - Phone number in any format
   * @returns {string|null} - 3-digit area code or null
   */
  extractAreaCode(phone) {
    if (!phone) return null;
    
    // Remove all non-digits
    const digits = String(phone).replace(/\D/g, '');
    
    // Handle different formats
    if (digits.length === 10) {
      return digits.substring(0, 3);
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return digits.substring(1, 4);
    }
    
    return null;
  }

  /**
   * Check if a phone number is Arizona-based
   * @param {string} phone - Phone number
   * @returns {boolean} - True if Arizona area code
   */
  isArizonaPhone(phone) {
    const areaCode = this.extractAreaCode(phone);
    return areaCode && this.arizonaAreaCodes.includes(areaCode);
  }

  /**
   * Get the best available phone number for a homeowner
   * @param {Object} homeowner - Homeowner data
   * @returns {string|null} - Best phone number
   */
  getBestPhone(homeowner) {
    // Check primary phone first
    if (homeowner.phone) return homeowner.phone;
    
    // Check phones array for any Arizona number
    if (homeowner.phones && homeowner.phones.length > 0) {
      // First try to find an Arizona mobile
      const arizonaMobile = homeowner.phones.find(p => 
        this.isArizonaPhone(p.number) && 
        (p.type === 'Mobile' || p.type === 'mobile' || p.type === 'Cell')
      );
      if (arizonaMobile) return arizonaMobile.number;
      
      // Then any Arizona number
      const arizonaPhone = homeowner.phones.find(p => this.isArizonaPhone(p.number));
      if (arizonaPhone) return arizonaPhone.number;
      
      // Fall back to first phone
      return homeowner.phones[0].number;
    }
    
    return null;
  }

  /**
   * Filter a single homeowner - check if they have an Arizona phone
   * @param {Object} homeowner - Homeowner data
   * @returns {Object|null} - Homeowner with Arizona phone or null
   */
  filterHomeowner(homeowner) {
    this.stats.total++;
    
    const phone = this.getBestPhone(homeowner);
    
    if (!phone) {
      this.stats.noPhone++;
      return null;
    }
    
    if (this.isArizonaPhone(phone)) {
      this.stats.arizonaPhones++;
      
      // Update the homeowner's phone to the Arizona number
      const areaCode = this.extractAreaCode(phone);
      return {
        ...homeowner,
        phone: phone,
        phoneAreaCode: areaCode,
        isArizonaPhone: true
      };
    }
    
    this.stats.nonArizonaPhones++;
    return null;
  }

  /**
   * Filter all homeowners to only Arizona phones
   * @param {Array} homeowners - Array of homeowner data
   * @returns {Array} - Filtered homeowners with Arizona phones only
   */
  filterAll(homeowners) {
    console.log(`\n   Arizona Phone Filter`);
    console.log('   ' + '-'.repeat(40));
    console.log(`   Filtering ${homeowners.length} homeowners for Arizona phones...`);
    console.log(`   Arizona area codes: ${this.arizonaAreaCodes.join(', ')}`);
    
    const filtered = [];
    
    for (const homeowner of homeowners) {
      const result = this.filterHomeowner(homeowner);
      if (result) {
        filtered.push(result);
      }
    }
    
    console.log(`\n   Filter Results:`);
    console.log(`   - Total processed: ${this.stats.total}`);
    console.log(`   - Arizona phones: ${this.stats.arizonaPhones} ✅`);
    console.log(`   - Non-Arizona phones: ${this.stats.nonArizonaPhones} ❌`);
    console.log(`   - No phone: ${this.stats.noPhone} ❌`);
    console.log(`   - Kept: ${filtered.length} (${Math.round(filtered.length / this.stats.total * 100)}%)`);
    
    return filtered;
  }

  /**
   * Get area code distribution for analysis
   * @param {Array} homeowners - Array of homeowner data
   * @returns {Object} - Area code counts
   */
  getAreaCodeDistribution(homeowners) {
    const distribution = {};
    
    for (const homeowner of homeowners) {
      const phone = this.getBestPhone(homeowner);
      const areaCode = this.extractAreaCode(phone);
      
      if (areaCode) {
        distribution[areaCode] = (distribution[areaCode] || 0) + 1;
      } else {
        distribution['none'] = (distribution['none'] || 0) + 1;
      }
    }
    
    // Sort by count
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});
  }

  /**
   * Get filter statistics
   * @returns {Object} - Statistics
   */
  getStats() {
    return {
      ...this.stats,
      arizonaPercentage: this.stats.total > 0 
        ? Math.round((this.stats.arizonaPhones / this.stats.total) * 100)
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      total: 0,
      arizonaPhones: 0,
      nonArizonaPhones: 0,
      noPhone: 0
    };
  }
}

module.exports = { ArizonaPhoneFilter };
