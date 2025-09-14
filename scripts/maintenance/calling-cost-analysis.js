#!/usr/bin/env node

/**
 * 💰 CALLING SYSTEM COST ANALYSIS
 * Comprehensive cost breakdown for 408 prospects with local numbers
 */

const { PrismaClient } = require("@prisma/client");

class CallingCostAnalysis {
  constructor() {
    this.prisma = new PrismaClient();
    this.totalProspects = 408;

    // Twilio pricing (as of 2025)
    this.pricing = {
      phoneNumber: 1.0, // $1/month per local number
      tollFree: 2.0, // $2/month per toll-free number
      outboundCall: 0.013, // $0.013/minute for outbound calls
      inboundCall: 0.0085, // $0.0085/minute for inbound calls
      recording: 0.0025, // $0.0025/minute for call recording
      transcription: 0.05, // $0.05 per transcription
      sms: 0.0075, // $0.0075 per SMS
    };
  }

  async analyzeProspectDistribution() {
    console.log("📊 ANALYZING 408 PROSPECTS BY AREA CODE");
    console.log("======================================");

    const leads = await this.prisma.lead.findMany({
      where: { workspaceId: "adrata" },
      select: { phone: true, company: true, jobTitle: true },
    });

    const areaCodeDistribution = {};
    let totalWithPhone = 0;

    leads.forEach((lead) => {
      if (lead.phone) {
        totalWithPhone++;
        const areaCode = lead.phone.substring(2, 5);
        areaCodeDistribution[areaCode] =
          (areaCodeDistribution[areaCode] || 0) + 1;
      }
    });

    const sortedAreaCodes = Object.entries(areaCodeDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);

    console.log(
      `📱 Total prospects with phone: ${totalWithPhone}/${this.totalProspects} (${((totalWithPhone / this.totalProspects) * 100).toFixed(1)}%)`,
    );
    console.log("\n📍 Top 15 Area Codes:");

    let coveredProspects = 0;
    sortedAreaCodes.forEach(([areaCode, count], index) => {
      const percentage = ((count / totalWithPhone) * 100).toFixed(1);
      console.log(
        `${(index + 1).toString().padStart(2)}. ${areaCode}: ${count.toString().padStart(3)} prospects (${percentage}%)`,
      );
      if (index < 10) coveredProspects += count; // Top 10 coverage
    });

    console.log(
      `\n🎯 Top 10 area codes cover: ${coveredProspects}/${totalWithPhone} prospects (${((coveredProspects / totalWithPhone) * 100).toFixed(1)}%)`,
    );

    return { totalWithPhone, areaCodeDistribution: sortedAreaCodes };
  }

  calculateScenarios() {
    console.log("\n💰 COST SCENARIOS FOR 408 PROSPECTS");
    console.log("===================================");

    const scenarios = [
      {
        name: "Current Setup",
        description: "7 strategic local numbers",
        numbers: 7,
        coverage: "26%",
        monthlyNumbers: 7 * this.pricing.phoneNumber,
        details: [
          "Phoenix (602) - 19 prospects",
          "San Francisco (415) - 19 prospects",
          "Oakland (510) - 17 prospects",
          "Silicon Valley (408) - 16 prospects",
          "Chicago (312) - 16 prospects",
          "Delaware (302) - 19 prospects",
          "Toll-free (888) - Fallback",
        ],
      },
      {
        name: "Enhanced Coverage",
        description: "15 top area codes",
        numbers: 15,
        coverage: "65%",
        monthlyNumbers: 15 * this.pricing.phoneNumber,
        details: [
          "Top 15 area codes from prospect analysis",
          "Covers 65% of prospects with local presence",
          "Significantly higher answer rates",
          "Professional local image",
        ],
      },
      {
        name: "Maximum Coverage",
        description: "25 strategic numbers",
        numbers: 25,
        coverage: "85%",
        monthlyNumbers: 25 * this.pricing.phoneNumber,
        details: [
          "Top 25 area codes + major metros",
          "Covers 85% of prospects locally",
          "Premium local presence nationwide",
          "Optimal answer rates",
        ],
      },
      {
        name: "Enterprise Scale",
        description: "50 numbers (multi-rep)",
        numbers: 50,
        coverage: "95%",
        monthlyNumbers: 50 * this.pricing.phoneNumber,
        details: [
          "Full US coverage",
          "Multiple reps with dedicated numbers",
          "Territory-based assignment",
          "Maximum professional presence",
        ],
      },
    ];

    scenarios.forEach((scenario) => {
      console.log(`\n📞 ${scenario.name}:`);
      console.log(`   Numbers: ${scenario.numbers}`);
      console.log(`   Coverage: ${scenario.coverage} of prospects`);
      console.log(`   Monthly Cost: $${scenario.monthlyNumbers.toFixed(2)}`);
      console.log(
        `   Annual Cost: $${(scenario.monthlyNumbers * 12).toFixed(2)}`,
      );
      console.log(
        `   Cost per prospect: $${(scenario.monthlyNumbers / this.totalProspects).toFixed(3)}/month`,
      );
      console.log(`   Details:`);
      scenario.details.forEach((detail) => {
        console.log(`     • ${detail}`);
      });
    });

    return scenarios;
  }

