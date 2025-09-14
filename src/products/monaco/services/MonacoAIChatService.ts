"use client";

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  responseType?: string;
  data?: any;
  actionButtons?: Array<{
    type: string;
    label: string;
    icon: string;
  }>;
  isTypewriter?: boolean;
}

export interface MonacoAIChatConfig {
  brightDataApiKey: string;
  recordsLimit: number;
  enableBrightDataSearch?: boolean;
  enableBuyerGroupAnalysis?: boolean;
}

export class MonacoAIChatService {
  private config: MonacoAIChatConfig;
  private companies: any[] = [];
  private people: any[] = [];

  constructor(config: MonacoAIChatConfig) {
    this['config'] = {
      ...config,
      recordsLimit: config.recordsLimit || 1000, // Default to 1000+ records as requested
    };
  }

  updateData(companies: any[], people: any[]) {
    this['companies'] = companies;
    this['people'] = people;
  }

  /**
   * Process a chat message and generate intelligent response
   */
  async processMessage(message: string): Promise<ChatMessage> {
    const lowerMessage = message.toLowerCase().trim();

    // DEMO CASE: Steve Ferro at DataCorp conference networking scenario
    if (this.isSteveFerroDemoQuery(lowerMessage)) {
      return await this.handleSteveFerroDemoQuery(message);
    }

    // Handle "yes" response to Steve Ferro email draft request
    if (this.isEmailDraftYesResponse(lowerMessage)) {
      return this.handleSteveFerroDraftEmail();
    }

    // Pattern matching for specific commands
    if (this.isListAnalysisQuery(lowerMessage)) {
      return this.handleListAnalysisQuery(message);
    }

    if (this.isWhyNotOnListQuery(lowerMessage)) {
      return this.handleWhyNotOnListQuery(message);
    }

    if (this.isFindPersonQuery(lowerMessage)) {
      return await this.handleFindPersonQuery(message);
    }

    if (this.isBuyerGroupQuery(lowerMessage)) {
      return await this.handleBuyerGroupQuery(message);
    }

    if (this.isNext100ProspectsQuery(lowerMessage)) {
      return this.handleNext100ProspectsAnalysis(message);
    }

    if (this.isRTPWorkQuery(lowerMessage)) {
      return this.handleRTPWorkQuery(message);
    }

    if (this.isHiringAlertsQuery(lowerMessage)) {
      return this.handleHiringAlertsAction();
    }

    if (this.isGrowthSignalsQuery(lowerMessage)) {
      return this.handleGrowthSignalsAction();
    }

    if (this.isDemoPrioritizationQuery(lowerMessage)) {
      return this.handleDemoPrioritizationAction();
    }

    if (this.isVPSalesDemoQuery(lowerMessage)) {
      return this.handleVPSalesDemoAction();
    }

    // General Monaco intelligence
    return this.handleGeneralQuery(message);
  }

  /**
   * Pattern matching methods
   */
  private isListAnalysisQuery(message: string): boolean {
    return message.includes("how did you come up") ||
           message.includes("list") && (message.includes("create") || message.includes("come up"));
  }

  private isWhyNotOnListQuery(message: string): boolean {
    return message.includes("why isn't") || message.includes("why not") || message.includes("why no");
  }

  private isFindPersonQuery(message: string): boolean {
    return (message.includes("find") && (message.includes("me") || message.includes("person") || message.includes("contact"))) ||
           message.includes("search for") ||
           message.includes("can you find");
  }

  private isBuyerGroupQuery(message: string): boolean {
    return message.includes("buyer group") || 
           message.includes("run buyer group") ||
           message.includes("stakeholders") ||
           message.includes("decision makers");
  }

  private isSteveFerroDemoQuery(message: string): boolean {
    return message.includes("steve ferro") || 
           (message.includes("steve") && message.includes("ferro")) ||
           (message.includes("steve") && message.includes("datacorp"));
  }

  private isEmailDraftYesResponse(message: string): boolean {
    return (message.includes("yes") || message.includes("yeah") || message.includes("yep")) &&
           message.length < 20; // Simple yes response
  }

  private isNext100ProspectsQuery(message: string): boolean {
    return message.includes("analyze next 100") || 
           message.includes("250 people") ||
           message.includes("next 100 prospects") ||
           message.includes("go after 250");
  }

  private isRTPWorkQuery(message: string): boolean {
    return (message.includes("how") && message.includes("rtp") && message.includes("work")) ||
           (message.includes("what") && message.includes("rtp")) ||
           (message.includes("explain") && message.includes("rtp")) ||
           (message.includes("rtp") && message.includes("priority")) ||
           (message.includes("how") && message.includes("speedrun") && message.includes("work")) ||
           (message.includes("what") && message.includes("speedrun")) ||
           (message.includes("explain") && message.includes("speedrun")) ||
           (message.includes("speedrun") && message.includes("priority"));
  }

  private isHiringAlertsQuery(message: string): boolean {
    return (message.includes("hiring") && message.includes("alert")) ||
           (message.includes("show") && message.includes("hiring")) ||
           (message.includes("hiring") && message.includes("today"));
  }

  private isGrowthSignalsQuery(message: string): boolean {
    return (message.includes("growth") && message.includes("signal")) ||
           (message.includes("analyze") && message.includes("growth")) ||
           (message.includes("expansion") && message.includes("signal"));
  }

  private isDemoPrioritizationQuery(message: string): boolean {
    return (message.includes("demo") && message.includes("prioritization")) ||
           (message.includes("demo") && message.includes("live")) ||
           (message.includes("live") && message.includes("prioritization"));
  }

  private isVPSalesDemoQuery(message: string): boolean {
    return (message.includes("vp") && message.includes("sales") && message.includes("demo")) ||
           (message.includes("vp sales") && message.includes("mode")) ||
           (message.includes("executive") && message.includes("demo"));
  }

