#!/usr/bin/env node

/**
 * Create Notary Everyday Growth Strategy Documents for Vision Tab
 * 
 * This script creates pitch and paper documents in the Vision tab
 * that capture the complete Growth Strategy 2025 plan.
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

// Find Notary Everyday workspace
async function findNotaryEverydayWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  // First try to find by exact slug
  let workspace = await prisma.workspaces.findUnique({
    where: { slug: 'notary-everyday' }
  });
  
  // If not found, try by name
  if (!workspace) {
    workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } },
          { slug: { contains: 'ne', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });
  }
  
  if (!workspace) {
    throw new Error('Notary Everyday workspace not found!');
  }
  
  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
  console.log(`   Slug: ${workspace.slug}\n`);
  return workspace;
}

// Create pitch document content
function createPitchContent() {
  return {
    slides: {
      cover: {
        title: 'Notary Everyday Growth Strategy 2025',
        subtitle: 'Excellence in Notary Fulfillment',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        presenter: 'Notary Everyday Leadership Team'
      },
      purpose: {
        title: 'Our Purpose',
        content: 'Build systematic growth through relationship-driven engagement while maintaining unwavering clarity about our value proposition: excellence in notary fulfillment.',
        description: 'Three-pillar approach: Acquisition, Expansion, and Retention'
      },
      mission: {
        title: 'Our Mission',
        targets: [
          { label: 'Acquisition', value: 'New business development through systematic outreach', progress: 0 },
          { label: 'Expansion', value: 'Increase business from existing clients by 30-50%', progress: 0 },
          { label: 'Retention', value: 'Maintain 95%+ client retention rate', progress: 0 }
        ]
      },
      values: {
        title: 'Our Core Values',
        values: [
          { name: 'Clarity', description: 'Every touchpoint tells the same story. Dano\'s emails, Noel\'s boardrooms, Irene\'s calls, Ryan\'s connections—identical message.' },
          { name: 'Consistency', description: 'Our voice never changes. Emails sound like our website. Website sounds like our events. Events sound like our conversations.' },
          { name: 'Human Connection', description: 'Build genuine relationships through every channel—calls, visits, emails, videos. People feel understood, not like they\'re on a list.' },
          { name: 'Repetition', description: 'We say it again and again. Recognition takes time. Trust is built through consistency. Every interaction reinforces: Notary Everyday represents excellence.' }
        ]
      },
      progress: {
        title: 'Progress Against Mission',
        metrics: [
          { label: 'Arizona Market Penetration', value: '65% of title companies', change: 'Target: 30-50% share per company' },
          { label: 'Active Accounts', value: '167 accounts', change: 'High-potential expansion opportunities' },
          { label: 'Current Share', value: '10% per company', change: 'Target: 30-50%' }
        ]
      },
      stories: {
        title: 'Key Strategies',
        stories: [
          'Cold Outreach Initiative - Systematic outreach across all target segments (Dano)',
          'Strategic Partnerships - Enterprise-level "whale hunting" for transformational partnerships (Noel)',
          'Expansion Strategy - 30-50% growth target from existing clients (Irene & Ryan)',
          'Top 10 of 1000 Notaries - Positioning network as premier standard',
          'Bridging Excellence Events - Unite top professionals to elevate closing standards'
        ]
      },
      understanding: {
        title: 'Key Insights',
        insights: [
          'The quality of a signing defines the client experience and protects every deal',
          'Marketing is about values - we must be really clear about what we want them to know about us',
          'Three years from now, "Notary Everyday" means one thing: Excellence',
          'The closing experience defines the partnership experience',
          'Recognition takes time - trust is built through consistency'
        ]
      },
      frameworks: {
        title: 'Growth Pillars',
        departments: [
          { name: 'Acquisition', framework: 'Cold Outreach (Dano) + Strategic Partnerships (Noel)' },
          { name: 'Expansion', framework: 'Market Penetration + Content Strategy + Certification Visibility (Irene & Ryan)' },
          { name: 'Retention', framework: 'Relationship Maintenance + Client Recognition + Expansion Outreach (All Team)' }
        ]
      },
      direction: {
        title: 'Next Steps',
        priorities: [
          'Launch formal expansion outreach (November 3-10, 2025)',
          'Complete localized content for Arizona and Florida',
          'Film and publish top notary features',
          'Plan and schedule first bridge event',
          'Expand to additional regional markets (Q1 2026)'
        ]
      },
      outro: {
        title: 'Together We Build the Future',
        quote: 'Marketing is about values. It\'s a complicated and noisy world, and we\'re not going to get a chance to get people to remember much about us. No company is. So we have to be really clear about what we want them to know about us.',
        author: 'Steve Jobs, 1997',
        message: 'We are Notary Everyday. We stand for notary excellence. Every single thing we do proves it.'
      }
    }
  };
}

// Create paper document content (using Lexical format)
function createPaperContent() {
  // Lexical editor format
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Notary Everyday Growth Strategy 2025',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h1',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Executive Summary',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'This strategic framework establishes a structured, three-pillar approach to sustainable growth: Acquisition, Expansion, and Retention. Each pillar has defined ownership, clear target segments, and aligned messaging that positions Notary Everyday as the premier standard for notary fulfillment excellence.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Core Objective: Build systematic growth through relationship-driven engagement while maintaining unwavering clarity about our value proposition, excellence in notary fulfillment.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Strategic Foundation',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Our growth strategy is anchored in a foundational belief: "Marketing is about values. It\'s a complicated and noisy world, and we\'re not going to get a chance to get people to remember much about us. No company is. So we have to be really clear about what we want them to know about us." - Steve Jobs, 1997',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'What We Want Them to Know:',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '• What we do: Deliver exceptional notary quality & fulfillment',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          listType: 'bullet',
          start: 1,
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '• How we do it: Through professionalism, technology, and integrity',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          listType: 'bullet',
          start: 1,
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '• Why it matters: The quality of a signing defines the client experience and protects every deal',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          listType: 'bullet',
          start: 1,
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Growth Pillar 1: Acquisition',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Cold Outreach Initiative (Owner: Dano)',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h3',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Target Segments: Underwriter-owned title agencies, Independent title agencies, Settlement companies, Escrow companies, Independent agencies combining services, Underwriter-managed escrow/settlement companies.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Strategic Partnerships (Owner: Noel)',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h3',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Enterprise-level "whale hunting" for transformational partnerships: Tech industry leaders, Title production software providers, Holding and parent companies, Underwriter partnerships.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Growth Pillar 2: Expansion',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Target: Increase business from existing clients by 30-50% (Owners: Irene & Ryan)',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Lead Portfolio: 167 active accounts representing existing clients and high-potential expansion opportunities.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Primary Market: Arizona - Current penetration: 65% of title companies in AZ, Current share: 10% of each company\'s notary business, Target share: 30-50% of each company\'s notary business.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Secondary Markets: Florida (initial expansion state), Additional regional partnerships to follow.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Growth Pillar 3: Retention',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Strategic Objective: Maintain and strengthen existing customer relationships through continuous engagement and personal connection. Focus on interpersonal relationships and consistency in care.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Accountability Matrix',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '• Acquisition - Cold: Dano (New client acquisition rate, meeting conversion)',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          listType: 'bullet',
          start: 1,
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '• Acquisition - Strategic: Noel (Partnership deals closed, integration launches)',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          listType: 'bullet',
          start: 1,
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '• Expansion: Irene & Ryan (Revenue growth per client 30-50% target)',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          listType: 'bullet',
          start: 1,
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '• Retention: All team members (Client retention rate 95%+, satisfaction scores)',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          listType: 'bullet',
          start: 1,
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Success Measures',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Acquisition: Number of new prospects contacted monthly, Meeting-to-client conversion rate, Strategic partnership agreements signed.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Expansion: Percentage increase in business per existing client, New contacts established within existing client organizations, Market share growth in Arizona (baseline: 10% > target: 30-50%).',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Retention: Client retention rate (target: 95%+), Relationship touchpoint frequency, Customer satisfaction and NPS scores.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Conclusion',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'heading',
          tag: 'h2',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'This growth strategy unifies our team around a singular vision: excellence in notary fulfillment. Through disciplined execution across Acquisition, Expansion, and Retention, and unwavering clarity in our messaging, Notary Everyday will establish itself as the indispensable partner for every professional who values quality, integrity, and exceptional closing experiences.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Our competitive advantage lies not in what we sell, but in what we stand for. Every interaction, every touchpoint, every relationship should leave no doubt: Notary Everyday represents the future standard of our industry.',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  };
}

// Main execution function
async function createDocuments() {
  try {
    console.log('🚀 Creating Notary Everyday Growth Strategy Documents\n');
    console.log('='.repeat(80));
    
    // Find workspace
    const workspace = await findNotaryEverydayWorkspace();
    console.log();
    
    // Find or use a user (prefer Ross, then Ryan, then Noel)
    let owner = await findUserByEmail('ross@adrata.com') ||
                await findUserByEmail('ross@notaryeveryday.com') ||
                await findUserByEmail('ryan@notaryeveryday.com') ||
                await findUserByEmail('ryan@notary-everyday.com') ||
                await findUserByEmail('noel@notaryeveryday.com');
    
    if (!owner) {
      // Try to find any user in the workspace
      const workspaceUser = await prisma.workspace_users.findFirst({
        where: { workspaceId: workspace.id },
        include: { user: true }
      });
      
      if (workspaceUser && workspaceUser.user) {
        owner = workspaceUser.user;
      } else {
        throw new Error('No user found to own documents');
      }
    }
    
    console.log(`✅ Using owner: ${owner.name} (${owner.email})`);
    console.log();
    
    // Create pitch document
    console.log('📝 Creating pitch document...');
    const pitchContent = createPitchContent();
    
    const pitchDocument = await prisma.workshopDocument.create({
      data: {
        title: 'Notary Everyday Growth Strategy 2025 - Pitch',
        description: 'Executive presentation of the Growth Strategy 2025 - Three-pillar approach to sustainable growth',
        documentType: 'pitch',
        workspaceId: workspace.id,
        ownerId: owner.id,
        createdById: owner.id,
        content: pitchContent,
        fileType: 'application/json',
        status: 'published',
        tags: ['growth-strategy', '2025', 'notary-everyday', 'vision'],
        isStarred: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Created pitch document: ${pitchDocument.title} (${pitchDocument.id})`);
    console.log();
    
    // Create paper document
    console.log('📄 Creating paper document...');
    const paperContent = createPaperContent();
    
    const paperDocument = await prisma.workshopDocument.create({
      data: {
        title: 'Notary Everyday Growth Strategy 2025 - Complete Strategy Document',
        description: 'Comprehensive strategic framework for Notary Everyday growth - Acquisition, Expansion, and Retention pillars',
        documentType: 'paper',
        workspaceId: workspace.id,
        ownerId: owner.id,
        createdById: owner.id,
        content: paperContent,
        fileType: 'application/json',
        status: 'published',
        tags: ['growth-strategy', '2025', 'notary-everyday', 'vision', 'strategy'],
        isStarred: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Created paper document: ${paperDocument.title} (${paperDocument.id})`);
    console.log();
    
    console.log('='.repeat(80));
    console.log('🎉 Successfully created Growth Strategy documents!');
    console.log(`📊 Summary:`);
    console.log(`   - Workspace: ${workspace.name}`);
    console.log(`   - Pitch Document: ${pitchDocument.title}`);
    console.log(`   - Paper Document: ${paperDocument.title}`);
    console.log(`   - Both documents are published and starred`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error creating documents:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDocuments()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

