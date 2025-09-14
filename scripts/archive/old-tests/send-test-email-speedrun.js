#!/usr/bin/env node

/**
 * Send Test Email to Dano using Speedrun EmailService
 * 
 * Uses the existing Speedrun EmailService which supports Gmail API and Mailgun
 */

// Import the Speedrun EmailService directly
const path = require('path');
const fs = require('fs');

// Check if we're in Node.js environment and set up module resolution
const isNode = typeof window === 'undefined';

async function sendTestEmailViaSpeedrun() {
  console.log('📧 Sending test buying signal email to Dano using Speedrun EmailService...\n');
  
  try {
    // Define the email content
    const emailData = {
      to: 'dano@retail-products.com',
      subject: 'Hey Dano, I want to buy!',
      body: `Hey Dano,

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
🧪 This is a test email to verify real-time webhook processing and Speedrun signal detection.`
    };

    console.log('📋 Email details:');
    console.log(`   To: ${emailData.to}`);
    console.log(`   Subject: ${emailData.subject}`);
    console.log(`   Body preview: ${emailData.body.substring(0, 100)}...\n`);

    // Create the API call to test the speedrun email endpoint
    const fetch = require('node-fetch').default || require('node-fetch');
    
    // Try sending via our new email API endpoint first
    console.log('🔧 Testing email API endpoint...');
    
    const response = await fetch('https://action.adrata.com/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        from: 'Test Prospect <test@prospectcompany.com>',
        replyTo: 'john.smith@prospectcompany.com'
      })
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log('✅ Test email sent successfully via API!');
      console.log('📋 Response:', result);
      
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
      console.log('❌ API failed, trying alternative method...');
      console.log('📋 API Response:', result);
      console.log('Status:', response.status, response.statusText);
      
      // Fallback to using a direct Resend call
      console.log('\n🔄 Trying Resend API directly...');
      
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Test Prospect <test@prospectcompany.com>',
          to: [emailData.to],
          subject: emailData.subject,
          text: emailData.body,
          reply_to: 'john.smith@prospectcompany.com'
        })
      });
      
      if (resendResponse.ok) {
        const resendResult = await resendResponse.json();
        console.log('✅ Email sent via Resend directly!');
        console.log('📧 Email ID:', resendResult.id);
      } else {
        console.log('❌ Resend also failed:', await resendResponse.text());
        
        // Final fallback - provide manual email content
        console.log('\n📝 Manual email option:');
        console.log('Since automated sending failed, you can manually send this email:');
        console.log('\n📧 Email Template:');
        console.log('─'.repeat(50));
        console.log(`To: ${emailData.to}`);
        console.log(`From: Your email (reply-to: john.smith@prospectcompany.com)`);
        console.log(`Subject: ${emailData.subject}`);
        console.log('─'.repeat(50));
        console.log(emailData.body);
        console.log('─'.repeat(50));
        
        console.log('\n🎯 This email will test:');
        console.log('• Real-time webhook processing');
        console.log('• Buying signal detection');
        console.log('• Speedrun prioritization');
        console.log('• Monaco notifications');
      }
    }

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    
    // Provide manual email as backup
    console.log('\n📧 Manual Email Template (copy and send manually):');
    console.log('═'.repeat(60));
    console.log('To: dano@retail-products.com');
    console.log('From: john.smith@prospectcompany.com (or your email)');
    console.log('Subject: Hey Dano, I want to buy!');
    console.log('═'.repeat(60));
    console.log(`Hey Dano,

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
🧪 This is a test email to verify real-time webhook processing and Speedrun signal detection.`);
    console.log('═'.repeat(60));
  }
}

// Check if we can access environment variables
function checkEmailConfiguration() {
  console.log('🔧 Checking email configuration...');
  
  const resendKey = process.env.RESEND_API_KEY;
  const mailgunKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  
  console.log(`   Resend API Key: ${resendKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Mailgun API Key: ${mailgunKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Mailgun Domain: ${mailgunDomain ? '✅ Configured' : '❌ Missing'}`);
  
  if (resendKey || (mailgunKey && mailgunDomain)) {
    console.log('✅ Email sending should work\n');
    return true;
  } else {
    console.log('⚠️ No email providers configured, will try API endpoint\n');
    return false;
  }
}

// Run the test
if (require.main === module) {
  checkEmailConfiguration();
  sendTestEmailViaSpeedrun();
}

module.exports = { sendTestEmailViaSpeedrun };
