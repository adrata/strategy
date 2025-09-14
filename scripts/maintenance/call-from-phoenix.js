#!/usr/bin/env node

/**
 * 📞 CALL FROM PHOENIX NUMBER
 * Makes a call to +13027574107 from the Phoenix (602) number
 */

const twilio = require("twilio");

async function callFromPhoenix() {
  try {
    console.log("📞 CALLING FROM PHOENIX NUMBER");
    console.log("==============================");

    // Initialize Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID || "CREDENTIAL_REMOVED_FOR_SECURITY",
      process.env.TWILIO_AUTH_TOKEN || "CREDENTIAL_REMOVED_FOR_SECURITY",
    );

    const phoenixNumber = "+16025669750";
    const targetNumber = "+13027574107";

    console.log(`🌵 From: ${phoenixNumber} (Phoenix, AZ)`);
    console.log(`🎯 To: ${targetNumber} (Your phone)`);
    console.log("");

    // Create the call with a Phoenix-themed message
    const call = await client.calls.create({
      to: targetNumber,
      from: phoenixNumber,
      twiml: `
        <Response>
          <Say voice="alice">
            Hello! This is a test call from your Phoenix, Arizona phone number. 
            Your Adrata calling system now has local presence across multiple cities.
            This call is coming from area code 6-0-2 in Phoenix.
            Your local number system is working perfectly!
            You can now call leads with local numbers for better answer rates.
            Thank you for testing the Phoenix number!
          </Say>
          <Pause length="2"/>
          <Say voice="alice">
            This call will end automatically in 3 seconds.
          </Say>
          <Pause length="3"/>
        </Response>
      `,
    });

    console.log("🎉 PHOENIX CALL INITIATED!");
    console.log(`📞 Call SID: ${call.sid}`);
    console.log(`📱 Status: ${call.status}`);
    console.log(`🌵 From: ${call.from} (Phoenix, AZ)`);
    console.log(`🎯 To: ${call.to}`);
    console.log("");
    console.log("🔔 Your phone should be ringing from (602) 566-9750!");
    console.log("🌵 Phoenix local presence activated!");

    return call;
  } catch (error) {
    console.error("❌ Phoenix call failed:", error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  callFromPhoenix().catch(console.error);
}

module.exports = callFromPhoenix;
