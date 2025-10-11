#!/usr/bin/env node

/**
 * 🚀 BULK BUYER GROUP DISCOVERY FOR DANO'S 150 ACCOUNTS
 * 
 * Use Coresignal to find real executives at all title agencies
 * Save them as contacts with buyer group roles
 */

const { PrismaClient } = require('@prisma/client');

const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';
const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

async function bulkBuyerGroupDiscovery() {
  console.log('🚀 BULK BUYER GROUP DISCOVERY FOR DANO\'S 150 ACCOUNTS');
  console.log('====================================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Get all of Dano's accounts
    const accounts = await prisma.accounts.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${accounts.length} accounts assigned to Dano`);
    console.log('🎯 Target roles for efficiency software: Operations Manager, Business Development Manager, CEO, President, CFO\n');
    
    let totalPeopleFound = 0;
    let companiesWithPeople = 0;
    let companiesProcessed = 0;
    
    // Process each account
    for (const account of accounts) {
      companiesProcessed++;
      console.log(`\n📋 [${companiesProcessed}/${accounts.length}] ${account.name}`);
      console.log(`    Website: ${account.website || 'No website'}`);
      
      try {
        // Step 1: Find company ID using enrich endpoint
        const domain = account.website || `${account.name.toLowerCase().replace(/[^a-z]/g, '')}.com`;
        
        const companyResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_clean/enrich?website=${domain}`, {
          method: 'GET',
          headers: {
            'apikey': CORESIGNAL_API_KEY,
            'accept': 'application/json'
          }
        });
        
        if (!companyResponse.ok) {
          console.log(`    ❌ Company not found in Coresignal`);
          continue;
        }
        
        const companyData = await companyResponse.json();
        if (!companyData.id) {
          console.log(`    ❌ No company ID returned`);
          continue;
        }
        
        console.log(`    ✅ Found company ID: ${companyData.id}`);
        
        // Step 2: ULTRA-SMART SENIOR TARGETING for Efficiency Software
        // Prioritized by decision-making power + efficiency focus
        const ultraSeniorRoles = [
          // 🔥 TIER 1: C-LEVEL (100 points) - Ultimate decision makers
          'CEO', 'Chief Executive Officer', 'President', 'Owner', 'Founder', 'Managing Partner',
          'CFO', 'Chief Financial Officer', 'Controller', 'Finance Director',
          'COO', 'Chief Operating Officer', 'Chief Operations Officer',
          'CTO', 'Chief Technology Officer', 'Chief Information Officer',
          
          // 🔥 TIER 2: VP LEVEL (80 points) - Senior champions with budget authority
          'VP Operations', 'Vice President Operations', 'VP of Operations',
          'VP Business Development', 'Vice President Business Development',
          'Executive Vice President', 'Senior Vice President', 'EVP', 'SVP',
          'VP Finance', 'Vice President Finance', 'VP Technology', 'VP IT',
          
          // 🔥 TIER 3: DIRECTOR LEVEL (60 points) - Department heads who feel the pain
          'Director of Operations', 'Operations Director', 'Director Operations',
          'Director of Business Development', 'Business Development Director',
          'Title Department Manager', 'Title Operations Manager',
          'Escrow Manager', 'Escrow Director', 'Director of Escrow',
          'Branch Manager', 'Regional Manager', 'Area Manager',
          'IT Director', 'Technology Director', 'Director of Technology',
          'Process Improvement Director', 'Efficiency Director',
          
          // 🔥 TIER 4: SENIOR MANAGER LEVEL (40 points) - Key operational roles
          'Senior Operations Manager', 'Operations Manager', 'Sr Operations Manager',
          'Senior Business Development Manager', 'Business Development Manager',
          'Unit Manager', 'Department Manager', 'Workflow Manager',
          'Process Manager', 'Quality Manager', 'Compliance Manager'
        ];
        
        const searchQuery = {
          query: {
            bool: {
              filter: [
                { term: { is_parent: 1 } },
                { term: { is_deleted: 0 } },
                { term: { is_working: 1 } },
                { term: { active_experience_company_id: companyData.id } }
              ],
              should: ultraSeniorRoles.map(role => ({ 
                match: { active_experience_title: role } 
              })),
              minimum_should_match: 1
            }
          }
        };
        
        const employeeSearchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
          method: 'POST',
          headers: {
            'apikey': CORESIGNAL_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchQuery)
        });
        
        if (!employeeSearchResponse.ok) {
          console.log(`    ⚠️ Employee search failed: ${employeeSearchResponse.status}`);
          continue;
        }
        
        const employeeSearchData = await employeeSearchResponse.json();
        const employeeIds = Array.isArray(employeeSearchData) ? employeeSearchData : [];
        
        console.log(`    👥 Found ${employeeIds.length} executives`);
        
        if (employeeIds.length === 0) {
          continue;
        }
        
        companiesWithPeople++;
        
        // Step 3: Get details for each person and save as contact
        for (let i = 0; i < Math.min(employeeIds.length, 5); i++) { // Limit to top 5 per company
          const employeeId = employeeIds[i];
          
          try {
            const detailsResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
              method: 'GET',
              headers: {
                'apikey': CORESIGNAL_API_KEY,
                'accept': 'application/json'
              }
            });
            
            if (detailsResponse.ok) {
              const personData = await detailsResponse.json();
              
              if (personData.full_name) {
                // Determine buyer group role
                const title = personData.active_experience_title || 'Unknown';
                const buyerRole = determineBuyerGroupRole(title);
                
                // Save as contact
                const contactId = `coresignal-${employeeId}-${Date.now()}`;
                
                // Check if contact already exists
                const existingContact = await prisma.contacts.findFirst({
                  where: {
                    workspaceId: NOTARY_WORKSPACE_ID,
                    email: personData.primary_professional_email
                  }
                });
                
                if (existingContact) {
                  console.log(`      ⚠️ Contact already exists: ${personData.full_name}`);
                  continue;
                }
                
                await prisma.contacts.create({
                  data: {
                    id: contactId,
                    workspaceId: NOTARY_WORKSPACE_ID,
                    accountId: account.id, // Valid account from Dano's 150
                    assignedUserId: 'dano',
                    firstName: (personData.first_name || 'Unknown').substring(0, 50),
                    lastName: (personData.last_name || 'Unknown').substring(0, 50),
                    fullName: (personData.full_name || 'Unknown').substring(0, 100),
                    displayName: (personData.full_name || 'Unknown').substring(0, 100),
                    jobTitle: title?.substring(0, 100) || 'Unknown', // Truncate long titles
                    department: personData.active_experience_department || 'Operations',
                    seniority: getSeniorityLevel(title),
                    email: personData.primary_professional_email || null,
                    linkedinUrl: personData.linkedin_url || null,
                    status: 'active', // Use valid status from schema
                    
                    // 🧠 NEW BUYER GROUP INTELLIGENCE FIELDS
                    buyerGroupRole: buyerRole.role,
                    seniorityScore: calculateSeniorityScore(title),
                    decisionMakingPower: getDecisionMakingPower(title),
                    efficiencyFocus: getEfficiencyFocus(title),
                    targetPriority: buyerRole.priority || 50,
                    discoverySource: 'coresignal_v2_bulk',
                    coresignalEmployeeId: employeeId.toString(),
                    coresignalCompanyId: companyData.id.toString(),
                    
                    tags: [
                      'buyer-group',
                      buyerRole.role,
                      'efficiency-software-target',
                      'coresignal-discovered',
                      getSeniorityLevel(title).toLowerCase(),
                      `priority-${buyerRole.priority || 50}`
                    ],
                    customFields: {
                      buyerGroupReasoning: buyerRole.reasoning,
                      discoveryMethod: 'coresignal_v2_bulk',
                      discoveredAt: new Date().toISOString(),
                      headline: personData.headline || null,
                      summary: personData.summary || null,
                      connectionsCount: personData.connections_count || null,
                      followersCount: personData.followers_count || null,
                      experienceDuration: personData.total_experience_duration_months || null,
                      relationshipStage: 'identified',
                      source: 'coresignal_buyer_group_discovery'
                    },
                    lastEnriched: new Date(),
                    updatedAt: new Date() // Required field
                  }
                });
                
                totalPeopleFound++;
                console.log(`      ✅ Saved: ${personData.full_name} (${title}) - ${buyerRole.role}`);
                console.log(`         📧 ${personData.primary_professional_email || 'No email'}`);
                console.log(`         🔗 ${personData.linkedin_url || 'No LinkedIn'}`);
              }
            }
            
            // Rate limiting between employee details
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (error) {
            console.log(`      ❌ Error getting details for employee ${employeeId}: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`    ❌ Error processing ${account.name}: ${error.message}`);
      }
      
      // Rate limiting between companies
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Progress update every 10 companies
      if (companiesProcessed % 10 === 0) {
        console.log(`\n📊 PROGRESS UPDATE:`);
        console.log(`   Companies processed: ${companiesProcessed}/${accounts.length}`);
        console.log(`   Companies with people: ${companiesWithPeople}`);
        console.log(`   Total people found: ${totalPeopleFound}`);
        console.log(`   Average people per company: ${Math.round(totalPeopleFound / Math.max(companiesWithPeople, 1) * 100) / 100}\n`);
      }
    }
    
    await prisma.$disconnect();
    
    console.log('\n🎉 BULK BUYER GROUP DISCOVERY COMPLETE!');
    console.log('==========================================');
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   Total accounts processed: ${companiesProcessed}`);
    console.log(`   Companies with executives found: ${companiesWithPeople}`);
    console.log(`   Total executives discovered: ${totalPeopleFound}`);
    console.log(`   Success rate: ${Math.round(companiesWithPeople / companiesProcessed * 100)}%`);
    console.log(`   Average executives per company: ${Math.round(totalPeopleFound / Math.max(companiesWithPeople, 1) * 100) / 100}`);
    
    console.log(`\n🎯 All executives saved as contacts in Notary Everyday workspace`);
    console.log(`   Assigned to: dano`);
    console.log(`   Tagged with: buyer-group, efficiency-software-target`);
    console.log(`   Includes: LinkedIn URLs, emails, buyer group roles`);
    
  } catch (error) {
    console.error('❌ Bulk discovery error:', error.message);
  }
}

