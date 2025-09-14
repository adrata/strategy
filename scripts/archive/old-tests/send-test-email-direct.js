#!/usr/bin/env node

/**
 * Direct Test Email to Dano using Alternative Method
 */

const { sendEmail } = require('../src/platform/services/ResendService.ts');

async function sendTestEmailDirect() {
  console.log('📧 Sending test buying signal email to Dano directly...\n');
  
  try {
    // Import the sendEmail function directly
    const emailData = {
      to: 'dano@retail-products.com',
      from: 'Test Prospect <test@prospectcompany.com>',
      subject: 'Hey Dano, I want to buy!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hey Dano, I want to buy!</h2>
          
          <p>Hi Dano,</p>
          
          <p>I hope this email finds you well. I've been researching solutions for our company 
          and I'm very interested in <strong>purchasing your platform</strong>.</p>
          
          <p>We have <strong>budget approved</strong> and are looking to make a decision quickly. Could you please 
          send me <strong>pricing</strong> information and schedule a <strong>demo</strong>?</p>
          
          <p>We're <strong>ready to buy</strong> and want to get started as soon as possible. This is <strong>urgent</strong> 
          for our <strong>Q4 timeline</strong>.</p>
          
          <p>Best regards,<br>
          John Smith<br>
          Director of Operations<br>
          Test Prospect Company<br>
          john.smith@prospectcompany.com<br>
          (555) 123-4567</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            🧪 This is a test email to verify real-time webhook processing and Speedrun signal detection.
          </p>
        </div>
      `,
      text: `Hey Dano, I want to buy!

Hi Dano,

I hope this email finds you well. I've been researching solutions for our company and I'm very interested in purchasing your platform.

We have budget approved and are looking to make a decision quickly. Could you please send me pricing information and schedule a demo?

We're ready to buy and want to get started as soon as possible. This is urgent for our Q4 timeline.

Best regards,
John Smith
Director of Operations
Test Prospect Company
john.smith@prospectcompany.com
(555) 123-4567

---
🧪 This is a test email to verify real-time webhook processing and Speedrun signal detection.`,
      replyTo: 'john.smith@prospectcompany.com'
    };

    console.log('📋 Email details:');
    console.log(`   To: ${emailData.to}`);
    console.log(`   From: ${emailData.from}`);
    console.log(`   Subject: ${emailData.subject}`);
    console.log(`   Reply-To: ${emailData.replyTo}\n`);

    // Send using the direct ResendService
    const result = await sendEmail(emailData);

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Email ID:', result.emailId);
      
      console.log('\n🔍 What should happen next:');
      console.log('1. 📧 Email delivered to dano@retail-products.com');
      console.log('2. 🔔 Microsoft Graph webhook triggered (real-time)');
      console.log('3. 🤖 Buying signal detection activated');
      console.log('4. 🚀 Contact moved to top of Speedrun list');
      console.log('5. 📊 Monaco notification generated');
      
      console.log('\n🧪 Buying signals in this email:');
      console.log('• "want to buy" - Explicit purchase intent (Score: 0.9)');
      console.log('• "purchasing" - Purchase keyword');
      console.log('• "budget approved" - Budget confirmation (Score: 0.6)');
      console.log('• "pricing" - Pricing inquiry (Score: 0.8)');
      console.log('• "demo" - Demo request (Score: 0.85)');
      console.log('• "ready to buy" - Explicit purchase intent');
      console.log('• "urgent" - Urgency signal');
      console.log('• "Q4 timeline" - Timeline discussion (Score: 0.5)');
      console.log('• "decision quickly" - Decision urgency');
      
      console.log('\n⏰ Expected processing time: < 30 seconds');
      console.log('💡 Check the Speedrun dashboard to see if the contact appears at the top!');
      
    } else {
      console.log('❌ Failed to send test email');
      console.log('📋 Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

// Run the test
if (require.main === module) {
  sendTestEmailDirect();
}

module.exports = { sendTestEmailDirect };
