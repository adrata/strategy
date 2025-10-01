require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAllClaudeIntegrations() {
  try {
    console.log('🧪 Testing All Claude Integrations...\n');
    
    // Test 1: Basic Claude API
    console.log('1️⃣ Testing Basic Claude API...');
    const { Anthropic } = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const basicResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 50,
      temperature: 0.3,
      messages: [{ role: 'user', content: 'Test basic Claude API. Respond with "Basic API working".' }]
    });
    console.log('✅ Basic Claude API:', basicResponse.content[0].text);
    
    // Test 2: Intelligence Generation API
    console.log('\n2️⃣ Testing Intelligence Generation API...');
    const aaronId = '01K5D60X0GVPX2GG0D954KQ84R';
    const aaronWorkspace = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    const intelligenceResponse = await fetch('http://localhost:3000/api/intelligence/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: aaronId,
        recordType: 'people',
        workspaceId: aaronWorkspace
      })
    });
    
    if (intelligenceResponse.ok) {
      const intelligenceData = await intelligenceResponse.json();
      console.log('✅ Intelligence API:', intelligenceData.intelligenceProfile.influenceLevel);
    } else {
      console.log('❌ Intelligence API failed:', intelligenceResponse.status);
    }
    
    // Test 3: Company Intelligence API
    console.log('\n3️⃣ Testing Company Intelligence API...');
    const companyResponse = await fetch('http://localhost:3000/api/companies/01K5D5TE2CN4JJNEPMWKPAV76N/intelligence', {
      method: 'GET'
    });
    
    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      console.log('✅ Company Intelligence API:', companyData.intelligence ? 'Generated' : 'Not generated');
    } else {
      console.log('❌ Company Intelligence API failed:', companyResponse.status);
    }
    
    // Test 4: Enhanced AI API
    console.log('\n4️⃣ Testing Enhanced AI API...');
    const enhancedResponse = await fetch('http://localhost:3000/api/ai/enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Test enhanced AI with claude-sonnet-4-5',
        context: { company: 'Test Company', industry: 'Technology' },
        options: { temperature: 0.3, maxTokens: 100 }
      })
    });
    
    if (enhancedResponse.ok) {
      const enhancedData = await enhancedResponse.json();
      console.log('✅ Enhanced AI API:', enhancedData.response ? 'Generated' : 'Not generated');
    } else {
      console.log('❌ Enhanced AI API failed:', enhancedResponse.status);
    }
    
    // Test 5: Unified Intelligence API
    console.log('\n5️⃣ Testing Unified Intelligence API...');
    const unifiedResponse = await fetch('http://localhost:3000/api/intelligence/unified?workspaceId=01K5D01YCQJ9TJ7CT4DZDE79T1&userId=01K1VBYZG41K9QA0D9CF06KNRG', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depth: 'thorough',
        type: 'research',
        target: {
          company: 'Test Company',
          accountId: 'test-account',
          query: 'Test unified intelligence'
        },
        options: {
          includeBuyerGroups: true,
          includeIndustryAnalysis: true
        }
      })
    });
    
    if (unifiedResponse.ok) {
      const unifiedData = await unifiedResponse.json();
      console.log('✅ Unified Intelligence API:', unifiedData.intelligence ? 'Generated' : 'Not generated');
    } else {
      console.log('❌ Unified Intelligence API failed:', unifiedResponse.status);
    }
    
    console.log('\n🎉 All Claude Integration Tests Completed!');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAllClaudeIntegrations();
