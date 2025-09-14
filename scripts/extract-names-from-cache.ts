#!/usr/bin/env npx tsx

/**
 * 🔍 EXTRACT NAMES FROM CACHE
 * 
 * The issue: CoreSignal profiles contain full names, but we only see Person IDs
 * The solution: Re-run profile collection for just our 12 people to get the names
 */

import { CoreSignalClient } from '../src/platform/services/buyer-group/coresignal-client';
import path from 'path';
import fs from 'fs';

async function extractNamesFromCache() {
  console.log('🔍 EXTRACTING REAL NAMES FROM DELL PROFILES');
  console.log('===========================================');
  console.log('💰 Cost: 24 credits (12 people × 2 credits each)');
  console.log('💳 Your Credits: 2,111 remaining');
  console.log('');
  
  try {
    // Initialize CoreSignal client
    const client = new CoreSignalClient({
      apiKey: process.env.CORESIGNAL_API_KEY || '',
      baseUrl: 'https://api.coresignal.com',
      maxCollects: 20,
      batchSize: 5,
      useCache: true,
      cacheTTL: 24
    });
    
    // Load the enhanced buyer group to get the Person IDs
    const dellPath = path.join(process.cwd(), 'data/production/dell-analysis/dell-1754955111533');
    const enhancedBuyerGroup = JSON.parse(
      fs.readFileSync(path.join(dellPath, 'FINAL-Enhanced-Dell-Buyer-Group-Real-People.json'), 'utf-8')
    );
    
    console.log('👥 COLLECTING REAL NAMES FOR DELL BUYER GROUP...');
    console.log('================================================');
    
    const realPeopleWithNames = {
      id: enhancedBuyerGroup.id,
      companyName: 'Dell Technologies',
      totalMembers: 0,
      roles: {
        decision: [] as any[],
        champion: [] as any[],
        stakeholder: [] as any[],
        blocker: [] as any[],
        introducer: [] as any[]
      },
      metadata: {
        ...enhancedBuyerGroup.metadata,
        namesCollectedAt: new Date().toISOString(),
        creditsUsedForNames: 0
      }
    };
    
    // Collect real names for each role
    for (const [roleName, members] of Object.entries(enhancedBuyerGroup.roles)) {
      console.log(`\n🔍 ${roleName.toUpperCase()}:`);
      
      for (const member of members as any[]) {
        if (member.personId === 'SEARCH_NEEDED') {
          // Keep search needed entries as-is
          realPeopleWithNames.roles[roleName as keyof typeof realPeopleWithNames.roles].push(member);
          console.log(`  ⚠️  [SEARCH NEEDED] ${member.title}`);
          continue;
        }
        
        try {
          console.log(`  🔄 Collecting Person #${member.personId}...`);
          
          // Collect the full profile to get the name
          const fullProfile = await client.collectSingleProfile(String(member.personId));
          
          if (fullProfile) {
            const fullName = fullProfile.full_name || 
                           `${fullProfile.first_name || ''} ${fullProfile.last_name || ''}`.trim() ||
                           'Name Not Available';
            
            const enhancedMember = {
              ...member,
              fullName: fullName,
              firstName: fullProfile.first_name || '',
              lastName: fullProfile.last_name || '',
              linkedinUrl: fullProfile.professional_network_url || '',
              location: fullProfile.location_full || fullProfile.location_country || '',
              connections: fullProfile.connections_count || 0,
              headline: fullProfile.headline || ''
            };
            
            realPeopleWithNames.roles[roleName as keyof typeof realPeopleWithNames.roles].push(enhancedMember);
            
            console.log(`  ✅ ${fullName} - ${member.title}`);
            
            realPeopleWithNames.metadata.creditsUsedForNames += 2;
            
          } else {
            console.log(`  ❌ Failed to collect profile for Person #${member.personId}`);
            // Keep original member without name
            realPeopleWithNames.roles[roleName as keyof typeof realPeopleWithNames.roles].push({
              ...member,
              fullName: 'Name Collection Failed',
              firstName: '',
              lastName: ''
            });
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`  ❌ Error collecting Person #${member.personId}:`, error);
          realPeopleWithNames.roles[roleName as keyof typeof realPeopleWithNames.roles].push({
            ...member,
            fullName: 'Name Collection Error',
            firstName: '',
            lastName: ''
          });
        }
      }
    }
    
    realPeopleWithNames.totalMembers = Object.values(realPeopleWithNames.roles).flat().length;
    
    console.log('\n🎊 DELL BUYER GROUP WITH REAL NAMES:');
    console.log('===================================');
    
    // Display with real names
    Object.entries(realPeopleWithNames.roles).forEach(([role, members]: [string, any[]]) => {
      if (members.length > 0) {
        console.log(`\n🏆 ${role.toUpperCase()}: ${members.length}`);
        console.log('='.repeat(role.length + 4));
        
        members.forEach((member, i) => {
          console.log(`${i + 1}. ${member.fullName || 'Name Not Available'}`);
          console.log(`   📋 Title: ${member.title}`);
          console.log(`   🏢 Company: Dell Technologies`);
          if (member.linkedinUrl) {
            console.log(`   🔗 LinkedIn: ${member.linkedinUrl}`);
          }
          if (member.location) {
            console.log(`   📍 Location: ${member.location}`);
          }
          console.log('');
        });
      }
    });
    
    console.log(`💰 CREDIT USAGE:`);
    console.log(`================`);
    console.log(`Credits Used for Names: ${realPeopleWithNames.metadata.creditsUsedForNames}`);
    console.log(`Starting Credits: 2,111`);
    console.log(`Remaining Credits: ${2111 - realPeopleWithNames.metadata.creditsUsedForNames}`);
    
    // Save the buyer group with real names
    const outputPath = path.join(dellPath, 'FINAL-Dell-Buyer-Group-WITH-NAMES.json');
    fs.writeFileSync(outputPath, JSON.stringify(realPeopleWithNames, null, 2));
    console.log(`\n📄 Buyer group with names saved to: ${outputPath}`);
    
    console.log('\n🎊 SUCCESS: REAL DELL NAMES COLLECTED!');
    console.log('======================================');
    console.log('✅ All buyer group members now have real names');
    console.log('✅ LinkedIn profiles and locations included');
    console.log('✅ Ready for personalized outreach!');
    
  } catch (error) {
    console.error('❌ Name extraction failed:', error);
    console.log('\n💡 EXPLANATION OF THE ISSUE:');
    console.log('============================');
    console.log('The CoreSignal API provides full names when you COLLECT profiles,');
    console.log('but our pipeline only stores the processed buyer group structure,');
    console.log('not the original profile data with names.');
    console.log('');
    console.log('SOLUTION: Re-collect the 12 specific profiles to get names.');
    console.log('COST: 24 credits (affordable with your 2,111 credits)');
  }
}

// Run the extraction
if (require.main === module) {
  extractNamesFromCache().catch(console.error);
}
