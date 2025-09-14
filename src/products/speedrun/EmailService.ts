// Email Service - Handles sending emails via Gmail API and storing email history
// Supports both plain text (Gmail-to-Gmail style) and HTML emails

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  leadId?: string;
  type: "introduction" | "follow-up" | "meeting-request" | "proposal" | "other";
}

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  leadId?: string;
  type: string;
  status: "sent" | "failed" | "pending";
  provider: "gmail" | "mailgun";
  messageId?: string;
}

/**
 * Send email via Gmail API or Mailgun
 * Prioritizes Gmail API for more natural delivery
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Try Gmail API first (more natural delivery)
    const success = await sendViaGmail(emailData);

    if (success) {
      await storeEmailHistory(emailData, "gmail", "sent");
      return true;
    }

    // Fallback to Mailgun if Gmail fails
    const mailgunSuccess = await sendViaMailgun(emailData);

    if (mailgunSuccess) {
      await storeEmailHistory(emailData, "mailgun", "sent");
      return true;
    }

    await storeEmailHistory(emailData, "gmail", "failed");
    return false;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    await storeEmailHistory(emailData, "gmail", "failed");
    return false;
  }
}

/**
 * Send email via Gmail API for natural delivery
 */
async function sendViaGmail(emailData: EmailData): Promise<boolean> {
  try {
    // Check if Gmail API is configured
    const accessToken = await getGmailAccessToken();
    if (!accessToken) {
      console.log("📧 Gmail API not configured, will try Mailgun");
      return false;
    }

    // Format email as plain text (Gmail-to-Gmail style)
    const plainTextEmail = formatAsPlainText(emailData);

    // Create Gmail message
    const message = createGmailMessage(
      emailData.to,
      emailData.subject,
      plainTextEmail,
    );

    // Send via Gmail API
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: btoa(message)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, ""),
        }),
      },
    );

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Email sent via Gmail:", result.id);
      return true;
    } else {
      console.error("❌ Gmail API error:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("❌ Gmail sending error:", error);
    return false;
  }
}

/**
 * Send email via Mailgun as fallback
 */
