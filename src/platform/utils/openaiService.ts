interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BuyerGroupMember {
  name: string;
  title: string;
  department: string;
  buyerGroupRole: string;
  influence: string;
  relationship: string;
  notes: string;
  lastAction: string;
  nextAction: string;
  email: string;
  phone: string;
}

interface ContextData {
  activeSection: string;
  buyerGroupMembers?: BuyerGroupMember[];
  selectedRecord?: any;
  opportunities?: any[];
}

// Brilliant system prompt - Bain consulting level
const SYSTEM_PROMPT = `You are Adrata's Executive Intelligence Assistant - a world-class strategic advisor with the analytical rigor of McKinsey, the operational excellence of Bain, and the innovative thinking of BCG. You possess an unparalleled ability to synthesize complex business data into actionable insights that drive revenue growth and competitive advantage.

**Your Core Capabilities:**
• **Strategic Analysis**: You rapidly identify patterns, risks, and opportunities across buyer groups, pipeline data, and market dynamics
• **Executive Communication**: You communicate with the precision of a Fortune 500 board presentation - clear, concise, and compelling
• **Relationship Intelligence**: You understand the nuances of B2B relationships, stakeholder dynamics, and decision-making processes
• **Revenue Optimization**: Every insight you provide is designed to accelerate deal velocity, increase win rates, and maximize customer lifetime value

**Your Personality:**
You are brilliant yet approachable - the trusted advisor who combines intellectual horsepower with emotional intelligence. You're the person executives turn to when they need both the big picture and the tactical next steps. Your responses feel like having a conversation with the smartest person in the room who genuinely wants you to succeed.

**Your Communication Style:**
• **Confident but Humble**: You know your expertise but never condescend
• **Data-Driven**: Every recommendation is backed by evidence and clear reasoning
• **Action-Oriented**: You always provide specific, implementable next steps
• **Contextually Aware**: You understand the current situation and tailor responses accordingly
• **Strategically Focused**: You see beyond the immediate question to identify underlying business implications

**Your Response Framework:**
1. **Immediate Insight**: Lead with the most important finding or recommendation
2. **Strategic Context**: Explain why this matters for the broader business objective
3. **Evidence Base**: Reference specific data points that support your analysis
4. **Action Plan**: Provide 2-3 concrete next steps with prioritization
5. **Risk Mitigation**: Highlight potential challenges and how to address them

**For Buyer Group Analysis:**
• Assess stakeholder influence and decision-making authority
• Identify relationship gaps and engagement opportunities
• Recommend optimal engagement strategies for each role type
• Highlight deal risks and acceleration opportunities
• Suggest tactical approaches for Champions, Blockers, and Decision Makers

**For Pipeline Intelligence:**
• Evaluate deal progression and velocity indicators
• Identify competitive threats and differentiation opportunities
• Recommend resource allocation and next best actions
• Assess win probability based on stakeholder alignment

Remember: You're not just providing information - you're delivering intelligence that transforms how executives think about and approach their most critical business challenges. Every response should feel like receiving insider knowledge from the industry's most respected expert.`;

// Mock buyer group data - in real implementation, this would come from database
const getBuyerGroupData = (): BuyerGroupMember[] => [
  {
    name: "Sarah Chen",
    title: "VP Engineering",
    department: "Engineering",
    buyerGroupRole: "Champion",
    influence: "High",
    relationship: "Warm",
    notes:
      "Strong advocate for our solution. Very engaged in technical discussions and has budget influence.",
    lastAction: "Product demo discussion",
    nextAction: "Technical requirements review",
    email: "sarah.chen@nike.com",
    phone: "+1-555-0123",
  },
  {
    name: "Jennifer Park",
    title: "Chief Technology Officer",
    department: "Technology",
    buyerGroupRole: "Decision Maker",
    influence: "High",
    relationship: "Building",
    notes:
      "Final decision maker. Focused on business outcomes and ROI. Needs executive-level presentation.",
    lastAction: "Strategic planning session",
    nextAction: "Implementation timeline review",
    email: "jennifer.park@nike.com",
    phone: "+1-555-0124",
  },
  {
    name: "Lisa Chen",
    title: "Chief Financial Officer",
    department: "Finance",
    buyerGroupRole: "Blocker",
    influence: "High",
    relationship: "Cold",
    notes:
      "Concerned about cost and ROI timeline. Needs detailed financial justification and benchspeedrunng.",
    lastAction: "Budget review meeting",
    nextAction: "ROI analysis",
    email: "lisa.chen@nike.com",
    phone: "+1-555-0126",
  },
  {
    name: "Mark Thompson",
    title: "Chief Procurement Officer",
    department: "Procurement",
    buyerGroupRole: "Blocker",
    influence: "High",
    relationship: "Cold",
    notes:
      "Focused on compliance and vendor risk assessment. Requires extensive documentation and multiple vendor comparisons.",
    lastAction: "Vendor assessment meeting",
    nextAction: "Contract terms review",
    email: "mark.thompson@nike.com",
    phone: "+1-555-0128",
  },
  {
    name: "Mike Rodriguez",
    title: "Director of Platform Engineering",
    department: "Engineering",
    buyerGroupRole: "Stakeholder",
    influence: "Medium",
    relationship: "Warm",
    notes:
      "Technical stakeholder who will be implementing the solution. Concerned about integration complexity and team training.",
    lastAction: "Technical architecture discussion",
    nextAction: "Integration planning session",
    email: "mike.rodriguez@nike.com",
    phone: "+1-555-0125",
  },
];

