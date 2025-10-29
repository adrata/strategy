#!/usr/bin/env node

/**
 * 📧 SEND DAN WELCOME EMAIL TO PRODUCTION
 * 
 * This script sends a welcome email to dan@adrata.com
 * with a production setup link
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple email template
function generateWelcomeEmailHTML(data) {
  const { userName, workspaceName, invitationLink, expiresAt } = data;
  const firstName = userName?.split(' ')[0] || 'Dan';
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
    <title>Welcome to ${workspaceName} on Adrata</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
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
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to Adrata!</h1>
            <p>Set up your account for ${workspaceName}</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hi ${firstName},
            </div>
            
            <div class="main-text">
                Welcome to <strong>${workspaceName}</strong> on Adrata! You're all set up in the workspace and ready to start using our intelligent sales platform.
            </div>
            
            <div class="main-text">
                Click the button below to set up your password and complete your account setup:
            </div>
            
            <div class="button-container">
                <a href="${invitationLink}" class="cta-button">
                    Set Up My Password
                </a>
            </div>
            
            <p style="color: #666666; font-size: 14px; margin: 0;">
                This setup link expires on <strong>${expirationDate}</strong>.
            </p>
        </div>
        
        <div class="footer">
            <p>
                Having trouble with the button? Copy and paste this link:<br>
                <a href="${invitationLink}">${invitationLink}</a>
            </p>
            <p>
                © ${new Date().getFullYear()} Adrata. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

async function sendDanWelcomeEmail() {
  console.log('📧 [SEND WELCOME EMAIL] Sending welcome email to dan@adrata.com for production\n');

  try {
    await prisma.$connect();
    
    // Get Adrata workspace specifically
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
          type: 'welcome',
          workspaceId: workspace.id,
          role: 'VIEWER',
          invitedBy: user.id,
          invitedAt: new Date().toISOString(),
        }
      }
    });

    console.log(`✅ Generated welcome token: ${invitationToken.substring(0, 8)}...`);

    // Create production invitation link
    const invitationLink = `https://adrata.com/setup-account?token=${invitationToken}`;
    console.log(`🔗 Production Setup URL: ${invitationLink}`);

    // Generate email content
    const emailData = {
      userName: user.name,
      workspaceName: workspace.name,
      invitationLink: invitationLink,
      expiresAt: expiresAt
    };

    const htmlContent = generateWelcomeEmailHTML(emailData);
    const textContent = `
Welcome to ${workspace.name} on Adrata!

Hi ${user.name?.split(' ')[0] || 'Dan'},

Welcome to ${workspace.name} on Adrata! You're all set up in the workspace and ready to start using our intelligent sales platform.

Set up your password here: ${invitationLink}

This setup link expires on ${expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}.

© ${new Date().getFullYear()} Adrata. All rights reserved.
    `.trim();

    console.log('\n📧 [EMAIL CONTENT] Generated email content:');
    console.log('Subject: Welcome to Adrata - Set up your password');
    console.log('To: dan@adrata.com');
    console.log('From: Adrata <noreply@adrata.com>');
    console.log(`Setup Link: ${invitationLink}`);
    console.log(`Expires: ${expiresAt.toLocaleString()}`);

    console.log('\n✅ [SUCCESS] Welcome email content generated!');
    console.log('\nTo send the actual email, you can:');
    console.log('1. Copy the setup link and send it to Dan manually');
    console.log('2. Use the admin panel to resend invitation');
    console.log('3. Use the Resend API directly (requires API key)');
    console.log(`\nSetup Link: ${invitationLink}`);

  } catch (error) {
    console.error('❌ Error generating welcome email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendDanWelcomeEmail();
