/**
 * Test script for Content Quality Evaluator
 */

import { 
  evaluateContentFast, 
  formatScoreBreakdown, 
  getQualityLabel 
} from '../../src/platform/ai/services/ContentQualityEvaluator';

console.log('\n🎯 CONTENT QUALITY EVALUATOR TEST\n');
console.log('='.repeat(60));

// Test 1: Good cold outreach email
const email1 = `Hi Sarah,

I noticed your recent post about scaling SaaS operations at TechCorp and wanted to reach out. 

At Adrata, we help companies streamline their compliance workflows, which I think could be valuable for your team's growth plans.

Would you be open to a quick 15-minute call next week to discuss?

Best regards,
Ross`;

const context1 = {
  recipientName: 'Sarah Johnson',
  recipientCompany: 'TechCorp',
  recipientTitle: 'VP of Operations',
  purpose: 'cold outreach'
};

console.log('\n📧 TEST 1: Good Cold Outreach Email');
console.log('-'.repeat(40));
const score1 = evaluateContentFast(email1, 'email', context1);
console.log(formatScoreBreakdown(score1));

// Test 2: Poor email with jargon
const email2 = `Hey,

Just wanted to circle back and touch base about leveraging synergies. We should probably hop on a call ASAP to discuss the paradigm shift in our holistic approach!!!

Ya know what I mean? LOL

- sent from my iPhone`;

console.log('\n\n📧 TEST 2: Poor Email (Jargon, Unprofessional)');
console.log('-'.repeat(40));
const score2 = evaluateContentFast(email2, 'email');
console.log(formatScoreBreakdown(score2));

// Test 3: LinkedIn message
const linkedin = `Hi Mike! I came across your profile and was impressed by your work at Google. I'm building something in the AI space that might interest you. Would love to connect and share ideas - are you open to a quick chat?`;

console.log('\n\n💼 TEST 3: LinkedIn Connection Message');
console.log('-'.repeat(40));
const score3 = evaluateContentFast(linkedin, 'linkedin', { 
  recipientName: 'Mike Chen', 
  recipientCompany: 'Google', 
  purpose: 'cold outreach' 
});
console.log(formatScoreBreakdown(score3));

// Test 4: Short text message
const textMsg = `Hey! Quick check - are we still on for the demo tomorrow at 2pm? Let me know if you need to reschedule.`;

console.log('\n\n📱 TEST 4: Text Message');
console.log('-'.repeat(40));
const score4 = evaluateContentFast(textMsg, 'text');
console.log(formatScoreBreakdown(score4));

// Test 5: Sales advice
const advice = `Based on Luke's profile at Stellar Cyber, here's my recommended approach:

1. **Opening**: Reference their recent Series B funding and growth plans
2. **Value Prop**: Focus on how Adrata can accelerate their SOC 2 compliance timeline
3. **Ask**: Propose a 15-minute discovery call to discuss their security roadmap
4. **Timing**: Best to reach out Tuesday/Wednesday morning when response rates are highest

Key talking points:
- Their expansion into enterprise requires compliance certifications
- Mention similar customers in the cybersecurity space
- Highlight the 50% time savings in audit preparation`;

console.log('\n\n💡 TEST 5: Sales Advice');
console.log('-'.repeat(40));
const score5 = evaluateContentFast(advice, 'advice', {
  recipientName: 'Luke Fritz',
  recipientCompany: 'Stellar Cyber',
  purpose: 'cold outreach'
});
console.log(formatScoreBreakdown(score5));

// Summary
console.log('\n\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`
| Test | Type     | Score | Label        |
|------|----------|-------|--------------|
| 1    | Email    | ${score1.overall.toString().padStart(3)}   | ${getQualityLabel(score1.overall).padEnd(12)} |
| 2    | Email    | ${score2.overall.toString().padStart(3)}   | ${getQualityLabel(score2.overall).padEnd(12)} |
| 3    | LinkedIn | ${score3.overall.toString().padStart(3)}   | ${getQualityLabel(score3.overall).padEnd(12)} |
| 4    | Text     | ${score4.overall.toString().padStart(3)}   | ${getQualityLabel(score4.overall).padEnd(12)} |
| 5    | Advice   | ${score5.overall.toString().padStart(3)}   | ${getQualityLabel(score5.overall).padEnd(12)} |
`);

console.log('✅ All tests completed!\n');

