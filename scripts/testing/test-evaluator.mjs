/**
 * Test script for Content Quality Evaluator (ES Module version)
 */

// Define the evaluation functions inline for testing
const WEIGHTS = {
  email: {
    clarity: 0.20,
    personalization: 0.25,
    professionalism: 0.20,
    actionability: 0.15,
    brevity: 0.10,
    relevance: 0.10
  },
  linkedin: {
    clarity: 0.15,
    personalization: 0.30,
    professionalism: 0.15,
    actionability: 0.15,
    brevity: 0.15,
    relevance: 0.10
  },
  text: {
    clarity: 0.25,
    personalization: 0.15,
    professionalism: 0.10,
    actionability: 0.20,
    brevity: 0.20,
    relevance: 0.10
  },
  advice: {
    clarity: 0.25,
    personalization: 0.10,
    professionalism: 0.15,
    actionability: 0.25,
    brevity: 0.10,
    relevance: 0.15
  }
};

function evaluateClarity(content) {
  let score = 100;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 30);
  score -= longSentences.length * 10;
  
  const jargonWords = ['synergy', 'leverage', 'paradigm', 'holistic', 'proactive', 'bandwidth', 'circle back'];
  const jargonCount = jargonWords.reduce((count, word) => 
    count + (content.toLowerCase().match(new RegExp(word, 'gi')) || []).length, 0
  );
  score -= jargonCount * 8;
  
  return Math.max(0, Math.min(100, score));
}

function evaluatePersonalization(content, context) {
  let score = 50;
  if (!context) return score;
  
  const lowerContent = content.toLowerCase();
  
  if (context.recipientName) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    if (lowerContent.includes(firstName)) score += 20;
  }
  
  if (context.recipientCompany) {
    if (lowerContent.includes(context.recipientCompany.toLowerCase())) score += 15;
  }
  
  const genericOpenings = ['dear sir', 'to whom it may concern'];
  if (genericOpenings.some(opening => lowerContent.startsWith(opening))) score -= 30;
  
  return Math.max(0, Math.min(100, score));
}

