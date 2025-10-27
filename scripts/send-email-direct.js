#!/usr/bin/env node

/**
 * 📧 DIRECT EMAIL SENDING
 * 
 * This script directly sends an invitation email to ross@adrata.com
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
            background: #000000;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            color: #cccccc;
        }
        .content {
            padding: 30px;
        }
        .welcome {
            font-size: 18px;
            margin-bottom: 20px;
            color: #000000;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
            border: 1px solid #2563eb;
        }
        .cta-button:hover {
            background: #2563eb;
        }
        .features {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e5e5e5;
        }
        .features h3 {
            margin: 0 0 15px 0;
            color: #000000;
            font-size: 16px;
        }
        .features ul {
            margin: 0;
            padding-left: 20px;
        }
        .features li {
            margin-bottom: 8px;
            color: #333333;
        }
        .expiration-notice {
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .security-note {
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            color: #666666;
            font-size: 14px;
            border-top: 1px solid #e5e5e5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited!</h1>
            <p>${workspaceName === 'Adrata' ? 'Join Adrata on Adrata' : `Join ${workspaceName} Workspace on Adrata`}</p>
        </div>
        
        <div class="content">
            <div class="welcome">
                Hi ${firstName || userName},
            </div>
            
            <p>
                You've been invited to join <strong>${workspaceName}</strong> on Adrata, our intelligent sales platform.
            </p>
            
            <p>
                You'll be able to collaborate with your team, manage prospects, and leverage AI-powered insights to accelerate your sales process.
            </p>
            
            <div style="text-align: center;">
                <a href="${invitationLink}" class="cta-button">
                    Set Up My Account
                </a>
            </div>
            
            <div class="expiration-notice">
                <strong>This invitation expires on ${expirationDate}</strong><br>
                Please set up your account before this date to ensure access.
            </div>
            
            <div class="security-note">
                <strong>Security Note:</strong> This invitation link is unique to you and can only be used once. 
                If you didn't expect this invitation, please contact ${inviterName}.
            </div>
            
            <div class="features">
                <h3>Once you've set up your account, you'll be able to:</h3>
                <ul>
                    <li>Access your personalized dashboard</li>
                    <li>Collaborate with your team in real-time</li>
                    <li>Leverage AI-powered sales insights</li>
                    <li>Manage your pipeline and prospects</li>
                </ul>
            </div>
            
            <p>
                If you have any questions, feel free to reach out to Adrata Client Team.
            </p>
        </div>
        
        <div class="footer">
            <p>This invitation was sent by Adrata Client Team via Adrata.</p>
            <p>&copy; ${new Date().getFullYear()} Adrata. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
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

  const headerText = workspaceName === 'Adrata' ? 'Join Adrata on Adrata' : `Join ${workspaceName} Workspace on Adrata`;
  
  return `
You're Invited to ${headerText}

Hi ${firstName || userName},

You've been invited to join ${workspaceName} on Adrata, our intelligent sales platform.

You'll be able to collaborate with your team, manage prospects, and leverage AI-powered insights to accelerate your sales process.

Set up your account here: ${invitationLink}

This invitation expires on ${expirationDate}
Please set up your account before this date to ensure access.

Security Note: This invitation link is unique to you and can only be used once. If you didn't expect this invitation, please contact ${inviterName}.

Once you've set up your account, you'll be able to:
• Access your personalized dashboard
• Collaborate with your team in real-time
• Leverage AI-powered sales insights
• Manage your pipeline and prospects

If you have any questions, feel free to reach out to Adrata Client Team.

---
This invitation was sent by Adrata Client Team via Adrata.
© ${new Date().getFullYear()} Adrata. All rights reserved.
  `.trim();
}

async function sendRossInvitation() {
  console.log('📧 [SEND INVITATION] Sending invitation email to ross@adrata.com\n');

  try {
    await prisma.$connect();
    
    // Get workspace info
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ No active workspace found');
      return;
    }

    console.log(`🎯 Using workspace: ${workspace.name}`);

    // Get Ross user
    const user = await prisma.users.findFirst({
      where: { email: 'ross@adrata.com', isActive: true },
      select: { id: true, email: true, name: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log('❌ Ross user not found');
      return;
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

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

    // Create invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

    console.log(`🔗 Setup URL: ${invitationLink}`);

    // Send email using Resend directly
    console.log('\n📧 [EMAIL] Sending invitation email...');
    
    const emailData = {
      inviterName: 'Adrata Client Team',
      workspaceName: workspace.name,
      invitationLink: invitationLink,
      expiresAt: expiresAt,
      userName: user.name,
      firstName: user.firstName || user.name.split(' ')[0]
    };

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
sendRossInvitation();
