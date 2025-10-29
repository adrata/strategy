#!/usr/bin/env node

/**
 * 📧 SEND DAN EMAIL VIA RESEND
 * 
 * This script directly sends an invitation email to dan@adrata.com
 * using the Resend service without going through the API
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple email template without emojis
function generateEmailHTML(data) {
  const { inviterName, workspaceName, invitationLink, expiresAt, userName, firstName } = data;
  
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
    <title>Invitation to join ${workspaceName} workspace on Adrata</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #000000;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .container {
            background: white;
            border: 1px solid #e5e5e5;
            overflow: hidden;
        }
        .header {
            background: #ffffff;
            color: #333333;
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid #e9ecef;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
            color: #333333;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            color: #666666;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            margin-bottom: 24px;
            color: #333333;
            font-weight: 500;
        }
        .main-text {
            font-size: 16px;
            margin-bottom: 24px;
            color: #555555;
            line-height: 1.7;
        }
        .workspace-name {
            font-weight: 600;
            color: #667eea;
        }
        .description {
            font-size: 15px;
            margin-bottom: 32px;
            color: #666666;
            line-height: 1.6;
        }
        .cta-button {
            display: inline-block;
            background: #5B7FFF;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(91, 127, 255, 0.3);
            transition: all 0.3s ease;
            letter-spacing: 0.5px;
        }
        .cta-button:hover {
            background: #4A6BFF;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(91, 127, 255, 0.4);
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .info-section {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #667eea;
        }
        .info-section h3 {
            margin: 0 0 12px 0;
            color: #333333;
            font-size: 16px;
            font-weight: 600;
        }
        .info-section p {
            margin: 0;
            color: #666666;
            font-size: 14px;
            line-height: 1.5;
        }
        .features {
            margin: 32px 0;
        }
        .features h3 {
            font-size: 16px;
            margin-bottom: 16px;
            color: #333333;
            font-weight: 600;
        }
        .features ul {
            margin: 0;
            padding-left: 0;
            list-style: none;
        }
        .features li {
            margin-bottom: 8px;
            color: #555555;
            font-size: 14px;
            position: relative;
            padding-left: 20px;
        }
        .features li:before {
            content: "✓";
            color: #667eea;
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0 0 12px 0;
            color: #666666;
            font-size: 13px;
            line-height: 1.5;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
            word-break: break-all;
        }
        .copyright {
            font-size: 12px;
            color: #999999;
            margin-top: 16px;
        }
        .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 24px 0;
        }
        @media (max-width: 600px) {
            body {
                margin: 0;
                padding: 0;
            }
            .container {
                margin: 0;
                border-radius: 0;
                border: none;
            }
            .header, .content, .footer {
                padding: 20px 16px;
            }
            .header h1 {
                font-size: 22px;
                line-height: 1.3;
            }
            .header p {
                font-size: 14px;
                margin-top: 6px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
            }
            .main-text {
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .description {
                font-size: 14px;
                margin-bottom: 28px;
            }
            .cta-button {
                font-size: 16px;
                padding: 16px 24px;
                min-height: 48px;
                display: block;
                width: 100%;
                box-sizing: border-box;
                text-align: center;
            }
            .button-container {
                margin: 28px 0;
            }
            .info-section {
                padding: 16px;
                margin: 20px 0;
            }
            .info-section h3 {
                font-size: 15px;
                margin-bottom: 8px;
            }
            .info-section p {
                font-size: 13px;
            }
            .features {
                margin: 28px 0;
            }
            .features h3 {
                font-size: 15px;
                margin-bottom: 12px;
            }
            .features li {
                font-size: 13px;
                margin-bottom: 6px;
                padding-left: 18px;
            }
            .footer p {
                font-size: 12px;
                line-height: 1.4;
            }
            .footer a {
                word-break: break-all;
                font-size: 11px;
            }
            .copyright {
                font-size: 11px;
                margin-top: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited!</h1>
            <p>Join ${workspaceName} on Adrata</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hi ${firstName},
            </div>
            
            <div class="main-text">
                You've been invited to join <span class="workspace-name">${workspaceName}</span> on Adrata, our intelligent sales platform that helps teams accelerate revenue growth.
            </div>
            
            <div class="description">
                Get ready to collaborate with your team, manage prospects more effectively, and leverage AI-powered insights to close more deals faster.
            </div>
            
            <div class="button-container">
                <a href="${invitationLink}" class="cta-button">
                    Set Up My Account
                </a>
            </div>
            
            <div class="info-section">
                <h3>Important</h3>
                <p>This invitation expires on <strong>${expirationDate}</strong>. Please set up your account before this date to ensure access.</p>
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
            
            <div class="divider"></div>
            
            <p style="color: #666666; font-size: 14px; margin: 0;">
                Questions? Contact us at <a href="mailto:${inviterName}" style="color: #667eea;">${inviterName}</a>
            </p>
        </div>
        
        <div class="footer">
            <p>
                This invitation was sent by Adrata Client Team via Adrata.
            </p>
            <p>
                Having trouble with the button? Copy and paste this link:<br>
                <a href="${invitationLink}">${invitationLink}</a>
            </p>
            <p class="copyright">
                © ${new Date().getFullYear()} Adrata. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

function generateEmailText(data) {
  const { inviterName, workspaceName, invitationLink, expiresAt, userName, firstName } = data;
  
  const expirationDate = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
You're Invited to Join ${workspaceName} on Adrata

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

async function sendDanEmail() {
  console.log('📧 [SEND EMAIL] Sending invitation email to dan@adrata.com via Resend\n');

  try {
    await prisma.$connect();
    
    // Get Adrata workspace
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
      console.log('❌ Adrata workspace not found');
      return;
    }

    console.log(`🎯 Using workspace: ${workspace.name}`);

    // Get Dan user
    const user = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com', isActive: true },
      select: { id: true, email: true, name: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log('❌ Dan user not found');
      return;
    }

    console.log(`👤 Found user: ${user.name} (${user.email})`);

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Store invitation token
    await prisma.reset_tokens.create({
      data: {
        token: invitationToken,
        userId: user.id,
        expiresAt: expiresAt,
        used: false,
        metadata: {
          type: 'invitation',
          workspaceId: workspace.id,
          role: 'VIEWER',
          invitedBy: user.id,
          invitedAt: new Date().toISOString(),
        }
      }
    });

    console.log(`✅ Generated invitation token: ${invitationToken.substring(0, 8)}...`);

    // Create production invitation link
    const invitationLink = `https://adrata.com/setup-account?token=${invitationToken}`;
    console.log(`🔗 Production Setup URL: ${invitationLink}`);

    // Prepare email data
    const emailData = {
      inviterName: 'Adrata Client Team',
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
      console.log(`\n📧 [MANUAL SEND] You can send this link to Dan manually:`);
      console.log(`Subject: Invitation to join ${workspace.name} workspace on Adrata`);
      console.log(`To: dan@adrata.com`);
      console.log(`Setup Link: ${invitationLink}`);
      return;
    }

    console.log('📧 [EMAIL] Sending email via Resend...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Adrata <noreply@adrata.com>',
        to: [user.email],
        subject: workspace.name === 'Adrata' 
          ? 'Invitation to join Adrata on Adrata'
          : `Invitation to join ${workspace.name} workspace on Adrata`,
        html: generateEmailHTML(emailData),
        text: generateEmailText(emailData),
        reply_to: 'admin@adrata.com'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully!');
      console.log(`   Email ID: ${result.id}`);
      console.log(`   To: ${user.email}`);
      console.log(`   Subject: Invitation to join ${workspace.name} workspace on Adrata`);
    } else {
      const error = await response.text();
      console.log('❌ Email sending failed:', error);
    }

    console.log('\n📋 [SUMMARY]');
    console.log(`   User: ${user.email} (${user.name})`);
    console.log(`   Workspace: ${workspace.name}`);
    console.log(`   Token: ${invitationToken.substring(0, 8)}...`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);
    console.log(`   Setup URL: ${invitationLink}`);

  } catch (error) {
    console.error('❌ [ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendDanEmail();