// 🧠 ULTRA-SMART BUYER GROUP LOGIC for Efficiency Software at Title Companies
function determineBuyerGroupRole(title) {
  const titleLower = title.toLowerCase();
  
  // 🎯 TIER 1: ULTIMATE DECISION MAKERS (Final Authority + Budget)
  if (['ceo', 'chief executive', 'president', 'owner', 'founder', 'managing partner'].some(r => titleLower.includes(r))) {
    return {
      role: 'decision_maker',
      reasoning: '🔥 C-Level executive with final authority on efficiency investments. ROI-focused, efficiency directly impacts their bottom line and competitive advantage.',
      priority: 100
    };
  }
  
  if (['cfo', 'chief financial', 'controller', 'finance director'].some(r => titleLower.includes(r))) {
    return {
      role: 'decision_maker', 
      reasoning: '💰 Financial decision maker who evaluates ROI of efficiency software. Approves automation investments that reduce operational costs and improve margins.',
      priority: 95
    };
  }
  
  if (['coo', 'chief operating', 'chief operations'].some(r => titleLower.includes(r))) {
    return {
      role: 'decision_maker',
      reasoning: '⚡ Operations leader responsible for efficiency and process optimization. Primary stakeholder for notary/title automation - feels the pain daily.',
      priority: 98
    };
  }
  
  // 🎯 TIER 2: SENIOR CHAMPIONS (High Authority + Direct Benefit)
  if (['vp operations', 'vice president operations', 'vp of operations', 'executive vice president', 'evp'].some(r => titleLower.includes(r))) {
    return {
      role: 'champion',
      reasoning: '🚀 Senior operations leader who drives efficiency initiatives. Strong advocate for automation tools that improve processes and reduce manual work.',
      priority: 85
    };
  }
  
  if (['vp business development', 'vice president business', 'vp finance', 'vp technology', 'vp it'].some(r => titleLower.includes(r))) {
    return {
      role: 'champion',
      reasoning: '📈 VP-level leader focused on business growth and operational excellence. Champions tools that improve service delivery and client satisfaction.',
      priority: 80
    };
  }
  
  // 🎯 TIER 3: DEPARTMENT CHAMPIONS (Direct Users + Process Owners)
  if (['director of operations', 'operations director', 'title department manager', 'escrow manager', 'escrow director'].some(r => titleLower.includes(r))) {
    return {
      role: 'champion',
      reasoning: '🎯 Department head who manages daily title/escrow operations. Primary user and advocate for efficiency automation - knows exactly where time is wasted.',
      priority: 75
    };
  }
  
  if (['branch manager', 'regional manager', 'area manager', 'unit manager'].some(r => titleLower.includes(r))) {
    return {
      role: 'champion',
      reasoning: '🏢 Branch/regional leader responsible for operational efficiency and client satisfaction. Strong advocate for tools that streamline processes.',
      priority: 70
    };
  }
  
  if (['it director', 'technology director', 'director of technology', 'cto', 'chief technology'].some(r => titleLower.includes(r))) {
    return {
      role: 'champion',
      reasoning: '💻 Technology leader who evaluates and implements efficiency tools. Key advocate for automation and digital transformation.',
      priority: 78
    };
  }
  
  // 🎯 TIER 4: OPERATIONAL CHAMPIONS (Day-to-Day Users)
  if (['operations manager', 'senior operations manager', 'business development manager', 'process manager'].some(r => titleLower.includes(r))) {
    return {
      role: 'champion',
      reasoning: '⚙️ Process manager who benefits directly from automation. Advocates for tools that streamline daily operations and reduce manual tasks.',
      priority: 65
    };
  }
  
  // 🚨 POTENTIAL BLOCKERS (Must Approve for Compliance)
  if (['compliance', 'legal', 'risk', 'quality', 'audit'].some(r => titleLower.includes(r))) {
    return {
      role: 'blocker',
      reasoning: '⚖️ Compliance officer who must approve notary automation for regulatory compliance. Can block if legal/compliance concerns arise.',
      priority: 60
    };
  }
  
  // 🤝 INFLUENCERS (Input Providers)
  return {
    role: 'influencer',
    reasoning: '📊 Operational role that influences efficiency decisions through day-to-day process input and user feedback.',
    priority: 50
  };
}

