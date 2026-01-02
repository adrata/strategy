/**
 * BatchData Property Search Module
 * 
 * Uses the Property Search API to find properties by location and criteria,
 * with skipTrace option to get owner contact information.
 * 
 * API: POST https://api.batchdata.com/api/v1/property/search
 * Docs: https://developer.batchdata.com/docs/batchdata/batchdata-v1/operations/create-a-property-search
 */

class BatchDataSearcher {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('BATCHDATA_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.batchdata.com/api/v1';
    this.requestCount = 0;
    this.creditsUsed = 0;
  }

  /**
   * Search for homeowners in Paradise Valley with skip-trace data
   * @param {Object} options - Search options
   * @param {number} options.maxResults - Maximum number of results
   * @param {string} options.city - City to search (default: Paradise Valley)
   * @param {string} options.state - State (default: AZ)
   * @param {number} options.minLotSizeSqFt - Minimum lot size in sqft (for gate prospects)
   * @param {number} options.minHomeValue - Minimum home value
   * @returns {Promise<Array>} - Array of homeowner objects with contact info
   */
  async searchHomeowners({ 
    maxResults = 100, 
    city = 'Paradise Valley', 
    state = 'AZ',
    minLotSizeSqFt = 10000,  // 1/4 acre minimum - good for gates
    minHomeValue = 500000,   // High-value homes
    skipOffset = 0           // Skip first N results for pagination
  } = {}) {
    console.log(`\n   BatchData Property Search`);
    console.log(`   ========================================`);
    console.log(`   Location: ${city}, ${state}`);
    console.log(`   Min lot size: ${minLotSizeSqFt.toLocaleString()} sqft`);
    console.log(`   Min home value: $${minHomeValue.toLocaleString()}`);
    console.log(`   Max results: ${maxResults}`);
    
    const allHomeowners = [];
    const batchSize = Math.min(maxResults, 100); // API allows up to 500, but 100 is safer
    let skip = skipOffset; // Start from offset for pagination
    
    while (allHomeowners.length < maxResults) {
      const take = Math.min(batchSize, maxResults - allHomeowners.length);
      
      console.log(`\n   Fetching batch: skip=${skip}, take=${take}...`);
      
      try {
        const batch = await this.searchBatch({
          city,
          state,
          minLotSizeSqFt,
          minHomeValue,
          skip,
          take
        });
        
        if (batch.length === 0) {
          console.log(`   No more results available.`);
          break;
        }
        
        allHomeowners.push(...batch);
        console.log(`   Got ${batch.length} properties (total: ${allHomeowners.length})`);
        
        skip += take;
        
        // Small delay between requests
        if (allHomeowners.length < maxResults) {
          await this.delay(500);
        }
      } catch (error) {
        console.log(`   Batch error: ${error.message}`);
        break;
      }
    }
    
    // Count stats
    const withPhone = allHomeowners.filter(h => h.phone).length;
    const withEmail = allHomeowners.filter(h => h.email).length;
    
    console.log(`\n   Search Complete!`);
    console.log(`   - Total homeowners: ${allHomeowners.length}`);
    console.log(`   - With phone: ${withPhone}`);
    console.log(`   - With email: ${withEmail}`);
    console.log(`   - API requests: ${this.requestCount}`);
    console.log(`   - Estimated cost: $${(this.creditsUsed * 0.015).toFixed(2)} (property) + $${(withPhone * 0.07).toFixed(2)} (skip-trace)`);
    
    return allHomeowners;
  }

