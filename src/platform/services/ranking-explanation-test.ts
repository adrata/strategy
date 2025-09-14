/**
 * TEST: LLM-Powered Ranking Explanations
 * 
 * This demonstrates the new default LLM-powered explanations
 */

import { RankingExplanationService } from './ranking-explanation-service';

// Test data representing different contact scenarios
const testContacts = [
  {
    name: "Sarah Johnson",
    title: "VP of Operations",
    company: "RetailMax Corp",
    sourceType: 'customer' as const,
    score: 92,
    factors: {
      relationship: 'warm',
      decisionPower: 'Decision Maker',
      value: 250000
    },
    recentActivity: {
      type: 'email',
      daysAgo: 1
    }
  },
  {
    name: "Michael Chen",
    title: "CEO",
    company: "TechStart Inc",
    sourceType: 'lead' as const,
    score: 78,
    factors: {
      relationship: 'cold',
      decisionPower: 'Decision Maker',
      value: 50000
    }
  },
  {
    name: "Jennifer Davis",
    title: "Marketing Manager", 
    company: "GrowthCorp",
    sourceType: 'prospect' as const,
    score: 65,
    factors: {
      relationship: 'warm',
      value: 75000
    },
    recentActivity: {
      type: 'call',
      daysAgo: 3
    }
  }
];

const testAccounts = [
  {
    name: "RetailMax Corp",
    contactCount: 5,
    opportunityCount: 2,
    isCustomer: true,
    revenue: 500000,
    lastActivity: "Email response 2 days ago"
  },
  {
    name: "TechStart Inc",
    contactCount: 1,
    opportunityCount: 0,
    isCustomer: false,
    revenue: 0,
    lastActivity: "Initial outreach"
  }
];

/**
 * Test the LLM-powered explanations
 */
export async function testRankingExplanations() {
  console.log('🤖 Testing LLM-Powered Ranking Explanations\n');
  
  // Test contact explanations
  console.log('📋 Contact Explanations:');
  for (const contact of testContacts) {
    try {
      const explanation = await RankingExplanationService.generateExplanation(contact);
      console.log(`• ${contact.name}: "${explanation}"`);
    } catch (error) {
      console.log(`• ${contact.name}: Error - ${error}`);
    }
  }
  
  console.log('\n🏢 Account Explanations:');
  for (const account of testAccounts) {
    try {
      const explanation = await RankingExplanationService.generateAccountExplanation(account);
      console.log(`• ${account.name}: "${explanation}"`);
    } catch (error) {
      console.log(`• ${account.name}: Error - ${error}`);
    }
  }
}

// Example of what the LLM responses might look like:
export const expectedExamples = {
  highValueCustomer: "Critical priority: existing customer, VP-level executive, high-value opportunity, responded yesterday",
  newCEOLead: "High priority: cold prospect, CEO, fresh opportunity",
  warmProspect: "Medium priority: warm prospect, mid-value opportunity, engaged recently",
  customerAccount: "High priority: existing customer account, 2 active opportunities, high-value account",
  prospectAccount: "Medium priority: single contact, new opportunity"
};

// Run test if called directly
if (require['main'] === module) {
  testRankingExplanations()
    .then(() => console.log('\n✅ Test completed'))
    .catch(error => console.error('❌ Test failed:', error));
}
