#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const twilio = require("twilio");

const prisma = new PrismaClient();

// Twilio configuration
const accountSid =
  process.env.TWILIO_ACCOUNT_SID || "CREDENTIAL_REMOVED_FOR_SECURITY";
const authToken =
  process.env.TWILIO_AUTH_TOKEN || "CREDENTIAL_REMOVED_FOR_SECURITY";
const client = twilio(accountSid, authToken);

// Dan's callback number for forwarding
const callbackNumber = "+13477496383";

async function analyzeAreaCodes() {
  console.log("🎯 UPGRADING TO 100% LOCAL COVERAGE");
  console.log("===================================");
  console.log("");

  const leads = await prisma.lead.findMany({
    where: { workspaceId: "adrata" },
    select: { phone: true, firstName: true, lastName: true, company: true },
  });

  const areaCodeMap = new Map();
  let totalWithValidPhone = 0;

  leads.forEach((lead) => {
    if (lead.phone) {
      // Clean phone number - remove all non-digits
      const cleanPhone = lead.phone.replace(/\D/g, "");

      // Check if it's a valid US phone number (10 or 11 digits)
      if (
        cleanPhone.length === 10 ||
        (cleanPhone.length === 11 && cleanPhone.startsWith("1"))
      ) {
        totalWithValidPhone++;
        // Extract area code (first 3 digits after country code)
        const areaCode =
          cleanPhone.length === 11
            ? cleanPhone.substring(1, 4)
            : cleanPhone.substring(0, 3);

        if (!areaCodeMap.has(areaCode)) {
          areaCodeMap.set(areaCode, []);
        }
        areaCodeMap.get(areaCode).push({
          name: `${lead.firstName} ${lead.lastName}`,
          company: lead.company,
          phone: lead.phone,
        });
      }
    }
  });

  const sortedAreaCodes = Array.from(areaCodeMap.entries()).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  console.log(
    `📱 Total prospects with valid phone numbers: ${totalWithValidPhone}/408`,
  );
  console.log(`📞 Unique area codes needed: ${sortedAreaCodes.length}`);
  console.log("");

  // Show top area codes
  console.log("🏆 TOP 20 AREA CODES BY PROSPECT COUNT:");
  console.log("======================================");
  sortedAreaCodes.slice(0, 20).forEach(([areaCode, prospects], index) => {
    const rank = (index + 1).toString().padStart(2);
    console.log(`${rank}. ${areaCode}: ${prospects.length} prospects`);
  });
  console.log("");

  // Cost analysis
  const totalAreaCodes = sortedAreaCodes.length;
  const costPerNumber = 1.15; // Verified Twilio pricing
  const monthlyCost = totalAreaCodes * costPerNumber;
  const annualCost = monthlyCost * 12;

  console.log("💰 COMPLETE COVERAGE COST BREAKDOWN:");
  console.log("====================================");
  console.log(`• Area codes to purchase: ${totalAreaCodes}`);
  console.log(`• Monthly cost: $${monthlyCost.toFixed(2)}`);
  console.log(`• Annual cost: $${annualCost.toFixed(2)}`);
  console.log(
    `• Cost per prospect: $${(monthlyCost / totalWithValidPhone).toFixed(3)}/month`,
  );
  console.log("");

  return { sortedAreaCodes, totalAreaCodes, monthlyCost };
}

async function getCurrentNumbers() {
  console.log("📋 CHECKING CURRENT PHONE NUMBERS:");
  console.log("==================================");

  try {
    const incomingNumbers = await client.incomingPhoneNumbers.list();

    console.log(`Current phone numbers: ${incomingNumbers.length}`);
    incomingNumbers.forEach((number, index) => {
      const areaCode = number.phoneNumber.substring(2, 5);
      console.log(
        `${index + 1}. ${number.phoneNumber} (${areaCode}) - ${number.friendlyName || "No name"}`,
      );
    });
    console.log("");

    return incomingNumbers.map((num) => num.phoneNumber.substring(2, 5));
  } catch (error) {
    console.error("Error fetching current numbers:", error.message);
    return [];
  }
}

