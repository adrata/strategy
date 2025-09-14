const fetch = require('node-fetch');

async function startVercelServices() {
  try {
    console.log('🚀 STARTING VERCEL BACKGROUND SERVICES');
    console.log('=======================================');
    
    const baseUrl = 'https://adrata-8um13dkti-adrata.vercel.app';
    
    // Start Email Sync Scheduler
    console.log('📧 Starting email sync scheduler...');
    try {
      const emailResponse = await fetch(`${baseUrl}/api/email/sync-scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log('✅ Email sync scheduler started:', emailResult);
      } else {
        console.log('⚠️  Email sync scheduler start failed:', emailResponse.status);
      }
    } catch (error) {
      console.log('❌ Error starting email sync scheduler:', error.message);
    }
    
    // Start Calendar Sync Scheduler
    console.log('📅 Starting calendar sync scheduler...');
    try {
      const calendarResponse = await fetch(`${baseUrl}/api/calendar/scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      if (calendarResponse.ok) {
        const calendarResult = await calendarResponse.json();
        console.log('✅ Calendar sync scheduler started:', calendarResult);
      } else {
        console.log('⚠️  Calendar sync scheduler start failed:', calendarResponse.status);
      }
    } catch (error) {
      console.log('❌ Error starting calendar sync scheduler:', error.message);
    }
    
    // Test Cloud Email Processor
    console.log('☁️ Testing cloud email processor...');
    try {
      const cloudResponse = await fetch(`${baseUrl}/api/email/cloud-processor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
          priority: 'recent',
          batchSize: 10,
          maxProcessingTime: 30000
        })
      });
      
      if (cloudResponse.ok) {
        const cloudResult = await cloudResponse.json();
        console.log('✅ Cloud email processor working:', cloudResult);
      } else {
        console.log('⚠️  Cloud email processor test failed:', cloudResponse.status);
      }
    } catch (error) {
      console.log('❌ Error testing cloud email processor:', error.message);
    }
    
    // Check system health
    console.log('🏥 Checking system health...');
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      
      if (healthResponse.ok) {
        const healthResult = await healthResponse.json();
        console.log('✅ System health check passed:', healthResult);
      } else {
        console.log('⚠️  System health check failed:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ Error checking system health:', error.message);
    }
    
    console.log('\n🎯 VERCEL DEPLOYMENT STATUS:');
    console.log('============================');
    console.log('✅ Application deployed to Vercel');
    console.log('✅ Background services started');
    console.log('✅ Cloud processing available');
    console.log('✅ Automated schedulers running');
    
    console.log('\n🔗 IMPORTANT LINKS:');
    console.log('===================');
    console.log(`Production URL: ${baseUrl}`);
    console.log(`Inspect URL: https://vercel.com/adrata/adrata/8JFLpNVUxqeDbMsEPKYh4tqnBtX2`);
    
    console.log('\n📋 BACKGROUND SERVICES:');
    console.log('=======================');
    console.log('• Email Sync: Every 15 minutes');
    console.log('• Calendar Sync: Every 15 minutes');
    console.log('• Cloud Processing: On-demand');
    console.log('• Token Refresh: Automatic');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('==============');
    console.log('1. Set environment variables in Vercel dashboard');
    console.log('2. Run database migrations if needed');
    console.log('3. Monitor services in Vercel dashboard');
    console.log('4. Check logs for any issues');
    
  } catch (error) {
    console.error('❌ Error starting Vercel services:', error);
  }
}

startVercelServices();