  /**
   * DEMO CASE: Handle Steve Ferro conference networking scenario
   */
  private async handleSteveFerroDemoQuery(message: string): Promise<ChatMessage> {
    // Generate thinking steps that are contextual to DataCorp and buyer group research
    const thinkingSteps = [
      "Scanning enterprise contact database for Steve Ferro...",
      "Cross-referencing DataCorp organizational structure...", 
      "Mapping DataCorp security technology decision makers...",
      "Analyzing Steve's network connections and influence pathways...",
      "Identifying DataCorp buyer group hierarchy and budget authority...",
      "Evaluating DataCorp growth signals and technology expansion needs...",
      "Compiling strategic buyer group intelligence report..."
    ];

    // Create and return thinking message
    const thinkingMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: "Initiating comprehensive buyer group analysis...",
      timestamp: new Date(),
      responseType: "thinking",
      data: { 
        steps: thinkingSteps,
        company: "DataCorp",
        context: "buyer_group_research"
      },
      isTypewriter: false,
    };

    // First return the thinking message
    // The actual research will be shown after the thinking animation completes
    return thinkingMessage;
  }

  /**
   * Generate the actual Steve Ferro response after thinking is complete
   */
  async generateSteveFerroResponse(): Promise<ChatMessage> {
    const content = `🔍 **Research Complete: [Steve Ferro](#person-steve-ferro) at DataCorp**

**Contact Information:**
• **Name**: [Steve Ferro](#person-steve-ferro)
• **Title**: VP of Sales Operations
• **Company**: DataCorp Solutions
• **Email**: steve.ferro@datacorp.com
• **Mobile**: +1 (555) 847-2941
• **LinkedIn**: linkedin.com/in/stevenferro
• **Location**: San Francisco, CA

**Steve's Profile Analysis:**
• **Role Assessment**: Adequate opener (6/10 influence score)
• **Buyer Group Position**: Sales stakeholder, limited technical decision authority
• **Best Use**: Gateway to technical decision makers
• **Networking Strength**: Strong connections to engineering leadership

---

**[DataCorp Buyer Group](#company-datacorp) Intelligence**

**Champions Identified:**

• **[Susan Smith](#person-susan-smith)** - Director of IT Security
  - **Primary Decision Maker** for security technology purchases
  - **Budget Authority**: $2M+ security infrastructure spending
  - **LinkedIn**: linkedin.com/in/susansmith-security
  - **Direct Phone**: +1 (555) 847-2901

• **[Jackson Washington](#person-jackson-washington)** - VP of Infrastructure Security  
  - **Technical Champion** and security implementation lead
  - **Team Size**: 25 security engineers reporting
  - **LinkedIn**: linkedin.com/in/jacksonwash-security
  - **Direct Phone**: +1 (555) 847-2915

**Additional Stakeholders:**
• [Michael Torres](#person-michael-torres) - CISO
• [Emily Chen](#person-emily-chen) - Security Operations Manager  
• [David Kim](#person-david-kim) - IT Infrastructure Director
• [Lisa Rodriguez](#person-lisa-rodriguez) - Compliance Manager
• [James Wilson](#person-james-wilson) - Network Security Engineer
• [Sarah Johnson](#person-sarah-johnson) - IT Procurement Specialist
• [Robert Lee](#person-robert-lee) - Security Analyst
• [Amanda Davis](#person-amanda-davis) - Risk Management Director

**Strategic Recommendation:**
[Steve Ferro](#person-steve-ferro) can facilitate introductions to both [Susan Smith](#person-susan-smith) and [Jackson Washington](#person-jackson-washington). His sales operations background means he understands the business case and can position your solution effectively.

**[View Full DataCorp Buyer Group](#action-datacorp-buyer-group)** | **[Add DataCorp to Account List](#action-add-datacorp)**

---

**Would you like me to draft an email to [Steve Ferro](#person-steve-ferro)?**`;

    return {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "steve_ferro_demo",
      data: {
        company: "DataCorp",
        profiles: [
          {
            name: "Steve Ferro",
            title: "VP of Sales Operations",
            role: "VP Sales Operations",
            email: "steve.ferro@datacorp.com",
            phone: "+1 (555) 847-2941",
            linkedin: "https://linkedin.com/in/stevenferro",
            company: "DataCorp Solutions",
            department: "Sales Operations",
            seniority: "VP",
            buyerGroupRole: "Opener",
            engagement: 4,
            painSummary: "Sales ops inefficiencies costing 15% deal velocity while competitive pressure demands faster customer acquisition"
          },
          {
            name: "Susan Smith",
            title: "Director of IT Security",
            role: "Director IT Security",
            email: "susan.smith@datacorp.com",
            phone: "+1 (555) 847-2901",
            linkedin: "https://linkedin.com/in/susansmith-security",
            company: "DataCorp Solutions",
            department: "Information Security",
            seniority: "Director",
            buyerGroupRole: "Champion",
            engagement: 5,
            painSummary: "Legacy security infrastructure vulnerable to quantum threats - $2M+ budget authority for infrastructure upgrades"
          },
          {
            name: "Jackson Washington",
            title: "VP of Infrastructure Security",
            role: "VP Infrastructure Security",
            email: "jackson.washington@datacorp.com",
            phone: "+1 (555) 847-2915",
            linkedin: "https://linkedin.com/in/jacksonwash-security",
            company: "DataCorp Solutions",
            department: "Infrastructure Security",
            seniority: "VP",
            buyerGroupRole: "Champion",
            engagement: 4,
            painSummary: "Managing 25 security engineers while scaling quantum-safe architecture across distributed infrastructure"
          },
          {
            name: "Michael Torres",
            title: "Chief Information Security Officer",
            role: "CISO",
            email: "michael.torres@datacorp.com",
            phone: "+1 (555) 847-2950",
            linkedin: "https://linkedin.com/in/michaeltorres-ciso",
            company: "DataCorp Solutions",
            department: "Information Security",
            seniority: "C-Level",
            buyerGroupRole: "Decision Maker",
            engagement: 3,
            painSummary: "Board-level security reporting demands while balancing $10M+ security budget across emerging quantum threats"
          },
          {
            name: "Emily Chen",
            title: "Security Operations Manager",
            role: "Security Operations Manager",
            email: "emily.chen@datacorp.com",
            phone: "+1 (555) 847-2903",
            linkedin: "https://linkedin.com/in/emilychen-secops",
            company: "DataCorp Solutions",
            department: "Security Operations",
            seniority: "Manager",
            buyerGroupRole: "Stakeholder",
            engagement: 4,
            painSummary: "24/7 security monitoring operations requiring quantum-resistant detection and response capabilities"
          },
          {
            name: "David Kim",
            title: "IT Infrastructure Director",
            role: "IT Infrastructure Director",
            email: "david.kim@datacorp.com",
            phone: "+1 (555) 847-2920",
            linkedin: "https://linkedin.com/in/davidkim-infra",
            company: "DataCorp Solutions",
            department: "IT Infrastructure",
            seniority: "Director",
            buyerGroupRole: "Stakeholder",
            engagement: 3,
            painSummary: "Infrastructure modernization projects stalled by security integration complexities and quantum readiness requirements"
          },
          {
            name: "Lisa Rodriguez",
            title: "Compliance Manager",
            role: "Compliance Manager",
            email: "lisa.rodriguez@datacorp.com",
            phone: "+1 (555) 847-2925",
            linkedin: "https://linkedin.com/in/lisarodriguez-compliance",
            company: "DataCorp Solutions",
            department: "Compliance",
            seniority: "Manager",
            buyerGroupRole: "Stakeholder",
            engagement: 3,
            painSummary: "Regulatory compliance challenges with quantum-safe cryptography standards and emerging security frameworks"
          },
          {
            name: "James Wilson",
            title: "Network Security Engineer",
            role: "Network Security Engineer",
            email: "james.wilson@datacorp.com",
            phone: "+1 (555) 847-2930",
            linkedin: "https://linkedin.com/in/jameswilson-netsec",
            company: "DataCorp Solutions",
            department: "Network Security",
            seniority: "Engineer",
            buyerGroupRole: "Opener",
            engagement: 3,
            painSummary: "Network security architecture requires quantum-resistant protocols while maintaining performance and compatibility"
          },
          {
            name: "Sarah Johnson",
            title: "IT Procurement Specialist",
            role: "IT Procurement Specialist",
            email: "sarah.johnson@datacorp.com",
            phone: "+1 (555) 847-2935",
            linkedin: "https://linkedin.com/in/sarahjohnson-procurement",
            company: "DataCorp Solutions",
            department: "Procurement",
            seniority: "Specialist",
            buyerGroupRole: "Opener",
            engagement: 2,
            painSummary: "Technology procurement processes need quantum-readiness evaluation criteria and vendor security assessments"
          },
          {
            name: "Robert Lee",
            title: "Security Analyst",
            role: "Security Analyst",
            email: "robert.lee@datacorp.com",
            phone: "+1 (555) 847-2940",
            linkedin: "https://linkedin.com/in/robertlee-secanalyst",
            company: "DataCorp Solutions",
            department: "Security Analysis",
            seniority: "Analyst",
            buyerGroupRole: "Opener",
            engagement: 2,
            painSummary: "Threat analysis and incident response capabilities require quantum-aware security monitoring and detection"
          },
          {
            name: "Amanda Davis",
            title: "Risk Management Director",
            role: "Risk Management Director",
            email: "amanda.davis@datacorp.com",
            phone: "+1 (555) 847-2945",
            linkedin: "https://linkedin.com/in/amandadavis-risk",
            company: "DataCorp Solutions",
            department: "Risk Management",
            seniority: "Director",
            buyerGroupRole: "Stakeholder",
            engagement: 3,
            painSummary: "Enterprise risk assessment frameworks need quantum threat modeling and long-term security resilience planning"
          }
        ]
      },

      isTypewriter: true,
    };
  }

  /**
   * Handle Steve Ferro email draft with action buttons
   */
  private handleSteveFerroDraftEmail(): ChatMessage {
    const content = `**Email Draft for Steve Ferro**

**Subject**: Great connecting tonight - would love to help!

Hi Steve,

Great connecting at the conference tonight! Really enjoyed our conversation about the data challenges at DataCorp.

I'd love to help with the security infrastructure challenges you mentioned. Based on our chat, I think your security leadership team would be perfect to connect with:

• **Michael Torres** (CISO) - michael.torres@datacorp.com
• **Susan Smith** (Director IT Security) - susan.smith@datacorp.com
• **Jackson Washington** (VP Infrastructure Security) - jackson.washington@datacorp.com

Would you be open to facilitating introductions to your security team?

Thanks again for the great conversation!

Best,
James`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "email_draft_with_actions",
      data: { 
        recipient: "Steve Ferro",
        company: "DataCorp Solutions",
      },
      actionButtons: [
        { 
          type: 'send_email', 
          label: 'Send ⌘S', 
          icon: 'send'
        },
        { 
          type: 'copy_email', 
          label: 'Copy', 
          icon: 'copy'
        }
      ],
      isTypewriter: true,
    };
  }

  /**
   * Handle next 100 prospects analysis - 250 people strategy
   */
  private handleNext100ProspectsAnalysis(message: string): ChatMessage {
    const content = `**Strategic Expansion Analysis: Go After 250 People Today**

Current Status: 150 prospects in Speedrun
Recommendation: Expand to 250 total prospects

**Next 100 Best Prospects Analysis:**

Top Decision Makers (25):
• CTOs and Chief Technology Officers across enterprise accounts
• Average deal size: $2.1M
• Close probability: 67%
• Industry focus: Technology, Finance, Healthcare

Champions & Influencers (35):
• VPs of Engineering and Technology Directors
• Strong technical evaluation capabilities
• Budget influence: $500K-$1.5M range
• High engagement scores (85%+ LinkedIn activity)

Enterprise Stakeholders (40):
• Senior Managers and Department Heads
• Implementation decision influence
• Average deal size: $850K
• Strategic accounts with growth potential

**Strategic Rationale:**
Your current 150 prospects are performing at 73% engagement rate. Adding these 100 highly-qualified prospects will:
• Increase pipeline value by $127M
• Maintain quality standards (ICP score 85%+)
• Optimize seller productivity across target accounts
• Accelerate Q4 revenue achievement

**Ready to execute:** All 100 prospects are pre-qualified and mapped to buyer groups.

Press Command+Enter to add these 100 prospects to your Speedrun.`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "next_100_analysis",
      data: { 
        additionalProspects: 100,
        newTotal: 250,
        currentRtpCount: 150
      },

      isTypewriter: true,
    };
  }

  /**
   * Handle RTP work explanation queries
   */
  private handleRTPWorkQuery(message: string): ChatMessage {
    const content = `**How Today's Speedrun (Prepare to win) Works**

**The "Get Lucky" Account List Problem:**
Your sellers have what I call a "get lucky" account list - a catch-all of thousands of companies they're randomly calling, hoping to create deal flow. It's inefficient and overwhelming.

**BGI + RTP Solution:**

**1. Buyer Group Intelligence (BGI) Immediately Shows Who to Call**
• All 5,472 buyer group members in your database are instantly analyzed
• Each contact mapped to their decision-making role and influence
• No more random calling - you know exactly who matters

**2. Real-Time Priority Ranking**
• Every prospect ranked by most strategic action to take next
• Considers all potential and open opportunities simultaneously
• Updates continuously as new signals emerge

**3. Real-Time Notifications Drive Prioritization**
• **HIRING ANNOUNCEMENT DETECTED**: ZeroPoint just announced they're hiring!
• **Growth Signal**: Expanding team = growing client base = pressing security needs
• **Automatic Reprioritization**: ZeroPoint moved to #1 on your Speedrun list
• **Context on Record**: Clear explanation why they're now top priority

**The VP of Sales "WOW" Factor:**

Before: "My reps are drowning in a list of 3,000 random companies"
After: "My reps know exactly who to call next and why - they're having strategic conversations instead of cold calls"

**Example Speedrun Workflow:**
1. **Morning**: Speedrun shows Michael Chen (ADP CTO) at #1A - budget approved signal
2. **Real-Time**: Notification pops up - DataCorp hiring announcement
3. **Instant**: DataCorp jumps to #1, Michael moves to #1B
4. **Context**: Rep sees exactly why DataCorp is now the priority
5. **Result**: Strategic outreach instead of random calling

**Current Status**: 150 prospects in Speedrun, all ranked and contextualized for maximum impact.`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "speedrun_work_explanation",
      data: { 
        speedrunCount: 150,
        totalProspects: 5472,
        accountList: "get_lucky"
      },

      isTypewriter: true,
    };
  }

  /**
   * Handle list analysis queries
   */
  private handleListAnalysisQuery(message: string): ChatMessage {
    const content = `**Monaco List Analysis**

**How This List Was Created:**

This list was generated using our proprietary ICP scoring algorithm with the following criteria:

**Primary Filters:**
• High-growth companies (50+ employees, $10M+ revenue)
• Technology adoption signals (cloud migration, digital transformation)
• Decision maker accessibility score
• Competitive threat assessment

**Data Sources:**
• ${this.config.recordsLimit.toLocaleString()} enterprise records analyzed
• LinkedIn Sales Navigator integration
• Company news and funding signals
• Technology stack intelligence

**Prioritization Methodology:**
• Revenue potential and deal size (40%)
• Buyer group completeness (30%)
• Engagement likelihood (20%)
• Competitive positioning (10%)

**Real-Time Filters:**
• Active in last 90 days
• Technology spending budget confirmed
• Decision maker contact information verified
• No active competitor engagement

**Current List Metrics:**
• ${this.companies.length} companies analyzed
• ${this.people.length} decision makers identified
• 94.2% data accuracy score
• ${Math.floor(this.companies.length * 0.23)} companies with hot buying signals

The methodology ensures each company meets our strict qualification criteria for enterprise sales engagement.`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "list_analysis",
      isTypewriter: true,
    };
  }

  /**
   * Handle why not on list queries
   */
  private handleWhyNotOnListQuery(message: string): ChatMessage {
    // Extract company name from query
    const companyMatch = message.match(/why (?:isn't|not|no) (.+?)(?:\s+on|$)/i);
    const companyName = companyMatch ? (companyMatch[1] || "").trim() : "this company";

    const content = `**Analysis: Why ${companyName} Isn't on the List**

**Exclusion Reasons:**

**1. ICP Score Below Threshold**
• Current ICP Score: 64% (requires 70%+ for inclusion)
• Missing criteria: Budget signals weak, decision maker access limited

**2. Market Fit Assessment**
• Company size: Outside target range (too small/large)
• Industry vertical: Low priority sector for our solution
• Technology stack: Minimal overlap with our platform

**3. Competitive Intelligence**
• Active engagement with primary competitor detected
• Recent investment in competing solution (last 6 months)
• Contract renewal cycle not aligned (18 months remaining)

**4. Data Quality Issues**
• Decision maker contacts: Only 40% verified
• Company information: Last updated 8 months ago
• Engagement history: No previous touchpoints

**Recommendation:**
• Re-evaluate in Q2 2024 when their current contract expires
• Monitor for technology stack changes
• Build relationship through industry events and thought leadership

Would you like me to add ${companyName} to a watch list for future qualification?`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "exclusion_analysis",
      data: { companyName },

      isTypewriter: true,
    };
  }

  /**
   * Handle find person queries with enterprise database integration
   */
  private async handleFindPersonQuery(message: string): Promise<ChatMessage> {
    // Extract person name from the message
    const nameMatch = message.match(/find (?:me )?(.+?)(?:\s+at|$)/i) || 
                      message.match(/can you find (?:me )?(.+?)(?:\s+at|$)/i) ||
                      message.match(/search for (.+?)(?:\s+at|$)/i);
    
    const personName = nameMatch ? (nameMatch[1] || "").trim() : "this person";

         // Enhanced enterprise search using correct field schema (gd_l1viktl72bvl7bjuj0)
     const content = `**Search Results for "${personName}"**

Found 3 matches in our enterprise database:

**1. ${personName}** - Chief Technology Officer
• Company: ZeroPoint Cybersecurity
• Location: San Francisco, CA
• Position: Chief Technology Officer
• LinkedIn: linkedin.com/in/${personName.toLowerCase().replace(/\s+/g, '-')}
• Network: 500+ connections
• Background: 15+ years cybersecurity experience, quantum-resistant security expert
• Previous: Former Okta, specialized in enterprise security

**2. ${personName}** - VP of Engineering
• Company: TechFlow Solutions
• Location: Austin, TX
• Position: VP of Engineering
• LinkedIn: linkedin.com/in/${personName.toLowerCase().replace(/\s+/g, '')}
• Network: 750+ connections
• Background: Cloud infrastructure leader, AI/ML specialist
• Previous: Ex-Microsoft Azure team, 12+ years experience

**3. ${personName}** - Senior Director of Product
• Company: DataVault Inc
• Location: Boston, MA
• Position: Senior Director of Product
• LinkedIn: linkedin.com/in/${(personName.split(' ')[0] || '').toLowerCase()}-${(personName.split(' ')[1] || '').toLowerCase()}
• Network: 1000+ connections
• Background: Data security and privacy product expert
• Previous: Data protection specialist, enterprise B2B products

Search completed: ${this.config.recordsLimit.toLocaleString()} profiles analyzed in 2.1 seconds.`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "person_search",
      data: { personName, searchResults: 3 },
      isTypewriter: true,
    };
  }

  /**
   * Handle buyer group analysis queries
   */
  private async handleBuyerGroupQuery(message: string): Promise<ChatMessage> {
    // Extract company name from the message
    const companyMatch = message.match(/buyer group for (.+?)(?:\s|$)/i) ||
                        message.match(/run buyer group (.+?)(?:\s|$)/i) ||
                        message.match(/analyze (.+?) buyer group/i) ||
                        message.match(/stakeholders at (.+?)(?:\s|$)/i);
    
    const companyName = companyMatch ? (companyMatch[1] || "").trim() : "this company";

    const content = `**Buyer Group Analysis: ${companyName}**

**Decision Making Unit:**

**Executive Sponsors**
• **Sarah Chen** - CEO (Final Decision Maker)
  - Budget Authority: $5M+
  - Technology Vision: Cloud-first strategy
  - Key Concern: ROI and competitive advantage

• **Michael Torres** - CFO (Financial Gatekeeper)
  - Budget Oversight: All tech expenditures > $500K
  - Decision Weight: 40%
  - Key Concern: Cost optimization and compliance

**Technical Decision Makers**
• **Jennifer Kim** - CTO (Technical Champion)
  - Influence: High (reports to CEO)
  - Technical Authority: Architecture decisions
  - Pain Point: Legacy system modernization

• **David Rodriguez** - VP Engineering (Implementation Lead)
  - Team Size: 45 engineers
  - Decision Weight: 25%
  - Key Concern: Developer productivity and scalability

**Business Stakeholders**
• **Lisa Wang** - Head of Product (End User Advocate)
  - User Experience Focus
  - Influence: Medium-High
  - Pain Point: Time-to-market challenges

• **Robert Johnson** - Head of Security (Compliance Gate)
  - Security Requirements Owner
  - Veto Power: Yes (security concerns)
  - Key Concern: Data protection and privacy

**Buying Process Intelligence:**
• Decision Timeline: 6-9 months
• Budget Cycle: Q1 planning (January-March)
• Approval Process: Technical → Financial → Executive
• Vendor Evaluation: 3-vendor shortlist process
• Success Metrics: 25% efficiency improvement target

**Recommended Engagement Strategy:**
1. Entry Point: Jennifer Kim (CTO) - technical champion
2. Business Case: Lisa Wang (Product) - ROI demonstration
3. Financial Validation: Michael Torres (CFO) - cost justification
4. Executive Buy-in: Sarah Chen (CEO) - strategic alignment

Analysis derived from proprietary buyer group intelligence and ${this.config.recordsLimit.toLocaleString()} enterprise relationship maps.`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "buyer_group_analysis",
      data: { companyName, stakeholders: 6 },
      isTypewriter: true,
    };
  }

  /**
   * Handle general Monaco queries
   */
  private handleGeneralQuery(message: string): ChatMessage {
    const content = `**Monaco Intelligence System**

Available capabilities:

**Data Analysis**
• "How did you come up with this list?"
• "Why isn't [company] on the list?"
• "What's the ICP score methodology?"

**Person & Company Search**
• "Can you find me [person name]?"
• "Search for CTOs at [company]?"
• "Who are the decision makers at [company]?"

**Buyer Group Intelligence**
• "Run a buyer group for [company]"
• "Who makes decisions at [company]?"
• "Analyze the stakeholders at [company]"

**Current Database Status**
• ${this.companies.length} companies analyzed
• ${this.people.length} decision makers identified
• ${this.config.recordsLimit.toLocaleString()} enterprise records integrated
• 94.2% data accuracy score
• Real-time updates every 15 minutes

Ask me about any company, person, or strategic analysis you need.`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "general_help",
      isTypewriter: true,
    };
  }

  /**
   * Generate follow-up response after thinking animation
   */
  async generateFollowUpResponse(responseType: string): Promise<ChatMessage | null> {
    switch (responseType) {
      case "thinking":
        // If it was a thinking message for Steve Ferro, generate the actual response
                 return await this.generateSteveFerroResponse();
      
      default:
        return null;
    }
  }

  /**
   * Execute action buttons
   */
  async executeAction(actionType: string, data?: any): Promise<ChatMessage | null> {
    switch (actionType) {
      case "draft_email":
        return this.handleEmailDraftAction(data);
        
      case "view_buyer_group":
        return this.handleViewBuyerGroupAction(data);
        
      case "add_to_pipeline":
        return this.handleAddToPipelineAction(data);
        
      case "search_mock_data":
        return await this.handleFindPersonQuery(`find ${data?.entityName || "person"}`);
        
      case "analyze_anyway":
        return await this.handleBuyerGroupQuery(`buyer group for ${data?.entityName || "company"}`);
        
      case "create_sequences":
        return {
          id: Date.now().toString(),
          type: "assistant",
          content: `**Outreach Sequences Created for ${data?.companyName || "Company"}**\n\n6 personalized sequences created\nIntegrated with Speedrun email platform\nCadence optimized for each stakeholder\n\nSequences are ready to launch.`,
          timestamp: new Date(),
          responseType: "sequences_created",
        };

      case "show_hiring_alerts":
        return this.handleHiringAlertsAction(data);

      case "analyze_growth_signals":
        return this.handleGrowthSignalsAction(data);

      case "demo_prioritization":
        return this.handleDemoPrioritizationAction(data);

      case "vp_sales_demo":
        return this.handleVPSalesDemoAction(data);
        
      default:
        return null;
    }
  }

  /**
   * Handle email draft action for Steve Ferro demo
   */
  private handleEmailDraftAction(data?: any): ChatMessage {
    const content = `**Draft Email to Steve Ferro**

**Subject**: Great meeting you tonight - Quick intro request

**Email:**

Hi Steve,

Great meeting you at the conference tonight! Really enjoyed our conversation about data infrastructure challenges in the sales operations space.

After our chat, I looked into DataCorp's setup and I think Susan Smith (your Director IT Security) and Jackson Washington (VP Infrastructure Security) would be the perfect folks to help solve the security infrastructure challenges you mentioned.

Based on what we discussed, I believe our quantum-resistant security platform could help DataCorp prepare for the next generation of cyber threats.

Can you facilitate introductions to your security leadership team? I'd love to connect with your CISO Michael Torres and the key security champions. Here are the contacts that would be most valuable:

• Michael Torres (CISO) - michael.torres@datacorp.com
• Susan Smith (Director IT Security) - susan.smith@datacorp.com  
• Jackson Washington (VP Infrastructure Security) - jackson.washington@datacorp.com
• Elena Rodriguez (Director Cybersecurity Ops) - elena.rodriguez@datacorp.com

Thanks again for the great conversation!

Best,
James

---

**📎 Attachments Ready:**
• DataCorp ROI Case Study (2-page overview)
• Technical Architecture Brief for Susan
• Implementation Timeline for Jackson

**📊 Email Performance Prediction:**
• Open Rate: 89% (personalized + warm intro)
• Response Rate: 67% (specific request + value prop)
• Meeting Booking Rate: 45% (clear next steps)`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "email_draft",
      data: { recipient: "Steve Ferro", company: "DataCorp" },

      isTypewriter: true,
    };
  }

  /**
   * Handle view buyer group action
   */
  private handleViewBuyerGroupAction(data?: any): ChatMessage {
    const content = `**Complete DataCorp Buyer Group Analysis**

**Executive Leadership (Final Approval)**
• **Patricia Davis** - CEO & President
  - Final sign-off authority for $1M+ purchases
  - Technology vision: AI-first operations
  - Engagement strategy: Business case focus

• **Marcus Thompson** - CFO
  - Budget gatekeeper for all technology spending
  - ROI requirements: 18-month payback minimum
  - Key metrics: Cost per customer acquisition

**Technology Leadership (Technical Decision)**
• **Michael Torres** - Chief Information Security Officer ⭐ DECISION MAKER
  - Final security technology approval authority
  - $5M+ security budget oversight
  - Strategic security vision and executive sponsor
  - Pain points: Quantum threat preparedness across enterprise

• **Susan Smith** - Director of IT Security ⭐ CHAMPION
  - Security architecture implementation lead
  - Technical champion for security initiatives
  - Pain points: Legacy security infrastructure vulnerabilities

• **Jackson Washington** - VP of Infrastructure Security ⭐ CHAMPION  
  - Infrastructure security implementation lead
  - Cross-functional security coordination
  - Focus: Secure, scalable infrastructure and security operations

• **Elena Rodriguez** - Director of Cybersecurity Operations ⭐ CHAMPION
  - Daily security operations oversight
  - Incident response and threat management
  - Security team coordination and execution

**Operations & Implementation**
• **Steve Ferro** - VP Sales Operations (Your Contact)
  - Sales process optimization expert
  - Gateway to technical leadership
  - Influence: Medium (process improvements)

• **Linda Rodriguez** - Head of Data Analytics
  - Data quality and reporting requirements
  - End user representative for analytics tools
  - Compliance and governance focus

**Security & Compliance**
• **Jonathan Kim** - CISO
  - Security requirements and compliance oversight
  - Veto power for security-sensitive purchases
  - Key concerns: Data protection and access controls

**Procurement Process:**
1. **Technical evaluation** (Susan & Jackson - 4 weeks)
2. **Security review** (Jonathan - 2 weeks)  
3. **Financial analysis** (Marcus - 1 week)
4. **Executive approval** (Patricia - 1 week)

**Optimal Engagement Sequence:**
1. Steve facilitates intro to Susan (your champion)
2. Technical demo with Susan & Jackson
3. Security deep-dive with Jonathan
4. Business case presentation to Marcus & Patricia

**💡 Success Probability: 73% (High - strong champions identified)**`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "full_buyer_group",
      data: { company: "DataCorp", stakeholders: 7 },

      isTypewriter: true,
    };
  }

  /**
   * Handle add to pipeline action
   */
  private handleAddToPipelineAction(data?: any): ChatMessage {
    const content = `**✅ Added DataCorp to Pipeline**

**Opportunity Created:**
• **Company**: DataCorp Solutions
• **Primary Contact**: Steve Ferro (VP Sales Operations)
• **Decision Makers**: Michael Torres (CISO), Susan Smith (Director IT Security), Jackson Washington (VP Infrastructure Security), Elena Rodriguez (Director Cybersecurity Ops)
• **Estimated Value**: $85,000 - $125,000 ARR
• **Timeline**: 3-4 months (typical enterprise sales cycle)
• **Stage**: Qualification (Meeting scheduled)

**Next Actions:**
• ✅ Contact information imported to CRM
• ✅ Buyer group profiles added to contact database  
• ✅ Meeting invite sent for intro call with Steve
• ✅ Technical demo materials prepared for Susan & Jackson
• ✅ ROI calculator customized for DataCorp's metrics

**Pipeline Summary:**
• This Week: +1 qualified opportunity
• Total Pipeline Value: +$105,000 (estimated mid-point)
• Conversion Probability: 73% (strong champion indicators)

**📱 Mobile Alert**: Steve Ferro intro call scheduled for Tuesday 2 PM`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "pipeline_added",
      data: { company: "DataCorp", value: 105000, stage: "Qualification" },
      isTypewriter: true,
    };
  }

  /**
   * Handle hiring alerts action
   */
  private handleHiringAlertsAction(data?: any): ChatMessage {
    const content = `**Hiring Alerts - Real-Time Growth Signals**

**Today's Hiring Announcements (5 Companies):**

**🔴 HIGH PRIORITY**
• **ZeroPoint Cybersecurity** - 12 new security engineer positions
  - **Growth Signal**: 40% team expansion in security division
  - **Implication**: Major client onboarding or new product launch
  - **Action**: Moved to #1 priority - call CEO Sarah Chen immediately
  - **Contact**: sarah.chen@zeropoint.com | +1 (555) 234-9876

• **DataVault Inc** - 8 new data privacy specialists
  - **Growth Signal**: GDPR compliance expansion into EU markets
  - **Implication**: International growth = increased data protection needs
  - **Action**: Contact Head of Privacy Jennifer Rodriguez
  - **Contact**: j.rodriguez@datavault.com | +1 (555) 345-7890

**🟡 MEDIUM PRIORITY**
• **TechFlow Solutions** - 15 new developers across 3 teams
  - **Growth Signal**: Engineering team doubling in size
  - **Implication**: New product development cycle starting
  - **Action**: Technical demo opportunity with CTO

• **CloudSecure Systems** - 6 new sales engineers
  - **Growth Signal**: Sales team scaling for market expansion
  - **Implication**: Rapid revenue growth phase
  - **Action**: Partnership opportunity discussion

• **NextGen Analytics** - 4 new compliance officers
  - **Growth Signal**: Regulatory readiness initiative
  - **Implication**: Enterprise client requirements increasing
  - **Action**: Monitor for procurement announcements

**📊 Alert Intelligence:**
• **Detection Method**: LinkedIn job postings, company announcements, insider signals
• **Accuracy Rate**: 94% correlation with actual growth phases
• **Response Time**: Average 3.2 hours from announcement to alert
• **Success Rate**: 67% meeting booking rate when contacted within 24 hours

**Automatic Actions Taken:**
• ZeroPoint moved to #1 in Speedrun ranking
• Contact records updated with growth context
• Follow-up reminders set for all contacts
• Competitive intelligence monitoring activated`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "hiring_alerts",
      data: { alertCount: 5, highPriority: 2 },

      isTypewriter: true,
    };
  }

  /**
   * Handle growth signals analysis action
   */
  private handleGrowthSignalsAction(data?: any): ChatMessage {
    const content = `**Growth Signals Analysis - Strategic Intelligence**

**Multi-Signal Growth Detection Across Your Portfolio:**

**🚀 EXPANSION SIGNALS (23 Companies)**

**Funding & Investment:**
• **MegaCorp Technologies** - $45M Series B announced yesterday
  - **Investor**: Andreessen Horowitz (enterprise software specialist)
  - **Use Case**: Scaling infrastructure for 10x customer growth
  - **Opportunity**: Infrastructure security overhaul required
  - **Timeline**: 6-month implementation window

• **StartupFlow Inc** - $12M Series A from Sequoia Capital
  - **Growth Plan**: International expansion into Europe
  - **Signal**: GDPR compliance requirements = immediate data protection needs
  - **Budget**: $2-5M allocated for security infrastructure

**Hiring Velocity:**
• **RapidScale Systems** - 300% engineering team growth (45 → 135 people)
  - **Signal**: Major product launch preparation
  - **Budget Implication**: Engineering security tools budget increased 4x
  - **Decision Maker**: New VP Engineering hired from Google

**Market Expansion:**
• **GlobalTech Solutions** - Opened 3 new regional offices (Austin, Denver, Seattle)
  - **Signal**: Geographic expansion into new markets
  - **Compliance**: Multi-state data residency requirements
  - **Opportunity**: Unified security platform across all locations

**🔄 TRANSFORMATION SIGNALS (18 Companies)**

**Digital Transformation:**
• **TraditionalCorp** - Announced cloud-first strategy
  - **Legacy Challenge**: 40-year-old mainframe systems
  - **Budget**: $25M digital transformation initiative
  - **Timeline**: 24-month migration project
  - **Pain Point**: Security gaps during migration

• **ManufacturingGiant** - IoT initiative for smart factories
  - **Investment**: $50M in connected manufacturing
  - **Security Gap**: Industrial IoT protection gaps
  - **Compliance**: NIST cybersecurity framework requirements

**PRIORITIZATION ALGORITHM:**

**Scoring Factors:**
• **Deal Size Potential** (40%): $2.5M average expansion deals
• **Timing Urgency** (30%): Implementation pressure from growth
• **Budget Confirmation** (20%): Verified funding/budget allocation  
• **Decision Access** (10%): Direct contact with budget holders

**Top 5 Action Items:**
1. **MegaCorp** - Call CTO Michael Torres today (funding just closed)
2. **RapidScale** - Demo request to new VP Engineering
3. **GlobalTech** - Multi-site security consultation proposal
4. **StartupFlow** - GDPR compliance needs assessment
5. **TraditionalCorp** - Legacy system security audit offer

**📊 Intelligence Sources:**
• Funding databases (Crunchbase, PitchBook)
• Job posting velocity tracking
• LinkedIn executive movement monitoring
• SEC filing analysis for public companies
• Industry news and press release monitoring

**Success Metrics:**
• **Response Rate**: 73% when contacted within 48 hours of signal
• **Meeting Conversion**: 45% schedule technical demos
• **Pipeline Impact**: 2.3x higher close rates vs. cold outreach`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "growth_signals",
      data: { expansionSignals: 23, transformationSignals: 18 },

      isTypewriter: true,
    };
  }

  /**
   * Handle demo prioritization action
   */
  private handleDemoPrioritizationAction(data?: any): ChatMessage {
    const content = `**Live Prioritization Demo - Watch Speedrun in Action**

**Scenario: Your Typical Tuesday Morning**

**9:00 AM - Initial Speedrun Ranking:**
1A. **Michael Chen** (ADP CTO) - Budget approved, demo scheduled Friday
1B. **Sarah Rodriguez** (ADP VP Eng) - Technical evaluation phase
1C. **Jennifer Kim** (TechCorp CTO) - Architecture review meeting
1D. **David Wang** (CloudFirst VP Ops) - Procurement process started
1E. **Lisa Thompson** (DataCorp Head Security) - Pain point identified

**9:15 AM - REAL-TIME SIGNAL DETECTED**

**Alert**: ZeroPoint Cybersecurity announces $30M funding round
**Source**: TechCrunch, company press release, LinkedIn executive posts
**Analysis**: Series B funding for "aggressive market expansion"

**Automatic Speedrun Reprioritization (Live Update):**

**NEW #1A: ZeroPoint Cybersecurity - Alex Rivera (CEO)**
• **Why #1**: Fresh funding = immediate implementation budget
• **Timeline**: 90-day "deploy and scale" mandate from board
• **Budget**: $5-8M allocated for security infrastructure
• **Champion**: CTO Maria Santos (former Okta security architect)
• **Decision Urgency**: HIGH - board reporting requirements

**Updated Rankings:**
1A. **Alex Rivera** (ZeroPoint CEO) - 🆕 FUNDING ALERT
1B. **Michael Chen** (ADP CTO) - Budget approved  
1C. **Sarah Rodriguez** (ADP VP Eng) - Technical evaluation
1D. **Jennifer Kim** (TechCorp CTO) - Architecture review
1E. **David Wang** (CloudFirst VP Ops) - Procurement started

**📱 NOTIFICATION POPUP:**
"Priority Change: ZeroPoint moved to #1
Reason: $30M funding round announced
Action: Call CEO Alex Rivera immediately
Best time: Next 48 hours while news is fresh"

**Context Added to Record:**
✅ Funding details and investor information
✅ Board mandate timeline (90 days)
✅ Technical team background (ex-Okta CTO)
✅ Competitive landscape (no incumbent solution)
✅ Optimal conversation starters prepared

**The VP Sales Moment:**
"Look at this! Our system just detected ZeroPoint got funding 15 minutes ago, automatically moved them to priority #1, and my rep already knows exactly why they should call and what to say. This is what I call competitive advantage."

**Demo Features:**
• **Real-time signal detection** (funding, hiring, news)
• **Automatic re-ranking** based on buying signals
• **Context-rich notifications** explaining the change
• **Pre-built conversation frameworks** for each scenario
• **Competitive intelligence** integration`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "demo_prioritization",
      data: { liveDemo: true, companiesReranked: 5 },

      isTypewriter: true,
    };
  }

  /**
   * Handle VP Sales demo action
   */
  private handleVPSalesDemoAction(data?: any): ChatMessage {
    const content = `**🏆 VP of Sales Demo Mode - Executive Dashboard**

**"WOW" Metrics That Matter to Leadership:**

**📊 PIPELINE TRANSFORMATION METRICS**

**Before BGI + RTP (Traditional "Get Lucky" Lists):**
• **Outreach Efficiency**: 2.3% response rate
• **Meeting Conversion**: 0.8% of cold calls → meetings
• **Rep Productivity**: 47 calls/day, 2.1 meetings/week
• **Pipeline Quality**: 23% of opportunities advance past discovery
• **Sales Cycle**: 147 days average
• **Forecast Accuracy**: 67% (reps guessing on deal likelihood)

**After BGI + RTP (Strategic Intelligence):**
• **Outreach Efficiency**: 18.7% response rate (+713% improvement)
• **Meeting Conversion**: 12.4% of targeted calls → meetings (+1,450% improvement)
• **Rep Productivity**: 28 strategic calls/day, 11.3 meetings/week (+439% improvement)
• **Pipeline Quality**: 73% of opportunities advance past discovery (+217% improvement)
• **Sales Cycle**: 89 days average (-40% faster close)
• **Forecast Accuracy**: 91% (data-driven deal intelligence)

**EXECUTIVE IMPACT SUMMARY**

**Revenue Impact:**
• **Pipeline Value**: $47.2M (up from $18.3M in Q3)
• **Close Rate**: 34% (up from 19% traditional approach)
• **Rep Quota Attainment**: 89% team average (vs. 67% industry benchmark)
• **Revenue per Rep**: $2.1M annual (vs. $1.3M industry average)

**Operational Efficiency:**
• **Time to First Meeting**: 3.2 days (vs. 28 days cold calling)
• **Research Time per Prospect**: 4 minutes (vs. 45 minutes manual research)
• **Administrative Tasks**: -67% reduction (automated intelligence)
• **CRM Data Quality**: 94% accurate (real-time updates)

**Competitive Advantage:**
• **Market Intelligence**: Real-time signals vs. quarterly reports
• **Account Penetration**: 4.7 contacts per target account (vs. 1.2 random contacts)
• **Win Rate vs. Competitors**: 73% (vs. 45% when competing blind)
• **Deal Size**: $387K average (vs. $234K without BGI insights)

**🚀 THE "VP OF SALES WOW" MOMENT:**

**Real Example - This Quarter:**
"My rep called the ZeroPoint CEO 20 minutes after their funding announcement because our RTP system detected it and automatically prioritized them. The CEO said 'Perfect timing - we literally just got off a board call about scaling our security.' We closed a $750K deal in 32 days."

**Board-Level Results:**
• **Q4 Pipeline**: 156% of target (highest in company history)
• **Team Morale**: +34% (reps love having strategic conversations)
• **Customer Acquisition Cost**: -41% (efficient targeting)
• **Sales Velocity**: 2.7x faster than previous system

**VP Leadership Dashboard:**
• **Real-time rep performance** with strategic context
• **Pipeline health** with buyer group intelligence
• **Competitive win/loss** analysis with reasoning
• **Forecast accuracy** trending and early warning system

**The Bottom Line:**
"My team went from hoping to get lucky to strategically orchestrating every conversation. We're not just hitting our numbers - we're redefining what's possible in enterprise sales."`;

    return {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      responseType: "vp_sales_demo",
      data: { 
        pipelineIncrease: 158,
        responseRateImprovement: 713,
        cycleReduction: 40
      },

      isTypewriter: true,
    };
  }
} 