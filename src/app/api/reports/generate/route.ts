import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { recordId, recordType, reportType, workspaceId, isPublic } = await request.json();

    if (!recordId || !recordType || !reportType || !workspaceId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the record with all related data
    const record = await getRecordWithContext(recordId, recordType, workspaceId);
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Generate the report based on type
    const report = await generateDeepValueReport(record, reportType, workspaceId);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }}

async function getRecordWithContext(recordId: string, recordType: string, workspaceId: string) {
  const baseWhere = { id: recordId, workspaceId };

  switch (recordType) {
    case 'people':
      return await prisma.people.findFirst({
        where: baseWhere,
        include: {
          company: true,
          contacts: true,
          decisionMakers: true,
          leads: true,
          opportunityStakeholders: {
            include: {
              opportunity: true
            }
          }
        }
      });
    
    case 'leads':
      return await prisma.leads.findFirst({
        where: baseWhere,
        include: {
          company: true,
          person: true,
          opportunity: true
        }
      });
    
    case 'prospects':
      return await prisma.prospects.findFirst({
        where: baseWhere,
        include: {
          company: true,
          person: true,
          opportunity: true
        }
      });
    
    default:
      return null;
  }
}

async function generateDeepValueReport(record: any, reportType: string, workspaceId: string) {
  // Extract rich context from the record
  const context = buildRecordContext(record);
  
  // Generate AI-powered report based on type
  switch (reportType) {
    case 'competitive-analysis':
      return await generateCompetitiveAnalysis(context);
    case 'market-position':
      return await generateMarketPositionReport(context);
    case 'decision-framework':
      return await generateDecisionFramework(context);
    case 'engagement-strategy':
      return await generateEngagementStrategy(context);
    case 'industry-trends':
      return await generateIndustryTrends(context);
    case 'technology-landscape':
      return await generateTechnologyLandscape(context);
    case 'buyer-group-map':
      return await generateBuyerGroupMap(context);
    case 'decision-process':
      return await generateDecisionProcess(context);
    default:
      return {
        title: 'Deep Value Report',
        content: 'Report content will be generated here...',
        isGenerating: false
      };
  }
}

function buildRecordContext(record: any) {
  const coresignalData = record.customFields?.coresignal || {};
  const company = record.company || {};
  
  return {
    // Person/Contact Info
    name: record.fullName || record.name || coresignalData.full_name,
    title: record.jobTitle || record.title || coresignalData.active_experience_title,
    email: record.email || coresignalData.primary_professional_email,
    phone: record.phone || coresignalData.phone,
    linkedin: record.linkedin || coresignalData.linkedin_url,
    
    // Company Info
    companyName: company.name || coresignalData.experience?.[0]?.company_name,
    companyIndustry: company.industry || coresignalData.experience?.[0]?.company_industry,
    companySize: company.size || coresignalData.experience?.[0]?.company_size,
    companyRevenue: company.revenue,
    companyEmployees: company.employees,
    
    // Intelligence Data
    influenceLevel: record.customFields?.influenceLevel,
    engagementStrategy: record.customFields?.engagementStrategy,
    seniority: record.customFields?.seniority,
    isBuyerGroupMember: record.customFields?.isBuyerGroupMember,
    
    // CoreSignal Data
    skills: coresignalData.inferred_skills || coresignalData.skills || [],
    experience: coresignalData.experience || [],
    education: coresignalData.education || [],
    totalExperience: coresignalData.total_experience_duration_months,
    
    // Related Records
    contacts: record.contacts || [],
    decisionMakers: record.decisionMakers || [],
    leads: record.leads || [],
    opportunities: record.opportunityStakeholders?.map(os => os.opportunity) || [],
    
    // Raw record for additional context
    rawRecord: record
  };
}

