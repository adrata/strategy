import { Resend } from "resend";

// Initialize Resend with API key (conditional for build safety)
const resend = process['env']['RESEND_API_KEY'] ? new Resend(process['env']['RESEND_API_KEY']) : null;

export interface EmailData {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResponse> {
  try {
    if (!process['env']['RESEND_API_KEY'] || !resend) {
      console.warn("⚠️ [RESEND] API key not configured, skipping email send");
      return {
        success: false,
        error: "RESEND_API_KEY is not configured"
      };
    }

    const response = await resend.emails.send({
      from: emailData.from || "Adrata <noreply@adrata.com>",
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      replyTo: emailData.replyTo,
      cc: emailData.cc,
      bcc: emailData.bcc,
      attachments: emailData.attachments,
    });

    if (response.error) {
      console.error("❌ [RESEND] Error sending email:", response.error);
      return {
        success: false,
        error: response.error.message || "Failed to send email",
      };
    }

    console.log("✅ [RESEND] Email sent successfully:", response.data?.id);
    return {
      success: true,
      emailId: response.data?.id,
    };
  } catch (error) {
    console.error("❌ [RESEND] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send form submission notification to team
 */
export async function sendFormNotification(formData: {
  formType: string;
  name?: string;
  email: string;
  company?: string;
  phone?: string;
  message?: string;
  additionalFields?: Record<string, any>;
}): Promise<EmailResponse> {
  const { formType, name, email, company, phone, message, additionalFields } = formData;

  let emailSubject = "";
  let emailBody = "";

  // Build email content based on form type
  switch (formType) {
    case "contact":
      emailSubject = `New Contact Form Submission from ${name || email}`;
      emailBody = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        ${additionalFields ? `<p><strong>Additional Details:</strong></p><pre>${JSON.stringify(additionalFields, null, 2)}</pre>` : ''}
        <hr>
        <p><small>Submitted via Adrata Contact Form at ${new Date().toLocaleString()}</small></p>
      `;
      break;

    case "demo":
      emailSubject = `Demo Request from ${name || email} at ${company || 'Unknown Company'}`;
      emailBody = `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        ${additionalFields ? `<p><strong>Additional Details:</strong></p><pre>${JSON.stringify(additionalFields, null, 2)}</pre>` : ''}
        <hr>
        <p><small>Submitted via Adrata Demo Request Form at ${new Date().toLocaleString()}</small></p>
      `;
      break;

    case "security":
      emailSubject = `Security Assessment Request from ${name || email}`;
      emailBody = `
        <h2>Security Assessment Request</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        ${additionalFields ? `<p><strong>Additional Details:</strong></p><pre>${JSON.stringify(additionalFields, null, 2)}</pre>` : ''}
        <hr>
        <p><small>Submitted via Adrata Security Assessment Form at ${new Date().toLocaleString()}</small></p>
      `;
      break;

    default:
      emailSubject = `New ${formType} Form Submission from ${name || email}`;
      emailBody = `
        <h2>New ${formType} Form Submission</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        ${additionalFields ? `<p><strong>Additional Details:</strong></p><pre>${JSON.stringify(additionalFields, null, 2)}</pre>` : ''}
        <hr>
        <p><small>Submitted via Adrata ${formType} Form at ${new Date().toLocaleString()}</small></p>
      `;
  }

  return sendEmail({
    to: ["dan@adrata.com"],
    subject: emailSubject,
    html: emailBody,
    replyTo: email,
  });
}

/**
 * Send confirmation email to user
 */
export async function sendConfirmationEmail(userData: {
  name?: string;
  email: string;
  formType: string;
  message?: string;
}): Promise<EmailResponse> {
  const { name, email, formType, message } = userData;

  const subject = "Thank you for contacting Adrata";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0066cc;">Thank you for contacting Adrata!</h2>
      <p>Hi ${name || 'there'},</p>
      <p>We've received your ${formType} form submission and will get back to you soon.</p>
      
      ${message ? `
        <p>Here's a summary of what you sent:</p>
        <div style="border-left: 3px solid #0066cc; padding-left: 16px; margin: 16px 0; background-color: #f9f9f9; padding: 16px;">
          ${message}
        </div>
      ` : ''}
      
      <p>We typically respond within 24 hours during business days.</p>
      <p>Best regards,<br><strong>The Adrata Team</strong></p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
      <p style="font-size: 12px; color: #666;">
        This is an automated confirmation. Please do not reply to this email.<br>
        If you need immediate assistance, please contact us at <a href="mailto:support@adrata.com">support@adrata.com</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: [email],
    subject,
    html,
    from: "Adrata Team <noreply@adrata.com>",
  });
}

/**
 * Test Resend configuration
 */
export async function testResendConfiguration(): Promise<{
  configured: boolean;
  error?: string;
}> {
  try {
    if (!process['env']['RESEND_API_KEY']) {
      return {
        configured: false,
        error: "RESEND_API_KEY environment variable is not set",
      };
    }

    // Test API key by attempting to get domain info
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${process['env']['RESEND_API_KEY']}`,
      },
    });

    if (!response.ok) {
      return {
        configured: false,
        error: `Invalid API key or API error: ${response.status}`,
      };
    }

    return {
      configured: true,
    };
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Resend configuration status
 */
export function getResendStatus(): {
  configured: boolean;
  apiKey: string;
  recommendation: string;
} {
  const apiKey = process['env']['RESEND_API_KEY'];
  const configured = !!apiKey;

  return {
    configured,
    apiKey: configured ? `${apiKey?.substring(0, 8)}...` : "Not configured",
    recommendation: configured
      ? "Resend is configured and ready to send emails."
      : "Please set RESEND_API_KEY environment variable to enable email sending.",
  };
} 