#!/usr/bin/env node

/**
 * 🧪 TEXT PARSING TEST
 * 
 * Tests our text parsing with the exact response from Perplexity
 */

// Simulate the exact response from debug
const TEST_RESPONSE = "David Hisey, Chief Financial Officer[1][3].";
const COMPANY_NAME = "Stewart Title";

// Simulate the text parsing logic
function parseTextResponse(content, companyName) {
  const executives = [];
  
  console.log(`📝 [TEXT PARSER] Parsing: "${content}"`);
  
  // Handle simple responses like "David Hisey, Chief Financial Officer[1][3]."
  const executivePatterns = [
    // "David Hisey, Chief Financial Officer"
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([^,\[\]\(\)\.]+)/g,
    // "David Hisey - Chief Financial Officer"  
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–]\s*([^,\[\]\(\)\.]+)/g,
    // "David Hisey: Chief Financial Officer"
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:\s*([^,\[\]\(\)\.]+)/g
  ];
  
  for (const pattern of executivePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let name = match[1]?.trim();
      let title = match[2]?.trim();
      
      console.log(`   🔍 Pattern match: name="${name}", title="${title}"`);
      
      if (name && title && name.length > 3 && title.length > 3) {
        // Simulate role detection
        const role = classifyRole(title);
        if (role) {
          executives.push({
            name: name,
            title: title,
            role: role,
            confidence: 85,
            source: 'ai_text_parsing',
            reasoning: `Found via AI research for ${companyName}`
          });
          
          console.log(`   ✅ Parsed: ${name} (${title}) → ${role}`);
        }
      }
    }
  }
  
  console.log(`   📝 Text parsing found ${executives.length} executives`);
  return executives;
}

function classifyRole(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('chief financial officer') || titleLower.includes('cfo')) {
    return 'CFO';
  }
  if (titleLower.includes('chief executive officer') || titleLower.includes('ceo')) {
    return 'CEO';
  }
  if (titleLower.includes('chief operating officer') || titleLower.includes('coo')) {
    return 'COO';
  }
  if (titleLower.includes('general counsel') || titleLower.includes('chief legal')) {
    return 'General_Counsel';
  }
  if (titleLower.includes('president') && !titleLower.includes('vice')) {
    return 'President';
  }
  
  return null;
}

console.log('🧪 TEXT PARSING TEST');
console.log('=' .repeat(50));
console.log(`Input: "${TEST_RESPONSE}"`);
console.log(`Company: ${COMPANY_NAME}`);
console.log('');

const result = parseTextResponse(TEST_RESPONSE, COMPANY_NAME);

console.log('');
console.log('📊 RESULTS:');
console.log(`Executives found: ${result.length}`);

if (result.length > 0) {
  result.forEach((exec, index) => {
    console.log(`${index + 1}. ${exec.name} (${exec.role})`);
    console.log(`   Title: ${exec.title}`);
    console.log(`   Confidence: ${exec.confidence}%`);
  });
  console.log('');
  console.log('✅ TEXT PARSING WORKING!');
} else {
  console.log('❌ TEXT PARSING FAILED - No executives extracted');
  
  console.log('');
  console.log('🔧 DEBUGGING:');
  console.log('Testing regex patterns manually...');
  
  const patterns = [
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([^,\[\]\(\)\.]+)/g
  ];
  
  patterns.forEach((pattern, index) => {
    const matches = [...TEST_RESPONSE.matchAll(pattern)];
    console.log(`Pattern ${index + 1}: ${matches.length} matches`);
    matches.forEach(match => {
      console.log(`  Match: "${match[1]}" | "${match[2]}"`);
    });
  });
}
