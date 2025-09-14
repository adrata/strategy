import {
  SearchPill,
  SearchResults,
  Company,
  Person,
  PendingAction,
} from "../types";

export class MonacoAIService {
  // Detect user intent from natural language queries
  detectUserIntent(query: string) {
    const lowerQuery = query.toLowerCase();

    // AI-powered intent detection
    if (
      lowerQuery.includes("add") &&
      (lowerQuery.includes("pipeline") || lowerQuery.includes("prospect"))
    ) {
      return "add_to_pipeline";
    }
    if (lowerQuery.includes("generate") && lowerQuery.includes("report")) {
      return "generate_report";
    }
    if (
      lowerQuery.includes("mini report") ||
      lowerQuery.includes("quick report")
    ) {
      return "mini_report";
    }
    if (
      lowerQuery.includes("show") &&
      (lowerQuery.includes("top") || lowerQuery.includes("best"))
    ) {
      return "show_top_results";
    }
    if (lowerQuery.includes("find") || lowerQuery.includes("search")) {
      return "search";
    }
    if (lowerQuery.includes("create") && lowerQuery.includes("opportunity")) {
      return "create_opportunity";
    }
    if (lowerQuery.includes("update") && lowerQuery.includes("status")) {
      return "update_status";
    }
    if (lowerQuery.includes("add") && lowerQuery.includes("note")) {
      return "add_note";
    }
    if (
      lowerQuery.includes("schedule") ||
      lowerQuery.includes("meeting") ||
      lowerQuery.includes("call")
    ) {
      return "schedule_meeting";
    }
    if (lowerQuery.includes("remove") || lowerQuery.includes("delete")) {
      return "remove_record";
    }
    if (lowerQuery.includes("export") || lowerQuery.includes("download")) {
      return "export_data";
    }
    if (lowerQuery.includes("share") || lowerQuery.includes("send")) {
      return "share_data";
    }

    return "search"; // Default to search
  }

  // Execute different AI actions based on intent
  executeAction(
    intent: string,
    query: string,
    results: SearchResults,
  ): PendingAction | null {
    switch (intent) {
      case "add_to_pipeline":
        return this.generatePipelineAction(query, results);
      case "generate_report":
        return this.generateReportAction(query, results);
      case "mini_report":
        return this.generateMiniReportAction(query, results);
      case "create_opportunity":
        return this.generateOpportunityAction(query, results);
      case "update_status":
        return this.generateStatusAction(query, results);
      case "add_note":
        return this.generateNoteAction(query, results);
      case "schedule_meeting":
        return this.generateScheduleAction(query, results);
      case "remove_record":
        return this.generateRemovalAction(query, results);
      case "export_data":
        return this.generateExportAction(query, results);
      case "share_data":
        return this.generateShareAction(query, results);
      default:
        return null;
    }
  }

