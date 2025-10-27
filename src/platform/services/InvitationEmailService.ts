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
  
  const firstName = userName?.split(' ')[0] || userEmail.split('@')[0];

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
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #000000;
            font-weight: 600;
        }
        .workspace-info {
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            padding: 20px;
            margin: 20px 0;
        }
        .workspace-name {
            font-size: 18px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 8px;
        }
        .workspace-details {
            color: #6b7280;
            font-size: 14px;
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
        .expiration-notice {
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            padding: 15px;
            margin: 20px 0;
            color: #000000;
            font-size: 14px;
        }
        .expiration-notice strong {
            color: #000000;
        }
        .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            color: #666666;
            font-size: 14px;
            border-top: 1px solid #e5e5e5;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .security-note {
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            padding: 15px;
            margin: 20px 0;
            color: #000000;
            font-size: 14px;
        }
        .security-note strong {
            color: #000000;
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
            <p>${workspaceName === 'Adrata' ? 'Join Adrata on Adrata' : `Join ${workspaceName} Workspace on Adrata`}</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hi ${firstName},
            </div>
            
            <p>
                You've been invited to join <strong>${workspaceName}</strong> on Adrata, our intelligent sales platform.
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
                <strong>This invitation expires on ${expirationDate}</strong><br>
                Please set up your account before this date to ensure access.
            </div>
            
            <div class="security-note">
                <strong>Security Note:</strong> This invitation link is unique to you and can only be used once. 
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
                If you have any questions, feel free to reach out to Adrata Client Team.
            </p>
        </div>
        
        <div class="footer">
            <p>
                This invitation was sent by Adrata Client Team via Adrata.<br>
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

  const firstName = userName?.split(' ')[0] || userEmail.split('@')[0];
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

You've been invited to join ${workspaceName} on Adrata, our intelligent sales platform.

You'll be able to collaborate with your team, manage prospects, and leverage AI-powered insights to accelerate your sales process.

Set up your account here: ${invitationLink}

This invitation expires on ${expirationDate}
Please set up your account before this date to ensure access.

Security Note: This invitation link is unique to you and can only be used once. If you didn't expect this invitation, please contact ${inviterEmail}.

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

/**
 * Send invitation email to user
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const subjectText = data.workspaceName === 'Adrata' 
      ? 'Invitation to join Adrata on Adrata'
      : `Invitation to join ${data.workspaceName} workspace on Adrata`;

    const emailResult = await sendEmail({
      to: data.to,
      subject: subjectText,
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