// SMART HELPER FUNCTIONS for targeting the best people

// Get seniority level for prioritization
function getSeniorityLevel(title) {
  const titleLower = title.toLowerCase();
  
  if (['ceo', 'cfo', 'coo', 'president', 'owner', 'founder', 'chief'].some(r => titleLower.includes(r))) {
    return 'Executive';
  }
  
  if (['vp', 'vice president', 'executive vice president', 'senior vice president'].some(r => titleLower.includes(r))) {
    return 'VP';
  }
  
  if (['director', 'head of'].some(r => titleLower.includes(r))) {
    return 'Director';
  }
  
  if (['manager', 'supervisor'].some(r => titleLower.includes(r))) {
    return 'Manager';
  }
  
  return 'Individual Contributor';
}

// Calculate seniority score (higher = more senior = higher priority)
function calculateSeniorityScore(title) {
  const titleLower = title.toLowerCase();
  
  // C-Level = 100 points (highest priority)
  if (['ceo', 'cfo', 'coo', 'president', 'owner', 'chief'].some(r => titleLower.includes(r))) {
    return 100;
  }
  
  // VP Level = 80 points
  if (['vp', 'vice president', 'executive vice president'].some(r => titleLower.includes(r))) {
    return 80;
  }
  
  // Director Level = 60 points
  if (['director', 'head of'].some(r => titleLower.includes(r))) {
    return 60;
  }
  
  // Manager Level = 40 points
  if (['manager', 'supervisor'].some(r => titleLower.includes(r))) {
    return 40;
  }
  
  return 20; // Individual contributor
}

