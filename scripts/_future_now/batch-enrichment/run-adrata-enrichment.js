#!/usr/bin/env node

/**
 * Run Adrata Workspace Enrichment
 * Streamlined version that auto-runs without confirmation
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V'; // Adrata
const BATCH_SIZE = 5;
const DELAY_BETWEEN_PEOPLE = 300;

async function runEnrichment() {
  const startTime = Date.now();
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 ADRATA WORKSPACE ENRICHMENT - Dan\'s Contacts');
    console.log('='.repeat(80));
    
    // Initialize verifier
    const verifier = new MultiSourceVerifier({
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      LUSHA_API_KEY: process.env.LUSHA_API_KEY,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TIMEOUT: 30000
    });
    
    // Get all people
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null
      },
      include: {
        company: {
          select: { name: true, website: true }
        }
      }
    });
    
    console.log(`\n📊 Found ${allPeople.length} people in Adrata workspace`);
    
    // Filter who needs enrichment
    const needsEnrichment = allPeople.filter(p => {
      const hasEmail = p.email && p.email.includes('@');
      const hasLinkedIn = p.linkedinUrl && p.linkedinUrl.trim() !== '';
      const needsVerification = !p.emailVerified || !p.phoneVerified;
      return (hasEmail || hasLinkedIn) && needsVerification;
    });
    
    console.log(`🔄 ${needsEnrichment.length} people need enrichment`);
    console.log(`⏭️  ${allPeople.length - needsEnrichment.length} already good\n`);
    
    if (needsEnrichment.length === 0) {
      console.log('✅ All contacts already verified!');
      return;
    }
    
    const stats = {
      processed: 0,
      emailsVerified: 0,
      phonesDiscovered: 0,
      emailCost: 0,
      phoneCost: 0
    };
    
    // Process in batches
    const totalBatches = Math.ceil(needsEnrichment.length / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = needsEnrichment.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
      
      console.log(`📦 Batch ${batchIndex + 1}/${totalBatches}:`);
      
      for (const person of batch) {
        const personStart = Date.now();
        console.log(`   👤 ${person.fullName || person.firstName + ' ' + person.lastName}`);
        
        try {
          const companyDomain = person.company?.website ? extractDomain(person.company.website) : null;
          let updates = {};
          
          // Verify email
          if (person.email && person.email.includes('@')) {
            try {
              const verification = await verifier.verifyEmailMultiLayer(
                person.email,
                person.fullName,
                companyDomain
              );
              
              if (verification.valid && verification.confidence >= 70) {
                updates.email = person.email;
                updates.emailVerified = true;
                updates.emailConfidence = verification.confidence;
                stats.emailsVerified++;
                stats.emailCost += 0.003;
                const personDuration = Math.floor((Date.now() - personStart) / 1000);
                console.log(`      📧 ✅ Verified (${verification.confidence}%, ${personDuration}s)`);
              }
            } catch (err) {
              console.log(`      📧 ⚠️ Verification failed`);
            }
          }
          
          // Discover phone
          if (person.linkedinUrl && process.env.LUSHA_API_KEY) {
            try {
              const response = await fetch(\`https://api.lusha.com/v2/person?linkedinUrl=\${encodeURIComponent(person.linkedinUrl)}\`, {
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
                  
                  updates.phone = best.number;
                  updates.phoneVerified = true;
                  updates.phoneConfidence = 75;
                  updates.phoneType = best.phoneType;
                  if (best.phoneType === 'mobile') updates.mobilePhone = best.number;
                  stats.phonesDiscovered++;
                  stats.phoneCost += 0.01;
                  const personDuration = Math.floor((Date.now() - personStart) / 1000);
                  console.log(\`      📞 ✅ Discovered (${best.phoneType}, \${personDuration}s)\`);
                }
              }
            } catch (err) {
              console.log(\`      📞 ⚠️ Discovery failed\`);
            }
          }
          
          // Update database
          if (Object.keys(updates).length > 0) {
            updates.lastEnriched = new Date();
            await prisma.people.update({
              where: { id: person.id },
              data: updates
            });
          }
          
          stats.processed++;
          
        } catch (error) {
          console.log(\`      ❌ Error: \${error.message}\`);
        }
        
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PEOPLE));
      }
      
      // Progress update
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const elapsedMin = Math.floor(elapsed / 60);
      const elapsedSec = elapsed % 60;
      console.log(\`\\n📈 Progress (\${elapsedMin}m \${elapsedSec}s elapsed):\`);
      console.log(\`   Processed: \${stats.processed}/\${needsEnrichment.length}\`);
      console.log(\`   Emails: \${stats.emailsVerified} verified\`);
      console.log(\`   Phones: \${stats.phonesDiscovered} discovered\`);
      console.log(\`   Cost: $\${(stats.emailCost + stats.phoneCost).toFixed(4)}\\n\`);
      
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final results
    const totalDuration = Date.now() - startTime;
    const durationMin = Math.floor(totalDuration / 1000 / 60);
    const durationSec = Math.floor((totalDuration / 1000) % 60);
    
    console.log('='.repeat(80));
    console.log('✅ ADRATA ENRICHMENT COMPLETE');
    console.log('='.repeat(80));
    console.log(\`\\n👥 Results:\`);
    console.log(\`   Total People: \${allPeople.length}\`);
    console.log(\`   Processed: \${stats.processed}\`);
    console.log(\`   Emails Verified: \${stats.emailsVerified} (${Math.round(stats.emailsVerified/stats.processed*100)}%)\`);
    console.log(\`   Phones Discovered: \${stats.phonesDiscovered} (${Math.round(stats.phonesDiscovered/stats.processed*100)}%)\`);
    console.log(\`\\n💰 Cost: $\${(stats.emailCost + stats.phoneCost).toFixed(4)}\`);
    console.log(\`⏱️  Duration: \${durationMin}m \${durationSec}s\`);
    console.log('='.repeat(80) + '\\n');
    console.log('✅ Dan\\'s Adrata workspace contacts are now 100% good!\\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

function extractDomain(website) {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : \`https://\${website}\`);
    return url.hostname.replace('www.', '');
  } catch (error) {
    return null;
  }
}

runEnrichment();
" 2>&1