  /**
   * Search a single batch of properties
   */
  async searchBatch({ city, state, minLotSizeSqFt, minHomeValue, skip, take }) {
    const requestBody = {
      searchCriteria: {
        // Location query
        query: `${city}, ${state}`,
        
        // Property type filters - residential only
        general: {
          propertyType: {
            inList: ['SFR']  // Single Family Residential
          }
        },
        
        // Lot size filter - larger lots = better gate prospects
        lot: {
          lotSizeSqFt: {
            min: minLotSizeSqFt
          }
        },
        
        // Home value filter - wealthy homeowners
        valuation: {
          estimatedValue: {
            min: minHomeValue
          }
        }
      },
      
      options: {
        skip: skip,
        take: take,
        skipTrace: true,  // Include owner contact info (phone/email)
        images: false
      }
    };

    const response = await fetch(`${this.baseUrl}/property/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    this.requestCount++;

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   API Error: ${response.status} - ${errorText}`);
      throw new Error(`Property search failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Debug: Log full response structure
    if (data.status) {
      console.log(`   API Status: ${data.status.code} - ${data.status.text}`);
    }
    if (data.results?.meta) {
      console.log(`   Meta: total=${data.results.meta.total}, returned=${data.results.meta.resultCount}, skipTraced=${data.results.meta.skipTraceMatchCount || 0}`);
      this.creditsUsed += data.results.meta.resultCount || 0;
    }

    // Debug: Log first property to see structure
    const properties = data.results?.properties || [];
    if (properties.length > 0) {
      const sample = properties[0];
      console.log(`   Sample property keys: ${Object.keys(sample).join(', ')}`);
      console.log(`   Full sample: ${JSON.stringify(sample).substring(0, 800)}`);
    }

    return properties.map(prop => this.transformProperty(prop));
  }

  /**
   * Transform BatchData property to our homeowner format
   * Note: Property Search returns basic data, phones come from separate Skip Trace call
   */
  transformProperty(property) {
    const address = property.address || {};
    const owner = property.owner || property.currentOwner || {};
    const building = property.building || {};
    const lot = property.lot || {};
    const valuation = property.valuation || {};
    const sale = property.sale || {};
    
    // Get emails from owner object
    const ownerEmails = owner.emails || [];
    const primaryEmail = ownerEmails[0];
    
    // Parse owner name
    const ownerName = owner.fullName || owner.name || '';
    const names = owner.names || [];
    const primaryName = names[0] || {};

    return {
      // Address
      address: address.street || address.line1,
      city: address.city,
      state: address.state,
      postalCode: address.zip || address.zip5,
      fullAddress: `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim(),
      
      // Owner info
      ownerName: ownerName,
      firstName: primaryName.first || this.parseFirstName(ownerName),
      lastName: primaryName.last || this.parseLastName(ownerName),
      
      // Contact info - phones will be added by skip trace
      phone: null,  // Will be populated by skip trace
      phoneType: null,
      phoneTcpa: false,
      phoneDnc: false,
      phones: [],
      email: primaryEmail,
      emails: ownerEmails,
      
      // Property characteristics (may be limited from search)
      lotSizeSqFt: lot.lotSizeSqFt || lot.sizeSqFt || null,
      lotSizeAcres: lot.lotSizeAcres || (lot.lotSizeSqFt ? lot.lotSizeSqFt / 43560 : null),
      squareFeet: building.buildingSqFt || building.totalSqFt || null,
      bedrooms: building.bedrooms || null,
      bathrooms: building.bathrooms || null,
      yearBuilt: building.yearBuilt || null,
      stories: building.stories || null,
      
      // Valuation
      homeValue: valuation.estimatedValue || valuation.value || null,
      estimatedEquity: valuation.estimatedEquity || null,
      
      // Sale history
      lastSaleDate: sale.lastSaleDate || sale.saleDate || null,
      lastSalePrice: sale.lastSalePrice || sale.saleAmount || null,
      
      // Metadata
      propertyId: property._id || property.id,
      dataSource: 'BatchData',
      searchedAt: new Date().toISOString(),
      hasSkipTrace: ownerEmails.length > 0
    };
  }

