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
            line-height: 1.8;
            color: #000000;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #ffffff;
        }
        .content {
            padding: 0;
        }
        .greeting {
            font-size: 24px;
            margin-bottom: 40px;
            color: #000000;
            font-weight: 400;
        }
        .main-text {
            font-size: 18px;
            margin-bottom: 50px;
            color: #000000;
            font-weight: 400;
        }
        .workspace-name {
            font-weight: 500;
        }
        .description {
            font-size: 16px;
            margin-bottom: 50px;
            color: #000000;
            font-weight: 400;
        }
        .cta-button {
            display: inline-block;
            background: #007AFF;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 500;
            font-size: 17px;
            margin: 0 0 50px 0;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
            transition: opacity 0.2s ease;
        }
        .cta-button:hover {
            opacity: 0.9;
        }
        .button-container {
            text-align: center;
            margin: 50px 0;
        }
        .expiration-notice {
            margin: 50px 0;
            color: #000000;
            font-size: 16px;
            font-weight: 400;
        }
        .expiration-notice strong {
            color: #000000;
            font-weight: 500;
        }
        .security-note {
            margin: 50px 0;
            color: #000000;
            font-size: 16px;
            font-weight: 400;
        }
        .security-note strong {
            color: #000000;
            font-weight: 500;
        }
        .features {
            margin: 50px 0;
        }
        .features p {
            font-size: 16px;
            margin-bottom: 20px;
            font-weight: 400;
        }
        .features ul {
            margin: 0;
            padding-left: 0;
            list-style: none;
        }
        .features li {
            margin-bottom: 12px;
            color: #000000;
            font-size: 16px;
            font-weight: 400;
            position: relative;
            padding-left: 20px;
        }
        .features li:before {
            content: "•";
            color: #007AFF;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            color: #8E8E93;
            font-size: 14px;
            font-weight: 400;
        }
        .footer a {
            color: #007AFF;
            text-decoration: none;
        }
        .footer p {
            margin: 0 0 20px 0;
        }
        .copyright {
            font-size: 12px;
            color: #8E8E93;
            margin-top: 20px;
        }
        @media (max-width: 600px) {
            body {
                padding: 20px 15px;
            }
            .greeting {
                font-size: 22px;
            }
            .main-text {
                font-size: 16px;
            }
            .description {
                font-size: 15px;
            }
            .cta-button {
                font-size: 16px;
                padding: 14px 28px;
            }
        }
    </style>
</head>
<body>
    <div class="content">
        <div class="greeting">
            Hi ${firstName},
        </div>
        
        <div class="main-text">
            You've been invited to join <span class="workspace-name">${workspaceName}</span> on Adrata, our intelligent sales platform.
        </div>
        
        <div class="description">
            You'll be able to collaborate with your team, manage prospects, and leverage AI-powered insights to accelerate your sales process.
        </div>
        
        <div class="button-container">
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
        
        <div class="features">
            <p>
                Once you've set up your account, you'll be able to:
            </p>
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
        
        <div class="footer">
            <p>
                This invitation was sent by Adrata Client Team via Adrata.<br>
                If you're having trouble with the button above, copy and paste this link into your browser:<br>
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
