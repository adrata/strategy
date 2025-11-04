#!/usr/bin/env node

/**
 * Create Notary Everyday Growth Strategy in Stacks
 * 
 * This script creates the complete Growth Strategy 2025 structure in Stacks:
 * - Creates Irene Serrato user
 * - Finds Notary Everyday workspace
 * - Creates "Growth Strategy 2025" project
 * - Creates all epochs, epics, and stories with proper relationships
 * - Assigns stories to appropriate owners
 * - All data is stored in the database within the Notary Everyday workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to find user by email
async function findUserByEmail(email) {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  return await prisma.users.findFirst({
    where: {
      email: normalizedEmail,
      isActive: true
    }
  });
}

// Helper function to find or create user
async function findOrCreateUser(userData) {
  const { email, username, name, firstName, lastName, workspaceId } = userData;
  const normalizedEmail = email.toLowerCase().trim();
  
  let user = await findUserByEmail(normalizedEmail);
  
  if (!user) {
    user = await prisma.users.create({
      data: {
        email: normalizedEmail,
        username: username || null,
        name: name,
        firstName: firstName || null,
        lastName: lastName || null,
        isActive: true,
        activeWorkspaceId: workspaceId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Created user: ${name} (${email})`);
  } else {
    console.log(`✅ Found existing user: ${name} (${email})`);
  }
  
  return user;
}

// Helper function to add user to workspace
async function ensureUserInWorkspace(userId, workspaceId, role = 'SELLER') {
  const existing = await prisma.workspace_users.findFirst({
    where: {
      userId,
      workspaceId
    }
  });
  
  if (!existing) {
    await prisma.workspace_users.create({
      data: {
        workspaceId,
        userId,
        role,
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Added user to workspace`);
  }
}

// Find Notary Everyday workspace
async function findNotaryEverydayWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
        { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
        { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
        { slug: { contains: 'notaryeveryday', mode: 'insensitive' } },
        { slug: { contains: 'ne', mode: 'insensitive' } }
      ],
      isActive: true
    }
  });
  
  if (!workspace) {
    throw new Error('Notary Everyday workspace not found!');
  }
  
  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
  return workspace;
}

// Find or create project
async function findOrCreateProject(workspaceId, name, description) {
  let project = await prisma.stacksProject.findFirst({
    where: {
      workspaceId,
      name
    }
  });
  
  if (!project) {
    project = await prisma.stacksProject.create({
      data: {
        workspaceId,
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Created project: ${name}`);
  } else {
    console.log(`✅ Found existing project: ${name}`);
  }
  
  return project;
}

// Find or create epoch
async function findOrCreateEpoch(projectId, title, description, priority = 'medium') {
  let epoch = await prisma.stacksEpoch.findFirst({
    where: {
      projectId,
      title
    }
  });
  
  if (!epoch) {
    epoch = await prisma.stacksEpoch.create({
      data: {
        projectId,
        title,
        description: description || '',
        status: 'todo',
        priority,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`  ✅ Created epoch: ${title}`);
  } else {
    console.log(`  ⚠️  Epoch already exists: ${title}`);
  }
  
  return epoch;
}

// Find or create epic
async function findOrCreateEpic(projectId, epochId, title, description, priority = 'medium') {
  let epic = await prisma.stacksEpic.findFirst({
    where: {
      projectId,
      title,
      epochId: epochId || null
    }
  });
  
  if (!epic) {
    epic = await prisma.stacksEpic.create({
      data: {
        projectId,
        epochId: epochId || null,
        title,
        description: description || '',
        status: 'todo',
        priority,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`    ✅ Created epic: ${title}`);
  } else {
    console.log(`    ⚠️  Epic already exists: ${title}`);
  }
  
  return epic;
}

// Find or create story
async function findOrCreateStory(projectId, epicId, epochId, title, description, assigneeId, priority = 'medium', status = 'todo') {
  let story = await prisma.stacksStory.findFirst({
    where: {
      projectId,
      title,
      epicId: epicId || null,
      epochId: epochId || null
    }
  });
  
  if (!story) {
    story = await prisma.stacksStory.create({
      data: {
        projectId,
        epicId: epicId || null,
        epochId: epochId || null,
        title,
        description: description || '',
        status,
        priority,
        assigneeId: assigneeId || null,
        statusChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`      ✅ Created story: ${title}`);
  } else {
    console.log(`      ⚠️  Story already exists: ${title}`);
  }
  
  return story;
}

// Main execution function
async function createGrowthStrategy() {
  try {
    console.log('🚀 Creating Notary Everyday Growth Strategy in Stacks\n');
    console.log('='.repeat(80));
    
    // Step 1: Find workspace
    const workspace = await findNotaryEverydayWorkspace();
    console.log();
    
    // Step 2: Find or create users
    console.log('👥 Setting up users...');
    
    // Find existing users
    const dano = await findUserByEmail('dano@notaryeveryday.com') || 
                 await findUserByEmail('dano@notary-everyday.com');
    const noel = await findUserByEmail('noel@notaryeveryday.com');
    const ryan = await findUserByEmail('ryan@notaryeveryday.com') ||
                 await findUserByEmail('ryan@notary-everyday.com');
    
    // Create Irene
    const irene = await findOrCreateUser({
      email: 'irene@notaryeveryday.com',
      username: 'irene',
      name: 'Irene Serrato',
      firstName: 'Irene',
      lastName: 'Serrato',
      workspaceId: workspace.id
    });
    
    // Ensure all users are in workspace
    if (dano) {
      await ensureUserInWorkspace(dano.id, workspace.id);
      console.log(`✅ Dano found: ${dano.name} (${dano.email})`);
    } else {
      console.log(`⚠️  Dano not found - stories will be unassigned`);
    }
    
    if (noel) {
      await ensureUserInWorkspace(noel.id, workspace.id);
      console.log(`✅ Noel found: ${noel.name} (${noel.email})`);
    } else {
      console.log(`⚠️  Noel not found - stories will be unassigned`);
    }
    
    if (ryan) {
      await ensureUserInWorkspace(ryan.id, workspace.id);
      console.log(`✅ Ryan found: ${ryan.name} (${ryan.email})`);
    } else {
      console.log(`⚠️  Ryan not found - stories will be unassigned`);
    }
    
    await ensureUserInWorkspace(irene.id, workspace.id);
    console.log();
    
    // Step 3: Create or find project
    const project = await findOrCreateProject(
      workspace.id,
      'Growth Strategy 2025',
      'Notary Everyday Growth Strategy 2025 - Three-pillar approach: Acquisition, Expansion, Retention'
    );
    console.log();
    
    // Step 4: Create epochs
    console.log('📦 Creating epochs...');
    const epoch1 = await findOrCreateEpoch(
      project.id,
      'Strategic Foundation',
      'Establish the core messaging and principles that guide all growth activities. Contains the Thought Campaign, Four Principles (Clarity, Consistency, Human Connection, Repetition), and the commitment to excellence positioning.'
    );
    
    const epoch2 = await findOrCreateEpoch(
      project.id,
      'Acquisition',
      'Strategic pillar for new business development. Systematic growth through cold outreach and strategic partnerships to acquire new clients.'
    );
    
    const epoch3 = await findOrCreateEpoch(
      project.id,
      'Expansion',
      'Strategic pillar for growing existing client relationships. Increase business from existing clients by 30-50% through relationship activation and market penetration.'
    );
    
    const epoch4 = await findOrCreateEpoch(
      project.id,
      'Retention',
      'Strategic pillar for maintaining customer relationships. Maintain and strengthen existing customer relationships through continuous engagement and personal connection.'
    );
    
    const epoch5 = await findOrCreateEpoch(
      project.id,
      'Event Strategy',
      'Bridging Excellence Event Strategy - Unite top real estate, title, and escrow professionals to elevate industry closing standards.'
    );
    
    const epoch6 = await findOrCreateEpoch(
      project.id,
      'Accountability & Success Measures',
      'Accountability Matrix and Success Measures - Track and measure success across all growth pillars.'
    );
    
    const epoch7 = await findOrCreateEpoch(
      project.id,
      'Implementation Timeline',
      'Implementation Timeline & Next Steps - Track immediate, short-term, and medium-term actions.'
    );
    console.log();
    
    // Step 5: Create epics
    console.log('📚 Creating epics...');
    
    // Epoch 1: Strategic Foundation
    const epic1_1 = await findOrCreateEpic(
      project.id,
      epoch1.id,
      'Thought Campaign Foundation',
      'Establish and maintain clarity about what we want people to know about Notary Everyday. Core message: "Deliver exceptional notary quality & fulfillment". How: Through professionalism, technology, and integrity. Why: Quality of signing defines client experience and protects every deal.'
    );
    
    const epic1_2 = await findOrCreateEpic(
      project.id,
      epoch1.id,
      'Four Principles Implementation',
      'Ensure all touchpoints follow the four core principles: 1. Clarity - Every touchpoint tells the same story. 2. Consistency - Voice never changes across all channels. 3. Human Connection - Build genuine relationships through every channel. 4. Repetition - Reinforce excellence message consistently.'
    );
    
    const epic1_3 = await findOrCreateEpic(
      project.id,
      epoch1.id,
      'Brand Positioning',
      'Establish Notary Everyday as the standard for notary fulfillment excellence. Outcome: "Three years from now, \'Notary Everyday\' means one thing: Excellence"'
    );
    
    // Epoch 2: Acquisition
    const epic2_1 = await findOrCreateEpic(
      project.id,
      epoch2.id,
      'Cold Outreach Initiative',
      'Systematic outreach to new business development across all target segments: Underwriter-owned title agencies, Independent title agencies, Settlement companies, Escrow companies, Independent agencies combining services, Underwriter-managed escrow/settlement companies.'
    );
    
    const epic2_2 = await findOrCreateEpic(
      project.id,
      epoch2.id,
      'Strategic Partnerships',
      'Enterprise-level "whale hunting" for transformational partnerships. Target: Tech industry leaders, Title production software providers (integration partnerships), Holding and parent companies (enterprise agreements), Underwriter partnerships (leveraging CEO-level positioning).'
    );
    
    const epic2_3 = await findOrCreateEpic(
      project.id,
      epoch2.id,
      'Top 10 of 1000 Notaries Outreach',
      'Support acquisition and expansion by positioning network as premier standard. Components: Email template development, Follow-up message strategy, Integration messaging (direct system integration, verified signers, background-screened notaries, geo-verified signings, secure audit trails, real-time alerts).'
    );
    
    // Epoch 3: Expansion
    const epic3_1 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Expansion Strategy Implementation',
      'Increase business from existing clients by 30-50%. Lead Portfolio: 167 active accounts representing existing clients and high-potential expansion opportunities.'
    );
    
    const epic3_2 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Market Penetration - Arizona',
      'Primary market expansion focus. Current State: 65% of title companies in AZ, 10% of each company\'s notary business. Target State: 30-50% of each company\'s notary business.'
    );
    
    const epic3_3 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Market Penetration - Florida',
      'Secondary market expansion focus. Status: Initial expansion state.'
    );
    
    const epic3_4 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Funnel Management',
      'Strategic escalation pathway. Top of Funnel: Irene and Ryan manage initial touchpoints and introductions. Mid-to-Lower Funnel: Strategic escalation to Dano (technical discussions) or Noel (executive-level positioning).'
    );
    
    const epic3_5 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Localized Content Strategy',
      'Develop geographically tailored materials for major U.S. cities. Initial Focus: Arizona and Florida markets. Deliverables: Localized landing pages ("Top 5 Phoenix Notaries", "Top 5 Tampa Notaries"), City-specific marketing materials.'
    );
    
    const epic3_6 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Top Performer Features',
      'Demonstrate the caliber of our network. Components: Video interviews with top-performing notaries in each city, Written profiles showcasing excellence.'
    );
    
    const epic3_7 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Certification Visibility',
      'Prominently display Notary Everyday Inc. 0105 Certification. Certification Includes: Background check completion, $1 million minimum E&O insurance, Internal team screening, ID verification technology enablement, Listed education and qualifications.'
    );
    
    const epic3_8 = await findOrCreateEpic(
      project.id,
      epoch3.id,
      'Digital Presence & Notary-Shareable Content',
      'Create content for notary personal brand building and community engagement.'
    );
    
    // Epoch 4: Retention
    const epic4_1 = await findOrCreateEpic(
      project.id,
      epoch4.id,
      'Relationship Maintenance',
      'Maintain and strengthen existing customer relationships through continuous engagement. Focus: Interpersonal relationships and consistency in care.'
    );
    
    const epic4_2 = await findOrCreateEpic(
      project.id,
      epoch4.id,
      'Client Recognition & Touchpoints',
      'Active recognition of customer partnerships and regular touchpoints demonstrating partnership value.'
    );
    
    const epic4_3 = await findOrCreateEpic(
      project.id,
      epoch4.id,
      'Expansion Outreach Within Existing Clients',
      'Formal expansion outreach within existing client organizations (Starting November 3, 2025). Key Framework: "Hey, do you mind connecting me with others in the company that can benefit from this?" This: Excellence in notary fulfillment and ability to deploy top-tier notaries.'
    );
    
    // Epoch 5: Event Strategy
    const epic5_1 = await findOrCreateEpic(
      project.id,
      epoch5.id,
      'Bridging Excellence Event Strategy',
      'Unite top real estate, title, and escrow professionals to elevate industry closing standards. For Realtors: "Close the Closing Experience Gap" - Learn how the signing table experience can make or break your business. For Title & Escrow Professionals: "Close the Realtor Retention Gap" - Understand what top agents truly value in partnerships. Event Positioning: Exclusive & Elevated (60 hand-selected professionals), Insightful & Impactful, Premium & Connected, Collaborative & Vision-Driven.'
    );
    
    // Epoch 6: Accountability
    const epic6_1 = await findOrCreateEpic(
      project.id,
      epoch6.id,
      'Accountability & Success Measures',
      'Establish and track success metrics across all growth pillars: Acquisition, Expansion, and Retention.'
    );
    
    // Epoch 7: Timeline
    const epic7_1 = await findOrCreateEpic(
      project.id,
      epoch7.id,
      'Implementation Timeline & Next Steps',
      'Track immediate (November 3-10, 2025), short-term (November-December 2025), and medium-term (Q1 2026) actions.'
    );
    
    console.log();
    
    // Step 6: Create stories
    console.log('📖 Creating stories...');
    
    // Stories under Epic 1.1: Thought Campaign Foundation
    await findOrCreateStory(project.id, epic1_1.id, null, 'Define Core Messaging Framework', 'Document "What we do: Deliver exceptional notary quality & fulfilment", "How we do it: Through professionalism, technology, and integrity", "Why it matters: The quality of a signing defines the client experience and protects every deal"', null, 'high');
    await findOrCreateStory(project.id, epic1_1.id, null, 'Create Messaging Guide for All Team Members', 'Ensure every interaction reinforces: Notary Everyday represents excellence', null, 'high');
    
    // Stories under Epic 1.2: Four Principles Implementation
    await findOrCreateStory(project.id, epic1_2.id, null, 'Clarity Principle - Unified Messaging Across All Channels', 'Ensure Dano\'s emails, Noel\'s boardrooms, Irene\'s calls, Ryan\'s connections—identical message', null, 'high');
    await findOrCreateStory(project.id, epic1_2.id, null, 'Consistency Principle - Voice Standardization', 'Ensure emails sound like website, website sounds like events, events sound like conversations', null, 'high');
    await findOrCreateStory(project.id, epic1_2.id, null, 'Human Connection Principle - Relationship Building Framework', 'Build genuine relationships through every channel—calls, visits, emails, videos. People feel understood, not like they\'re on a list', null, 'high');
    await findOrCreateStory(project.id, epic1_2.id, null, 'Repetition Principle - Consistent Reinforcement Strategy', 'Say it again and again. Recognition takes time. Trust is built through consistency. Every interaction reinforces: Notary Everyday represents excellence', null, 'high');
    
    // Stories under Epic 2.1: Cold Outreach Initiative
    await findOrCreateStory(project.id, epic2_1.id, null, 'Develop Outreach Template for Underwriter-Owned Title Agencies', 'Create systematic outreach approach for underwriter-owned title agencies segment', dano?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_1.id, null, 'Develop Outreach Template for Independent Title Agencies', 'Create systematic outreach approach for independent title agencies segment', dano?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_1.id, null, 'Develop Outreach Template for Settlement Companies', 'Create systematic outreach approach for settlement companies (handling settlement, fulfillment, and payouts)', dano?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_1.id, null, 'Develop Outreach Template for Escrow Companies', 'Create systematic outreach approach for escrow companies (focused solely on escrow responsibilities)', dano?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_1.id, null, 'Develop Outreach Template for Independent Agencies (Title + Settlement + Escrow)', 'Create systematic outreach approach for independent agencies combining title, settlement, and escrow services', dano?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_1.id, null, 'Develop Outreach Template for Underwriter-Managed Escrow/Settlement Companies', 'Create systematic outreach approach for underwriter-managed escrow or settlement companies', dano?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_1.id, null, 'Implement Consistent Touchpoint System', 'Develop consistent, meaningful touchpoints with every industry participant not yet engaged', dano?.id || null, 'high');
    
    // Stories under Epic 2.2: Strategic Partnerships
    await findOrCreateStory(project.id, epic2_2.id, null, 'Identify Tech Industry Leaders for Partnership', 'Research and identify tech industry leaders for transformational partnerships', noel?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_2.id, null, 'Develop Integration Partnership Strategy with Title Production Software Providers', 'Create approach for integration partnerships with title production software providers', noel?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_2.id, null, 'Develop Enterprise Agreement Strategy for Holding and Parent Companies', 'Create approach for enterprise agreements with holding and parent companies', noel?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_2.id, null, 'Develop Underwriter Partnership Strategy', 'Create approach leveraging CEO-level positioning for underwriter partnerships', noel?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_2.id, null, 'Position Partnerships as Strategic, Transformational Opportunities', 'Ensure partnerships are positioned as strategic, transformational opportunities rather than transactional vendor relationships', noel?.id || null, 'high');
    
    // Stories under Epic 2.3: Top 10 of 1000 Notaries Outreach
    await findOrCreateStory(project.id, epic2_3.id, null, 'Finalize "Top 10 of 1000 Notaries" Email Template', 'Complete email template with subject "Top 10 of 1000 Notaries" and messaging about select group meeting standards of professionalism, punctuality, and background screening', dano?.id || null, 'high');
    await findOrCreateStory(project.id, epic2_3.id, null, 'Develop Follow-Up Message Template', 'Create personalized follow-up message: "I know my team reached out via email, but I wanted to connect personally. Your experience in the industry really stands out. Would love to stay in touch and schedule a short demo when the time is right."', dano?.id || null, 'medium');
    await findOrCreateStory(project.id, epic2_3.id, null, 'Create Integration Messaging Materials', 'Develop materials explaining: Notary Everyday integrates directly with current systems and connects with verified, experienced notaries who help reduce errors and combat fraud through verified signers, background-screened notaries, geo-verified signings, secure audit trails, real-time alerts', dano?.id || null, 'high');
    
    // Stories under Epic 3.1: Expansion Strategy Implementation
    await findOrCreateStory(project.id, epic3_1.id, null, 'Review and Catalog 167 Active Accounts', 'Review lead portfolio of 167 active accounts representing existing clients and high-potential expansion opportunities', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_1.id, null, 'Develop 30-50% Growth Target Plan', 'Create specific plan to increase business from existing clients by 30-50%', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_1.id, null, 'Establish Expansion Tracking System', 'Set up system to track expansion progress and measure success against 30-50% target', irene.id, 'medium');
    
    // Stories under Epic 3.2: Market Penetration - Arizona
    await findOrCreateStory(project.id, epic3_2.id, null, 'Analyze Current Arizona Market Penetration (65% of title companies, 10% share)', 'Document current state: 65% of title companies in AZ, 10% of each company\'s notary business', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_2.id, null, 'Develop Strategy to Increase Share from 10% to 30-50%', 'Create specific strategies to increase market share from 10% to 30-50% of each company\'s notary business', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_2.id, null, 'Implement Arizona Expansion Tactics', 'Execute expansion tactics for Arizona market', irene.id, 'high');
    
    // Stories under Epic 3.3: Market Penetration - Florida
    await findOrCreateStory(project.id, epic3_3.id, null, 'Research Florida Market Landscape', 'Conduct research on Florida market as initial expansion state', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_3.id, null, 'Develop Florida Market Entry Strategy', 'Create strategy for entering Florida market', irene.id, 'medium');
    
    // Stories under Epic 3.4: Funnel Management
    await findOrCreateStory(project.id, epic3_4.id, null, 'Establish Top of Funnel Processes (Irene & Ryan)', 'Set up processes for Irene and Ryan to manage initial touchpoints and introductions', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_4.id, null, 'Define Mid-to-Lower Funnel Escalation Criteria', 'Establish criteria for strategic escalation to Dano (technical discussions) or Noel (executive-level positioning)', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_4.id, null, 'Create Escalation Playbook', 'Document escalation pathways and triggers', irene.id, 'medium');
    
    // Stories under Epic 3.5: Localized Content Strategy
    await findOrCreateStory(project.id, epic3_5.id, null, 'Develop Arizona Localized Content', 'Create geographically tailored materials for Arizona market', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_5.id, null, 'Develop Florida Localized Content', 'Create geographically tailored materials for Florida market', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_5.id, null, 'Create Localized Landing Page Template', 'Develop template for localized landing pages (e.g., "Top 5 Phoenix Notaries", "Top 5 Tampa Notaries")', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_5.id, null, 'Launch "Top 5 Phoenix Notaries" Landing Page', 'Create and launch localized landing page for Phoenix market', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_5.id, null, 'Launch "Top 5 Tampa Notaries" Landing Page', 'Create and launch localized landing page for Tampa market', irene.id, 'medium');
    
    // Stories under Epic 3.6: Top Performer Features
    await findOrCreateStory(project.id, epic3_6.id, null, 'Develop Video Interview Process for Top Notaries', 'Create process for video interviews with top-performing notaries in each city', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_6.id, null, 'Create Written Profile Template', 'Develop template for written profiles showcasing excellence', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_6.id, null, 'Film Top Performer Features for Arizona', 'Conduct video interviews and create written profiles for top Arizona notaries', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_6.id, null, 'Film Top Performer Features for Florida', 'Conduct video interviews and create written profiles for top Florida notaries', irene.id, 'low');
    
    // Stories under Epic 3.7: Certification Visibility
    await findOrCreateStory(project.id, epic3_7.id, null, 'Create Certification Marketing Materials', 'Develop materials prominently displaying Notary Everyday Inc. 0105 Certification', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_7.id, null, 'Document Certification Components for Marketing', 'Document all certification components: Background check completion, $1 million minimum E&O insurance, Internal team screening, ID verification technology enablement, Listed education and qualifications', irene.id, 'high');
    await findOrCreateStory(project.id, epic3_7.id, null, 'Integrate Certification into All Marketing Materials', 'Ensure certification is prominently displayed in all materials', irene.id, 'medium');
    
    // Stories under Epic 3.8: Digital Presence & Notary-Shareable Content
    await findOrCreateStory(project.id, epic3_8.id, null, 'Develop Notary-Shareable Content Strategy', 'Create content for notary personal brand building and community engagement', irene.id, 'medium');
    await findOrCreateStory(project.id, epic3_8.id, null, 'Create Shareable Content Templates', 'Develop templates that notaries can share for personal brand building', irene.id, 'medium');
    
    // Stories under Epic 4.1: Relationship Maintenance
    await findOrCreateStory(project.id, epic4_1.id, null, 'Establish Relationship Maintenance Framework', 'Create framework for maintaining and strengthening existing customer relationships through continuous engagement', null, 'high');
    await findOrCreateStory(project.id, epic4_1.id, null, 'Implement Interpersonal Relationship Focus', 'Focus on interpersonal relationships and consistency in care', null, 'high');
    await findOrCreateStory(project.id, epic4_1.id, null, 'Document Relationship Touchpoint Schedule', 'Establish regular schedule for relationship touchpoints', null, 'medium');
    
    // Stories under Epic 4.2: Client Recognition & Touchpoints
    await findOrCreateStory(project.id, epic4_2.id, null, 'Develop Client Recognition Program', 'Create active recognition program for customer partnerships', null, 'medium');
    await findOrCreateStory(project.id, epic4_2.id, null, 'Implement Regular Touchpoint Demonstrating Partnership Value', 'Establish regular touchpoints that demonstrate partnership value', null, 'high');
    await findOrCreateStory(project.id, epic4_2.id, null, 'Document Current Activities (as of October 31, 2025)', 'Document current retention activities: Dano (Florida and Arizona prospects), Noel (large-scale commitments; Facebook groups for escrow officers), Ryan & Irene (in-person visits Oct 30-31 with goodwill gestures)', null, 'low');
    
    // Stories under Epic 4.3: Expansion Outreach Within Existing Clients
    await findOrCreateStory(project.id, epic4_3.id, null, 'Develop Expansion Outreach Framework (Starting November 3, 2025)', 'Create formal expansion outreach framework for use within existing client organizations', irene.id, 'high');
    await findOrCreateStory(project.id, epic4_3.id, null, 'Finalize Referral-Driven Language', 'Finalize key conversation framework: "Hey, do you mind connecting me with others in the company that can benefit from this?"', irene.id, 'high');
    await findOrCreateStory(project.id, epic4_3.id, null, 'Identify Internal Contacts for Deeper Service Penetration', 'Create process to identify internal contacts for deeper service penetration within existing client organizations', irene.id, 'high');
    await findOrCreateStory(project.id, epic4_3.id, null, 'Create Expansion Pathways', 'Create expansion pathways to increase visibility across client networks', irene.id, 'medium');
    
    // Stories under Epic 5.1: Bridging Excellence Event Strategy
    await findOrCreateStory(project.id, epic5_1.id, null, 'Develop Event Invitation Strategy', 'Create personalized outreach to top-performing professionals, positioning as private, high-value session with tangible outcomes', null, 'high');
    await findOrCreateStory(project.id, epic5_1.id, null, 'Design Event Flow', 'Design event flow including: Welcome and recognition of top professionals, High-performance sales and deal protection training, Panel discussion on closing gaps, Premium food and drinks, Optional after-hours social gathering', null, 'high');
    await findOrCreateStory(project.id, epic5_1.id, null, 'Create Event Marketing Materials', 'Develop materials capturing event media (photos, video, testimonials) and reinforcing positioning as bridge between real estate and closing excellence', null, 'medium');
    await findOrCreateStory(project.id, epic5_1.id, null, 'Position Brand Outcome', 'Ensure event positions Notary Everyday as the organization empowering professionals to protect every deal, elevate every closing, and set the industry standard for trust and execution', null, 'high');
    await findOrCreateStory(project.id, epic5_1.id, null, 'Plan and Schedule First Bridge Event', 'Complete planning and scheduling of first bridge event', null, 'medium');
    
    // Stories under Epic 6.1: Accountability & Success Measures
    await findOrCreateStory(project.id, epic6_1.id, null, 'Establish Acquisition Success Metrics', 'Track: Number of new prospects contacted monthly, Meeting-to-client conversion rate, Strategic partnership agreements signed', null, 'high');
    await findOrCreateStory(project.id, epic6_1.id, null, 'Establish Expansion Success Metrics', 'Track: Percentage increase in business per existing client, New contacts established within existing client organizations, Market share growth in Arizona (baseline: 10% > target: 30-50%)', null, 'high');
    await findOrCreateStory(project.id, epic6_1.id, null, 'Establish Retention Success Metrics', 'Track: Client retention rate (target: 95%+), Relationship touchpoint frequency, Customer satisfaction and NPS scores', null, 'high');
    await findOrCreateStory(project.id, epic6_1.id, null, 'Create Accountability Dashboard', 'Build dashboard showing accountability matrix with owners, responsibilities, and success metrics', null, 'medium');
    
    // Stories under Epic 7.1: Implementation Timeline
    await findOrCreateStory(project.id, epic7_1.id, null, 'Immediate Actions (November 3-10, 2025)', 'Launch formal expansion outreach (Irene & Ryan), Continue acquisition cold outreach (Dano), Advance strategic partnership discussions (Noel)', null, 'high');
    await findOrCreateStory(project.id, epic7_1.id, null, 'Short-term Actions (November-December 2025)', 'Complete localized content for Arizona and Florida, Film and publish top notary features, Plan and schedule first bridge event', null, 'medium');
    await findOrCreateStory(project.id, epic7_1.id, null, 'Medium-term Actions (Q1 2026)', 'Expand to additional regional markets, Scale event strategy to multiple cities, Measure and optimize conversion rates across all three pillars', null, 'low');
    
    console.log();
    
    // Step 7: Verification
    console.log('✅ Verification...');
    const epochCount = await prisma.stacksEpoch.count({ where: { projectId: project.id } });
    const epicCount = await prisma.stacksEpic.count({ where: { projectId: project.id } });
    const storyCount = await prisma.stacksStory.count({ where: { projectId: project.id } });
    
    console.log(`✅ Created ${epochCount} epochs`);
    console.log(`✅ Created ${epicCount} epics`);
    console.log(`✅ Created ${storyCount} stories`);
    console.log();
    
    console.log('='.repeat(80));
    console.log('🎉 Successfully created Notary Everyday Growth Strategy in Stacks!');
    console.log(`📊 Summary:`);
    console.log(`   - Workspace: ${workspace.name}`);
    console.log(`   - Project: ${project.name}`);
    console.log(`   - Epochs: ${epochCount}`);
    console.log(`   - Epics: ${epicCount}`);
    console.log(`   - Stories: ${storyCount}`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error creating growth strategy:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createGrowthStrategy()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

