#!/usr/bin/env node

/**
 * 📧 SEND RYAN SERRATO WELCOME EMAIL (PRODUCTION)
 * 
 * This script sends a welcome email to ryan@notaryeveryday.com
 * in the Notary Everyday workspace using Resend API directly
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Email template matching the InvitationEmailService format
function generateEmailHTML(data) {
  const { inviterName, workspaceName, invitationLink, expiresAt, userName } = data;
  
  const firstName = userName?.split(' ')[0] || 'there';
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
            background-color: #f6f9fc;
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
            width: 100%;
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
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 40px 16px;
            }
            .header {
                margin-bottom: 32px;
            }
            .header h1 {
                font-size: 24px;
            }
            .header p {
                font-size: 15px;
            }
            .greeting {
                font-size: 15px;
                margin-bottom: 20px;
            }
            .main-text {
                font-size: 15px;
                margin-bottom: 20px;
            }
            .description {
                font-size: 15px;
                margin-bottom: 28px;
            }
            .cta-button {
                font-size: 15px;
                padding: 14px 24px;
                display: block;
                width: 100%;
                box-sizing: border-box;
                color: #ffffff !important;
            }
            .button-container {
                margin: 28px 0 32px 0;
            }
            .info-section {
                margin: 28px 0;
            }
            .info-section p {
                font-size: 14px;
            }
            .features {
                margin: 32px 0;
            }
            .features h3 {
                font-size: 14px;
                margin-bottom: 12px;
            }
            .features li {
                font-size: 14px;
                margin-bottom: 8px;
            }
            .footer {
                padding: 32px 0 0 0;
                margin-top: 40px;
            }
            .footer p {
                font-size: 13px;
            }
            .footer a {
                font-size: 13px;
            }
            .copyright {
                font-size: 12px;
                margin-top: 20px;
            }
            .help-text {
                font-size: 14px;
                margin: 28px 0 0 0;
            }
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
                    Questions? Contact us at <a href="mailto:${inviterName}">${inviterName}</a>
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

function generateEmailText(data) {
  const { inviterName, workspaceName, invitationLink, expiresAt, userName } = data;
  
  const firstName = userName?.split(' ')[0] || 'there';
  const headerText = workspaceName === 'Adrata' ? 'Join Adrata on Adrata' : `Join ${workspaceName} Workspace on Adrata`;
  const expirationDate = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
You're Invited to ${headerText}

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

Security Note: This invitation link is unique to you and can only be used once. If you didn't expect this invitation, please contact ${inviterName}.

Questions? Contact us at ${inviterName}

---
This invitation was sent by Adrata Client Team via Adrata.
© ${new Date().getFullYear()} Adrata. All rights reserved.
  `.trim();
}

async function sendRyanWelcomeEmail() {
  console.log('📧 [SEND WELCOME EMAIL] Sending welcome email to Ryan Serrato\n');

  try {
    await prisma.$connect();
    
    // Find Ryan user
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'ryan@notaryeveryday.com' },
          { email: 'ryan@notary-everyday.com' },
          { name: { contains: 'Ryan Serrato', mode: 'insensitive' } }
        ]
      },
      select: { id: true, email: true, name: true, firstName: true, lastName: true }
    });
    
    if (!user) {
      console.log('❌ Ryan user not found');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Get Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { 
        isActive: true,
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: 'notary-everyday' },
          { slug: 'ne' }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`🎯 Using workspace: ${workspace.name} (${workspace.id})`);
    console.log(`👤 Using user: ${user.name} (${user.email})`);

    // Invalidate any previous unused tokens for Ryan
    console.log('🔒 Invalidating previous tokens...');
    await prisma.reset_tokens.updateMany({
      where: {
        userId: user.id,
        used: false
      },
      data: {
        used: true
      }
    });
    console.log('✅ Previous tokens invalidated');

    // Generate new secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Store invitation token - ensure it's user-specific
    await prisma.reset_tokens.create({
      data: {
        token: invitationToken,
        userId: user.id, // This ensures only this user can use the token
        expiresAt: expiresAt,
        used: false,
        metadata: {
          type: 'invitation',
          workspaceId: workspace.id,
          role: 'WORKSPACE_ADMIN', // Ryan is a WORKSPACE_ADMIN
          invitedBy: user.id,
          invitedAt: new Date().toISOString(),
        }
      }
    });

    console.log(`✅ Generated secure invitation token: ${invitationToken.substring(0, 8)}...`);
    console.log(`   Token is user-specific (userId: ${user.id}) - only this user can use it`);

    // Create production invitation link
    const baseUrl = 'https://adrata.com';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

    console.log(`🔗 Production Setup URL: ${invitationLink}`);

    // Prepare email data
    const emailData = {
      inviterName: 'noreply@adrata.com',
      workspaceName: workspace.name,
      invitationLink: invitationLink,
      expiresAt: expiresAt,
      userName: user.name,
      firstName: user.firstName || user.name.split(' ')[0]
    };

    // Check if RESEND_API_KEY is available
    if (!process.env.RESEND_API_KEY) {
      console.log('❌ RESEND_API_KEY not found in environment variables');
      console.log('   Please set RESEND_API_KEY in your .env file');
      console.log(`\n📧 [MANUAL SEND] You can send this link to Ryan manually:`);
      console.log(`Subject: Invitation to join ${workspace.name} workspace on Adrata`);
      console.log(`To: ${user.email}`);
      console.log(`Setup Link: ${invitationLink}`);
      return;
    }

    console.log('\n📧 [EMAIL] Sending welcome email via Resend...');

    const subjectText = workspace.name === 'Adrata' 
      ? 'Invitation to join Adrata on Adrata'
      : `Invitation to join ${workspace.name} workspace on Adrata`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Adrata <noreply@adrata.com>',
        to: [user.email],
        subject: subjectText,
        html: generateEmailHTML(emailData),
        text: generateEmailText(emailData),
        reply_to: 'noreply@adrata.com'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Welcome email sent successfully!');
      console.log(`   Email ID: ${result.id}`);
      console.log(`   To: ${user.email}`);
      console.log(`   Subject: ${subjectText}`);
      console.log(`   Setup Link: ${invitationLink}`);
      console.log(`\n🔒 Security: Token is user-specific and can only be used by ${user.email}`);
      console.log('   Previous tokens have been invalidated');
      console.log(`   Token expires: ${expiresAt.toLocaleString()}`);
    } else {
      const error = await response.text();
      console.log('❌ Email sending failed:', error);
      console.log(`\n📧 [MANUAL SEND] You can send this link to Ryan manually:`);
      console.log(`Subject: ${subjectText}`);
      console.log(`To: ${user.email}`);
      console.log(`Setup Link: ${invitationLink}`);
    }

    console.log('\n📋 [SUMMARY]');
    console.log(`   User: ${user.email} (${user.name})`);
    console.log(`   Workspace: ${workspace.name}`);
    console.log(`   Token: ${invitationToken.substring(0, 8)}...`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);
    console.log(`   Setup URL: ${invitationLink}`);

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendRyanWelcomeEmail();
