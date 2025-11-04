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
  
  const firstNameRaw = userName?.split(' ')[0] || userEmail.split('@')[0];
  // Capitalize first letter of firstName for display
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1).toLowerCase();

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
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 40px 16px;
            }
            .email-container {
                padding: 32px 24px;
                border-radius: 16px;
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
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 48px;
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

  const firstNameRaw = userName?.split(' ')[0] || userEmail.split('@')[0];
  // Capitalize first letter of firstName for display
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1).toLowerCase();
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

Security Note: This invitation link is unique to you and can only be used once. If you didn't expect this invitation, please contact ${inviterEmail}.

Questions? Contact us at ${inviterEmail}

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