  /**
   * Parse first name from full name
   */
  parseFirstName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
  }

  /**
   * Parse last name from full name
   */
  parseLastName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Skip trace properties to get phone numbers
   * Uses the V1 skip-trace endpoint
   * @param {Array} homeowners - Array of homeowner objects with addresses
   * @returns {Promise<Array>} - Homeowners enriched with phone numbers
   */
  async skipTraceHomeowners(homeowners) {
    console.log(`\n   Skip-tracing ${homeowners.length} properties for phone numbers...`);
    console.log(`   Cost estimate: ${homeowners.length} x $0.07 = $${(homeowners.length * 0.07).toFixed(2)}`);
    
    const batchSize = 50;
    const enriched = [];
    
    for (let i = 0; i < homeowners.length; i += batchSize) {
      const batch = homeowners.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(homeowners.length/batchSize)}...`);
      
      const requests = batch.map((h, idx) => ({
        requestId: `req_${i + idx}`,
        propertyAddress: {
          street: h.address,
          city: h.city,
          state: h.state,
          zip: h.postalCode
        }
      }));
      
      try {
        const response = await fetch(`${this.baseUrl}/property/skip-trace`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        });
        
        this.requestCount++;
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`   Skip-trace error: ${response.status} - ${errorText.substring(0, 100)}`);
          // Add batch without phone data
          enriched.push(...batch);
          continue;
        }
        
        const data = await response.json();
        
        // Debug: Log skip trace response structure
        console.log(`   Skip-trace response status: ${data.status?.code}`);
        console.log(`   Response keys: ${JSON.stringify(Object.keys(data.results || {}))}`);
        
        // V1 skip-trace returns persons array, not responses
        const persons = data.results?.persons || [];
        console.log(`   Persons found: ${persons.length}`);
        if (persons[0]) {
          console.log(`   First person keys: ${Object.keys(persons[0]).join(', ')}`);
          if (persons[0].phoneNumbers) {
            console.log(`   Phone numbers: ${JSON.stringify(persons[0].phoneNumbers)}`);
          }
          if (persons[0].phones) {
            console.log(`   Phones: ${JSON.stringify(persons[0].phones)}`);
          }
        }
        
        // V1 format: persons array matches our requests array by index
        for (let j = 0; j < batch.length; j++) {
          const homeowner = { ...batch[j] };
          
          // V1 returns persons in same order as requests
          const person = persons[j];
          
          if (person && person.phoneNumbers && person.phoneNumbers.length > 0) {
            const phones = person.phoneNumbers;
            // Filter out DNC numbers, prefer reachable phones
            const safePhones = phones.filter(p => !p.dnc);
            const reachablePhones = safePhones.filter(p => p.reachable);
            const mobilePhones = reachablePhones.filter(p => p.type === 'Mobile');
            
            // Priority: reachable mobile > reachable any > any safe > first
            const primaryPhone = mobilePhones[0] || reachablePhones[0] || safePhones[0] || phones[0];
            
            if (primaryPhone) {
              homeowner.phone = primaryPhone.number;
              homeowner.phoneType = primaryPhone.type?.toLowerCase() || 'unknown';
              homeowner.phoneTcpa = primaryPhone.tcpa || false;
              homeowner.phoneDnc = primaryPhone.dnc || false;
              homeowner.phoneReachable = primaryPhone.reachable || false;
              homeowner.phoneScore = primaryPhone.score || 0;
              homeowner.phones = phones;
              homeowner.hasSkipTrace = true;
              console.log(`   Found phone for ${homeowner.address}: ${homeowner.phone} (${primaryPhone.type})`);
            }
            
            // Also grab name from skip trace if available
            if (person.name) {
              homeowner.firstName = person.name.first || homeowner.firstName;
              homeowner.lastName = person.name.last || homeowner.lastName;
              homeowner.ownerName = `${person.name.first || ''} ${person.name.last || ''}`.trim() || homeowner.ownerName;
            }
          }
          
          enriched.push(homeowner);
        }
        
        // Small delay between batches
        if (i + batchSize < homeowners.length) {
          await this.delay(500);
        }
      } catch (error) {
        console.log(`   Batch error: ${error.message}`);
        enriched.push(...batch);
      }
    }
    
    const withPhone = enriched.filter(h => h.phone).length;
    console.log(`   Skip-trace complete: ${withPhone} phones found`);
    
    return enriched;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      creditsUsed: this.creditsUsed,
      estimatedCost: this.creditsUsed * 0.015 // Property search is ~$0.015/record
    };
  }
}

module.exports = BatchDataSearcher;