// Get decision making power (higher = more authority)
function getDecisionMakingPower(title) {
  const titleLower = title.toLowerCase();
  
  if (['ceo', 'president', 'owner'].some(r => titleLower.includes(r))) {
    return 'final_authority';
  }
  
  if (['cfo', 'coo', 'chief'].some(r => titleLower.includes(r))) {
    return 'high_authority';
  }
  
  if (['vp', 'vice president', 'executive'].some(r => titleLower.includes(r))) {
    return 'significant_influence';
  }
  
  if (['director', 'manager'].some(r => titleLower.includes(r))) {
    return 'departmental_authority';
  }
  
  return 'limited_authority';
}

// Get efficiency focus score (higher = more interested in efficiency tools)
function getEfficiencyFocus(title) {
  const titleLower = title.toLowerCase();
  
  // Operations roles = highest efficiency focus
  if (['operations', 'process', 'efficiency', 'escrow', 'title department'].some(r => titleLower.includes(r))) {
    return 'very_high';
  }
  
  // Business development = high (client satisfaction through efficiency)
  if (['business development', 'client experience', 'customer service'].some(r => titleLower.includes(r))) {
    return 'high';
  }
  
  // Financial roles = medium (cost reduction focus)
  if (['cfo', 'financial', 'controller'].some(r => titleLower.includes(r))) {
    return 'medium';
  }
  
  // Executive roles = medium (overall efficiency)
  if (['ceo', 'president', 'coo'].some(r => titleLower.includes(r))) {
    return 'medium';
  }
  
  return 'low';
}

bulkBuyerGroupDiscovery();
