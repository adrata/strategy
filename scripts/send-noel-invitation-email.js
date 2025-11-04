#!/usr/bin/env node

/**
 * SEND INVITATION EMAIL TO NOEL FOR PASSWORD SETUP
 * 
 * Sends Noel an invitation email so he can set up his password for Notary Everyday workspace
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();

// Import the email template functions (we'll recreate them here)
function generateInvitationEmailHTML(data) {
  const {
    inviterName,
    inviterEmail,
    workspaceName,
    invitationLink,
    expiresAt,
    userEmail,
    userName
  } = data;

  const firstNameRaw = userName?.split(' ')[0] || userEmail.split('@')[0];
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1).toLowerCase();
  const expirationDate = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're invited to join ${workspaceName} on Adrata</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #0a2540;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 60px 20px;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 48px 40px;
            box-sizing: border-box;
        }
        .header {
            padding: 0;
            margin-bottom: 40px;
        }
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
            color: #0a2540;
            line-height: 1.3;
        }
        .header p {
            margin: 0;
            font-size: 16px;
            color: #425466;
        }
        .content {
            padding: 0;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 24px;
            color: #0a2540;
            font-weight: 400;
        }
        .main-text {
            font-size: 16px;
            margin-bottom: 24px;
            color: #0a2540;
            line-height: 1.7;
        }
        .workspace-name {
            font-weight: 600;
            color: #0a2540;
        }
        .description {
            font-size: 16px;
            margin-bottom: 32px;
            color: #425466;
            line-height: 1.7;
        }
        .cta-button {
            display: inline-block;
            background: #0a2540;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            text-align: center;
            letter-spacing: 0;
        }
        .cta-button:hover {
            background: #1a365d;
            color: #ffffff !important;
        }
        .button-container {
            margin: 32px 0 40px 0;
        }
        .info-section {
            margin: 32px 0;
            padding: 0;
        }
        .info-section p {
            margin: 0;
            color: #425466;
            font-size: 15px;
            line-height: 1.6;
        }
        .info-section strong {
            color: #0a2540;
            font-weight: 600;
        }
        .features {
            margin: 40px 0;
        }
        .features h3 {
            font-size: 15px;
            margin-bottom: 16px;
            color: #0a2540;
            font-weight: 600;
        }
        .features ul {
            margin: 0;
            padding-left: 0;
            list-style: none;
        }
        .features li {
            margin-bottom: 10px;
            color: #425466;
            font-size: 15px;
            line-height: 1.6;
            padding-left: 24px;
            position: relative;
        }
        .features li:before {
            content: "•";
            color: #425466;
            position: absolute;
            left: 8px;
            font-size: 16px;
            line-height: 1.5;
        }
        .footer {
            padding: 40px 0 0 0;
            margin-top: 48px;
            border-top: 1px solid #e3e8ef;
        }
        .footer p {
            margin: 0 0 12px 0;
            color: #8898aa;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer a {
            color: #0a2540;
            text-decoration: none;
            word-break: break-all;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .copyright {
            font-size: 13px;
            color: #8898aa;
            margin-top: 24px;
        }
        .help-text {
            color: #425466;
            font-size: 15px;
            margin: 32px 0 0 0;
            line-height: 1.6;
        }
        .help-text a {
            color: #0a2540;
            text-decoration: none;
        }
        .help-text a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <h1>You're invited to ${workspaceName}</h1>
                <p>Join your team on Adrata</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hi ${firstName},
                </div>
                
                <div class="main-text">
                    You've been invited to join <span class="workspace-name">${workspaceName}</span> on Adrata.
                </div>
                
                <div class="description">
                    Adrata helps teams accelerate revenue growth with intelligent sales tools and AI-powered insights.
                </div>
                
                <div class="button-container">
                    <a href="${invitationLink}" class="cta-button">
                        Accept invitation
                    </a>
                </div>
                
                <div class="info-section">
                    <p>This invitation expires on <strong>${expirationDate}</strong>. Please accept it before then.</p>
                </div>
                
                <div class="features">
                    <h3>What you'll get access to:</h3>
                    <ul>
                        <li>Personalized sales dashboard</li>
                        <li>Real-time team collaboration</li>
                        <li>AI-powered sales insights</li>
                        <li>Advanced pipeline management</li>
                        <li>Prospect intelligence tools</li>
                    </ul>
                </div>
                
                <div class="help-text">
                    Questions? Contact us at <a href="mailto:${inviterEmail}">${inviterEmail}</a>
                </div>
            </div>
            
            <div class="footer">
                <p>
                    Having trouble with the button? Copy and paste this link into your browser:
                </p>
                <p>
                    <a href="${invitationLink}">${invitationLink}</a>
                </p>
                <p class="copyright">
                    © ${new Date().getFullYear()} Adrata. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

function generateInvitationEmailText(data) {
  const {
    inviterName,
    inviterEmail,
    workspaceName,
    invitationLink,
    expiresAt,
    userEmail,
    userName
  } = data;

  const firstNameRaw = userName?.split(' ')[0] || userEmail.split('@')[0];
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1).toLowerCase();
  const expirationDate = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
You're Invited to join ${workspaceName} workspace on Adrata

Hi ${firstName},

You've been invited to join ${workspaceName} on Adrata, our intelligent sales platform that helps teams accelerate revenue growth.

Get ready to collaborate with your team, manage prospects more effectively, and leverage AI-powered insights to close more deals faster.

Set up your account here: ${invitationLink}

IMPORTANT: This invitation expires on ${expirationDate}
Please set up your account before this date to ensure access.

What you'll get access to:
✓ Personalized sales dashboard
✓ Real-time team collaboration
✓ AI-powered sales insights
✓ Advanced pipeline management
✓ Prospect intelligence tools

Security Note: This invitation link is unique to you and can only be used once. If you didn't expect this invitation, please contact ${inviterEmail}.

Questions? Contact us at ${inviterEmail}

---
This invitation was sent by Adrata Client Team via Adrata.
© ${new Date().getFullYear()} Adrata. All rights reserved.
  `.trim();
}

async function sendNoelInvitationEmail() {
  try {
    console.log('📧 Sending invitation email to Noel for password setup...\n');

    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Step 1: Find Noel
    console.log('👤 Finding Noel user...');
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!noel) {
      throw new Error('Noel user not found!');
    }

    console.log(`✅ Found Noel: ${noel.name} (${noel.email})\n`);

    // Step 2: Find Notary Everyday workspace
    console.log('🏢 Finding Notary Everyday workspace...');
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: 'notary-everyday' }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    console.log(`✅ Found workspace: ${workspace.name}\n`);

    // Step 3: Check Noel's membership and role
    console.log('🔍 Checking workspace membership...');
    const membership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: noel.id
      }
    });

    if (!membership) {
      throw new Error('Noel is not a member of Notary Everyday workspace!');
    }

    console.log(`✅ Noel is a member with role: ${membership.role}\n`);

    // Step 4: Check for existing unused invitation tokens
    console.log('🔍 Checking for existing unused invitation tokens...');
    const existingToken = await prisma.reset_tokens.findFirst({
      where: {
        userId: noel.id,
        used: false,
        expiresAt: { gt: new Date() },
        metadata: {
          path: ['type'],
          equals: 'invitation'
        }
      }
    });

    let invitationToken;
    let expiresAt;

    if (existingToken) {
      console.log(`⚠️  Found existing unused invitation token (expires: ${existingToken.expiresAt.toLocaleString()})`);
      console.log(`   Using existing token...\n`);
      invitationToken = existingToken.token;
      expiresAt = existingToken.expiresAt;
    } else {
      // Step 5: Generate new invitation token
      console.log('🔐 Generating new invitation token...');
      invitationToken = crypto.randomBytes(32).toString('hex');
      expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // Store invitation token
      await prisma.reset_tokens.create({
        data: {
          token: invitationToken,
          userId: noel.id,
          expiresAt: expiresAt,
          used: false,
          metadata: {
            type: 'invitation',
            workspaceId: workspace.id,
            role: membership.role,
            invitedBy: noel.id, // Self-invitation for password setup
            invitedAt: new Date().toISOString(),
          }
        }
      });

      console.log(`✅ Created invitation token (expires: ${expiresAt.toLocaleString()})\n`);
    }

    // Step 6: Create invitation link
    // Use production URL - check environment or default to adrata.com
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://adrata.com';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;
    console.log(`🔗 Invitation link: ${invitationLink}`);
    console.log(`   Base URL: ${baseUrl}\n`);

    // Step 7: Get inviter details (use a default or find admin user)
    const inviter = await prisma.users.findFirst({
      where: {
        email: { contains: '@adrata.com' }
      },
      select: { name: true, email: true }
    }) || {
      name: 'Adrata Team',
      email: 'support@adrata.com'
    };

    console.log(`📧 Preparing email...`);
    console.log(`   To: ${noel.email}`);
    console.log(`   Workspace: ${workspace.name}`);
    console.log(`   Inviter: ${inviter.name} (${inviter.email})\n`);

    // Step 8: Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.log('⚠️  RESEND_API_KEY not found in environment variables');
      console.log('   Email will not be sent automatically.\n');
      console.log('📋 EMAIL DETAILS (for manual sending):');
      console.log('='.repeat(60));
      console.log(`To: ${noel.email}`);
      console.log(`Subject: Invitation to join ${workspace.name} workspace on Adrata`);
      console.log(`\nInvitation Link: ${invitationLink}`);
      console.log(`Expires: ${expiresAt.toLocaleString()}\n`);
      return;
    }

    const resend = new Resend(resendApiKey);

    const emailData = {
      to: noel.email,
      inviterName: inviter.name,
      inviterEmail: inviter.email,
      workspaceName: workspace.name,
      invitationLink: invitationLink,
      expiresAt: expiresAt,
      userEmail: noel.email,
      userName: noel.name,
    };

    const subject = `Invitation to join ${workspace.name} workspace on Adrata`;

    console.log('📤 Sending email via Resend...');
    const result = await resend.emails.send({
      from: 'Adrata <noreply@adrata.com>',
      to: noel.email,
      subject: subject,
      html: generateInvitationEmailHTML(emailData),
      text: generateInvitationEmailText(emailData),
      replyTo: inviter.email,
    });

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${result.data?.id || 'N/A'}\n`);

    console.log('📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ User: ${noel.name} (${noel.email})`);
    console.log(`✅ Workspace: ${workspace.name}`);
    console.log(`✅ Role: ${membership.role}`);
    console.log(`✅ Invitation Link: ${invitationLink}`);
    console.log(`✅ Expires: ${expiresAt.toLocaleString()}`);
    console.log(`\n🎉 Noel should receive an email with instructions to set up his password!`);
    console.log(`   He can click the link to access the password setup page.`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendNoelInvitationEmail();

