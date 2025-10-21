#!/usr/bin/env node

/**
 * WINNING VARIANT BUYER GROUP DISCOVERY
 * 
 * Advanced buyer group discovery for 4 target companies with archetype enrichment
 * Uses the BuyerGroupEngine with archetype personalization
 */

import { BuyerGroupEngine } from '../src/platform/intelligence/buyer-group/buyer-group-engine';
import { determineArchetype } from '../src/platform/services/buyer-group-archetypes';
import { StrategyPersonalizationService } from '../src/platform/services/strategy-personalization-service';
import * as fs from 'fs';
import * as path from 'path';

interface CompanyBuyerGroupReport {
  companyInfo: {
    name: string;
    website: string;
    industry: string;
    size: string;
    headquarters: string;
  };
  buyerGroup: {
    totalMembers: number;
    cohesionScore: number;
    overallConfidence: number;
    members: BuyerGroupMember[];
  };
  salesIntent: {
    score: number;
    level: string;
    signals: string[];
    hiringActivity: any;
  };
  archetypeDistribution: {
    [archetypeId: string]: number;
  };
  strategicRecommendations: string[];
  metadata: {
    discoveryTime: string;
    enrichmentLevel: string;
    processingTime: number;
    costEstimate: number;
  };
}

interface BuyerGroupMember {
  name: string;
  title: string;
  role: 'Decision Maker' | 'Champion' | 'Stakeholder' | 'Blocker' | 'Introducer';
  archetype: any;
  personalizedStrategy: {
    situation: string;
    complication: string;
    futureState: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  aiIntelligence?: {
    wants: any;
    pains: any;
    outreach: any;
  };
  influenceScore: number;
  confidence: number;
}

async function discoverWinningVariantBuyerGroups() {
  console.log('🎯 Starting world-class buyer group discovery for Winning Variant demo...\n');

  // Initialize services
  const buyerGroupEngine = new BuyerGroupEngine();
  const strategyService = new StrategyPersonalizationService();

  // Target companies for Winning Variant
  const companies = [
    {
      name: "Match Group",
      website: "https://mtch.com",
      industry: "Online Dating / Technology",
      size: "2,000+ employees",
      headquarters: "Dallas, Texas"
    },
    {
      name: "Brex",
      website: "https://brex.com",
      industry: "FinTech",
      size: "500-1,000 employees",
      headquarters: "San Francisco, California"
    },
    {
      name: "First Premier Bank",
      website: "https://firstpremier.com",
      industry: "Banking / Financial Services",
      size: "1,000-5,000 employees",
      headquarters: "Sioux Falls, South Dakota"
    },
    {
      name: "Zuora",
      website: "https://zuora.com",
      industry: "SaaS / Subscription Management",
      size: "1,000-5,000 employees",
      headquarters: "Redwood City, California"
    }
  ];

  const results: CompanyBuyerGroupReport[] = [];

  for (const company of companies) {
    try {
      console.log(`\n🔍 Discovering buyer group for: ${company.name}`);
      console.log(`   Industry: ${company.industry}`);
      console.log(`   Size: ${company.size}`);
      
      // Run buyer group discovery with enrichment
      const discoveryResult = await buyerGroupEngine.discover({
        companyName: company.name,
        website: company.website,
        enrichmentLevel: 'enrich', // Balanced cost/quality
        workspaceId: 'demo-winning-variant',
        options: {
          saveToDatabase: true
        }
      });

      if (discoveryResult.buyerGroup && discoveryResult.buyerGroup.members) {
        console.log(`✅ ${company.name} - ${discoveryResult.buyerGroup.totalMembers} buyer group members found`);
        
        // Enrich with archetypes and personalized strategies
        const enrichedMembers: BuyerGroupMember[] = discoveryResult.buyerGroup.members.map((member: any) => {
          // Determine archetype
          const archetype = determineArchetype(member);
          
          // Generate personalized strategy
          const personalizedStrategy = strategyService.generatePersonalizedStrategy({
            id: member.id || '',
            name: member.name || '',
            title: member.title || '',
            company: company.name,
            industry: company.industry,
            department: member.department || '',
            seniority: member.seniority || '',
            buyerGroupRole: member.role || '',
            painPoints: member.painPoints || [],
            goals: member.goals || [],
            challenges: member.challenges || [],
            opportunities: member.opportunities || [],
            skills: member.skills || [],
            experience: member.experience || [],
            customFields: member.customFields || {}
          }, archetype);

          return {
            name: member.name || '',
            title: member.title || '',
            role: member.role || 'Stakeholder',
            archetype: archetype,
            personalizedStrategy: {
              situation: personalizedStrategy.personalizedContent.situation,
              complication: personalizedStrategy.personalizedContent.complication,
              futureState: personalizedStrategy.personalizedContent.futureState
            },
            contactInfo: {
              email: member.email,
              phone: member.phone,
              linkedin: member.linkedin
            },
            aiIntelligence: member.aiIntelligence,
            influenceScore: member.influenceScore || 0,
            confidence: member.confidence || 0
          };
        });

        // Calculate archetype distribution
        const archetypeDistribution: { [key: string]: number } = {};
        enrichedMembers.forEach(member => {
          const archetypeId = member.archetype?.id || 'unknown';
          archetypeDistribution[archetypeId] = (archetypeDistribution[archetypeId] || 0) + 1;
        });

        // Generate strategic recommendations
        const strategicRecommendations = generateStrategicRecommendations(company, enrichedMembers);

        // Create comprehensive report
        const report: CompanyBuyerGroupReport = {
          companyInfo: company,
          buyerGroup: {
            totalMembers: enrichedMembers.length,
            cohesionScore: discoveryResult.buyerGroup.cohesionScore || 0,
            overallConfidence: discoveryResult.buyerGroup.overallConfidence || 0,
            members: enrichedMembers
          },
          salesIntent: {
            score: discoveryResult.salesIntent?.score || 0,
            level: discoveryResult.salesIntent?.level || 'medium',
            signals: discoveryResult.salesIntent?.signals || [],
            hiringActivity: discoveryResult.salesIntent?.hiringActivity || {}
          },
          archetypeDistribution,
          strategicRecommendations,
          metadata: {
            discoveryTime: new Date().toISOString(),
            enrichmentLevel: 'enrich',
            processingTime: discoveryResult.processingTime || 0,
            costEstimate: discoveryResult.costEstimate || 0
          }
        };

        // Save individual result
        const outputDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filename = `${company.name.toLowerCase().replace(/\s+/g, '-')}-buyer-group.json`;
        const filepath = path.join(outputDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`   📁 Data saved to: ${filepath}`);
        console.log(`   🎭 Archetypes: ${Object.keys(archetypeDistribution).join(', ')}`);
        console.log(`   💰 Cost: $${report.metadata.costEstimate.toFixed(2)}`);
        
        results.push(report);
        
      } else {
        console.log(`❌ ${company.name} - Discovery failed: No buyer group data returned`);
      }
      
    } catch (error) {
      console.error(`❌ Error discovering ${company.name}:`, error instanceof Error ? error.message : String(error));
    }
  }

  // Generate aggregate summary
  const aggregateStats = {
    totalCompanies: results.length,
    totalMembers: results.reduce((sum, r) => sum + r.buyerGroup.totalMembers, 0),
    totalDecisionMakers: results.reduce((sum, r) => sum + r.buyerGroup.members.filter(m => m.role === 'Decision Maker').length, 0),
    totalChampions: results.reduce((sum, r) => sum + r.buyerGroup.members.filter(m => m.role === 'Champion').length, 0),
    averageCohesionScore: results.reduce((sum, r) => sum + r.buyerGroup.cohesionScore, 0) / results.length,
    totalCost: results.reduce((sum, r) => sum + r.metadata.costEstimate, 0),
    archetypeDistribution: {}
  };

  // Calculate aggregate archetype distribution
  results.forEach(report => {
    Object.entries(report.archetypeDistribution).forEach(([archetype, count]) => {
      aggregateStats.archetypeDistribution[archetype] = (aggregateStats.archetypeDistribution[archetype] || 0) + count;
    });
  });

  // Save aggregate summary
  const summaryPath = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data', 'aggregate-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(aggregateStats, null, 2));