  private generatePipelineAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];
    const topTargets = allTargets.slice(0, 3);

    return {
      type: "add_to_pipeline",
      query,
      targets: topTargets,
      summary: `Add ${topTargets?.length || 0} high-potential ${(topTargets?.length || 0) === 1 ? "prospect" : "prospects"} to your sales pipeline`,
    };
  }

  private generateReportAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];
    const topTargets = allTargets.slice(0, 5);

    return {
      type: "generate_report",
      query,
      targets: topTargets,
      summary: `Generate comprehensive intelligence report for ${topTargets?.length || 0} prospects`,
    };
  }

  private generateMiniReportAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];
    const target = allTargets[0];

    if (!target) {
      return {
        type: "mini_report",
        query,
        targets: [],
        summary: "No prospects found to generate report for",
      };
    }

    return {
      type: "mini_report",
      query,
      targets: [target],
      summary: `Generate mini intelligence report for ${target.name}`,
    };
  }

  private generateOpportunityAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const companies = (results.companies || []).slice(0, 1);

    return {
      type: "create_opportunity",
      query,
      targets: companies,
      summary: `Create sales opportunity from ${(companies?.length || 0) > 0 ? (companies?.[0]?.name || "selected prospect") : "selected prospect"}`,
    };
  }

  private generateStatusAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];
    const targets = allTargets.slice(0, 3);

    return {
      type: "update_status",
      query,
      targets,
      summary: `Update status for ${targets?.length || 0} prospect${(targets?.length || 0) !== 1 ? "s" : ""}`,
    };
  }

  private generateNoteAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];
    const targets = allTargets.slice(0, 1);

    return {
      type: "add_note",
      query,
      targets,
      summary: `Add note to ${(targets?.length || 0) > 0 ? targets?.[0]?.name || "selected prospect" : "selected prospect"}`,
    };
  }

  private generateScheduleAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const people = (results.people || []).slice(0, 1);

    return {
      type: "schedule_meeting",
      query,
      targets: people,
      summary: `Schedule meeting with ${(people?.length || 0) > 0 ? (people?.[0]?.name || "selected contact") : "selected contact"}`,
    };
  }

  private generateRemovalAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];
    const targets = allTargets.slice(0, 2);

    return {
      type: "remove_record",
      query,
      targets,
      summary: `Remove ${targets?.length || 0} record${(targets?.length || 0) !== 1 ? "s" : ""} from Monaco`,
    };
  }

  private generateExportAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];

    return {
      type: "export_data",
      query,
      targets: allTargets,
      summary: `Export ${allTargets?.length || 0} records to CSV/Excel`,
    };
  }

  private generateShareAction(
    query: string,
    results: SearchResults,
  ): PendingAction {
    const allTargets = [...results.companies, ...results.people];
    const targets = allTargets.slice(0, 5);

    return {
      type: "share_data",
      query,
      targets,
      summary: `Share ${targets?.length || 0} prospect${(targets?.length || 0) !== 1 ? "s" : ""} with team`,
    };
  }

  // Generate natural language responses
  generateSearchResponse(query: string, results: SearchResults): string {
    const { companies = [], partners = [], people = [] } = results;
    const totalResults = (companies?.length || 0) + (partners?.length || 0) + (people?.length || 0);

    if (totalResults === 0) {
      return `I couldn't find any results matching "${query}". Try adjusting your search criteria or using different keywords.`;
    }

    let response = `Found **${totalResults} results** for "${query}":`;

    if ((companies?.length || 0) > 0) {
      response += `\n\n🏢 **${companies?.length || 0} Companies** (average ICP score: ${Math.round((companies || []).reduce((sum, c) => sum + c.icpScore, 0) / (companies?.length || 1))})`;
      const topCompanies = (companies || []).slice(0, 3);
      topCompanies.forEach((company) => {
        response += `\n• **${company.name}** - ${company.industry}, ${company.employeeCount} employees (ICP: ${company.icpScore})`;
      });
    }

    if ((people?.length || 0) > 0) {
      response += `\n\n👥 **${people?.length || 0} People**`;
      const topPeople = (people || []).slice(0, 3);
      topPeople.forEach((person) => {
        response += `\n• **${person.name}** - ${person.title} at ${person.company}`;
      });
    }

    if ((partners?.length || 0) > 0) {
      response += `\n\n🤝 **${partners?.length || 0} Partners**`;
      const topPartners = (partners || []).slice(0, 3);
      topPartners.forEach((partner) => {
        response += `\n• **${partner.name}** - ${partner.partnershipType} in ${partner.region}`;
      });
    }

    response += `\n\n💡 **Try these actions:**\n• "Add [Company Name] to pipeline"\n• "Generate mini report for [Person Name]"\n• "Show me the top 5 companies"\n• "Create opportunity from highest ICP score"`;

    return response;
  }

  // Generate special responses for "Best 100" queries
  generateBest100Response(query: string): string {
    return `📊 **Monaco's Best 14 Companies** - Your AI-curated prospect database\n\n✨ **Intelligence Features:**\n• **ICP Scoring** - AI-ranked from 84-95% fit\n• **Company Intelligence** - Deep business insights\n• **Buying Signals** - Real-time intent data\n• **Executive Insights** - Leadership analysis\n• **Sales Intelligence** - Deal strategy & objection handling\n\n🎯 **Current Distribution:**\n• **4 Qualified** prospects (ready for outreach)\n• **3 Active** engagements (in conversation)\n• **4 Contacted** (follow-up needed)\n• **3 Prospecting** (initial research)\n\n💼 **Top Industries:** Enterprise Software, Cloud Infrastructure, Data Analytics, Cybersecurity\n\n🌍 **Global Reach:** North America, EMEA, APAC coverage\n\n**Try:** "Show me the top 5 companies" or "Add TechCorp Solutions to pipeline"`;
  }

  // Generate mini reports for specific records
  generateMiniReport(record: Company | Person): string {
    if ("domain" in record && "industry" in record) {
      // Company report
      const company = record as Company;
      return `📋 **${company.name} - Quick Intelligence Report**\n\n🏢 **Company Overview:**\n• Industry: ${company.industry}\n• Size: ${company.employeeCount} employees\n• Revenue: ${company.revenue}\n• Location: ${company.location}\n• ICP Score: ${company.icpScore}/100\n\n📈 **Key Insights:**\n• Status: ${company.status.charAt(0).toUpperCase() + company.status.slice(1)}\n• Last Updated: ${company.lastUpdated}\n• Domain: ${company.domain}\n\n💡 **Next Actions:**\n• Research key decision makers\n• Review buying signals\n• Prepare value proposition\n• Schedule discovery call\n\n🎯 **This company ${company.icpScore >= 90 ? "is a high-priority target" : company.icpScore >= 85 ? "shows strong potential" : "requires qualification"} based on your ICP criteria.**`;
    } else {
      // Person report
      const person = record as Person;
      return `👤 **${person.name} - Contact Intelligence Report**\n\n🎯 **Contact Details:**\n• Title: ${person.title}\n• Company: ${person.company}\n• Department: ${person.department}\n• Seniority: ${person.seniority}\n• Location: ${person.location}\n\n📊 **Engagement Status:**\n• Current Status: ${person.status.charAt(0).toUpperCase() + person.status.slice(1)}\n• Last Contact: ${person.lastContact}\n• Email: ${person.email}\n• LinkedIn: ${person.linkedin}\n\n💼 **Intelligence Summary:**\n• **Role Level:** ${person.seniority} in ${person.department}\n• **Contact Readiness:** ${person['status'] === "qualified" ? "High - Ready for outreach" : person['status'] === "contacted" ? "Medium - Follow up needed" : "Low - Requires qualification"}\n\n🎯 **Recommended Approach:**\n• Personalized email mentioning ${person.department} challenges\n• LinkedIn connection with value-driven message\n• Industry-specific content sharing\n• Department-focused solution positioning`;
    }
  }

  // Create actual leads from selected targets
  async createActualLeads(targets: (Company | Person)[]): Promise<string> {
    if ((targets?.length || 0) === 0) {
      return "No prospects selected to add to pipeline.";
    }

    let response = `✅ **Adding ${targets?.length || 0} prospect${(targets?.length || 0) !== 1 ? "s" : ""} to your sales pipeline:**\n\n`;
    let successCount = 0;

    for (const [index, target] of targets.entries()) {
      try {
        if ("domain" in target && "industry" in target) {
          // Company - add the primary contact as a lead
          const company = target as Company;
          // Find a primary contact or create a generic one
          const companyLead = {
            name: `${company.name} Contact`,
            email: `contact@${company.domain || company.name.toLowerCase().replace(/\s+/g, "")}.com`,
            company: company.name,
            title: "Key Contact",
            source: "Monaco Search",
            notes: `Added from Monaco. Industry: ${company.industry}. ICP Score: ${company.icpScore}/100.`,
          };

          // Call Action Platform API to create lead
          const createResponse = await fetch("/api/data/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // 🆕 CRITICAL FIX: Remove hardcoded workspace ID - API will get context from JWT
              leadData: companyLead,
            }),
          });

          if (createResponse.ok) {
            successCount++;
            response += `${index + 1}. 🏢 **${company.name}** ✅\n   • Industry: ${company.industry}\n   • ICP Score: ${company.icpScore}/100\n   • Added to Action Platform\n\n`;
          } else {
            response += `${index + 1}. 🏢 **${company.name}** ❌\n   • Failed to add to pipeline\n\n`;
          }
        } else {
          // Person
          const person = target as Person;
          const personLead = {
            name: person.name,
            email:
              person.email ||
              `${person.name.toLowerCase().replace(/\s+/g, ".")}@${person.company.toLowerCase().replace(/\s+/g, "")}.com`,
            company: person.company,
            title: person.title,
            source: "Monaco Search",
            notes: `Added from Monaco. ${person.seniority} level contact in ${person.department}.`,
          };

          // Call Action Platform API to create lead
          const createResponse = await fetch("/api/data/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // 🆕 CRITICAL FIX: Remove hardcoded workspace ID - API will get context from JWT
              leadData: personLead,
            }),
          });

          if (createResponse.ok) {
            successCount++;
            response += `${index + 1}. 👤 **${person.name}** ✅\n   • ${person.title} at ${person.company}\n   • Added to Action Platform\n\n`;
          } else {
            response += `${index + 1}. 👤 **${person.name}** ❌\n   • Failed to add to pipeline\n\n`;
          }
        }
      } catch (error) {
        console.error("Error creating lead:", error);
        response += `${index + 1}. ❌ **Error adding prospect**\n\n`;
      }
    }

    if (successCount > 0) {
      response += `🎯 **Successfully added ${successCount} prospect${successCount !== 1 ? "s" : ""} to Action Platform!**\n\n`;
      response += `**Next Steps:**\n• Go to Action Platform > Acquire to view new leads\n• Review and enrich lead data\n• Start personalized outreach sequences\n• Set follow-up reminders\n\n💡 **Pro Tip:** The leads are now available in your Action Platform pipeline with Monaco intelligence data!`;
    } else {
      response += `❌ **No prospects were successfully added.** Please check the API connection and try again.`;
    }

    return response;
  }
}
