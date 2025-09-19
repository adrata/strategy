#!/usr/bin/env node

/**
 * 🎯 TOP SELLER USE CASES
 * 
 * Comprehensive use cases for how a seller at TOP Engineering Plus would use the enrichment system
 */

// TOP seller use cases based on engineering consulting business
const TOP_SELLER_USE_CASES = [
  {
    id: 'prospect-research',
    title: 'Research a Manufacturing Prospect',
    description: 'A TOP seller needs to research a potential client before an initial call',
    scenario: 'Sarah, a TOP seller, has a call scheduled with Ford Motor Company tomorrow. She needs complete buyer group intelligence for their engineering services pitch.',
    query: {
      operation: 'buyer_group',
      target: { companyName: 'Ford Motor Company' },
      context: 'Manufacturing prospect for engineering consulting services'
    },
    expectedOutcome: 'Complete buyer group with operations/engineering leadership, verified employment, contact details'
  },
  
  {
    id: 'find-engineering-decision-maker',
    title: 'Find Engineering Decision Maker',
    description: 'Find the key engineering decision maker at a target company',
    scenario: 'Mike, a TOP seller, needs to find the VP of Engineering at Boeing for a critical infrastructure project discussion.',
    query: {
      operation: 'person_lookup',
      target: { 
        searchCriteria: {
          query: 'VP Engineering at Boeing',
          industry: 'aerospace',
          role: 'VP Engineering'
        }
      },
      context: 'Need engineering leadership contact for infrastructure project'
    },
    expectedOutcome: 'Verified VP of Engineering contact with current employment and accurate contact info'
  },
  
  {
    id: 'operations-manager-search',
    title: 'Find Operations Manager for Project',
    description: 'Search for operations managers who would champion engineering improvements',
    scenario: 'Jessica, a TOP seller, needs to find operations managers at automotive companies who would benefit from manufacturing optimization services.',
    query: {
      operation: 'technology_search',
      target: {
        searchCriteria: {
          query: 'Operations Manager manufacturing',
          industry: 'automotive',
          experienceLevel: 'senior'
        }
      },
      context: 'Manufacturing optimization project champions'
    },
    expectedOutcome: 'List of qualified operations managers with manufacturing experience'
  },
  
  {
    id: 'competitive-intel-research',
    title: 'Research Company Before Competitor Meeting',
    description: 'Deep research on a company where competitors are also engaged',
    scenario: 'David, a TOP seller, knows McKinsey is also pitching General Motors. He needs complete intelligence on GM\'s engineering organization and decision process.',
    query: {
      operation: 'company_research',
      target: { companyName: 'General Motors' },
      context: 'Competitive situation - need complete engineering org intelligence'
    },
    expectedOutcome: 'Comprehensive company intelligence with engineering org structure and decision process'
  },
  
  {
    id: 'warm-intro-path',
    title: 'Find Warm Introduction Path',
    description: 'Find connection paths to target decision makers',
    scenario: 'Rachel, a TOP seller, wants to reach the CTO at Lockheed Martin but needs a warm introduction path through existing relationships.',
    query: {
      operation: 'person_lookup',
      target: {
        searchCriteria: {
          query: 'CTO Lockheed Martin',
          company: 'Lockheed Martin',
          industry: 'aerospace'
        }
      },
      context: 'Need warm introduction path to aerospace CTO'
    },
    expectedOutcome: 'CTO contact info plus potential introduction paths through network'
  },
  
  {
    id: 'project-stakeholder-mapping',
    title: 'Map Project Stakeholders',
    description: 'Identify all stakeholders for a large engineering project',
    scenario: 'Tom, a TOP seller, is proposing a $2M infrastructure upgrade to Caterpillar. He needs to map all stakeholders who would be involved in the decision.',
    query: {
      operation: 'buyer_group',
      target: { companyName: 'Caterpillar Inc' },
      context: 'Large infrastructure project stakeholder mapping'
    },
    expectedOutcome: 'Complete stakeholder map including decision makers, influencers, and potential blockers'
  },
  
  {
    id: 'quality-manager-outreach',
    title: 'Find Quality Managers for Compliance Project',
    description: 'Find quality managers for regulatory compliance engineering project',
    scenario: 'Lisa, a TOP seller, has a regulatory compliance engineering project. She needs quality managers at pharmaceutical companies who handle FDA compliance.',
    query: {
      operation: 'technology_search',
      target: {
        searchCriteria: {
          query: 'Quality Manager pharmaceutical FDA',
          industry: 'pharmaceutical',
          experienceLevel: 'senior'
        }
      },
      context: 'FDA compliance engineering project'
    },
    expectedOutcome: 'Quality managers with FDA compliance experience and current contact info'
  },
  
  {
    id: 'expansion-opportunity-research',
    title: 'Research Expansion Opportunity',
    description: 'Research a company showing growth signals for engineering services',
    scenario: 'Carlos, a TOP seller, sees that Tesla is expanding manufacturing. He needs complete intelligence on their engineering organization for expansion services.',
    query: {
      operation: 'company_research',
      target: { companyName: 'Tesla Inc' },
      context: 'Manufacturing expansion - engineering services opportunity'
    },
    expectedOutcome: 'Company expansion intelligence with engineering hiring and growth signals'
  }
];

module.exports = { TOP_SELLER_USE_CASES };
