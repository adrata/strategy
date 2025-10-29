require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

class SketchUpEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.danUserId = '01K7B327HWN9G6KGWA97S1TK43';
    this.adrataWorkspaceId = '01K7464TNANHQXPCZT1FYX205V';
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    console.log('API Keys loaded:');
    console.log('CORESIGNAL_API_KEY:', this.coresignalApiKey ? 'Present' : 'Missing');
    console.log('PERPLEXITY_API_KEY:', this.perplexityApiKey ? 'Present' : 'Missing');
  }

  async enrichSketchUp() {
    console.log('🔍 Starting SketchUp Research and Enrichment...\n');

    // First, get the SketchUp company record
    const sketchUp = await this.getSketchUpCompany();
    if (!sketchUp) {
      console.log('❌ SketchUp company not found in database');
      return;
    }

    console.log(`📋 Found SketchUp: ${sketchUp.name}`);
    console.log(`🌐 Website: ${sketchUp.website}\n`);

    // Phase 1: Try multiple Coresignal search approaches
    console.log('🔍 Phase 1: Coresignal Search Approaches');
    console.log('==========================================');
    
    const coresignalResult = await this.tryCoresignalSearches(sketchUp);
    
    if (coresignalResult.success) {
      console.log(`\n✅ Coresignal Success! Found: ${coresignalResult.companyName}`);
      await this.updateCompanyWithCoresignalData(sketchUp, coresignalResult);
    } else {
      console.log('\n❌ All Coresignal searches failed');
      
      // Phase 2: Perplexity AI Fallback
      console.log('\n🤖 Phase 2: Perplexity AI Fallback');
      console.log('=====================================');
      
      const perplexityResult = await this.tryPerplexityEnrichment(sketchUp);
      if (perplexityResult.success) {
        console.log('✅ Perplexity AI Success!');
        await this.updateCompanyWithPerplexityData(sketchUp, perplexityResult);
      } else {
        console.log('❌ Perplexity AI also failed');
      }
    }

    await this.prisma.$disconnect();
  }

  async getSketchUpCompany() {
    return await this.prisma.companies.findFirst({
      where: {
        workspaceId: this.adrataWorkspaceId,
        mainSellerId: this.danUserId,
        name: { contains: 'SketchUp', mode: 'insensitive' }
      }
    });
  }

  async tryCoresignalSearches(company) {
    const searchStrategies = [
      {
        name: 'SketchUp Company Name',
        query: {
          "query": {
            "match": {
              "name": "SketchUp"
            }
          }
        }
      },
      {
        name: 'Trimble Company Name',
        query: {
          "query": {
            "match": {
              "name": "Trimble"
            }
          }
        }
      },
      {
        name: 'SketchUp by Trimble',
        query: {
          "query": {
            "match": {
              "name": "SketchUp by Trimble"
            }
          }
        }
      },
      {
        name: 'Trimble SketchUp',
        query: {
          "query": {
            "match": {
              "name": "Trimble SketchUp"
            }
          }
        }
      },
      {
        name: 'trimble.com domain',
        query: {
          "query": {
            "term": {
              "website": "trimble.com"
            }
          }
        }
      },
      {
        name: 'sketchup.trimble.com domain',
        query: {
          "query": {
            "term": {
              "website": "sketchup.trimble.com"
            }
          }
        }
      }
    ];

    for (const strategy of searchStrategies) {
      console.log(`   🔍 Trying: ${strategy.name}`);
      
      try {
        const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=1', {
          method: 'POST',
          headers: {
            'apikey': this.coresignalApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(strategy.query)
        });

        if (!searchResponse.ok) {
          console.log(`   ⚠️ Search failed: ${searchResponse.status}`);
          continue;
        }

        const searchData = await searchResponse.json();
        
        if (searchData.data && searchData.data.length > 0) {
          console.log(`   ✅ Found ${searchData.data.length} results`);
          
          // Get the first result and collect detailed data
          const companyId = searchData.data[0].id;
          const profileData = await this.collectCoresignalData(companyId);
          
          if (profileData) {
            console.log(`   📊 Collected profile data for: ${profileData.name || profileData.company_name}`);
            return {
              success: true,
              companyId,
              profileData,
              strategy: strategy.name
            };
          }
        } else {
          console.log(`   ⚠️ No results found`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    return { success: false };
  }

  async collectCoresignalData(companyId) {
    try {
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.coresignalApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!collectResponse.ok) {
        console.log(`   ⚠️ Collect failed: ${collectResponse.status}`);
        return null;
      }

      return await collectResponse.json();
    } catch (error) {
      console.log(`   ❌ Collect error: ${error.message}`);
      return null;
    }
  }

  async tryPerplexityEnrichment(company) {
    try {
      console.log('   🤖 Calling Perplexity AI...');
      
      const prompt = `Research and provide detailed information about SketchUp, a 3D modeling software company owned by Trimble. Website: ${company.website}

Please provide:
- Company description (2-3 sentences)
- Industry and sector
- Estimated employee count
- Founded year
- Revenue estimate if available
- Headquarters location
- LinkedIn URL if available
- Key products/services

Format as JSON with these fields: description, industry, sector, employeeCount, foundedYear, revenue, city, state, country, linkedinUrl, products`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.log(`   ❌ Perplexity API error: ${response.status}`);
        return { success: false };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log('   📝 Perplexity response received');
      
      // Try to parse JSON from response
      let perplexityData;
      try {
        // Extract JSON from response (might be wrapped in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          perplexityData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create structured data from text
          perplexityData = this.parsePerplexityText(content);
        }
      } catch (parseError) {
        console.log('   ⚠️ Could not parse JSON, using text parsing');
        perplexityData = this.parsePerplexityText(content);
      }

      return {
        success: true,
        data: perplexityData,
        rawResponse: content
      };

    } catch (error) {
      console.log(`   ❌ Perplexity error: ${error.message}`);
      return { success: false };
    }
  }

  parsePerplexityText(text) {
    // Basic text parsing as fallback
    return {
      description: text.substring(0, 200) + '...',
      industry: 'Software',
      sector: 'Technology',
      employeeCount: null,
      foundedYear: null,
      revenue: null,
      city: null,
      state: null,
      country: null,
      linkedinUrl: null,
      products: '3D modeling software'
    };
  }

  async updateCompanyWithCoresignalData(company, result) {
    try {
      const { companyId, profileData } = result;
      const revenue = this.extractRevenue(profileData);
      const qualityScore = this.calculateDataQualityScore(company, profileData);

      await this.prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: {
            ...(company.customFields || {}),
            coresignalId: companyId,
            coresignalData: profileData,
            lastEnrichedAt: new Date().toISOString(),
            enrichmentSource: 'coresignal',
            matchConfidence: 85, // High confidence for direct matches
            matchFactors: [{ factor: 'direct_search', score: 85, weight: 1.0 }],
            matchReasoning: `Found via ${result.strategy}`
          },
          
          // Basic Information
          name: profileData.name || profileData.company_name || company.name,
          description: profileData.description || company.description,
          descriptionEnriched: profileData.description || company.descriptionEnriched,
          
          // Contact Information
          website: profileData.website || company.website,
          domain: this.extractDomain(profileData.website || company.website),
          email: profileData.email || company.email,
          phone: profileData.company_phone_numbers?.[0] || profileData.phone || company.phone,
          
          // Social Media
          linkedinUrl: profileData.linkedin_url || company.linkedinUrl,
          twitterUrl: profileData.twitter_url?.[0] || company.twitterUrl,
          facebookUrl: profileData.facebook_url?.[0] || company.facebookUrl,
          
          // Location Information
          address: profileData.company_hq_street || profileData.hq_street || company.address,
          city: profileData.hq_city || profileData.company_hq_city || company.city,
          state: profileData.hq_state || profileData.company_hq_state || company.state,
          country: profileData.hq_country || profileData.company_hq_country || company.country,
          postalCode: profileData.company_hq_zipcode || profileData.hq_zipcode || company.postalCode,
          
          // Business Information
          industry: profileData.industry || company.industry,
          sector: profileData.sector || company.sector,
          size: profileData.size_range || company.size,
          revenue: revenue || company.revenue,
          employeeCount: profileData.employees_count || profileData.employee_count || company.employeeCount,
          foundedYear: profileData.founded_year ? parseInt(profileData.founded_year) : company.foundedYear,
          
          // Company Status
          isPublic: profileData.is_public || company.isPublic,
          
          // Quality Metrics
          dataQualityScore: qualityScore,
          dataSources: ['coresignal'],
          lastVerified: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Successfully updated SketchUp with Coresignal data`);
    } catch (error) {
      console.log(`❌ Error updating with Coresignal data: ${error.message}`);
    }
  }

  async updateCompanyWithPerplexityData(company, result) {
    try {
      const { data } = result;
      const qualityScore = 60; // Lower confidence for AI-generated data

      await this.prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: {
            ...(company.customFields || {}),
            perplexityData: data,
            lastEnrichedAt: new Date().toISOString(),
            enrichmentSource: 'perplexity',
            matchConfidence: 60,
            matchFactors: [{ factor: 'ai_generated', score: 60, weight: 0.6 }],
            matchReasoning: 'Generated by Perplexity AI due to no Coresignal data'
          },
          
          // Basic Information
          name: company.name, // Keep original name
          description: data.description || company.description,
          descriptionEnriched: data.description || company.descriptionEnriched,
          
          // Contact Information
          website: company.website,
          domain: this.extractDomain(company.website),
          
          // Social Media
          linkedinUrl: data.linkedinUrl || company.linkedinUrl,
          
          // Location Information
          city: data.city || company.city,
          state: data.state || company.state,
          country: data.country || company.country,
          
          // Business Information
          industry: data.industry || company.industry,
          sector: data.sector || company.sector,
          employeeCount: data.employeeCount ? parseInt(data.employeeCount.toString().replace(/\D/g, '').substring(0, 4)) || null : company.employeeCount,
          foundedYear: data.foundedYear ? parseInt(data.foundedYear.toString().replace(/\D/g, '').substring(0, 4)) || null : company.foundedYear,
          // Skip revenue for now due to string format issues
          
          // Quality Metrics
          dataQualityScore: qualityScore,
          dataSources: ['perplexity'],
          lastVerified: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Successfully updated SketchUp with Perplexity AI data`);
    } catch (error) {
      console.log(`❌ Error updating with Perplexity data: ${error.message}`);
    }
  }

  extractDomain(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  extractRevenue(profileData) {
    if (profileData.revenue_annual) {
      return profileData.revenue_annual;
    }
    if (profileData.revenue_annual_range) {
      return profileData.revenue_annual_range;
    }
    return null;
  }

  calculateDataQualityScore(company, profileData) {
    let score = 0;
    let maxScore = 0;

    // Basic company info (40 points)
    maxScore += 40;
    if (profileData.name || profileData.company_name) score += 10;
    if (profileData.description) score += 10;
    if (profileData.industry) score += 10;
    if (profileData.website) score += 10;

    // Contact info (20 points)
    maxScore += 20;
    if (profileData.email) score += 5;
    if (profileData.company_phone_numbers?.length > 0) score += 5;
    if (profileData.linkedin_url) score += 5;
    if (profileData.twitter_url?.length > 0) score += 5;

    // Location info (20 points)
    maxScore += 20;
    if (profileData.hq_city || profileData.company_hq_city) score += 5;
    if (profileData.hq_state || profileData.company_hq_state) score += 5;
    if (profileData.hq_country || profileData.company_hq_country) score += 5;
    if (profileData.hq_street || profileData.company_hq_street) score += 5;

    // Business metrics (20 points)
    maxScore += 20;
    if (profileData.employees_count || profileData.employee_count) score += 5;
    if (profileData.founded_year) score += 5;
    if (profileData.size_range) score += 5;
    if (profileData.revenue_annual || profileData.revenue_annual_range) score += 5;

    return Math.round((score / maxScore) * 100);
  }
}

// Run the enrichment
const enrichment = new SketchUpEnrichment();
enrichment.enrichSketchUp().catch(console.error);