async function purchasePhoneNumber(areaCode, prospectCount) {
  try {
    console.log(
      `🔍 Searching for number in area code ${areaCode} (${prospectCount} prospects)...`,
    );

    // Search for available local numbers in this area code
    const availableNumbers = await client
      .availablePhoneNumbers("US")
      .local.list({
        areaCode: areaCode,
        limit: 5,
      });

    if (availableNumbers.length === 0) {
      console.log(`❌ No numbers available in area code ${areaCode}`);
      return null;
    }

    const selectedNumber = availableNumbers[0].phoneNumber;
    console.log(`✅ Found available number: ${selectedNumber}`);

    // Purchase the number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: selectedNumber,
      friendlyName: `Local ${areaCode} - ${prospectCount} prospects`,
      voiceUrl: "https://adrata.vercel.app/api/twilio/voice",
      voiceMethod: "POST",
      statusCallback: "https://adrata.vercel.app/api/twilio/status",
      statusCallbackMethod: "POST",
    });

    console.log(`🎉 Successfully purchased: ${purchasedNumber.phoneNumber}`);
    return purchasedNumber;
  } catch (error) {
    console.error(
      `❌ Error purchasing number for area code ${areaCode}:`,
      error.message,
    );
    return null;
  }
}

async function upgradeToFullCoverage() {
  try {
    console.log("🚀 STARTING UPGRADE TO 100% LOCAL COVERAGE");
    console.log("==========================================");
    console.log("");

    // Analyze current prospect data
    const { sortedAreaCodes, totalAreaCodes, monthlyCost } =
      await analyzeAreaCodes();

    // Get current numbers
    const currentAreaCodes = await getCurrentNumbers();

    // Determine which area codes we need to purchase
    const neededAreaCodes = sortedAreaCodes.filter(
      ([areaCode]) => !currentAreaCodes.includes(areaCode),
    );

    console.log("🛒 PURCHASING PLAN:");
    console.log("===================");
    console.log(`• Area codes already covered: ${currentAreaCodes.length}`);
    console.log(`• Area codes to purchase: ${neededAreaCodes.length}`);
    console.log(
      `• Total monthly cost increase: $${(neededAreaCodes.length * 1.15).toFixed(2)}`,
    );
    console.log("");

    if (neededAreaCodes.length === 0) {
      console.log("🎉 You already have complete coverage!");
      return;
    }

    // Confirm purchase
    console.log("📞 PURCHASING PHONE NUMBERS:");
    console.log("============================");

    const purchasedNumbers = [];
    let successCount = 0;
    let failCount = 0;

    // Purchase numbers in batches to avoid rate limits
    for (let i = 0; i < neededAreaCodes.length; i++) {
      const [areaCode, prospects] = neededAreaCodes[i];

      // Add delay between purchases
      if (i > 0 && i % 5 === 0) {
        console.log("⏳ Pausing to avoid rate limits...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const result = await purchasePhoneNumber(areaCode, prospects.length);
      if (result) {
        purchasedNumbers.push(result);
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log("");
    console.log("📊 PURCHASE SUMMARY:");
    console.log("====================");
    console.log(`✅ Successfully purchased: ${successCount} numbers`);
    console.log(`❌ Failed purchases: ${failCount} numbers`);
    console.log(
      `💰 Additional monthly cost: $${(successCount * 1.15).toFixed(2)}`,
    );
    console.log(
      `📈 New coverage: ${(((currentAreaCodes.length + successCount) / totalAreaCodes) * 100).toFixed(1)}%`,
    );
    console.log("");

    if (purchasedNumbers.length > 0) {
      console.log("🎯 NEWLY PURCHASED NUMBERS:");
      console.log("===========================");
      purchasedNumbers.forEach((number, index) => {
        console.log(
          `${index + 1}. ${number.phoneNumber} - ${number.friendlyName}`,
        );
      });
      console.log("");
    }

    console.log("✅ UPGRADE COMPLETE!");
    console.log("====================");
    console.log("Next steps:");
    console.log("1. Update smart number selection algorithm");
    console.log("2. Test calling with new numbers");
    console.log("3. Monitor answer rate improvements");
    console.log("4. Track ROI from enhanced local presence");
  } catch (error) {
    console.error("❌ Error during upgrade:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upgrade
if (require.main === module) {
  upgradeToFullCoverage();
}

module.exports = { upgradeToFullCoverage, analyzeAreaCodes };
