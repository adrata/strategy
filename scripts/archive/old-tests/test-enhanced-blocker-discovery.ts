#!/usr/bin/env npx tsx

/**
 * TEST ENHANCED BLOCKER DISCOVERY
 * 
 * Validate that our fixed pipeline can now discover blockers
 * from corporate functions (procurement, legal, security, finance)
 */

import fs from 'fs';
import path from 'path';

// Mock CoreSignal data with corporate function blockers for testing
const mockCorporateData = [
  {
    id: 'mock_1',
    fullName: 'Jennifer Schmidt',
    title: 'Global Procurement Director',
    department: 'Procurement',
    location: 'Austin, TX',
    company: 'Dell Technologies',
    experience: [{
      title: 'Global Procurement Director',
      department: 'Procurement',
      company: 'Dell Technologies'
    }]
  },
  {
    id: 'mock_2', 
    fullName: 'Michael Torres',
    title: 'Chief Security Officer',
    department: 'Security',
    location: 'Round Rock, TX',
    company: 'Dell Technologies',
    experience: [{
      title: 'Chief Security Officer',
      department: 'Security', 
      company: 'Dell Technologies'
    }]
  },
  {
    id: 'mock_3',
    fullName: 'Sarah Chen',
    title: 'VP Legal Affairs',
    department: 'Legal',
    location: 'Austin, TX',
    company: 'Dell Technologies',
    experience: [{
      title: 'VP Legal Affairs',
      department: 'Legal',
      company: 'Dell Technologies'
    }]
  },
  {
    id: 'mock_4',
    fullName: 'David Richardson',
    title: 'Finance Director',
    department: 'Finance',
    location: 'Round Rock, TX', 
    company: 'Dell Technologies',
    experience: [{
      title: 'Finance Director',
      department: 'Finance',
      company: 'Dell Technologies'
    }]
  }
];

// Import the buyer group identifier to test classification
import { BuyerGroupIdentifier } from '../src/platform/services/buyer-group/buyer-group-identifier';
import { sellerProfiles } from '../src/platform/services/buyer-group/seller-profiles';

async function testBlockerDiscovery() {
  console.log('TESTING ENHANCED BLOCKER DISCOVERY');
  console.log('==================================');
  console.log('');
  
  const sellerProfile = sellerProfiles['dell-na-enterprise-250k'];
  const identifier = new BuyerGroupIdentifier();
  
  console.log('TESTING CORPORATE FUNCTION CLASSIFICATION:');
  console.log('==========================================');
  
  for (const mockProfile of mockCorporateData) {
    // Convert to PersonProfile format
    const personProfile = {
      id: mockProfile.id,
      fullName: mockProfile.fullName,
      title: mockProfile.title,
      department: mockProfile.department,
      location: mockProfile.location,
      company: mockProfile.company,
      seniorityLevel: 'Director' as any,
      departmentCategory: 'Corporate' as any,
      experience: mockProfile.experience,
      linkedinUrl: '',
      score: 85,
      rationale: []
    };
    
    // Test the role assignment logic
    try {
      // This would normally be done inside BuyerGroupIdentifier
      const roleAssignment = await identifier.identifyOptimalBuyerGroup([personProfile], sellerProfile);
      
      console.log(`${mockProfile.fullName} (${mockProfile.title})`);
      console.log(`  Department: ${mockProfile.department}`);
      
      // Check if they would be classified as blocker
      const isBlockerTitle = sellerProfile.roleDefinitions.blocker.some(pattern => 
        mockProfile.title.toLowerCase().includes(pattern.toLowerCase())
      );
      
      const isBlockerDept = ['procurement', 'legal', 'security', 'finance'].includes(
        mockProfile.department.toLowerCase()
      );
      
      console.log(`  Blocker Title Match: ${isBlockerTitle}`);
      console.log(`  Blocker Department: ${isBlockerDept}`);
      console.log(`  Expected Classification: BLOCKER`);
      console.log('');
      
    } catch (error) {
      console.log(`  Error testing: ${error}`);
      console.log('');
    }
  }
  
  console.log('PROFILE ANALYZER TEST:');
  console.log('======================');
  
  // Test if these profiles would pass the profile analyzer
  const ProfileAnalyzer = require('../src/platform/services/buyer-group/profile-analyzer').ProfileAnalyzer;
  const analyzer = new ProfileAnalyzer();
  
  for (const mockProfile of mockCorporateData) {
    const personProfile = {
      id: mockProfile.id,
      fullName: mockProfile.fullName,
      title: mockProfile.title,
      department: mockProfile.department,
      location: mockProfile.location,
      company: mockProfile.company,
      seniorityLevel: 'Director' as any,
      departmentCategory: 'Corporate' as any,
      experience: mockProfile.experience,
      linkedinUrl: '',
      score: 85,
      rationale: []
    };
    
    try {
      // Test company matching
      const companyMatch = analyzer.isCompanyMatch?.(personProfile, ['Dell Technologies', 'Dell EMC', 'Dell']);
      
      // Test quality filtering  
      const qualityPass = analyzer.passesQualityFilters?.(personProfile, sellerProfile, { 
        requireDirector: false, 
        allowIC: true,
        strictDepartmentMatch: false
      });
      
      console.log(`${mockProfile.fullName}:`);
      console.log(`  Company Match: ${companyMatch ?? 'Unable to test'}`);
      console.log(`  Quality Pass: ${qualityPass ?? 'Unable to test'}`);
      console.log('');
      
    } catch (error) {
      console.log(`${mockProfile.fullName}: Test error - ${error}`);
      console.log('');
    }
  }
  
  console.log('QUERY BUILDER TEST:');
  console.log('==================');
  
  // Test if the query builder includes corporate departments
  const QueryBuilder = require('../src/platform/services/buyer-group/query-builder').QueryBuilder;
  const queryBuilder = new QueryBuilder();
  
  try {
    const searchQuery = queryBuilder.buildSearchQuery('Dell Technologies', sellerProfile, ['Dell EMC', 'Dell']);
    
    const deptFilter = searchQuery.query?.bool?.must?.find((clause: any) => 
      clause.bool?.should?.some((should: any) => 
        should.match && Object.keys(should.match).includes('experience.department')
      )
    );
    
    if (deptFilter) {
      const departments = deptFilter.bool.should
        .filter((should: any) => should.match && should.match['experience.department'])
        .map((should: any) => should.match['experience.department']);
      
      console.log('Departments included in search:');
      departments.forEach((dept: string) => console.log(`  - ${dept}`));
      
      const blockerDepts = ['procurement', 'legal', 'security', 'finance'];
      const blockerCoverage = blockerDepts.filter(dept => departments.includes(dept));
      
      console.log('');
      console.log(`Blocker department coverage: ${blockerCoverage.length}/${blockerDepts.length}`);
      console.log(`Covered: ${blockerCoverage.join(', ')}`);
      
    } else {
      console.log('No department filtering found in query');
    }
    
  } catch (error) {
    console.log(`Query test error: ${error}`);
  }
  
  console.log('');
  console.log('ENHANCED BLOCKER DISCOVERY TEST COMPLETE');
  console.log('========================================');
  console.log('Next: Run actual pipeline with corporate function search');
}

if (require.main === module) {
  testBlockerDiscovery().catch(console.error);
}