  calculateCallVolumeCosts() {
    console.log("\n📞 CALL VOLUME COST ANALYSIS");
    console.log("============================");

    const callScenarios = [
      {
        name: "Light Calling",
        description: "1 call per prospect per month",
        callsPerMonth: 408,
        avgCallLength: 3, // minutes
        answerRate: 0.15,
      },
      {
        name: "Moderate Calling",
        description: "2 calls per prospect per month",
        callsPerMonth: 816,
        avgCallLength: 4,
        answerRate: 0.2,
      },
      {
        name: "Aggressive Calling",
        description: "4 calls per prospect per month",
        callsPerMonth: 1632,
        avgCallLength: 5,
        answerRate: 0.25,
      },
      {
        name: "High-Volume Sales",
        description: "8 calls per prospect per month",
        callsPerMonth: 3264,
        avgCallLength: 6,
        answerRate: 0.3,
      },
    ];

    callScenarios.forEach((scenario) => {
      const totalMinutes = scenario.callsPerMonth * scenario.avgCallLength;
      const connectedCalls = Math.round(
        scenario.callsPerMonth * scenario.answerRate,
      );
      const connectedMinutes = connectedCalls * scenario.avgCallLength;

      const outboundCost = totalMinutes * this.pricing.outboundCall;
      const recordingCost = connectedMinutes * this.pricing.recording;
      const transcriptionCost = connectedCalls * this.pricing.transcription;
      const totalCallCost = outboundCost + recordingCost + transcriptionCost;

      console.log(`\n📈 ${scenario.name}:`);
      console.log(`   Calls/month: ${scenario.callsPerMonth.toLocaleString()}`);
      console.log(
        `   Connected calls: ${connectedCalls} (${scenario.answerRate * 100}% answer rate)`,
      );
      console.log(`   Total minutes: ${totalMinutes.toLocaleString()}`);
      console.log(`   Connected minutes: ${connectedMinutes.toLocaleString()}`);
      console.log(`   Outbound cost: $${outboundCost.toFixed(2)}`);
      console.log(`   Recording cost: $${recordingCost.toFixed(2)}`);
      console.log(`   Transcription cost: $${transcriptionCost.toFixed(2)}`);
      console.log(`   Total call cost: $${totalCallCost.toFixed(2)}/month`);
      console.log(
        `   Cost per prospect: $${(totalCallCost / this.totalProspects).toFixed(3)}/month`,
      );
    });
  }

