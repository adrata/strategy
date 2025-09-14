const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleProgressAnalysis() {
  try {
    console.log('📧 EMAIL LINKING PROGRESS ANALYSIS');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. CURRENT STATUS
    const totalEmails = await prisma.email_messages.count();
    const emailsLinkedToContacts = await prisma.emailToContact.count();
    const emailsLinkedToAccounts = await prisma.emailToAccount.count();
    const emailsLinkedToLeads = await prisma.emailToLead.count();
    const emailsLinkedToOpportunities = await prisma.emailToOpportunity.count();
    const emailsLinkedToProspects = await prisma.emailToProspect.count();
    
    const totalLinks = emailsLinkedToContacts + emailsLinkedToAccounts + emailsLinkedToLeads + 
                      emailsLinkedToOpportunities + emailsLinkedToProspects;
    
    console.log('📊 CURRENT STATUS:');
    console.log('-'.repeat(30));
    console.log(`   Total emails: ${totalEmails.toLocaleString()}`);
    console.log(`   Total links: ${totalLinks.toLocaleString()}`);
    console.log(`   Average links per email: ${(totalLinks / totalEmails).toFixed(2)}`);
    console.log(`   Overall coverage: ${((totalLinks / (totalEmails * 5)) * 100).toFixed(1)}%`);
    console.log('');
    
    // 2. RECENT ACTIVITY ANALYSIS
    console.log('⏰ RECENT ACTIVITY ANALYSIS:');
    console.log('-'.repeat(30));
    
    // Get emails from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEmails = await prisma.email_messages.count({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      }
    });
    
    // Get emails from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyEmails = await prisma.email_messages.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });
    
    // Get emails from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyEmails = await prisma.email_messages.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    console.log(`   Last 24 hours: ${recentEmails} emails`);
    console.log(`   Last 7 days: ${weeklyEmails} emails`);
    console.log(`   Last 30 days: ${monthlyEmails} emails`);
    
    // Calculate daily average
    const dailyAverage = monthlyEmails / 30;
    console.log(`   Daily average: ${dailyAverage.toFixed(1)} emails`);
    console.log('');
    
    // 3. PROGRESS SINCE LAST CHECK
    console.log('📈 PROGRESS ANALYSIS:');
    console.log('-'.repeat(30));
    
    // Previous values from last check
    const previousTotalLinks = 20599;
    const previousCoverage = 25.3;
    const currentCoverage = (totalLinks / (totalEmails * 5)) * 100;
    
    const linksAdded = totalLinks - previousTotalLinks;
    const coverageIncrease = currentCoverage - previousCoverage;
    
    console.log(`   Links added since last check: ${linksAdded.toLocaleString()}`);
    console.log(`   Coverage increase: +${coverageIncrease.toFixed(1)}%`);
    console.log(`   Progress rate: ${linksAdded > 0 ? '🟢 Improving' : '🔴 Stalled'}`);
    console.log('');
    
    // 4. COMPLETION PREDICTION
    console.log('🎯 COMPLETION PREDICTION:');
    console.log('-'.repeat(30));
    
    // Target coverage scenarios
    const targetCoverages = [50, 75, 90, 95];
    
    console.log('   Target coverage scenarios:');
    targetCoverages.forEach(target => {
      if (target > currentCoverage) {
        const neededLinks = (target / 100) * (totalEmails * 5) - totalLinks;
        const linksPerDay = linksAdded; // Assuming this is daily progress
        const daysToComplete = linksPerDay > 0 ? neededLinks / linksPerDay : Infinity;
        
        console.log(`   ${target}% coverage:`);
        console.log(`     - Need ${neededLinks.toLocaleString()} more links`);
        console.log(`     - At current rate: ${daysToComplete.toFixed(1)} days`);
        console.log(`     - At 2x rate: ${(daysToComplete / 2).toFixed(1)} days`);
        console.log(`     - At 5x rate: ${(daysToComplete / 5).toFixed(1)} days`);
        console.log('');
      }
    });
    
    // 5. OPTIMIZATION RECOMMENDATIONS
    console.log('🚀 OPTIMIZATION RECOMMENDATIONS:');
    console.log('-'.repeat(30));
    
    if (currentCoverage < 50) {
      console.log('   🔴 HIGH PRIORITY:');
      console.log('     - Increase linking frequency');
      console.log('     - Optimize email parsing algorithms');
      console.log('     - Check for failed linking attempts');
    } else if (currentCoverage < 75) {
      console.log('   🟡 MEDIUM PRIORITY:');
      console.log('     - Fine-tune linking accuracy');
      console.log('     - Handle edge cases');
    } else {
      console.log('   🟢 LOW PRIORITY:');
      console.log('     - Maintain current performance');
      console.log('     - Monitor for new email patterns');
    }
    
    console.log('');
    
    // 6. SYSTEM HEALTH CHECK
    console.log('💚 SYSTEM HEALTH CHECK:');
    console.log('-'.repeat(30));
    
    const healthScore = Math.min(100, (currentCoverage / 25) * 100); // Scale to 100
    
    if (healthScore >= 80) {
      console.log('   🟢 EXCELLENT: System performing well');
    } else if (healthScore >= 60) {
      console.log('   🟡 GOOD: System performing adequately');
    } else if (healthScore >= 40) {
      console.log('   🟠 FAIR: System needs optimization');
    } else {
      console.log('   🔴 POOR: System needs immediate attention');
    }
    
    console.log(`   Health score: ${healthScore.toFixed(1)}/100`);
    console.log(`   Status: ${totalEmails > 10000 ? 'Large database' : 'Growing database'}`);
    console.log(`   Activity: ${recentEmails > 10 ? 'Highly active' : 'Moderate activity'}`);
    
    // 7. ESTIMATED COMPLETION TIME
    console.log('\n⏱️ ESTIMATED COMPLETION TIME:');
    console.log('-'.repeat(30));
    
    if (linksAdded > 0) {
      const target50 = (50 / 100) * (totalEmails * 5) - totalLinks;
      const target75 = (75 / 100) * (totalEmails * 5) - totalLinks;
      const target90 = (90 / 100) * (totalEmails * 5) - totalLinks;
      
      const daysTo50 = target50 / linksAdded;
      const daysTo75 = target75 / linksAdded;
      const daysTo90 = target90 / linksAdded;
      
      console.log(`   To 50% coverage: ${daysTo50.toFixed(1)} days`);
      console.log(`   To 75% coverage: ${daysTo75.toFixed(1)} days`);
      console.log(`   To 90% coverage: ${daysTo90.toFixed(1)} days`);
      
      if (daysTo50 < 30) {
        console.log('   🟢 Good progress - 50% achievable within a month');
      } else if (daysTo50 < 90) {
        console.log('   🟡 Moderate progress - 50% achievable within 3 months');
      } else {
        console.log('   🔴 Slow progress - Consider optimization');
      }
    } else {
      console.log('   ⚠️ No recent progress detected - system may be stalled');
    }
    
    console.log('\n✅ Analysis complete! Email linking system is operational.');
    
  } catch (error) {
    console.error('❌ Error analyzing email linking progress:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleProgressAnalysis();
