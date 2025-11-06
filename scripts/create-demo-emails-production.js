#!/usr/bin/env node

/**
 * CREATE DEMO EMAILS FOR PRODUCTION
 * Adds 3 template emails to the inbox for demo purposes
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Demo emails configuration
const DEMO_EMAILS = [
  {
    subject: 'Welcome to Adrata - Getting Started Guide',
    from: 'Sarah Chen <sarah@adrata.com>',
    to: ['demo@adrata.com'],
    cc: [],
    bcc: [],
    body: `Hi there!

Welcome to Adrata! We're excited to have you on board.

I wanted to reach out and share a quick getting started guide to help you get the most out of Adrata:

1. **Explore the Inbox** - Your centralized email management hub
2. **Connect Your Email Accounts** - Sync your Gmail and Outlook accounts
3. **Set Up Your Workspace** - Configure your team and preferences
4. **Try the Compose Feature** - Use the new compose button to send emails directly

If you have any questions or need assistance, don't hesitate to reach out. We're here to help!

Best regards,
Sarah Chen
Customer Success Manager
Adrata`,
    bodyHtml: `<p>Hi there!</p>
<p>Welcome to Adrata! We're excited to have you on board.</p>
<p>I wanted to reach out and share a quick getting started guide to help you get the most out of Adrata:</p>
<ol>
<li><strong>Explore the Inbox</strong> - Your centralized email management hub</li>
<li><strong>Connect Your Email Accounts</strong> - Sync your Gmail and Outlook accounts</li>
<li><strong>Set Up Your Workspace</strong> - Configure your team and preferences</li>
<li><strong>Try the Compose Feature</strong> - Use the new compose button to send emails directly</li>
</ol>
<p>If you have any questions or need assistance, don't hesitate to reach out. We're here to help!</p>
<p>Best regards,<br>
Sarah Chen<br>
Customer Success Manager<br>
Adrata</p>`,
    isRead: false,
    isImportant: true,
    labels: ['Important', 'Welcome'],
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    provider: 'adrata'
  },
  {
    subject: 'Quarterly Business Review - Action Items',
    from: 'Michael Rodriguez <michael@acmecorp.com>',
    to: ['demo@adrata.com'],
    cc: ['team@acmecorp.com'],
    bcc: [],
    body: `Hello,

Following up on our quarterly business review meeting. Here are the key action items we discussed:

ACTION ITEMS:
1. Review pricing strategy by end of week
2. Schedule follow-up meeting with product team
3. Prepare Q4 budget projections
4. Complete customer feedback analysis

I've attached the meeting notes for your reference. Please let me know if you have any questions or need clarification on any of these items.

Looking forward to working together on these initiatives.

Best,
Michael Rodriguez
VP of Sales
Acme Corp`,
    bodyHtml: `<p>Hello,</p>
<p>Following up on our quarterly business review meeting. Here are the key action items we discussed:</p>
<p><strong>ACTION ITEMS:</strong></p>
<ol>
<li>Review pricing strategy by end of week</li>
<li>Schedule follow-up meeting with product team</li>
<li>Prepare Q4 budget projections</li>
<li>Complete customer feedback analysis</li>
</ol>
<p>I've attached the meeting notes for your reference. Please let me know if you have any questions or need clarification on any of these items.</p>
<p>Looking forward to working together on these initiatives.</p>
<p>Best,<br>
Michael Rodriguez<br>
VP of Sales<br>
Acme Corp</p>`,
    isRead: false,
    isImportant: false,
    labels: ['Business', 'Action Items'],
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    provider: 'gmail',
    attachments: [
      {
        name: 'QBR_Meeting_Notes.pdf',
        filename: 'QBR_Meeting_Notes.pdf',
        size: 245760,
        contentType: 'application/pdf'
      }
    ]
  },
  {
    subject: 'Re: Product Demo Request',
    from: 'Emily Thompson <emily@techstartup.io>',
    to: ['demo@adrata.com'],
    cc: [],
    bcc: [],
    body: `Hi!

Thanks for reaching out about our product demo. I'd be happy to schedule a session with you.

I have availability next week:
- Monday, 2:00 PM - 3:00 PM EST
- Wednesday, 10:00 AM - 11:00 AM EST
- Thursday, 3:00 PM - 4:00 PM EST

Please let me know which time works best for you, and I'll send over a calendar invite with the meeting details.

During the demo, we'll cover:
- Platform overview and key features
- Use cases relevant to your business
- Q&A session

Looking forward to showing you what we've built!

Best regards,
Emily Thompson
Solutions Engineer
TechStartup.io`,
    bodyHtml: `<p>Hi!</p>
<p>Thanks for reaching out about our product demo. I'd be happy to schedule a session with you.</p>
<p>I have availability next week:</p>
<ul>
<li>Monday, 2:00 PM - 3:00 PM EST</li>
<li>Wednesday, 10:00 AM - 11:00 AM EST</li>
<li>Thursday, 3:00 PM - 4:00 PM EST</li>
</ul>
<p>Please let me know which time works best for you, and I'll send over a calendar invite with the meeting details.</p>
<p>During the demo, we'll cover:</p>
<ul>
<li>Platform overview and key features</li>
<li>Use cases relevant to your business</li>
<li>Q&A session</li>
</ul>
<p>Looking forward to showing you what we've built!</p>
<p>Best regards,<br>
Emily Thompson<br>
Solutions Engineer<br>
TechStartup.io</p>`,
    isRead: true,
    isImportant: false,
    labels: ['Demo', 'Follow-up'],
    receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    provider: 'outlook'
  }
];

async function createDemoEmails() {
  try {
    console.log('📧 Creating demo emails for production...\n');

    // Get the Adrata workspace specifically
    const workspace = await prisma.workspaces.findFirst({
      where: { 
        isActive: true,
        OR: [
          { name: 'Adrata' },
          { slug: 'adrata' }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ No active workspace found');
      return;
    }

    console.log(`✅ Using workspace: ${workspace.name} (${workspace.id})\n`);

    // Check if demo emails already exist and delete them
    const existingEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        subject: {
          in: DEMO_EMAILS.map(e => e.subject)
        }
      }
    });

    if (existingEmails.length > 0) {
      console.log(`⚠️  Found ${existingEmails.length} existing demo email(s). Deleting them first...`);
      await prisma.email_messages.deleteMany({
        where: {
          workspaceId: workspace.id,
          subject: {
            in: DEMO_EMAILS.map(e => e.subject)
          }
        }
      });
      console.log(`✅ Deleted ${existingEmails.length} existing demo email(s)\n`);
    }

    // Create demo emails
    const createdEmails = [];
    for (const emailData of DEMO_EMAILS) {
      const messageId = `demo-${crypto.randomBytes(16).toString('hex')}`;
      const threadId = `thread-${crypto.randomBytes(16).toString('hex')}`;

      const email = await prisma.email_messages.create({
        data: {
          workspaceId: workspace.id,
          provider: emailData.provider,
          messageId: messageId,
          threadId: threadId,
          subject: emailData.subject,
          body: emailData.body,
          bodyHtml: emailData.bodyHtml,
          from: emailData.from,
          to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
          cc: emailData.cc || [],
          bcc: emailData.bcc || [],
          sentAt: emailData.sentAt,
          receivedAt: emailData.receivedAt,
          isRead: emailData.isRead,
          isImportant: emailData.isImportant || false,
          attachments: emailData.attachments || [],
          labels: emailData.labels || []
        }
      });

      createdEmails.push(email);
      console.log(`✅ Created: ${email.subject}`);
    }

    console.log(`\n🎉 Successfully created ${createdEmails.length} demo emails!`);
    console.log('\n📋 Created emails:');
    createdEmails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email.subject} (${email.isRead ? 'Read' : 'Unread'})`);
    });

  } catch (error) {
    console.error('❌ Error creating demo emails:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDemoEmails()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

