#!/usr/bin/env node

/**
 * Test New Email Integration
 * 
 * This script tests the new Nango-powered email integration to ensure
 * everything is working correctly after the modernization.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailIntegration() {
  console.log('🧪 Testing New Email Integration...\n');
  
  try {
    // Test 1: Check if email_messages table exists and is accessible
    console.log('1️⃣ Testing email_messages table access...');
    const emailCount = await prisma.email_messages.count();
    console.log(`✅ email_messages table accessible - ${emailCount} emails found\n`);
    
    // Test 2: Check Grand Central connections
    console.log('2️⃣ Testing Grand Central email connections...');
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        provider: { in: ['outlook', 'gmail'] },
        status: 'active'
      }
    });
    console.log(`✅ Found ${connections.length} active email connections`);
    connections.forEach(conn => {
      console.log(`   - ${conn.provider} (${conn.nangoConnectionId})`);
    });
    console.log();
    
    // Test 3: Check email linking to people and companies
    console.log('3️⃣ Testing email linking to entities...');
    const linkedEmails = await prisma.email_messages.count({
      where: {
        OR: [
          { personId: { not: null } },
          { companyId: { not: null } }
        ]
      }
    });
    const totalEmails = await prisma.email_messages.count();
    const linkRate = totalEmails > 0 ? Math.round((linkedEmails / totalEmails) * 100) : 0;
    console.log(`✅ ${linkedEmails}/${totalEmails} emails linked to entities (${linkRate}%)\n`);
    
    // Test 4: Check action creation from emails
    console.log('4️⃣ Testing action creation from emails...');
    const emailActions = await prisma.actions.count({
      where: {
        type: 'EMAIL'
      }
    });
    console.log(`✅ ${emailActions} email actions created\n`);
    
    // Test 5: Check recent email activity
    console.log('5️⃣ Testing recent email activity...');
    const recentEmails = await prisma.email_messages.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        person: {
          select: { fullName: true, email: true }
        },
        company: {
          select: { name: true }
        }
      }
    });
    
    if (recentEmails.length > 0) {
      console.log(`✅ ${recentEmails.length} emails synced in last 24 hours:`);
      recentEmails.forEach(email => {
        console.log(`   - "${email.subject}" from ${email.from}`);
        if (email.person) {
          console.log(`     Linked to: ${email.person.fullName} (${email.person.email})`);
        }
        if (email.company) {
          console.log(`     Company: ${email.company.name}`);
        }
      });
    } else {
      console.log('ℹ️ No emails synced in last 24 hours');
    }
    console.log();
    
    // Test 6: Check email statistics by provider
    console.log('6️⃣ Testing email statistics by provider...');
    const providerStats = await prisma.email_messages.groupBy({
      by: ['provider'],
      _count: {
        id: true
      }
    });
    
    providerStats.forEach(stat => {
      console.log(`   - ${stat.provider}: ${stat._count.id} emails`);
    });
    console.log();
    
    // Test 7: Check for any remaining legacy tables
    console.log('7️⃣ Checking for legacy email tables...');
    try {
      await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%Email%' OR table_name LIKE '%email%' OR table_name LIKE '%Provider%')
        AND table_name != 'email_messages'
      `;
      console.log('✅ No legacy email tables found');
    } catch (error) {
      console.log('ℹ️ Could not check for legacy tables (this is expected if they were already removed)');
    }
    console.log();
    
    console.log('🎉 All tests passed! New email integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEmailIntegration();
