/**
 * 🎯 COLLECT 5BARS SERVICES CORESIGNAL DATA
 * 
 * Collects comprehensive company data from CoreSignal using the found company ID
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Collect5BarsCoreSignalData {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.coresignalCompanyId = 93620050; // Found company ID from CoreSignal
    this.coresignalSourceId = '15164968';
    
    // CoreSignal API configuration
    this.config = {
      apiKey: process.env.CORESIGNAL_API_KEY,
      baseUrl: 'https://api.coresignal.com',
      maxRetries: 3,
      rateLimitDelay: 1000
    };
    
    this.creditsUsed = { collect: 0, historical: 0, executives: 0 };
    this.results = {
      companyId: this.companyId,
      coresignalCompanyId: this.coresignalCompanyId,
      coresignalSourceId: this.coresignalSourceId,
      enrichmentDate: new Date().toISOString(),
      companyData: null,
      historicalData: null,
      executiveData: null,
      creditsUsed: this.creditsUsed,
      errors: []
    };
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('🎯 COLLECTING 5BARS SERVICES CORESIGNAL DATA');
    console.log('==========================================');
    console.log(`Database Company ID: ${this.companyId}`);
    console.log(`CoreSignal Company ID: ${this.coresignalCompanyId}`);
    console.log(`CoreSignal Source ID: ${this.coresignalSourceId}`);
    console.log('');

    try {
      // Step 1: Get current company data from database
      await this.getCurrentCompanyData();
      
      // Step 2: Collect comprehensive company data from CoreSignal
      await this.collectCompanyData();
      
      // Step 3: Collect historical headcount data
      await this.collectHistoricalData();
      
      // Step 4: Collect executive/employee data
      await this.collectExecutiveData();
      
      // Step 5: Update database with enriched data
      await this.updateDatabaseWithEnrichedData();
      
      // Step 6: Save results to JSON file
      await this.saveResultsToFile();
      
      // Step 7: Display summary
      this.displaySummary();
      
      return this.results;

    } catch (error) {
      console.error('❌ Data collection failed:', error);
      this.results.errors.push(error.message);
      await this.saveResultsToFile();
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * 📊 STEP 1: Get current company data from database
   */
  async getCurrentCompanyData() {
    console.log('📊 STEP 1: Getting current company data from database...');
    
    try {
      const company = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        select: {
          id: true,
          name: true,
          website: true,
          customFields: true,
          industry: true,
          size: true,
          revenue: true,
          description: true,
          city: true,
          state: true,
          country: true,
          address: true,
          postalCode: true,
          tags: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!company) {
        throw new Error('Company not found in database');
      }
      
      this.results.currentDatabaseData = company;
      console.log(`   ✅ Found company: ${company.name}`);
      console.log(`   📍 Location: ${company.address || 'Unknown'}, ${company.city || 'Unknown'}, ${company.state || 'Unknown'} ${company.postalCode || ''}`);
      console.log(`   🏭 Industry: ${company.industry || 'Unknown'}`);
      console.log(`   💰 Revenue: ${company.revenue ? `$${company.revenue.toLocaleString()}` : 'Unknown'}`);
      console.log(`   🌐 Website: ${company.website || 'Unknown'}`);
      console.log(`   📝 Description: ${company.description || 'None'}`);
      console.log(`   🔗 LinkedIn: ${company.customFields?.linkedinUrl || 'None'}`);
      
    } catch (error) {
      console.error('   ❌ Database query failed:', error.message);
      throw error;
    }
  }

  /**
   * 📊 STEP 2: Collect comprehensive company data from CoreSignal
   */
  async collectCompanyData() {
    console.log('\n📊 STEP 2: Collecting comprehensive company data from CoreSignal...');
    
    try {
      const companyData = await this.callCoreSignalAPI(`/cdapi/v2/company_multi_source/collect/${this.coresignalCompanyId}`, null, 'GET');
      
      if (companyData) {
        this.results.companyData = companyData;
        this.creditsUsed.collect += 2;
        console.log('   ✅ Company data collected successfully');
        console.log(`   📊 Company: ${companyData.company_name || 'Unknown'}`);
        console.log(`   🏭 Industry: ${companyData.industry || 'Unknown'}`);
        console.log(`   👥 Employees: ${companyData.employees_count || 'Unknown'}`);
        console.log(`   📏 Size Range: ${companyData.size_range || 'Unknown'}`);
        console.log(`   💰 Revenue: ${companyData.revenue_annual_range ? 
          `$${companyData.revenue_annual_range.annual_revenue_range_from || 0}M - $${companyData.revenue_annual_range.annual_revenue_range_to || 0}M` : 
          'Unknown'}`);
        console.log(`   🌍 HQ Country: ${companyData.hq_country || 'Unknown'}`);
        console.log(`   📍 HQ Location: ${companyData.hq_location || 'Unknown'}`);
        console.log(`   🏢 HQ Address: ${companyData.hq_full_address || 'Unknown'}`);
        console.log(`   🌐 Website: ${companyData.website || 'Unknown'}`);
        console.log(`   🔗 LinkedIn: ${companyData.linkedin_url || 'Unknown'}`);
        console.log(`   📅 Founded: ${companyData.founded_year || 'Unknown'}`);
        console.log(`   🏢 Type: ${companyData.type || 'Unknown'}`);
        console.log(`   📝 Description: ${companyData.description ? companyData.description.substring(0, 100) + '...' : 'None'}`);
        console.log(`   🏷️ Categories: ${companyData.categories_and_keywords ? companyData.categories_and_keywords.slice(0, 5).join(', ') : 'None'}`);
        console.log(`   📞 Phone: ${companyData.company_phone_numbers ? companyData.company_phone_numbers.join(', ') : 'None'}`);
        console.log(`   📧 Email: ${companyData.company_emails ? companyData.company_emails.join(', ') : 'None'}`);
        
        // Show key executives
        if (companyData.key_executives && companyData.key_executives.length > 0) {
          console.log(`   👔 Key Executives:`);
          companyData.key_executives.forEach((exec, index) => {
            console.log(`      ${index + 1}. ${exec.member_full_name} - ${exec.member_position_title}`);
          });
        }
        
        // Show company locations
        if (companyData.company_locations_full && companyData.company_locations_full.length > 0) {
          console.log(`   📍 Company Locations:`);
          companyData.company_locations_full.forEach((location, index) => {
            console.log(`      ${index + 1}. ${location.location_address} ${location.is_primary ? '(Primary)' : ''}`);
          });
        }
        
      } else {
        console.log('   ⚠️ No company data returned from CoreSignal');
      }
      
    } catch (error) {
      console.error('   ❌ Company data collection failed:', error.message);
      this.results.errors.push(`Company data collection failed: ${error.message}`);
    }
  }

  /**
   * 📈 STEP 3: Collect historical headcount data
   */
  async collectHistoricalData() {
    console.log('\n📈 STEP 3: Collecting historical headcount data...');
    
    try {
      const historicalData = await this.callCoreSignalAPI(`/v2/historical_headcount/collect/${this.coresignalCompanyId}`, null, 'GET');
      
      if (historicalData && Array.isArray(historicalData)) {
        this.results.historicalData = historicalData;
        this.creditsUsed.historical += 2;
        console.log(`   ✅ Historical data collected: ${historicalData.length} data points`);
        
        if (historicalData.length > 0) {
          const latest = historicalData[historicalData.length - 1];
          const oldest = historicalData[0];
          console.log(`   📊 Latest headcount: ${latest.employees_count || 'Unknown'} (${latest.date || 'Unknown date'})`);
          console.log(`   📊 Oldest headcount: ${oldest.employees_count || 'Unknown'} (${oldest.date || 'Unknown date'})`);
          console.log(`   📈 Growth: ${latest.employees_count && oldest.employees_count ? 
            `${((latest.employees_count - oldest.employees_count) / oldest.employees_count * 100).toFixed(1)}%` : 
            'Unknown'}`);
        }
      } else {
        console.log('   ⚠️ No historical data available');
      }
      
    } catch (error) {
      console.error('   ❌ Historical data collection failed:', error.message);
      this.results.errors.push(`Historical data collection failed: ${error.message}`);
    }
  }

  /**
   * 👔 STEP 4: Collect executive/employee data
   */
  async collectExecutiveData() {
    console.log('\n👔 STEP 4: Collecting executive/employee data...');
    
    try {
      // Try to get employee data (this might not be available for all companies)
      const employeeData = await this.callCoreSignalAPI(`/cdapi/v2/employee_multi_source/collect/company/${this.coresignalCompanyId}`, null, 'GET');
      
      if (employeeData && Array.isArray(employeeData)) {
        this.results.executiveData = employeeData;
        this.creditsUsed.executives += 2;
        console.log(`   ✅ Employee data collected: ${employeeData.length} employees`);
        
        // Show key executives
        const executives = employeeData.filter(emp => 
          emp.position_title && 
          (emp.position_title.toLowerCase().includes('ceo') || 
           emp.position_title.toLowerCase().includes('president') ||
           emp.position_title.toLowerCase().includes('director') ||
           emp.position_title.toLowerCase().includes('manager'))
        );
        
        if (executives.length > 0) {
          console.log(`   👔 Key Executives Found:`);
          executives.slice(0, 5).forEach((exec, index) => {
            console.log(`      ${index + 1}. ${exec.full_name || 'Unknown'} - ${exec.position_title || 'Unknown'}`);
            console.log(`         📧 ${exec.email || 'No email'}`);
            console.log(`         🔗 ${exec.linkedin_url || 'No LinkedIn'}`);
          });
        }
      } else {
        console.log('   ⚠️ No employee data available (this is common for smaller companies)');
      }
      
    } catch (error) {
      console.error('   ❌ Executive data collection failed:', error.message);
      this.results.errors.push(`Executive data collection failed: ${error.message}`);
    }
  }

  /**
   * 💾 STEP 5: Update database with enriched data
   */
  async updateDatabaseWithEnrichedData() {
    console.log('\n💾 STEP 5: Updating database with enriched data...');
    
    if (!this.results.companyData) {
      console.log('   ⚠️ No company data to update database with');
      return;
    }
    
    try {
      const companyData = this.results.companyData;
      
      // Prepare update data
      const updateData = {
        // Basic company info
        name: companyData.company_name || this.results.currentDatabaseData.name,
        website: companyData.website || this.results.currentDatabaseData.website,
        description: companyData.description || this.results.currentDatabaseData.description,
        industry: companyData.industry || this.results.currentDatabaseData.industry,
        
        // Location data
        address: companyData.hq_street || this.results.currentDatabaseData.address,
        city: companyData.hq_city || this.results.currentDatabaseData.city,
        state: companyData.hq_state || this.results.currentDatabaseData.state,
        country: companyData.hq_country || this.results.currentDatabaseData.country,
        postalCode: companyData.hq_zipcode || this.results.currentDatabaseData.postalCode,
        
        // Size and revenue
        size: companyData.size_range || this.results.currentDatabaseData.size,
        revenue: companyData.revenue_annual_range ? 
          parseFloat(companyData.revenue_annual_range.annual_revenue_range_to || 0) * 1000000 : 
          this.results.currentDatabaseData.revenue,
        
        // Custom fields with CoreSignal data
        customFields: {
          ...this.results.currentDatabaseData.customFields,
          coresignalCompanyId: this.coresignalCompanyId,
          coresignalSourceId: this.coresignalSourceId,
          coresignalData: {
            employees_count: companyData.employees_count,
            founded_year: companyData.founded_year,
            type: companyData.type,
            linkedin_url: companyData.linkedin_url,
            facebook_url: companyData.facebook_url,
            twitter_url: companyData.twitter_url,
            company_phone_numbers: companyData.company_phone_numbers,
            company_emails: companyData.company_emails,
            categories_and_keywords: companyData.categories_and_keywords,
            key_executives: companyData.key_executives,
            company_locations_full: companyData.company_locations_full,
            last_updated_at: companyData.last_updated_at
          },
          enrichmentDate: new Date().toISOString(),
          enrichmentSource: 'CoreSignal'
        },
        
        updatedAt: new Date()
      };
      
      // Update the company record
      const updatedCompany = await this.prisma.companies.update({
        where: { id: this.companyId },
        data: updateData,
        select: {
          id: true,
          name: true,
          website: true,
          industry: true,
          size: true,
          revenue: true,
          description: true,
          city: true,
          state: true,
          country: true,
          address: true,
          postalCode: true,
          customFields: true,
          updatedAt: true
        }
      });
      
      console.log('   ✅ Database updated successfully with CoreSignal data');
      console.log(`   📊 Updated company: ${updatedCompany.name}`);
      console.log(`   🏭 Industry: ${updatedCompany.industry || 'Unknown'}`);
      console.log(`   📏 Size: ${updatedCompany.size || 'Unknown'}`);
      console.log(`   💰 Revenue: ${updatedCompany.revenue ? `$${updatedCompany.revenue.toLocaleString()}` : 'Unknown'}`);
      console.log(`   📍 Location: ${updatedCompany.address || 'Unknown'}, ${updatedCompany.city || 'Unknown'}, ${updatedCompany.state || 'Unknown'}`);
      console.log(`   🔗 LinkedIn: ${updatedCompany.customFields?.linkedinUrl || 'None'}`);
      console.log(`   🆔 CoreSignal ID: ${updatedCompany.customFields?.coresignalCompanyId || 'None'}`);
      
      this.results.databaseUpdate = updatedCompany;
      
    } catch (error) {
      console.error('   ❌ Database update failed:', error.message);
      this.results.errors.push(`Database update failed: ${error.message}`);
    }
  }

  /**
   * 💾 STEP 6: Save results to JSON file
   */
  async saveResultsToFile() {
    console.log('\n💾 STEP 6: Saving results to JSON file...');
    
    try {
      const filename = `5bars-coresignal-collection-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      // Update credits used in results
      this.results.creditsUsed = this.creditsUsed;
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Results saved to: ${filename}`);
      console.log(`   📁 Full path: ${filepath}`);
      
      // Also save a latest version
      const latestFilename = '5bars-coresignal-collection-latest.json';
      const latestFilepath = path.join(process.cwd(), latestFilename);
      await fs.writeFile(latestFilepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Latest version saved to: ${latestFilename}`);
      
    } catch (error) {
      console.error('   ❌ Failed to save results:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Display summary
   */
  displaySummary() {
    console.log('\n📋 CORESIGNAL DATA COLLECTION SUMMARY');
    console.log('=====================================');
    console.log(`Database Company ID: ${this.companyId}`);
    console.log(`CoreSignal Company ID: ${this.coresignalCompanyId}`);
    console.log(`CoreSignal Source ID: ${this.coresignalSourceId}`);
    console.log(`Company Data Collected: ${this.results.companyData ? 'Yes' : 'No'}`);
    console.log(`Historical Data Collected: ${this.results.historicalData ? 'Yes' : 'No'}`);
    console.log(`Executive Data Collected: ${this.results.executiveData ? 'Yes' : 'No'}`);
    console.log(`Database Updated: ${this.results.databaseUpdate ? 'Yes' : 'No'}`);
    console.log(`Credits Used: ${this.creditsUsed.collect} collect + ${this.creditsUsed.historical} historical + ${this.creditsUsed.executives} executives = ${this.creditsUsed.collect + this.creditsUsed.historical + this.creditsUsed.executives} total`);
    console.log(`Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.results.companyData) {
      console.log('\n🎯 Key Company Data Collected:');
      console.log(`   Name: ${this.results.companyData.company_name || 'Unknown'}`);
      console.log(`   Industry: ${this.results.companyData.industry || 'Unknown'}`);
      console.log(`   Employees: ${this.results.companyData.employees_count || 'Unknown'}`);
      console.log(`   Size Range: ${this.results.companyData.size_range || 'Unknown'}`);
      console.log(`   Founded: ${this.results.companyData.founded_year || 'Unknown'}`);
      console.log(`   Type: ${this.results.companyData.type || 'Unknown'}`);
      console.log(`   Website: ${this.results.companyData.website || 'Unknown'}`);
      console.log(`   LinkedIn: ${this.results.companyData.linkedin_url || 'Unknown'}`);
      console.log(`   HQ Location: ${this.results.companyData.hq_location || 'Unknown'}`);
      console.log(`   Phone: ${this.results.companyData.company_phone_numbers ? this.results.companyData.company_phone_numbers.join(', ') : 'None'}`);
      console.log(`   Key Executives: ${this.results.companyData.key_executives ? this.results.companyData.key_executives.length : 0}`);
      console.log(`   Locations: ${this.results.companyData.company_locations_full ? this.results.companyData.company_locations_full.length : 0}`);
    }
    
    if (this.results.historicalData && this.results.historicalData.length > 0) {
      console.log('\n📈 Historical Data:');
      const latest = this.results.historicalData[this.results.historicalData.length - 1];
      const oldest = this.results.historicalData[0];
      console.log(`   Data Points: ${this.results.historicalData.length}`);
      console.log(`   Latest Headcount: ${latest.employees_count || 'Unknown'} (${latest.date || 'Unknown'})`);
      console.log(`   Oldest Headcount: ${oldest.employees_count || 'Unknown'} (${oldest.date || 'Unknown'})`);
    }
    
    if (this.results.executiveData && this.results.executiveData.length > 0) {
      console.log('\n👔 Executive Data:');
      console.log(`   Total Employees: ${this.results.executiveData.length}`);
      const executives = this.results.executiveData.filter(emp => 
        emp.position_title && 
        (emp.position_title.toLowerCase().includes('ceo') || 
         emp.position_title.toLowerCase().includes('president') ||
         emp.position_title.toLowerCase().includes('director') ||
         emp.position_title.toLowerCase().includes('manager'))
      );
      console.log(`   Key Executives: ${executives.length}`);
    }
  }

  /**
   * Make API call to CoreSignal
   */
  async callCoreSignalAPI(endpoint, params, method = 'GET') {
    const https = require('https');
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        let url = `${this.config.baseUrl}${endpoint}`;
        let options = {
          method: method,
          headers: {
            'apikey': this.config.apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Adrata-5Bars-Data-Collection/1.0'
          }
        };

        if (method === 'POST' && params) {
          options.body = JSON.stringify(params);
        } else if (method === 'GET' && params) {
          const queryString = new URLSearchParams(params).toString();
          url = `${url}?${queryString}`;
        }

        const response = await this.makeHttpRequest(url, options);
        
        if (response) {
          await this.delay(this.config.rateLimitDelay);
          return response;
        }

      } catch (error) {
        console.log(`   ⚠️ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.rateLimitDelay * 2);
        }
      }
    }

    throw new Error(`API call failed after ${this.config.maxRetries} attempts`);
  }

  /**
   * Make HTTP request
   */
  makeHttpRequest(url, options) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const urlObj = new URL(url);
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: options.headers
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${data}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the data collection
async function collect5BarsCoreSignalData() {
  const collector = new Collect5BarsCoreSignalData();
  const results = await collector.execute();
  
  console.log('\n🎉 5BARS SERVICES CORESIGNAL DATA COLLECTION COMPLETE!');
  console.log('Check the generated JSON files for the collected data.');
  console.log('The database has been updated with the enriched company information.');
  
  return results;
}

// Export for use
module.exports = { Collect5BarsCoreSignalData, collect5BarsCoreSignalData };

// Run if called directly
if (require.main === module) {
  collect5BarsCoreSignalData().catch(console.error);
}
