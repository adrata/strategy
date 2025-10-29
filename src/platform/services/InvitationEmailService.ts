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
            .email-container {
                margin: 0;
                border-radius: 0;
                box-shadow: none;
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
    <div class="email-container">
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
                <h3>⏰ Important</h3>
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
                Questions? Contact us at <a href="mailto:${inviterEmail}" style="color: #667eea;">${inviterEmail}</a>
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
