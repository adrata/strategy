import { sendEmail } from './ResendService';

export interface InvitationEmailData {
  to: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  invitationLink: string;
  expiresAt: Date;
  userEmail: string;
  userName?: string;
}

/**
 * Professional email template for user invitations
 */
export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const { 
    inviterName, 
    inviterEmail, 
    workspaceName, 
    invitationLink, 
    expiresAt, 
    userEmail,
    userName 
  } = data;

  const displayName = userName || userEmail.split('@')[0];
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
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .workspace-info {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .workspace-name {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .workspace-details {
            color: #6b7280;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 30px 0;
            text-align: center;
            transition: transform 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-1px);
        }
        .expiration-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
            font-size: 14px;
        }
        .expiration-notice strong {
            color: #b45309;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .security-note {
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #065f46;
            font-size: 14px;
        }
        .security-note strong {
            color: #047857;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .header h1 {
                font-size: 24px;
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
                Hi ${displayName},
            </div>
            
            <p>
                <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join 
                <strong>${workspaceName}</strong> on Adrata, our intelligent sales platform.
            </p>
            
            <div class="workspace-info">
                <div class="workspace-name">${workspaceName}</div>
                <div class="workspace-details">
                    You'll be able to collaborate with your team, manage prospects, and leverage AI-powered insights to accelerate your sales process.
                </div>
            </div>
            
            <p>
                Click the button below to set up your account and get started:
            </p>
            
            <div style="text-align: center;">
                <a href="${invitationLink}" class="cta-button">
                    Set Up My Account
                </a>
            </div>
            
            <div class="expiration-notice">
                <strong>⏰ This invitation expires on ${expirationDate}</strong><br>
                Please set up your account before this date to ensure access.
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Note:</strong> This invitation link is unique to you and can only be used once. 
                If you didn't expect this invitation, please contact ${inviterEmail}.
            </div>
            
            <p>
                Once you've set up your account, you'll be able to:
            </p>
            <ul>
                <li>Access your personalized dashboard</li>
                <li>Collaborate with your team in real-time</li>
                <li>Leverage AI-powered sales insights</li>
                <li>Manage your pipeline and prospects</li>
            </ul>
            
            <p>
                If you have any questions, feel free to reach out to ${inviterName} at ${inviterEmail}.
            </p>
        </div>
        
        <div class="footer">
            <p>
                This invitation was sent by ${inviterName} via Adrata.<br>
                If you're having trouble with the button above, copy and paste this link into your browser:<br>
                <a href="${invitationLink}">${invitationLink}</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Adrata. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version of invitation email
 */
export function generateInvitationEmailText(data: InvitationEmailData): string {
  const { 
    inviterName, 
    inviterEmail, 
    workspaceName, 
    invitationLink, 
    expiresAt, 
    userEmail,
    userName 
  } = data;

  const displayName = userName || userEmail.split('@')[0];
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

Hi ${displayName},

${inviterName} (${inviterEmail}) has invited you to join ${workspaceName} on Adrata, our intelligent sales platform.

You'll be able to collaborate with your team, manage prospects, and leverage AI-powered insights to accelerate your sales process.

Set up your account here: ${invitationLink}

⏰ This invitation expires on ${expirationDate}
Please set up your account before this date to ensure access.

🔒 Security Note: This invitation link is unique to you and can only be used once. If you didn't expect this invitation, please contact ${inviterEmail}.

Once you've set up your account, you'll be able to:
• Access your personalized dashboard
• Collaborate with your team in real-time
• Leverage AI-powered sales insights
• Manage your pipeline and prospects

If you have any questions, feel free to reach out to ${inviterName} at ${inviterEmail}.

---
This invitation was sent by ${inviterName} via Adrata.
© ${new Date().getFullYear()} Adrata. All rights reserved.
  `.trim();
}

/**
 * Send invitation email to user
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const emailResult = await sendEmail({
      to: data.to,
      subject: `You're invited to join ${data.workspaceName} on Adrata`,
      html: generateInvitationEmailHTML(data),
      text: generateInvitationEmailText(data),
      from: "Adrata <noreply@adrata.com>",
      replyTo: data.inviterEmail,
    });

    if (emailResult.success) {
      console.log(`✅ [INVITATION EMAIL] Sent successfully to ${data.to}`);
      return { success: true };
    } else {
      console.error(`❌ [INVITATION EMAIL] Failed to send to ${data.to}:`, emailResult.error);
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    console.error(`❌ [INVITATION EMAIL] Error sending to ${data.to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