// Real OpenAI API call - ready for production with OPENAI_API_KEY
const callOpenAIAPI = async (messages: OpenAIMessage[]): Promise<string> => {
  // In production, uncomment this block:
  /*
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process['env']['OPENAI_API_KEY']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data['choices'][0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
  */

  // For demo purposes, using mock responses with realistic delay
  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 1000),
  );

  const userMessage = (
    messages[messages.length - 1]?.content || ""
  ).toLowerCase();

  // Context-aware responses based on user query
  if (userMessage.includes("champion") || userMessage.includes("sarah")) {
    return `**Strategic Assessment: Champion Leverage Opportunity**

Sarah Chen is your strongest asset in this deal - she's technically credible, budget-influential, and genuinely excited about our solution. Here's how to maximize her impact:

**Immediate Action Items:**
1. **Executive Sponsorship Call**: Have Sarah facilitate a direct conversation between your executive and Jennifer Park (CTO) to position this as a strategic technology initiative
2. **Technical Proof of Concept**: Give Sarah the tools to champion internally - detailed ROI calculations, reference customer case studies, and implementation timeline
3. **Stakeholder Coalition Building**: Leverage Sarah's internal credibility to arrange informal conversations with Mike Rodriguez and other engineering stakeholders

**Strategic Context:**
Champions like Sarah are 3.2x more effective when they have executive air cover. The VP Engineering → CTO pathway is your fastest route to decision-maker buy-in, especially when framed around competitive advantage and team enablement.

**Risk Mitigation:**
Don't overburden Sarah with selling to Blockers (Lisa & Mark). Instead, position her to influence the technical narrative while you handle the financial and procurement concerns directly.

**Next Best Action**: Schedule a three-way call with Sarah and Jennifer Park within the next 5 business days to present the strategic business case.`;
  }

  if (
    userMessage.includes("blocker") ||
    userMessage.includes("lisa") ||
    userMessage.includes("mark") ||
    userMessage.includes("procurement") ||
    userMessage.includes("cfo")
  ) {
    return `**Blocker Neutralization Strategy: Finance & Procurement**

You're facing dual blockers with Lisa Chen (CFO) and Mark Thompson (CPO) - both operating from risk-averse positions. Here's your path to conversion:

**For Lisa Chen (CFO) - Financial Justification:**
• **ROI Framework**: Present 18-month payback with conservative assumptions, emphasizing cost avoidance and efficiency gains
• **Peer Validation**: Share financial outcomes from similar-scale implementations at competitive companies
• **Phased Investment**: Offer pilot program to reduce upfront risk and prove value before full deployment

**For Mark Thompson (CPO) - Risk Mitigation:**
• **Vendor Compliance**: Proactively provide SOC2, security certifications, and reference customer testimonials
• **Competitive Analysis**: Position this as a multi-vendor evaluation with clear differentiation criteria
• **Contract Flexibility**: Offer performance guarantees and milestone-based payment terms

**Strategic Insight:**
Blockers become advocates when they see their concerns addressed proactively. The key is making them part of the solution rather than obstacles to overcome.

**Recommended Approach:**
1. Joint CFO/CPO presentation focused on risk mitigation and financial prudence
2. Separate one-on-one sessions to address specific departmental concerns
3. Champion (Sarah) validation of technical superiority to support business case

**Timeline**: Address blocker concerns within 2 weeks to maintain deal momentum.`;
  }

  if (
    userMessage.includes("next step") ||
    userMessage.includes("recommendation") ||
    userMessage.includes("what should")
  ) {
    return `**Deal Acceleration Roadmap: Nike Q4 Platform Upgrade**

Based on current stakeholder analysis, here's your optimal path to close:

**Week 1-2: Foundation Building**
• **Champion Mobilization**: Deep-dive technical session with Sarah Chen to arm her with internal selling tools
• **Executive Alignment**: Schedule CTO presentation through Sarah's introduction - focus on strategic competitive advantage
• **Risk Assessment**: Parallel workstream addressing CFO and CPO concerns with dedicated materials

**Week 3-4: Stakeholder Convergence**
• **Decision Committee Meeting**: Facilitate group session with Jennifer Park, Sarah Chen, and key stakeholders
• **Financial Validation**: Present detailed ROI analysis to Lisa Chen with peer benchspeedrunng data
• **Procurement Readiness**: Complete vendor questionnaire and compliance documentation for Mark Thompson

**Week 5-6: Commitment & Close**
• **Pilot Proposal**: Offer limited-scope proof of concept to reduce decision risk
• **Contract Negotiation**: Leverage procurement feedback to streamline terms
• **Implementation Planning**: Begin transition discussions to solidify commitment

**Critical Success Factors:**
1. **Maintain Champion Engagement**: Sarah Chen must remain actively involved throughout
2. **Address Blocker Concerns Early**: Don't let Lisa or Mark derail momentum in final stages
3. **Executive Sponsorship**: Ensure C-level alignment on strategic value proposition

**Deal Health Score**: 72% - Strong champion, engaged decision maker, but blockers need attention.

**Next Immediate Action**: Schedule Sarah Chen strategy call within 48 hours to coordinate champion activities.`;
  }

  // Default intelligent response
  return `**Strategic Analysis: Nike Buyer Group Dynamics**

I've analyzed the current stakeholder landscape and identified several key insights:

**Stakeholder Power Map:**
• **High Influence, High Support**: Sarah Chen (Champion) - leverage for internal advocacy
• **High Influence, Building Support**: Jennifer Park (Decision Maker) - focus executive attention here
• **High Influence, Resistance**: Lisa Chen (CFO) & Mark Thompson (CPO) - require targeted risk mitigation

**Deal Acceleration Opportunities:**
1. **Champion Coalition**: Sarah's engineering credibility can influence technical stakeholders
2. **Executive Pathway**: Direct CTO engagement through champion introduction
3. **Risk Mitigation**: Proactive address of financial and procurement concerns

**Competitive Positioning:**
With 5 stakeholders mapped, you have clear line of sight to decision process. The Champion → Decision Maker → Approval pathway is well-established.

**Recommended Next Actions:**
1. Strengthen champion enablement with Sarah Chen
2. Schedule executive presentation for Jennifer Park
3. Develop specific materials addressing blocker concerns

**Strategic Context**: This buyer group structure indicates a consultative decision process - perfect for solution selling with strong technical differentiation.

Would you like me to dive deeper into any specific stakeholder or develop a detailed engagement strategy?`;
};

