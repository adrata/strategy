#!/usr/bin/env node

/**
 * Chronicle Report Scheduler
 * 
 * This script generates Chronicle reports at scheduled times:
 * - Daily reports: 5:00 AM local time
 * - Weekly reports: Friday 5:00 AM local time  
 * - Bi-weekly reports: Every other Friday 5:00 AM local time
 * 
 * Usage:
 * node scripts/chronicle-scheduler.js [reportType] [workspaceId]
 * 
 * Or run with cron:
 * 0 5 * * * node /path/to/scripts/chronicle-scheduler.js DAILY cmezxb1ez0001pc94yry3ntjk
 * 0 5 * * 5 node /path/to/scripts/chronicle-scheduler.js WEEKLY cmezxb1ez0001pc94yry3ntjk
 * 0 5 */14 * 5 node /path/to/scripts/chronicle-scheduler.js BIWEEKLY cmezxb1ez0001pc94yry3ntjk
 */

const https = require('https');
const http = require('http');

// Configuration
const NOTARY_EVERYDAY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function generateReport(reportType, workspaceId) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/api/v1/chronicle/scheduler`;
    const data = JSON.stringify({
      reportType,
      workspaceId
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = (url.startsWith('https') ? https : http).request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.error || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

async function checkSchedulerStatus(workspaceId) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/api/v1/chronicle/scheduler?workspaceId=${workspaceId}`;

    const req = (url.startsWith('https') ? https : http).get(url, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.error || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
  });
}

function getCurrentTimeInfo() {
  const now = new Date();
  const localTime = now.toLocaleString('en-US', {
    timeZone: 'America/New_York', // Adjust timezone as needed
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    timestamp: now.toISOString(),
    localTime,
    dayOfWeek: now.getDay(), // 0 = Sunday, 5 = Friday
    hour: now.getHours(),
    minute: now.getMinutes()
  };
}

function shouldGenerateReport(reportType, timeInfo) {
  const { dayOfWeek, hour, minute } = timeInfo;

  switch (reportType) {
    case 'DAILY':
      // Generate daily at 5:00 AM
      return hour === 5 && minute === 0;
    
    case 'WEEKLY':
      // Generate weekly on Friday at 5:00 AM
      return dayOfWeek === 5 && hour === 5 && minute === 0;
    
    case 'BIWEEKLY':
      // Generate bi-weekly every other Friday at 5:00 AM
      // This is a simplified check - in production you'd want more sophisticated logic
      return dayOfWeek === 5 && hour === 5 && minute === 0;
    
    default:
      return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const reportType = args[0] || 'DAILY';
  const workspaceId = args[1] || NOTARY_EVERYDAY_WORKSPACE_ID;

  const timeInfo = getCurrentTimeInfo();

  console.log('🕐 Chronicle Scheduler');
  console.log('====================');
  console.log(`Time: ${timeInfo.localTime}`);
  console.log(`Report Type: ${reportType}`);
  console.log(`Workspace ID: ${workspaceId}`);
  console.log('');

  // Check if we should generate this report type at this time
  if (!shouldGenerateReport(reportType, timeInfo)) {
    console.log(`⏰ Not the right time for ${reportType} report generation`);
    console.log(`Expected: 5:00 AM ${reportType === 'WEEKLY' || reportType === 'BIWEEKLY' ? 'on Friday' : 'daily'}`);
    return;
  }

  try {
    console.log(`🚀 Generating ${reportType} Chronicle reports...`);
    
    const result = await generateReport(reportType, workspaceId);
    
    console.log('✅ Report generation completed successfully!');
    console.log(`📊 Generated reports for ${result.results.filter(r => r.success).length} users`);
    
    if (result.results.some(r => !r.success)) {
      console.log('\n❌ Some reports failed:');
      result.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.userEmail}: ${r.error}`));
    }

    // Check scheduler status
    console.log('\n📈 Checking scheduler status...');
    const status = await checkSchedulerStatus(workspaceId);
    console.log(`📋 Recent reports: ${status.totalReports} in last 7 days`);

  } catch (error) {
    console.error('❌ Error generating reports:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  generateReport,
  checkSchedulerStatus,
  shouldGenerateReport
};

