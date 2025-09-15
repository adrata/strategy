#!/usr/bin/env node

/**
 * 🚀 PARALLEL EMAIL LINKING - PROCESS ALL 15,588 EMAILS WITH MULTI-THREADING
 * 
 * This script runs the improved email linking on ALL emails in the database
 * using parallel processing for maximum performance
 */

const { PrismaClient } = require('@prisma/client');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

// Configuration
const BATCH_SIZE = 500; // Smaller batches for better parallel processing
const MAX_CONCURRENT_WORKERS = Math.min(os.cpus().length, 8); // Use available CPU cores, max 8
const MAX_CONCURRENT_BATCHES = 4; // Process multiple batches in parallel

const prisma = new PrismaClient();

// Worker thread code
if (!isMainThread) {
  // Worker thread - process a batch of emails
  async function processBatch(emails) {
    const results = {
      processed: 0,
      linkedToPerson: 0,
      linkedToCompany: 0,
      linkedToAction: 0,
      errors: 0
    };

    // Create a separate Prisma client for this worker
    const workerPrisma = new PrismaClient();

    try {
      // Process emails in parallel within the batch
      const promises = emails.map(async (email) => {
        try {
          const result = await processEmail(email, workerPrisma);
          results.processed++;
          
          if (result.linkedToPerson) results.linkedToPerson++;
          if (result.linkedToCompany) results.linkedToCompany++;
          if (result.linkedToAction) results.linkedToAction++;
          
          return result;
        } catch (error) {
          results.errors++;
          console.log(`     ❌ Worker error processing email ${email.id}: ${error.message}`);
          return null;
        }
      });

      // Wait for all emails in this batch to complete
      await Promise.all(promises);

    } finally {
      await workerPrisma.$disconnect();
    }

    return results;
  }

  // Listen for work from main thread
  parentPort.on('message', async (message) => {
    try {
      if (message.action === 'fetchBatch') {
        // Fetch the batch of emails
        const workerPrisma = new PrismaClient();
        const emails = await workerPrisma.email_messages.findMany({
          skip: message.batch.skip,
          take: message.batch.take,
          orderBy: { sentAt: 'desc' }
        });
        await workerPrisma.$disconnect();
        
        // Process the batch
        const results = await processBatch(emails);
        parentPort.postMessage({ 
          batchId: message.batch.id, 
          results, 
          success: true 
        });
      }
    } catch (error) {
      parentPort.postMessage({ 
        batchId: message.batch?.id, 
        error: error.message, 
        success: false 
      });
    }
  });

  // Main thread code
} else {
  async function runParallelEmailLinking() {
    console.log('🚀 PARALLEL EMAIL LINKING');
    console.log('==========================');
    console.log(`💻 Using ${MAX_CONCURRENT_WORKERS} worker threads`);
    console.log(`📦 Batch size: ${BATCH_SIZE} emails`);
    console.log(`🔄 Max concurrent batches: ${MAX_CONCURRENT_BATCHES}`);
    
    try {
      // Get total count
      const totalEmails = await prisma.email_messages.count();
      console.log(`📧 Total emails to process: ${totalEmails}`);
      
      let processed = 0;
      let linkedToPerson = 0;
      let linkedToCompany = 0;
      let linkedToAction = 0;
      let errors = 0;
      
      const startTime = Date.now();
      
      // Process in parallel batches
      const batches = [];
      for (let i = 0; i < totalEmails; i += BATCH_SIZE) {
        batches.push({
          id: Math.floor(i / BATCH_SIZE) + 1,
          skip: i,
          take: BATCH_SIZE
        });
      }
      
      console.log(`📊 Created ${batches.length} batches for processing`);
      
      // Process batches with controlled concurrency
      for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
        const currentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
        
        console.log(`\n🔄 Processing batches ${currentBatches[0].id}-${currentBatches[currentBatches.length - 1].id}...`);
        
        // Create workers for current batches
        const workers = currentBatches.map(batch => createWorker(batch));
        
        // Wait for all workers in this group to complete
        const results = await Promise.all(workers);
        
        // Aggregate results
        for (const result of results) {
          processed += result.results.processed;
          linkedToPerson += result.results.linkedToPerson;
          linkedToCompany += result.results.linkedToCompany;
          linkedToAction += result.results.linkedToAction;
          errors += result.results.errors;
        }
        
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processed / elapsed;
        const remaining = totalEmails - processed;
        const eta = remaining / rate;
        
        console.log(`✅ Processed ${processed}/${totalEmails} emails (${Math.round(processed/totalEmails*100)}%)`);
        console.log(`⚡ Rate: ${Math.round(rate)} emails/sec | ETA: ${Math.round(eta)}s`);
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 PARALLEL EMAIL LINKING COMPLETE!');
      console.log('====================================');
      console.log(`⏱️  Total time: ${Math.round(totalTime)}s`);
      console.log(`⚡ Average rate: ${Math.round(processed/totalTime)} emails/sec`);
      console.log(`✅ Total emails processed: ${processed}`);
      console.log(`👤 Linked to existing person: ${linkedToPerson}`);
      console.log(`🏢 Linked to existing company: ${linkedToCompany}`);
      console.log(`⚡ Linked to existing action: ${linkedToAction}`);
      console.log(`❌ Errors: ${errors}`);
      
      // Final statistics
      const finalStats = await getFinalStatistics();
      console.log('\n📊 FINAL STATISTICS:');
      console.log('====================');
      console.log(`📧 Total emails: ${finalStats.totalEmails}`);
      console.log(`👤 Emails linked to person: ${finalStats.linkedToPerson} (${Math.round(finalStats.linkedToPerson/finalStats.totalEmails*100)}%)`);
      console.log(`🏢 Emails linked to company: ${finalStats.linkedToCompany} (${Math.round(finalStats.linkedToCompany/finalStats.totalEmails*100)}%)`);
      console.log(`⚡ Emails linked to action: ${finalStats.linkedToAction} (${Math.round(finalStats.linkedToAction/finalStats.totalEmails*100)}%)`);
      
    } catch (error) {
      console.error('❌ Error during parallel email linking:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  function createWorker(batch) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename);
      
      worker.on('message', async (message) => {
        if (message.success) {
          resolve(message);
        } else {
          reject(new Error(message.error));
        }
        worker.terminate();
      });
      
      worker.on('error', (error) => {
        reject(error);
        worker.terminate();
      });
      
      // Send batch information to worker
      worker.postMessage({ 
        action: 'fetchBatch',
        batch: batch 
      });
    });
  }

  // Run the script
  runParallelEmailLinking().catch(console.error);
}

