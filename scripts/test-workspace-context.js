const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testWorkspaceContext() {
  try {
    console.log('🔍 Testing workspace context resolution...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Create a JWT token exactly like the API would
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: userId,
      workspaceId: workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    console.log('🔐 Created JWT token');
    console.log('📊 Expected workspaceId:', workspaceId);
    console.log('👤 Expected userId:', userId);
    
    // Decode the token to verify
    const decoded = jwt.verify(token, secret);
    console.log('🔍 Decoded token:', {
      userId: decoded.userId,
      workspaceId: decoded.workspaceId,
      email: decoded.email
    });
    
    // Test the API with the token (add cache busting)
    const response = await fetch('http://localhost:3000/api/data/unified?cacheBust=' + Date.now(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    console.log('\n📡 API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response structure:', {
      success: data.success,
      hasData: !!data.data,
      leadsCount: data.data?.leads?.length || 0,
      counts: data.data?.counts
    });
    
    // Test with a specific section parameter
    console.log('\n🔍 Testing with currentSection=leads parameter...');
    
    const responseWithSection = await fetch('http://localhost:3000/api/data/unified?currentSection=leads', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    console.log('📡 Section API Response status:', responseWithSection.status);
    
    if (responseWithSection.ok) {
      const sectionData = await responseWithSection.json();
      console.log('✅ Section API Response:', {
        success: sectionData.success,
        leadsCount: sectionData.data?.leads?.length || 0,
        counts: sectionData.data?.counts
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing workspace context:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkspaceContext();