async function sendViaMailgun(emailData: EmailData): Promise<boolean> {
  try {
    const mailgunApiKey = process['env']['MAILGUN_API_KEY'];
    const mailgunDomain = process['env']['MAILGUN_DOMAIN'];

    if (!mailgunApiKey || !mailgunDomain) {
      console.log("📧 Mailgun not configured");
      return false;
    }

    // Format email as plain text for natural appearance
    const plainTextEmail = formatAsPlainText(emailData);

    const formData = new FormData();
    formData.append("from", `Adrata <noreply@${mailgunDomain}>`);
    formData.append("to", emailData.to);
    formData.append("subject", emailData.subject);
    formData.append("text", plainTextEmail);

    const response = await fetch(
      `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
        body: formData,
      },
    );

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Email sent via Mailgun:", result.id);
      return true;
    } else {
      console.error("❌ Mailgun error:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("❌ Mailgun sending error:", error);
    return false;
  }
}

/**
 * Get Gmail access token from stored credentials
 */
async function getGmailAccessToken(): Promise<string | null> {
  try {
    // Check localStorage for stored token
    const storedAuth = localStorage.getItem("gmail-auth");
    if (storedAuth) {
      const auth = JSON.parse(storedAuth);

      // Check if token is still valid
      if (auth.expires_at > Date.now()) {
        return auth.access_token;
      }

      // Try to refresh token
      if (auth.refresh_token) {
        const refreshedToken = await refreshGmailToken(auth.refresh_token);
        if (refreshedToken) {
          return refreshedToken;
        }
      }
    }

    // No valid token available
    return null;
  } catch (error) {
    console.error("❌ Error getting Gmail token:", error);
    return null;
  }
}

/**
 * Refresh Gmail access token
 */
async function refreshGmailToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/gmail/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      const tokens = await response.json();

      // Store new tokens
      localStorage.setItem(
        "gmail-auth",
        JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || refreshToken,
          expires_at: Date.now() + tokens.expires_in * 1000,
        }),
      );

      return tokens.access_token;
    }

    return null;
  } catch (error) {
    console.error("❌ Error refreshing Gmail token:", error);
    return null;
  }
}

/**
 * Format email as natural plain text (Gmail-to-Gmail style)
 */
function formatAsPlainText(emailData: EmailData): string {
  // Remove any HTML tags and format as natural plain text
  let plainText = emailData.body;

  // Remove HTML if present
  plainText = plainText.replace(/<[^>]*>/g, "");

  // Ensure proper line spacing for readability
  plainText = plainText.replace(/\n\n\n+/g, "\n\n");

  // Add natural email formatting
  plainText = plainText.trim();

  return plainText;
}

/**
 * Create Gmail-formatted message
 */
function createGmailMessage(to: string, subject: string, body: string): string {
  const messageParts = [
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    body,
  ];

  return messageParts.join("\n");
}

/**
 * Store email in history for tracking
 */
async function storeEmailHistory(
  emailData: EmailData,
  provider: "gmail" | "mailgun",
  status: "sent" | "failed" | "pending",
): Promise<void> {
  try {
    const emailRecord: SentEmail = {
      id: generateEmailId(),
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      sentAt: new Date().toISOString(),
      leadId: emailData.leadId,
      type: emailData.type,
      status,
      provider,
    };

    // Store in localStorage for now (in production, would store in database)
    const existingHistory = localStorage.getItem("speedrun-email-history");
    const history: SentEmail[] = existingHistory
      ? JSON.parse(existingHistory)
      : [];

    history.unshift(emailRecord); // Add to beginning

    // Keep only last 1000 emails
    if (history.length > 1000) {
      history.splice(1000);
    }

    localStorage.setItem("speedrun-email-history", JSON.stringify(history));

    console.log(`📧 Email ${status} and stored in history`);
  } catch (error) {
    console.error("❌ Error storing email history:", error);
  }
}

/**
 * Get email history for a lead
 */
export function getEmailHistory(leadId?: string): SentEmail[] {
  try {
    const stored = localStorage.getItem("speedrun-email-history");
    if (!stored) return [];

    const history: SentEmail[] = JSON.parse(stored);

    if (leadId) {
      return history.filter((email) => email['leadId'] === leadId);
    }

    return history;
  } catch (error) {
    console.error("❌ Error loading email history:", error);
    return [];
  }
}

/**
 * Generate unique email ID
 */
function generateEmailId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{
  gmail: boolean;
  mailgun: boolean;
  recommendation: string;
}> {
  const results = {
    gmail: false,
    mailgun: false,
    recommendation: "",
  };

  // Test Gmail
  try {
    const gmailToken = await getGmailAccessToken();
    results['gmail'] = !!gmailToken;
  } catch (error) {
    console.error("Gmail test failed:", error);
  }

  // Test Mailgun
  try {
    const mailgunApiKey = process['env']['MAILGUN_API_KEY'];
    const mailgunDomain = process['env']['MAILGUN_DOMAIN'];
    results['mailgun'] = !!(mailgunApiKey && mailgunDomain);
  } catch (error) {
    console.error("Mailgun test failed:", error);
  }

  // Provide recommendation
  if (results['gmail'] && results.mailgun) {
    results['recommendation'] =
      "Both Gmail and Mailgun are configured. Emails will be sent via Gmail for better deliverability with Mailgun as fallback.";
  } else if (results.gmail) {
    results['recommendation'] =
      "Gmail is configured. Emails will be sent via Gmail API for natural delivery.";
  } else if (results.mailgun) {
    results['recommendation'] =
      "Only Mailgun is configured. Consider setting up Gmail API for better deliverability.";
  } else {
    results['recommendation'] =
      "No email providers configured. Please set up Gmail API or Mailgun to send emails.";
  }

  return results;
}

/**
 * Required environment variables for email functionality
 */
export const REQUIRED_EMAIL_ENV_VARS = {
  gmail: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  mailgun: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"],
};