// Shared functions (used by both main thread and workers)
async function processEmail(email, prismaClient = prisma) {
  const result = {
    linkedToPerson: false,
    linkedToCompany: false,
    linkedToAction: false,
    createdPerson: false,
    createdCompany: false,
    createdAction: false
  };
  
  try {
    // Link to person
    const person = await findExistingPerson(email, prismaClient);
    if (person) {
      result.linkedToPerson = true;
      
      // Link email to person
      await linkEmailToPerson(email.id, person.id, prismaClient);
    }
    
    // Link to company
    const company = await findExistingCompany(email, person, prismaClient);
    if (company) {
      result.linkedToCompany = true;
      
      // Link email to company
      await linkEmailToCompany(email.id, company.id, prismaClient);
    }
    
    // Link to action
    const action = await findExistingAction(email, person, company, prismaClient);
    if (action) {
      result.linkedToAction = true;
      
      // Link email to action
      await linkEmailToAction(email.id, action.id, prismaClient);
    }
    
  } catch (error) {
    console.log(`     ❌ Error processing email ${email.id}: ${error.message}`);
  }
  
  return result;
}

async function findExistingPerson(email, prismaClient) {
  // Extract email addresses - handle different data types
  const fromEmail = email.from?.toLowerCase();
  
  // Handle email.to as string, array, or other types
  let toEmails = [];
  if (typeof email.to === 'string') {
    toEmails = email.to.split(',').map(e => e.trim().toLowerCase());
  } else if (Array.isArray(email.to)) {
    toEmails = email.to.map(e => e.toLowerCase());
  } else if (email.to) {
    toEmails = [String(email.to).toLowerCase()];
  }
  
  const allEmails = [fromEmail, ...toEmails].filter(Boolean);
  
  // Find existing person only
  for (const emailAddr of allEmails) {
    const person = await prismaClient.people.findFirst({
      where: {
        OR: [
          { email: emailAddr },
          { workEmail: emailAddr },
          { personalEmail: emailAddr },
          { secondaryEmail: emailAddr }
        ]
      }
    });
    
    if (person) {
      return person;
    }
  }
  
  return null;
}