  // Final summary
  console.log('\n📊 Discovery Summary:');
  console.log('====================');
  console.log(`✅ Successful: ${results.length}/${companies.length}`);
  console.log(`👥 Total Buyer Group Members: ${aggregateStats.totalMembers}`);
  console.log(`🎯 Decision Makers: ${aggregateStats.totalDecisionMakers}`);
  console.log(`⭐ Champions: ${aggregateStats.totalChampions}`);
  console.log(`📈 Average Cohesion Score: ${aggregateStats.averageCohesionScore.toFixed(1)}`);
  console.log(`💰 Total Cost: $${aggregateStats.totalCost.toFixed(2)}`);
  console.log(`🎭 Archetype Distribution:`, aggregateStats.archetypeDistribution);

  console.log('\n🎉 World-class buyer group discovery complete!');
  console.log('Ready to build the Winning Variant demo reports.');
}

function generateStrategicRecommendations(company: any, members: BuyerGroupMember[]): string[] {
  const recommendations: string[] = [];
  
  // Find decision makers
  const decisionMakers = members.filter(m => m.role === 'Decision Maker');
  const champions = members.filter(m => m.role === 'Champion');
  const blockers = members.filter(m => m.role === 'Blocker');
  
  if (decisionMakers.length > 0) {
    recommendations.push(`Engage with ${decisionMakers[0].name} (${decisionMakers[0].title}) as primary decision maker`);
  }
  
  if (champions.length > 0) {
    recommendations.push(`Leverage ${champions[0].name} (${champions[0].title}) as internal champion`);
  }
  
  if (blockers.length > 0) {
    recommendations.push(`Address concerns of ${blockers[0].name} (${blockers[0].title}) early in the process`);
  }
  
  recommendations.push(`Focus on ${company.industry} industry pain points and solutions`);
  recommendations.push(`Emphasize ROI and business impact for ${company.name} executives`);
  
  return recommendations;
}

// Run the discovery
discoverWinningVariantBuyerGroups().catch(console.error);
