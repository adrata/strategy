const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testContactsData() {
  try {
    console.log('🔍 Testing contacts data from API...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Create a JWT token
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: userId,
      workspaceId: workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    // Test the full API to get contacts data
    const response = await fetch('http://localhost:3000/api/data/unified?cacheBust=' + Date.now(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API request successful!');
    console.log(`📊 Found ${data.data?.contacts?.length || 0} contacts`);
    
    if (data.data?.contacts?.length > 0) {
      console.log('\n📋 Sample contacts from API:');
      const sampleContacts = data.data.contacts.slice(0, 10);
      sampleContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.fullName || 'No name'}`);
        console.log(`   Company: "${contact.company || 'null'}"`);
        console.log(`   Title: "${contact.title || 'null'}"`);
        console.log(`   AccountId: ${contact.accountId || 'null'}`);
        console.log(`   JobTitle: "${contact.jobTitle || 'null'}"`);
        console.log(`   ID: ${contact.id || 'null'}`);
        console.log('');
      });
    }
    
    // Also test the contacts section specifically
    console.log('\n🔍 Testing contacts section specifically...');
    const sectionResponse = await fetch('http://localhost:3000/api/data/unified?currentSection=contacts&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (sectionResponse.ok) {
      const sectionData = await sectionResponse.json();
      console.log('✅ Contacts section API successful!');
      console.log(`📊 Found ${sectionData.data?.contacts?.length || 0} contacts in section`);
      
      if (sectionData.data?.contacts?.length > 0) {
        console.log('\n📋 Sample contacts from section API:');
        const sectionContacts = sectionData.data.contacts.slice(0, 5);
        sectionContacts.forEach((contact, index) => {
          console.log(`${index + 1}. ${contact.fullName || 'No name'} - Company: "${contact.company || 'null'}" - AccountId: ${contact.accountId || 'null'}`);
        });
      }
    }
    
    // Test speedrun data
    console.log('\n🔍 Testing speedrun data...');
    const speedrunResponse = await fetch('http://localhost:3000/api/data/unified?currentSection=speedrun&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (speedrunResponse.ok) {
      const speedrunData = await speedrunResponse.json();
      console.log('✅ Speedrun section API successful!');
      console.log(`📊 Found ${speedrunData.data?.speedrunItems?.length || 0} speedrun items`);
      
      if (speedrunData.data?.speedrunItems?.length > 0) {
        console.log('\n📋 Sample speedrun items:');
        const speedrunItems = speedrunData.data.speedrunItems.slice(0, 5);
        speedrunItems.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name || 'No name'} - Company: "${item.company || 'null'}" - Type: ${item.type || 'null'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing contacts data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContactsData();