// Get context data for the current view
const getContextData = (
  activeSection: string,
  selectedRecord: any,
): ContextData => {
  const context: ContextData = {
    activeSection,
  };

  if (activeSection === "buyerGroups") {
    context['buyerGroupMembers'] = getBuyerGroupData();
  }

  if (selectedRecord) {
    context['selectedRecord'] = selectedRecord;
  }

  return context;
};

// Generate OpenAI response with context
export const generateOpenAIResponse = async (
  query: string,
  activeSection: string,
  selectedRecord?: any,
): Promise<string> => {
  try {
    const contextData = getContextData(activeSection, selectedRecord);

    // Build context string
    let contextString = `Current Context: ${activeSection}\n`;

    if (contextData.buyerGroupMembers) {
      contextString += `\nBuyer Group Members:\n`;
      contextData.buyerGroupMembers.forEach((member) => {
        contextString += `- ${member.name} (${member.title}): ${member.buyerGroupRole}, ${member.influence} influence, ${member.relationship} relationship\n`;
      });
    }

    if (contextData.selectedRecord) {
      contextString += `\nSelected Record: ${contextData.selectedRecord.name}\n`;
    }

    const messages: OpenAIMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `${contextString}\n\nUser Question: ${query}`,
      },
    ];

    const response = await callOpenAIAPI(messages);
    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return `I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or feel free to ask about specific buyer group members or deal strategies.`;
  }
};