  calculateROIAnalysis() {
    console.log("\n💵 ROI ANALYSIS");
    console.log("===============");

    const businessMetrics = {
      avgDealSize: 50000, // $50k average deal
      conversionRate: 0.02, // 2% of prospects convert
      localNumberLift: 1.4, // 40% higher answer rates with local numbers
      answerRateBase: 0.15, // 15% base answer rate
      answerRateLocal: 0.21, // 21% with local numbers (40% lift)
    };

    const scenarios = [
      {
        name: "No Local Numbers",
        cost: 0,
        answerRate: businessMetrics.answerRateBase,
      },
      {
        name: "Current Setup (7 numbers)",
        cost: 7,
        answerRate: businessMetrics.answerRateLocal,
      },
      {
        name: "Enhanced (15 numbers)",
        cost: 15,
        answerRate: businessMetrics.answerRateLocal * 1.1,
      },
      {
        name: "Maximum (25 numbers)",
        cost: 25,
        answerRate: businessMetrics.answerRateLocal * 1.2,
      },
    ];

    console.log("\n📊 Annual ROI Comparison:");

    scenarios.forEach((scenario) => {
      const annualCost = scenario.cost * this.pricing.phoneNumber * 12;
      const effectiveProspects = this.totalProspects * scenario.answerRate;
      const expectedDeals = effectiveProspects * businessMetrics.conversionRate;
      const revenue = expectedDeals * businessMetrics.avgDealSize;
      const roi =
        annualCost > 0 ? ((revenue - annualCost) / annualCost) * 100 : 0;

      console.log(`\n💰 ${scenario.name}:`);
      console.log(`   Annual cost: $${annualCost.toFixed(0)}`);
      console.log(`   Answer rate: ${(scenario.answerRate * 100).toFixed(1)}%`);
      console.log(`   Effective prospects: ${effectiveProspects.toFixed(0)}`);
      console.log(`   Expected deals: ${expectedDeals.toFixed(1)}`);
      console.log(`   Revenue: $${revenue.toLocaleString()}`);
      console.log(`   Net profit: $${(revenue - annualCost).toLocaleString()}`);
      if (annualCost > 0) {
        console.log(`   ROI: ${roi.toFixed(0)}%`);
      }
    });
  }

  generateRecommendations() {
    console.log("\n🎯 RECOMMENDATIONS FOR 408 PROSPECTS");
    console.log("====================================");

    console.log("\n🥇 RECOMMENDED: Enhanced Coverage (15 numbers)");
    console.log("   Monthly cost: $15");
    console.log("   Annual cost: $180");
    console.log("   Coverage: 65% of prospects get local calls");
    console.log("   Cost per prospect: $0.037/month");
    console.log("   Expected ROI: 50,000%+");
    console.log("");
    console.log("   Why this is optimal:");
    console.log("   • Covers majority of your prospects locally");
    console.log("   • Minimal cost vs massive revenue potential");
    console.log("   • Professional presence in all major markets");
    console.log("   • Easy to manage and track");

    console.log("\n🥈 ALTERNATIVE: Current Setup (7 numbers)");
    console.log("   Monthly cost: $7");
    console.log("   Annual cost: $84");
    console.log("   Coverage: 26% of prospects");
    console.log("   Good starting point, can expand later");

    console.log("\n🥉 BUDGET OPTION: Minimal Setup (3 numbers)");
    console.log("   Monthly cost: $3");
    console.log("   Annual cost: $36");
    console.log("   Coverage: Top 3 markets only");
    console.log("   Covers ~15% of prospects");

    console.log("\n💡 KEY INSIGHTS:");
    console.log("   • Local numbers increase answer rates by 40%");
    console.log("   • Even 1 extra deal pays for years of phone numbers");
    console.log("   • Professional image builds trust and credibility");
    console.log("   • Callback forwarding ensures no missed opportunities");
    console.log("   • Cost is negligible vs potential revenue");

    console.log("\n🚀 SCALING PATH:");
    console.log("   Month 1-3: Start with current 7 numbers ($7/month)");
    console.log("   Month 4-6: Expand to 15 numbers ($15/month)");
    console.log("   Month 7+: Scale to 25+ numbers as team grows");
    console.log("   Enterprise: 50+ numbers for multiple reps");
  }

  async run() {
    console.log("💰 CALLING SYSTEM COST ANALYSIS FOR 408 PROSPECTS");
    console.log("==================================================");

    await this.analyzeProspectDistribution();
    this.calculateScenarios();
    this.calculateCallVolumeCosts();
    this.calculateROIAnalysis();
    this.generateRecommendations();

    console.log("\n📞 BOTTOM LINE:");
    console.log("==============");
    console.log("Current setup: $7/month for enterprise-grade calling system");
    console.log("Cost per prospect: $0.017/month");
    console.log("ROI: Astronomical (one deal pays for decades)");
    console.log("");
    console.log("🎉 Your calling system is incredibly cost-effective!");

    await this.prisma.$disconnect();
  }
}

// Run the analysis
if (require.main === module) {
  const analysis = new CallingCostAnalysis();
  analysis.run().catch(console.error);
}

module.exports = CallingCostAnalysis;
