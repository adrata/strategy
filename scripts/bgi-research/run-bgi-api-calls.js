/**
 * 🎯 DIRECT API CALLS FOR BUYER GROUP INTELLIGENCE
 * 
 * This script calls our existing /api/intelligence/buyer-group-bulk endpoint
 * to get real CoreSignal data for Flexera and athenahealth
 */

const fetch = require('node-fetch');

async function runBGIApiCalls() {
  console.log('🚀 Starting Direct BGI API Calls...\n');

  const baseUrl = 'http://localhost:3000'; // Local development
  const endpoint = '/api/intelligence/buyer-group-bulk';

  const requests = [
    {
      name: 'Flexera',
      seller: 'SBI Growth',
      accounts: ['Flexera'],
      targetRoles: ['CEO', 'CRO', 'CFO', 'VP Sales', 'VP Marketing', 'Head of Revenue Operations'],
      userId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP'
    },
    {
      name: 'athenahealth',
      seller: 'Absorb',
      accounts: ['athenahealth'],
      targetRoles: ['CTO', 'VP Technology', 'Head of Learning', 'VP HR', 'Director of Training'],
      userId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP'
    }
  ];

  const results = [];

  for (const request of requests) {
    console.log(`\n🎯 Analyzing ${request.name} for ${request.seller}...`);
    console.log(`📊 Target Roles: ${request.targetRoles.join(', ')}\n`);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ ${request.name} Analysis Complete:`);
      console.log(`   📈 Total People Found: ${data.summary.totalPeopleFound}`);
      console.log(`   🎯 Success Rate: ${data.summary.overallSuccessRate}%`);
      console.log(`   ⏱️  Processing Time: ${data.summary.processingTimeMs}ms`);
      console.log(`   💰 Estimated Cost: ${data.summary.costEstimate}`);
      
      // Log buyer group details
      if (data.buyerGroups && data.buyerGroups.length > 0) {
        const buyerGroup = data.buyerGroups[0];
        console.log(`   👥 Buyer Group Size: ${buyerGroup.peopleCount}`);
        console.log(`   🔍 Search Time: ${buyerGroup.searchTime}ms`);
        
        // Log key people by role
        if (buyerGroup.people && buyerGroup.people.length > 0) {
          console.log(`   👑 Key People Found:`);
          buyerGroup.people.slice(0, 5).forEach((person, index) => {
            console.log(`      ${index + 1}. ${person.name} - ${person.title} (${person.role})`);
          });
          
          if (buyerGroup.people.length > 5) {
            console.log(`      ... and ${buyerGroup.people.length - 5} more`);
          }
        }
      }

      results.push({
        company: request.name,
        seller: request.seller,
        data: data,
        success: true
      });

    } catch (error) {
      console.error(`❌ Error analyzing ${request.name}:`, error.message);
      results.push({
        company: request.name,
        seller: request.seller,
        error: error.message,
        success: false
      });
    }

    // Rate limiting between requests
    console.log('\n⏳ Waiting 3 seconds before next request...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n📊 BGI API CALLS SUMMARY');
  console.log('========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful Calls: ${successful.length}`);
  console.log(`❌ Failed Calls: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 SUCCESSFUL RESULTS:');
    successful.forEach(result => {
      const data = result.data;
      console.log(`\n${result.company} (${result.seller}):`);
      console.log(`  Total People: ${data.summary.totalPeopleFound}`);
      console.log(`  Success Rate: ${data.summary.overallSuccessRate}%`);
      console.log(`  Cost: ${data.summary.costEstimate}`);
      
      if (data.buyerGroups && data.buyerGroups.length > 0) {
        const people = data.buyerGroups[0].people || [];
        const roles = {};
        people.forEach(person => {
          roles[person.role] = (roles[person.role] || 0) + 1;
        });
        
        console.log(`  Role Distribution:`);
        Object.entries(roles).forEach(([role, count]) => {
          console.log(`    ${role}: ${count}`);
        });
      }
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED CALLS:');
    failed.forEach(result => {
      console.log(`${result.company}: ${result.error}`);
    });
  }

  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bgi-api-results-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);

  return results;
}

// Run the API calls
if (require.main === module) {
  runBGIApiCalls()
    .then(results => {
      console.log('\n🎉 BGI API Calls Complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal Error:', error);
      process.exit(1);
    });
}

module.exports = { runBGIApiCalls };