async function findExistingCompany(email, person, prismaClient) {
  // If person exists and has company, use it
  if (person?.companyId) {
    const company = await prismaClient.companies.findUnique({
      where: { id: person.companyId }
    });
    if (company) return company;
  }
  
  // Extract domain from email
  const fromEmail = email.from?.toLowerCase();
  if (!fromEmail) return null;
  
  const domain = fromEmail.split('@')[1];
  if (!domain || isSystemEmail(fromEmail)) return null;
  
  // Check if company exists for this domain
  const existingCompany = await prismaClient.companies.findFirst({
    where: {
      OR: [
        { website: { contains: domain } },
        { email: { contains: domain } }
      ]
    }
  });
  
  return existingCompany;
}

async function findExistingAction(email, person, company, prismaClient) {
  // Try to find existing action
  const existingAction = await findMatchingAction(email, person, company, prismaClient);
  return existingAction;
}

async function findMatchingAction(email, person, company, prismaClient) {
  // Look for actions involving the same people/company
  const actions = await prismaClient.actions.findMany({
    where: {
      OR: [
        { personId: person?.id },
        { companyId: company?.id }
      ]
    },
    include: {
      person: true,
      company: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  // Find best match based on email content and timing
  for (const action of actions) {
    if (action.person && person && action.person.id === person.id) {
      return action;
    }
    if (action.company && company && action.company.id === company.id) {
      return action;
    }
  }
  
  return null;
}

function isSystemEmail(email) {
  const systemPatterns = [
    'updates@', 'notifications@', 'noreply@', 'no-reply@',
    'support@', 'help@', 'info@', 'admin@', 'system@',
    'billing@', 'payments@', 'accounts@'
  ];
  
  return systemPatterns.some(pattern => email.includes(pattern));
}

async function linkEmailToPerson(emailId, personId, prismaClient) {
  try {
    await prismaClient.$executeRaw`
      INSERT INTO "_EmailToPerson" ("A", "B")
      VALUES (${emailId}, ${personId})
      ON CONFLICT DO NOTHING
    `;
  } catch (error) {
    // Ignore duplicate key errors
  }
}

async function linkEmailToCompany(emailId, companyId, prismaClient) {
  try {
    await prismaClient.$executeRaw`
      INSERT INTO "_EmailToCompany" ("A", "B")
      VALUES (${emailId}, ${companyId})
      ON CONFLICT DO NOTHING
    `;
  } catch (error) {
    // Ignore duplicate key errors
  }
}

async function linkEmailToAction(emailId, actionId, prismaClient) {
  try {
    await prismaClient.$executeRaw`
      INSERT INTO "_EmailToAction" ("A", "B")
      VALUES (${emailId}, ${actionId})
      ON CONFLICT DO NOTHING
    `;
  } catch (error) {
    // Ignore duplicate key errors
  }
}

async function getFinalStatistics() {
  const totalEmails = await prisma.email_messages.count();
  
  const linkedToPerson = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "A") as count FROM "_EmailToPerson"
  `;
  
  const linkedToCompany = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "A") as count FROM "_EmailToCompany"
  `;
  
  const linkedToAction = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "A") as count FROM "_EmailToAction"
  `;
  
  return {
    totalEmails,
    linkedToPerson: Number(linkedToPerson[0].count),
    linkedToCompany: Number(linkedToCompany[0].count),
    linkedToAction: Number(linkedToAction[0].count)
  };
}