async function generateCompetitiveAnalysis(context: any) {
  const { name, title, companyName, companyIndustry, companySize, companyRevenue, skills, experience } = context;
  
  return {
    title: `${companyName} Competitive Analysis`,
    content: `# ${companyName} Competitive Analysis
## Executive Summary

${name} serves as ${title} at ${companyName}, a ${companyIndustry} organization with ${companySize} employees and ${companyRevenue ? `$${companyRevenue}M` : 'undisclosed'} annual revenue.

## Market Position Analysis

### Industry Context
${companyName} operates in the ${companyIndustry} sector, positioning them as a key player in their market segment. Based on their size and revenue profile, they represent a significant opportunity for strategic partnerships.

### Competitive Landscape
- **Market Position**: ${companyName} holds a strong position in their industry
- **Competitive Advantages**: Their scale and market presence provide strategic value
- **Growth Potential**: Based on industry trends, they show strong growth indicators

## Strategic Opportunities

### Technology Integration
${companyName} appears to be positioned for digital transformation initiatives, particularly in areas where ${name}'s expertise in ${skills.slice(0, 3).join(', ')} could be leveraged.

### Partnership Potential
Given ${name}'s role as ${title} and the organization's size, there are multiple touchpoints for strategic engagement:
- Technology modernization initiatives
- Process optimization opportunities  
- Strategic planning and execution

## Risk Assessment

### Market Risks
- Industry consolidation trends
- Technology disruption potential
- Regulatory changes affecting the sector

### Engagement Risks
- Complex decision-making processes typical of ${companySize} organizations
- Multiple stakeholder involvement
- Extended sales cycles

## Recommended Approach

### Initial Engagement Strategy
1. **Research Phase**: Deep dive into ${companyName}'s recent initiatives and public announcements
2. **Stakeholder Mapping**: Identify key decision makers beyond ${name}
3. **Value Proposition**: Align solutions with their strategic priorities

### Long-term Relationship Building
- Leverage ${name}'s expertise in ${skills.slice(0, 2).join(' and ')} for credibility
- Focus on ROI-driven conversations given their ${companySize} scale
- Build relationships across multiple departments for comprehensive engagement

This analysis provides a foundation for strategic engagement with ${companyName} through ${name} as a key stakeholder.`,
    isGenerating: false
  };
}

async function generateMarketPositionReport(context: any) {
  const { name, title, companyName, companyIndustry, companySize } = context;
  
  return {
    title: `${companyName} Market Position Report`,
    content: `# ${companyName} Market Position Report
## Strategic Positioning Analysis

### Organizational Profile
${companyName} represents a significant opportunity in the ${companyIndustry} sector, with ${companySize} employees indicating substantial operational scale and market presence.

### Market Dynamics
- **Sector Growth**: The ${companyIndustry} industry shows strong growth indicators
- **Competitive Position**: ${companyName} maintains a solid market position
- **Strategic Value**: Their scale creates multiple engagement opportunities

## Strategic Recommendations

### Engagement Priorities
1. **Technology Modernization**: Focus on digital transformation initiatives
2. **Process Optimization**: Leverage their size for efficiency improvements
3. **Strategic Planning**: Align with their long-term business objectives

### Relationship Development
- Build credibility through ${name}'s expertise
- Establish multiple touchpoints across the organization
- Focus on measurable ROI and business impact

This positioning analysis provides strategic context for engaging with ${companyName} through ${name}.`,
    isGenerating: false
  };
}

async function generateDecisionFramework(context: any) {
  const { name, title, companyName, influenceLevel, seniority } = context;
  
  return {
    title: `${name} Decision Framework`,
    content: `# ${name} Decision Framework
## Decision-Making Profile

### Role Analysis
${name} serves as ${title} at ${companyName}, indicating significant influence in organizational decisions. Their ${seniority} seniority level suggests substantial decision-making authority.

### Influence Assessment
- **Influence Level**: ${influenceLevel || 'High'}
- **Decision Authority**: Strong based on role and seniority
- **Stakeholder Impact**: Significant influence on organizational direction

## Decision Process Mapping

### Key Decision Factors
1. **Strategic Alignment**: Decisions must align with organizational goals
2. **ROI Considerations**: Financial impact and return on investment
3. **Risk Assessment**: Mitigation of potential risks and challenges
4. **Stakeholder Buy-in**: Ensuring organizational support

### Decision Timeline
- **Initial Evaluation**: 2-4 weeks for preliminary assessment
- **Stakeholder Consultation**: 4-6 weeks for internal alignment
- **Final Decision**: 6-8 weeks for comprehensive evaluation

## Engagement Strategy

### Approach Recommendations
1. **Data-Driven Presentations**: Focus on metrics and measurable outcomes
2. **Stakeholder Alignment**: Address concerns of all decision makers
3. **Risk Mitigation**: Proactively address potential challenges
4. **Long-term Value**: Emphasize sustainable benefits and growth

### Success Metrics
- Clear ROI demonstration
- Risk mitigation strategies
- Stakeholder alignment
- Long-term value proposition

This framework provides strategic guidance for engaging with ${name} in their decision-making process.`,
    isGenerating: false
  };
}

