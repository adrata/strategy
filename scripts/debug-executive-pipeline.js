#!/usr/bin/env node

/**
 * 🕵️ COMPREHENSIVE PIPELINE DEBUG
 * 
 * Traces every step of executive discovery to find where they're being lost
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function debugExecutivePipeline() {
  console.log('🕵️ COMPREHENSIVE PIPELINE DEBUG');
  console.log('=' .repeat(60));
  console.log('Tracing every step to find where executives are lost');
  console.log('');

  try {
    // STEP 1: Test Perplexity API directly
    console.log('🤖 STEP 1: Direct Perplexity AI Test');
    console.log('─'.repeat(40));
    
    const perplexityResult = await testPerplexityDirect();
    console.log(`   Result: ${perplexityResult ? 'SUCCESS' : 'FAILED'}`);
    
    if (perplexityResult) {
      console.log(`   📝 AI Response: "${perplexityResult}"`);
      
      // STEP 2: Test text parsing directly
      console.log('');
      console.log('📝 STEP 2: Text Parsing Test');
      console.log('─'.repeat(40));
      
      const parsedExecutives = parseTextDirectly(perplexityResult);
      console.log(`   Parsed: ${parsedExecutives.length} executives`);
      
      parsedExecutives.forEach((exec, index) => {
        console.log(`   ${index + 1}. ${exec.name} (${exec.role}) - ${exec.confidence}%`);
      });
      
      if (parsedExecutives.length > 0) {
        // STEP 3: Test ExecutiveContact conversion
        console.log('');
        console.log('🔄 STEP 3: ExecutiveContact Conversion Test');
        console.log('─'.repeat(40));
        
        const convertedContacts = convertToExecutiveContacts(parsedExecutives);
        console.log(`   Converted: ${convertedContacts.length} executive contacts`);
        
        convertedContacts.forEach((contact, index) => {
          console.log(`   ${index + 1}. ${contact.name} (${contact.role})`);
          console.log(`      ID: ${contact.id}`);
          console.log(`      Account ID: ${contact.accountId}`);
          console.log(`      Confidence: ${contact.confidenceScore}`);
        });
        
        if (convertedContacts.length > 0) {
          console.log('');
          console.log('✅ ALL STEPS WORKING - Issue must be in ResearchOrchestrator integration');
          console.log('');
          console.log('🔧 DIAGNOSIS: The pipeline works but there\'s a disconnect in integration');
          console.log('   - Perplexity AI: ✅ Finding executives');
          console.log('   - Text parsing: ✅ Extracting executives');  
          console.log('   - Conversion: ✅ Converting to ExecutiveContact');
          console.log('   - Issue: ❌ ResearchOrchestrator not receiving/processing results');
        }
      }
    }
    
    // STEP 4: Test the actual API endpoint response parsing
    console.log('');
    console.log('🌐 STEP 4: API Endpoint Response Analysis');
    console.log('─'.repeat(40));
    
    const apiResponse = await testAPIEndpointDirectly();
    console.log(`   API Response executives count: ${apiResponse?.executives?.length || 0}`);
    
    if (apiResponse?.executives?.length === 0 && perplexityResult) {
      console.log('');
      console.log('🚨 CRITICAL ISSUE IDENTIFIED:');
      console.log('   - Perplexity AI is finding executives');
      console.log('   - Text parsing works');
      console.log('   - But API returns 0 executives');
      console.log('   - This means there\'s an error in the ExecutiveResearchEnhanced integration');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

async function testPerplexityDirect() {
  try {
    const prompt = `Find the current senior executives and decision makers at Stewart Title (stewart.com) who would be involved in purchasing Legal Technology solutions.

FOCUS ON THESE KEY ROLES:
- Chief Executive Officer (CEO) / President
- Chief Operating Officer (COO)
- Chief Financial Officer (CFO) 
- General Counsel / Chief Legal Officer
- VP Operations / VP Finance / VP Legal

RETURN FORMAT - Simple list of current executives:
Name, Title
Name, Title

Example:
David Hisey, Chief Financial Officer
Sarah Johnson, Chief Operating Officer

REQUIREMENTS:
- Only current employees (not former)
- Include 3-5 key decision makers`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY?.replace(/\\n/g, '').trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    console.log(`   ❌ Perplexity test failed: ${error.message}`);
  }
  return null;
}

function parseTextDirectly(content) {
  const executives = [];
  
  // Use the same pattern as our fixed text parser
  const executivePatterns = [
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([^,\[\]\(\)\.]+)/g
  ];
  
  for (const pattern of executivePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let name = match[1]?.trim();
      let title = match[2]?.trim();
      
      if (name && title && name.length > 3 && title.length > 3) {
        const role = classifyRole(title);
        if (role) {
          executives.push({
            name: name,
            title: title,
            role: role,
            confidence: 85,
            source: 'ai_text_parsing'
          });
        }
      }
    }
  }
  
  return executives;
}

function classifyRole(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('chief financial officer') || titleLower.includes('cfo')) return 'CFO';
  if (titleLower.includes('chief executive officer') || titleLower.includes('ceo')) return 'CEO';
  if (titleLower.includes('chief operating officer') || titleLower.includes('coo')) return 'COO';
  if (titleLower.includes('general counsel') || titleLower.includes('chief legal')) return 'General_Counsel';
  if (titleLower.includes('president') && !titleLower.includes('vice')) return 'President';
  
  return null;
}

function convertToExecutiveContacts(candidates) {
  return candidates.map(candidate => ({
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    accountId: 'test_account',
    name: candidate.name,
    title: candidate.title,
    role: candidate.role,
    email: candidate.email,
    phone: candidate.phone,
    linkedinUrl: candidate.linkedinUrl,
    confidenceScore: candidate.confidence,
    researchMethods: [candidate.source],
    lastVerified: new Date(),
    isCurrent: true,
    selectionReasoning: `Found via AI research`
  }));
}

async function testAPIEndpointDirectly() {
  try {
    const response = await fetch('http://localhost:3000/api/intelligence/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'dano',
        'x-workspace-id': 'notary-everyday'
      },
      body: JSON.stringify({
        workspaceId: 'notary-everyday',
        userId: 'dano',
        accounts: [{
          name: 'Stewart Title',
          website: 'stewart.com',
          industry: 'Title Insurance',
          dealSize: 75000
        }],
        researchDepth: 'comprehensive',
        targetRoles: ['CEO', 'CFO', 'COO', 'General_Counsel', 'President']
      })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log(`   ❌ API test failed: ${error.message}`);
  }
  return null;
}

// Run the debug
if (require.main === module) {
  debugExecutivePipeline().catch(console.error);
}

module.exports = { debugExecutivePipeline };
