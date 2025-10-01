import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface IntelligenceProfile {
  influenceLevel: string;
  engagementStrategy: string;
  seniority: string;
  isBuyerGroupMember: boolean;
  influenceScore: number;
  decisionPower: number;
  primaryRole: string;
  engagementLevel: string;
  communicationStyle: string;
  decisionMaking: string;
  preferredContact: string;
  responseTime: string;
  painPoints: string[];
  interests: string[];
  goals: string[];
  challenges: string[];
  opportunities: string[];
  summary: string;
}

export async function generateIntelligenceProfile(record: any): Promise<IntelligenceProfile> {
  try {
    // Extract comprehensive context from the record
    const context = buildIntelligenceContext(record);
    
    const prompt = `You are an expert business intelligence analyst. Generate a comprehensive intelligence profile for this professional contact based on their role, experience, and organizational context.

CONTACT CONTEXT:
- Name: ${context.name}
- Title: ${context.title}
- Company: ${context.companyName}
- Industry: ${context.industry}
- Department: ${context.department}
- Experience: ${context.totalExperience} years
- Skills: ${context.skills.join(', ')}
- Education: ${context.education}
- LinkedIn Connections: ${context.connectionsCount}
- Company Size: ${context.companySize}
- Company Revenue: ${context.companyRevenue}

ANALYSIS REQUIREMENTS:
Generate a sophisticated intelligence profile that includes:

1. INFLUENCE ASSESSMENT:
   - Influence Level: High/Medium/Low (based on role, seniority, connections)
   - Influence Score: 0-100% (quantitative assessment)
   - Decision Power: 0-100% (decision-making authority)

2. ENGAGEMENT STRATEGY:
   - Recommended approach based on their role and communication patterns
   - Key messaging strategy
   - Preferred contact methods

3. BEHAVIORAL PROFILE:
   - Communication style (Professional/Casual/Technical/Data-driven)
   - Decision-making approach (Analytical/Intuitive/Collaborative/Authoritative)
   - Response time expectations
   - Preferred contact method

4. STRATEGIC INSIGHTS:
   - Pain points specific to their role and industry
   - Professional interests and motivations
   - Career goals and objectives
   - Current challenges they likely face
   - Strategic opportunities for engagement

5. CONTEXTUAL SUMMARY:
   - A comprehensive 2-3 sentence summary of their influence, role, and engagement approach

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "influenceLevel": "High/Medium/Low",
  "engagementStrategy": "Specific strategy based on their profile",
  "seniority": "Executive/Senior/Mid-level/Entry-level",
  "isBuyerGroupMember": true/false,
  "influenceScore": 85,
  "decisionPower": 78,
  "primaryRole": "Decision Maker/Influencer/Evaluator/User",
  "engagementLevel": "High/Medium/Low interest",
  "communicationStyle": "Professional/Technical/Casual",
  "decisionMaking": "Data-driven/Analytical/Intuitive/Collaborative",
  "preferredContact": "Email/Phone/LinkedIn/In-person",
  "responseTime": "24-48 hours/1-2 weeks/Immediate",
  "painPoints": ["Specific pain point 1", "Specific pain point 2", "etc"],
  "interests": ["Professional interest 1", "Professional interest 2", "etc"],
  "goals": ["Career goal 1", "Career goal 2", "etc"],
  "challenges": ["Current challenge 1", "Current challenge 2", "etc"],
  "opportunities": ["Strategic opportunity 1", "Strategic opportunity 2", "etc"],
  "summary": "Comprehensive 2-3 sentence summary of their profile and engagement approach"
}

Make all insights highly specific to their role, industry, and organizational context. Avoid generic statements.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        // Extract JSON from the response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const intelligenceData = JSON.parse(jsonMatch[0]);
          return intelligenceData as IntelligenceProfile;
        }
      } catch (error) {
        console.error('Error parsing AI intelligence response:', error);
      }
    }

    // Fallback to basic generation if AI fails
    return generateBasicIntelligenceProfile(context);
  } catch (error) {
    console.error('Error generating intelligence profile:', error);
    return generateBasicIntelligenceProfile(context);
  }
}

function buildIntelligenceContext(record: any) {
  const coresignalData = record?.customFields?.coresignal || {};
  const company = record?.company || {};
  
  return {
    name: record?.fullName || record?.name || coresignalData.full_name || 'Unknown',
    title: record?.jobTitle || record?.title || coresignalData.active_experience_title || 'Unknown',
    companyName: company.name || coresignalData.experience?.[0]?.company_name || 'Unknown Company',
    industry: company.industry || coresignalData.experience?.[0]?.company_industry || 'Unknown',
    department: coresignalData.active_experience_department || coresignalData.experience?.[0]?.department || 'Unknown',
    totalExperience: Math.floor((coresignalData.total_experience_duration_months || 0) / 12),
    skills: coresignalData.inferred_skills || coresignalData.skills || [],
    education: coresignalData.education?.[0]?.institution_name || 'Unknown',
    connectionsCount: coresignalData.connections_count || coresignalData.connectionsCount || 0,
    companySize: company.size || coresignalData.experience?.[0]?.company_size || 'Unknown',
    companyRevenue: company.revenue || 'Unknown'
  };
}

function generateBasicIntelligenceProfile(context: any): IntelligenceProfile {
  // Basic fallback - but still contextual
  const isSenior = context.totalExperience > 10 || context.title.toLowerCase().includes('director') || context.title.toLowerCase().includes('manager');
  const isSafety = context.title.toLowerCase().includes('safety') || context.skills.some((skill: string) => skill.toLowerCase().includes('safety'));
  
  return {
    influenceLevel: isSenior ? 'High' : 'Medium',
    engagementStrategy: isSafety ? 'Safety-focused approach with compliance emphasis' : 'Professional approach with ROI focus',
    seniority: isSenior ? 'Senior' : 'Mid-level',
    isBuyerGroupMember: isSenior,
    influenceScore: isSenior ? 85 : 65,
    decisionPower: isSenior ? 80 : 60,
    primaryRole: isSenior ? 'Decision Maker' : 'Influencer',
    engagementLevel: 'Medium',
    communicationStyle: 'Professional',
    decisionMaking: 'Data-driven',
    preferredContact: 'Email',
    responseTime: '24-48 hours',
    painPoints: isSafety ? [
      'Compliance monitoring and reporting challenges',
      'Incident tracking and investigation inefficiencies',
      'Safety training coordination across departments'
    ] : [
      'Limited visibility into current processes',
      'Manual workflows causing inefficiencies',
      'Difficulty in data-driven decision making'
    ],
    interests: isSafety ? [
      'Safety compliance and risk management',
      'Professional development and education',
      'Leadership and team management'
    ] : [
      'Technology innovation',
      'Process optimization',
      'Data-driven decision making'
    ],
    goals: isSafety ? [
      'Enhance safety compliance and risk management',
      'Improve incident response and prevention',
      'Streamline safety training and documentation'
    ] : [
      'Improve operational efficiency',
      'Enhance team productivity',
      'Streamline business processes'
    ],
    challenges: isSafety ? [
      'Maintaining safety standards during rapid growth',
      'Coordinating safety protocols across multiple sites',
      'Keeping up with evolving safety regulations'
    ] : [
      'Balancing innovation with stability',
      'Managing change across teams',
      'Ensuring data security and compliance'
    ],
    opportunities: isSafety ? [
      'Digital safety management systems',
      'Predictive analytics for risk assessment',
      'Mobile safety reporting and tracking'
    ] : [
      'Automation potential in current workflows',
      'Data analytics for better insights',
      'Process optimization opportunities'
    ],
    summary: `${context.name} serves as ${context.title} at ${context.companyName}, bringing ${context.totalExperience} years of experience in ${context.industry}. Their role suggests ${isSenior ? 'high' : 'moderate'} influence in organizational decisions, with a focus on ${isSafety ? 'safety compliance and risk management' : 'operational efficiency and process optimization'}.`
  };
}