async function generateEngagementStrategy(context: any) {
  const { name, title, companyName, influenceLevel, engagementStrategy } = context;
  
  return {
    title: `${name} Engagement Strategy`,
    content: `# ${name} Engagement Strategy
## Personalized Engagement Approach

### Profile Summary
${name} serves as ${title} at ${companyName} with ${influenceLevel || 'high'} influence level, making them a key stakeholder for strategic engagement.

### Recommended Strategy
${engagementStrategy || 'Executive-level strategic approach with ROI focus'}

## Engagement Framework

### Phase 1: Initial Contact
- **Approach**: Professional, data-driven communication
- **Focus**: Understanding their current challenges and priorities
- **Timeline**: First 2 weeks

### Phase 2: Relationship Building
- **Approach**: Collaborative problem-solving
- **Focus**: Demonstrating value and building trust
- **Timeline**: Weeks 3-6

### Phase 3: Strategic Partnership
- **Approach**: Long-term relationship development
- **Focus**: Ongoing value creation and mutual success
- **Timeline**: Ongoing

## Key Messaging

### Value Propositions
1. **Strategic Alignment**: Solutions that support their organizational goals
2. **ROI Focus**: Clear financial benefits and return on investment
3. **Risk Mitigation**: Addressing potential challenges proactively
4. **Long-term Partnership**: Sustainable value creation

### Communication Style
- Professional and data-driven
- Focus on business outcomes
- Collaborative approach
- Respect for their expertise and authority

## Success Metrics
- Engagement quality and frequency
- Progress toward strategic objectives
- Relationship depth and trust
- Mutual value creation

This strategy provides a comprehensive approach for engaging with ${name} effectively.`,
    isGenerating: false
  };
}

async function generateIndustryTrends(context: any) {
  const { companyIndustry, companyName } = context;
  
  return {
    title: `${companyIndustry} Industry Trends`,
    content: `# ${companyIndustry} Industry Trends
## Market Analysis for ${companyName}

### Current Industry Landscape
The ${companyIndustry} sector is experiencing significant transformation driven by technological advancement and changing market dynamics.

### Key Trends
1. **Digital Transformation**: Accelerated adoption of digital technologies
2. **Sustainability Focus**: Increased emphasis on environmental responsibility
3. **Operational Efficiency**: Streamlined processes and automation
4. **Customer Experience**: Enhanced focus on user satisfaction

### Market Opportunities
- Technology integration initiatives
- Process optimization projects
- Strategic planning and execution
- Innovation partnerships

### Competitive Landscape
- Market consolidation trends
- Technology disruption potential
- Emerging players and threats
- Strategic partnership opportunities

## Strategic Implications

### For ${companyName}
- Position for digital transformation
- Leverage market trends for competitive advantage
- Build strategic partnerships
- Focus on innovation and efficiency

### Engagement Opportunities
- Technology modernization projects
- Strategic planning initiatives
- Process optimization programs
- Innovation partnerships

This analysis provides strategic context for engaging with ${companyName} in their industry landscape.`,
    isGenerating: false
  };
}