function evaluateProfessionalism(content, contentType) {
  let score = 100;
  const lowerContent = content.toLowerCase();
  
  const unprofessionalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'ya', 'yep', 'nope', 'lol', 'omg'];
  const unprofessionalCount = unprofessionalWords.reduce((count, word) => 
    count + (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  score -= unprofessionalCount * 10;
  
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 2) score -= (exclamationCount - 2) * 5;
  
  const hasGreeting = /^(hi|hello|hey|dear|good morning|good afternoon)/i.test(content.trim());
  if (hasGreeting) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function evaluateActionability(content) {
  let score = 50;
  const lowerContent = content.toLowerCase();
  
  const actionPhrases = ['let me know', 'would you be', 'can we', 'could we', 'schedule', 'call', 'meet', 'discuss'];
  const actionCount = actionPhrases.reduce((count, phrase) => 
    count + (lowerContent.includes(phrase) ? 1 : 0), 0
  );
  score += Math.min(actionCount * 15, 40);
  
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount >= 1 && questionCount <= 3) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function evaluateBrevity(content, contentType) {
  const wordCount = content.split(/\s+/).length;
  const idealRanges = {
    email: { min: 50, max: 200, ideal: 100 },
    linkedin: { min: 30, max: 150, ideal: 75 },
    text: { min: 10, max: 50, ideal: 25 },
    advice: { min: 50, max: 300, ideal: 150 }
  };
  
  const range = idealRanges[contentType] || idealRanges.email;
  
  if (wordCount >= range.min && wordCount <= range.max) {
    const distanceFromIdeal = Math.abs(wordCount - range.ideal);
    const maxDistance = Math.max(range.ideal - range.min, range.max - range.ideal);
    return Math.round(100 - (distanceFromIdeal / maxDistance) * 30);
  } else if (wordCount < range.min) {
    return Math.max(30, 70 - (range.min - wordCount) * 2);
  } else {
    return Math.max(20, 70 - (wordCount - range.max) * 0.5);
  }
}

function evaluateRelevance(content, context) {
  if (!context?.purpose) return 70;
  
  let score = 70;
  const lowerContent = content.toLowerCase();
  
  const purposeKeywords = {
    'cold outreach': ['reaching out', 'connect', 'noticed', 'impressed', 'interested'],
    'follow-up': ['following up', 'checking in', 'last', 'previous', 'discussed'],
    'meeting request': ['schedule', 'meet', 'call', 'time', 'available']
  };
  
  const keywords = purposeKeywords[context.purpose] || [];
  const matchCount = keywords.reduce((count, keyword) => 
    count + (lowerContent.includes(keyword) ? 1 : 0), 0
  );
  score += Math.min(matchCount * 10, 30);
  
  return Math.max(0, Math.min(100, score));
}

function evaluateContentFast(content, contentType, context) {
  const breakdown = {
    clarity: evaluateClarity(content),
    personalization: evaluatePersonalization(content, context),
    professionalism: evaluateProfessionalism(content, contentType),
    actionability: evaluateActionability(content),
    brevity: evaluateBrevity(content, contentType),
    relevance: evaluateRelevance(content, context)
  };

  const weights = WEIGHTS[contentType] || WEIGHTS.email;
  const overall = Math.round(
    breakdown.clarity * weights.clarity +
    breakdown.personalization * weights.personalization +
    breakdown.professionalism * weights.professionalism +
    breakdown.actionability * weights.actionability +
    breakdown.brevity * weights.brevity +
    breakdown.relevance * weights.relevance
  );

  return { overall, breakdown, contentType };
}

function getQualityLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

// ============ RUN TESTS ============

console.log('\n🎯 CONTENT QUALITY EVALUATOR TEST\n');
console.log('='.repeat(60));

// Test 1: Good cold outreach email
const email1 = `Hi Sarah,

I noticed your recent post about scaling SaaS operations at TechCorp and wanted to reach out. 

At Adrata, we help companies streamline their compliance workflows, which I think could be valuable for your team's growth plans.

Would you be open to a quick 15-minute call next week to discuss?

Best regards,
Ross`;

console.log('\n📧 TEST 1: Good Cold Outreach Email');
console.log('-'.repeat(40));
const score1 = evaluateContentFast(email1, 'email', {
  recipientName: 'Sarah Johnson',
  recipientCompany: 'TechCorp',
  purpose: 'cold outreach'
});
console.log(`Score: ${score1.overall}/100 (${getQualityLabel(score1.overall)})`);
console.log('Breakdown:', score1.breakdown);

// Test 2: Poor email
const email2 = `Hey,

Just wanted to circle back and touch base about leveraging synergies. We should probably hop on a call ASAP to discuss the paradigm shift in our holistic approach!!!

Ya know what I mean? LOL

- sent from my iPhone`;

console.log('\n📧 TEST 2: Poor Email (Jargon, Unprofessional)');
console.log('-'.repeat(40));
const score2 = evaluateContentFast(email2, 'email', {});
console.log(`Score: ${score2.overall}/100 (${getQualityLabel(score2.overall)})`);
console.log('Breakdown:', score2.breakdown);

// Test 3: LinkedIn message
const linkedin = `Hi Mike! I came across your profile and was impressed by your work at Google. I'm building something in the AI space that might interest you. Would love to connect and share ideas - are you open to a quick chat?`;

console.log('\n💼 TEST 3: LinkedIn Connection Message');
console.log('-'.repeat(40));
const score3 = evaluateContentFast(linkedin, 'linkedin', {
  recipientName: 'Mike Chen',
  recipientCompany: 'Google',
  purpose: 'cold outreach'
});
console.log(`Score: ${score3.overall}/100 (${getQualityLabel(score3.overall)})`);
console.log('Breakdown:', score3.breakdown);

// Test 4: Text message
const textMsg = `Hey! Quick check - are we still on for the demo tomorrow at 2pm? Let me know if you need to reschedule.`;

console.log('\n📱 TEST 4: Text Message');
console.log('-'.repeat(40));
const score4 = evaluateContentFast(textMsg, 'text', {});
console.log(`Score: ${score4.overall}/100 (${getQualityLabel(score4.overall)})`);
console.log('Breakdown:', score4.breakdown);

// Summary table
console.log('\n\n' + '='.repeat(60));
console.log('📊 SUMMARY TABLE');
console.log('='.repeat(60));
console.log(`
| Test | Type     | Score | Label       |
|------|----------|-------|-------------|
| 1    | Email    | ${String(score1.overall).padStart(3)}   | ${getQualityLabel(score1.overall).padEnd(11)} |
| 2    | Email    | ${String(score2.overall).padStart(3)}   | ${getQualityLabel(score2.overall).padEnd(11)} |
| 3    | LinkedIn | ${String(score3.overall).padStart(3)}   | ${getQualityLabel(score3.overall).padEnd(11)} |
| 4    | Text     | ${String(score4.overall).padStart(3)}   | ${getQualityLabel(score4.overall).padEnd(11)} |
`);

console.log('✅ All tests completed!\n');