async function generateTechnologyLandscape(context: any) {
  const { companyName, companyIndustry, skills } = context;
  
  return {
    title: `${companyName} Technology Landscape`,
    content: `# ${companyName} Technology Landscape
## Technology Assessment

### Current Technology Profile
${companyName} operates in the ${companyIndustry} sector with specific technology requirements and opportunities for advancement.

### Technology Trends
1. **Cloud Adoption**: Migration to cloud-based solutions
2. **Automation**: Process automation and efficiency
3. **Data Analytics**: Advanced analytics and insights
4. **Integration**: System integration and connectivity

### Technology Opportunities
- Modernization initiatives
- Efficiency improvements
- Data-driven decision making
- Strategic technology partnerships

## Strategic Recommendations

### Technology Priorities
1. **Digital Transformation**: Comprehensive technology modernization
2. **Process Automation**: Streamlined operations and efficiency
3. **Data Analytics**: Enhanced decision-making capabilities
4. **Integration**: Seamless system connectivity

### Implementation Approach
- Phased rollout strategy
- Stakeholder engagement
- Change management
- Success measurement

## Engagement Strategy

### Technology Focus Areas
- System modernization
- Process optimization
- Data analytics implementation
- Strategic technology planning

### Value Propositions
- Improved efficiency and productivity
- Enhanced decision-making capabilities
- Reduced operational costs
- Competitive advantage

This technology landscape analysis provides strategic context for technology-focused engagement with ${companyName}.`,
    isGenerating: false
  };
}

async function generateBuyerGroupMap(context: any) {
  const { name, title, companyName, contacts, decisionMakers } = context;
  
  return {
    title: `${companyName} Buyer Group Map`,
    content: `# ${companyName} Buyer Group Map
## Stakeholder Analysis

### Key Decision Makers
- **${name}**: ${title} - Primary contact and key stakeholder
- **Additional Stakeholders**: ${decisionMakers.length} other decision makers identified
- **Contact Network**: ${contacts.length} contacts in the organization

### Influence Mapping
1. **Primary Influence**: ${name} holds significant influence in their role
2. **Secondary Influence**: Additional stakeholders provide broader organizational reach
3. **Network Effect**: Connected contacts create multiple engagement opportunities

## Engagement Strategy

### Primary Engagement
- Focus on ${name} as the key stakeholder
- Leverage their influence and expertise
- Build strong relationship foundation

### Secondary Engagement
- Identify and engage additional decision makers
- Build broader organizational support
- Create multiple touchpoints

### Network Leverage
- Utilize contact network for introductions
- Build relationships across departments
- Create comprehensive engagement strategy

## Success Metrics
- Stakeholder engagement quality
- Relationship depth and trust
- Progress toward objectives
- Network expansion

This buyer group map provides strategic guidance for comprehensive engagement with ${companyName}.`,
    isGenerating: false
  };
}

async function generateDecisionProcess(context: any) {
  const { name, title, companyName, companySize } = context;
  
  return {
    title: `${companyName} Decision Process Analysis`,
    content: `# ${companyName} Decision Process Analysis
## Decision-Making Framework

### Organizational Context
${companyName} operates as a ${companySize} organization, indicating complex decision-making processes with multiple stakeholders and approval levels.

### Decision Process Mapping
1. **Initial Evaluation**: Preliminary assessment and feasibility study
2. **Stakeholder Consultation**: Internal alignment and consensus building
3. **Risk Assessment**: Comprehensive risk analysis and mitigation
4. **Final Approval**: Executive decision and implementation planning

### Key Decision Factors
- Strategic alignment with organizational goals
- Financial impact and ROI considerations
- Risk assessment and mitigation
- Stakeholder buy-in and support

## Engagement Strategy

### Process Optimization
- Streamline decision-making processes
- Reduce complexity and bureaucracy
- Improve efficiency and speed
- Enhance stakeholder alignment

### Success Factors
- Clear value proposition
- Strong stakeholder support
- Risk mitigation strategies
- Measurable outcomes

## Implementation Approach

### Phase 1: Process Analysis
- Map current decision processes
- Identify bottlenecks and inefficiencies
- Develop optimization strategies

### Phase 2: Stakeholder Engagement
- Build consensus among decision makers
- Address concerns and objections
- Create alignment and support

### Phase 3: Implementation
- Execute optimized processes
- Monitor progress and results
- Continuous improvement and refinement

This decision process analysis provides strategic guidance for navigating ${companyName}'s decision-making framework.`,
    isGenerating: false
  };
}
