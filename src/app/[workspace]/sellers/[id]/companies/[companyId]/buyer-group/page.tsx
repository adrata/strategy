"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/PipelineLeftPanelStandalone';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
import { PipelineProvider } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { RecordContextProvider } from '@/platform/ui/context/RecordContextProvider';
import { ProfilePopupProvider } from '@/platform/ui/components/ProfilePopupContext';
import { AcquisitionOSProvider } from '@/platform/ui/context/AcquisitionOSProvider';
import { MiddlePanelSkeleton } from '@/platform/ui/components/skeletons/MiddlePanelSkeleton';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { generateSlug } from '@/platform/utils/url-utils';
// Removed authFetch import - using standard fetch
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';

interface CompanyData {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  description?: string;
  createdAt: string;
  notes?: string;
}

interface BuyerGroupMember {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  linkedinUrl?: string;
  buyerRole: string;
  influence: number;
  decisionPower: number;
  company: string;
  industry: string;
  directionalIntelligence?: string;
}

export default function BuyerGroupPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUnifiedAuth();
  const workspace = params['workspace'] as string;
  const sellerId = params['id'] as string;
  const companyId = params['companyId'] as string;
  const selectedPersonSlug = searchParams.get('person');

  const getDirectionalIntelligence = (buyerRole: string, title: string, department: string) => {
    const strategies = {
      'Decision Maker': [
        `Focus on ROI and business impact when approaching this decision maker. Present comprehensive case studies from similar companies in their industry, highlighting measurable outcomes and success metrics. Schedule executive-level meetings to discuss strategic alignment and long-term value proposition.

Emphasize security compliance and risk reduction as primary drivers. Highlight specific cost savings and operational efficiency gains that directly impact their bottom line. Present detailed implementation roadmaps with clear milestones and success criteria.

Address their concerns about budget allocation and resource requirements. Provide detailed financial analysis showing payback periods and total cost of ownership. Offer flexible implementation options and phased rollout strategies to minimize risk.

Build relationships with other C-level executives who can provide references and endorsements. Leverage industry connections and thought leadership to establish credibility and trust. Prepare for detailed technical and business discussions with supporting documentation.`,
        
        `Develop a comprehensive approach that addresses both technical and business requirements. Present detailed security assessments and compliance frameworks that align with their industry standards. Schedule multiple touchpoints to build relationship and understanding.

Focus on demonstrating clear value proposition through pilot programs and proof-of-concept implementations. Provide detailed ROI calculations and business case documentation. Engage with their procurement and legal teams early in the process.

Leverage industry expertise and thought leadership to position yourself as a trusted advisor. Provide insights into market trends and competitive landscape. Offer strategic consulting beyond just product implementation.`
      ],
      'Champion': [
        `Build strong technical relationship through in-depth product discussions and demonstrations. Provide comprehensive technical documentation, integration guides, and API specifications. Offer hands-on pilot opportunities and sandbox environments for testing.

Leverage their technical expertise and influence to schedule meetings with decision makers and other stakeholders. Provide them with compelling talking points and presentation materials to advocate internally. Offer co-marketing opportunities and technical partnership benefits.

Focus on technical benefits, integration capabilities, and scalability features that align with their technical roadmap. Provide detailed technical support and training resources. Engage in technical forums and communities where they participate.

Support their internal advocacy efforts with technical validation and proof points. Provide case studies from similar technical implementations. Offer technical consulting and best practices sharing beyond the product relationship.`,
        
        `Establish credibility through technical expertise and industry knowledge. Provide valuable technical insights and thought leadership content. Engage in technical discussions about architecture, security, and implementation strategies.

Build relationship through collaborative problem-solving and technical consultation. Offer to participate in their technical planning and architecture discussions. Provide technical resources and documentation that help them succeed in their role.

Create opportunities for them to showcase their technical expertise and influence within their organization. Provide technical content they can share internally. Offer technical training and certification opportunities for their team.`
      ],
      'Stakeholder': [
        `Understand their specific departmental needs and pain points through detailed discovery conversations. Provide targeted solutions that address their unique requirements and challenges. Demonstrate how the solution directly benefits their team and department.

Build consensus by addressing their concerns and objections proactively. Show how the solution integrates with their existing workflows and processes. Provide department-specific use cases and success stories from similar organizations.

Engage through department-specific value propositions and ROI calculations. Provide detailed implementation plans that consider their departmental constraints and requirements. Offer training and support tailored to their team's needs and skill levels.

Create internal champions by providing them with tools and resources to advocate for the solution. Offer department-specific pilot programs and proof-of-concept implementations. Provide ongoing support and consultation throughout the evaluation process.`,
        
        `Develop department-specific value propositions that address their unique challenges and opportunities. Provide detailed implementation plans that consider their team structure and workflow requirements. Offer customized training and support programs.

Build relationships with other department stakeholders to create a coalition of support. Provide cross-departmental use cases and integration scenarios. Offer collaborative planning sessions to ensure successful implementation.

Address their specific concerns about change management and user adoption. Provide detailed training plans and support resources. Offer ongoing consultation and support throughout the implementation process.`
      ],
      'Blocker': [
        `Address their specific concerns and objections directly through detailed discussions and documentation. Provide comprehensive information and reassurance about security, compliance, and risk mitigation. Develop targeted responses to their specific objections and concerns.

Identify the root causes of their resistance and develop customized approaches to address each concern. Consider involving third-party advocates, industry experts, or existing customers who can provide credible references and endorsements.

Focus on risk mitigation and compliance by providing detailed security documentation, compliance certifications, and audit reports. Offer additional security measures and safeguards to address their specific concerns. Provide detailed implementation plans that address their risk concerns.

Build trust through transparency and open communication about potential challenges and mitigation strategies. Offer flexible terms and conditions that address their specific concerns. Provide ongoing support and consultation to ensure successful implementation.`,
        
        `Develop a comprehensive approach to address their specific concerns and objections. Provide detailed documentation and evidence to counter their resistance. Engage in open dialogue to understand and address their underlying concerns.

Leverage industry expertise and third-party validation to address their concerns. Provide detailed risk assessments and mitigation strategies. Offer additional safeguards and security measures to address their specific concerns.

Build trust through consistent communication and follow-through on commitments. Provide detailed implementation plans that address their specific concerns. Offer ongoing support and consultation to ensure successful resolution of their concerns.`
      ],
      'Opener': [
        `Build initial relationship through valuable educational content and industry insights. Provide thought leadership materials, whitepapers, and case studies that demonstrate expertise and value. Focus on understanding their current challenges and offering preliminary solutions.

Establish credibility through industry knowledge and expertise. Provide valuable resources and insights that help them in their role. Engage in educational discussions about industry trends and best practices.

Focus on relationship building and trust establishment before introducing product discussions. Provide valuable consultation and advice that demonstrates expertise. Offer to participate in their planning and strategy discussions.

Create opportunities for ongoing engagement through valuable content and insights. Provide industry analysis and competitive intelligence. Offer to participate in their professional development and learning opportunities.`,
        
        `Develop a long-term relationship strategy focused on value creation and trust building. Provide ongoing educational content and industry insights. Offer consultation and advice that helps them succeed in their role.

Build credibility through consistent value delivery and expertise demonstration. Provide resources and tools that help them in their daily work. Engage in collaborative problem-solving and strategic discussions.

Create opportunities for ongoing engagement and relationship development. Provide valuable content and insights that demonstrate expertise. Offer to participate in their professional development and learning opportunities.`
      ]
    };

    const roleStrategies = strategies[buyerRole as keyof typeof strategies] || strategies['Stakeholder'];
    return roleStrategies[Math.floor(Math.random() * roleStrategies.length)];
  };
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [buyerGroupMembers, setBuyerGroupMembers] = useState<BuyerGroupMember[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<BuyerGroupMember | null>(null);
  const [personRecord, setPersonRecord] = useState<any>(null);
  const [personLoading, setPersonLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract company ID from slug
  const getCompanyIdFromSlug = (slug: string) => {
    console.log('🔍 [BUYER GROUP] Extracting company ID from slug:', slug);
    
    // If it's already a valid ID format, return as is
    if (slug.length === 26 && (slug.startsWith('01') || slug.startsWith('c'))) {
      console.log('🔍 [BUYER GROUP] Slug is already a valid ID:', slug);
      return slug;
    }
    
    // For URL slugs like "auth0-cybersecurity-company-1805", we need to find the actual company
    // by searching for companies with similar names
    console.log('🔍 [BUYER GROUP] Slug needs to be resolved to actual company ID');
    return slug; // We'll handle the lookup in the useEffect
  };

  useEffect(() => {
    const loadCompanyAndBuyerGroup = async () => {
      try {
        setLoading(true);
        setError(null);

        const actualCompanyId = getCompanyIdFromSlug(companyId);
        console.log('👥 [BUYER GROUP] Loading company with ID:', actualCompanyId);

        // Load company data using unified API
        const companyResponse = await fetch(`/api/data/unified?type=companies&action=get`);
        const companyResult = await companyResponse.json();

        if (companyResult['success'] && companyResult.data) {
          // First try to find by exact ID match
          let foundCompany = companyResult.data.find((c: CompanyData) => c.id === actualCompanyId);
          
          // If not found by ID, try to find by name (for URL slugs like "auth0-cybersecurity-company-1805")
          if (!foundCompany) {
            console.log('🔍 [BUYER GROUP] Company not found by ID, searching by name...');
            
            // Extract company name from slug (e.g., "auth0" from "auth0-cybersecurity-company-1805")
            const companyNameFromSlug = actualCompanyId.split('-')[0];
            console.log('🔍 [BUYER GROUP] Looking for company with name containing:', companyNameFromSlug);
            
            foundCompany = companyResult.data.find((c: CompanyData) => 
              c.name.toLowerCase().includes(companyNameFromSlug.toLowerCase()) ||
              companyNameFromSlug.toLowerCase().includes(c.name.toLowerCase())
            );
            
            if (foundCompany) {
              console.log('🔍 [BUYER GROUP] Found company by name:', foundCompany.name);
            }
          }
          
          if (foundCompany) {
            console.log('🔍 [BUYER GROUP] Using found company:', foundCompany.name);
            setCompany(foundCompany);
          } else {
            console.log('🔍 [BUYER GROUP] Company not found, using fallback data');
            // Fallback: create mock company data based on the slug
            const companyNameFromSlug = actualCompanyId.split('-')[0];
            const mockCompany: CompanyData = {
              id: actualCompanyId,
              name: companyNameFromSlug.charAt(0).toUpperCase() + companyNameFromSlug.slice(1),
              industry: "Cybersecurity",
              size: "3,900 employees",
              location: "San Francisco, CA",
              website: `${companyNameFromSlug.toLowerCase()}.com`,
              description: `Leading ${companyNameFromSlug} company`,
              createdAt: new Date().toISOString(),
              notes: "Demo company for buyer group analysis"
            };
            setCompany(mockCompany);
          }
        }

        // Load buyer group members (people assigned to this company)
        const peopleResponse = await fetch(`/api/data/unified?type=people&action=get`);
        const peopleResult = await peopleResponse.json();

        if (peopleResult['success'] && peopleResult.data) {
          // Filter people assigned to this company
          const companyNameFromSlug = actualCompanyId.split('-')[0];
          const companyPeople = peopleResult.data.filter((person: any) => 
            person.companyId === actualCompanyId || 
            person.company === company?.name ||
            (typeof person.company === 'string' && person.company.toLowerCase().includes(companyNameFromSlug.toLowerCase())) ||
            (typeof person.company === 'string' && companyNameFromSlug.toLowerCase().includes(person.company.toLowerCase()))
          );

          console.log('🔍 [BUYER GROUP] Found company people:', companyPeople.length);

          if (companyPeople.length > 0) {
            const members: BuyerGroupMember[] = companyPeople.map((person: any, index: number) => ({
              id: person.id,
              name: person.name || person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
              title: person.title || person.jobTitle || 'Unknown Title',
              department: person.department || 'Unknown Department',
              email: person.email || '',
              linkedinUrl: person.linkedinUrl,
              buyerRole: getBuyerRoleForIndex(index),
              influence: getInfluenceForRole(getBuyerRoleForIndex(index)),
              decisionPower: getDecisionPowerForRole(getBuyerRoleForIndex(index)),
              company: company?.name || 'Unknown Company',
              industry: company?.industry || 'Unknown Industry',
              directionalIntelligence: getDirectionalIntelligence(getBuyerRoleForIndex(index), person.title || person.jobTitle || 'Unknown Title', person.department || 'Unknown Department')
            }));
            setBuyerGroupMembers(members);
          } else {
            // Only create mock data in demo workspace
            const isDemoWorkspace = workspace === 'demo' || workspace === '01K1VBYXHD0J895XAN0HGFBKJP';
            
            if (isDemoWorkspace) {
              console.log('🔍 [BUYER GROUP] No company people found, creating expanded mock data for demo workspace...');
              // Create expanded mock buyer group data (9-10 people per company)
              const mockMembers: BuyerGroupMember[] = [
              {
                id: 'person-1',
                name: 'Alexei Volkov',
                title: 'Chief Information Security Officer',
                department: 'IT Security',
                email: 'alexei.volkov@company.com',
                buyerRole: 'Decision Maker',
                influence: 95,
                decisionPower: 90,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: 'Focus on ROI and business impact. Present case studies from similar companies. Schedule executive-level meetings.'
              },
              {
                id: 'person-2',
                name: 'Maria Petrov',
                title: 'Security Operations Manager',
                department: 'Security Operations',
                email: 'maria.petrov@company.com',
                buyerRole: 'Champion',
                influence: 80,
                decisionPower: 70,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: 'Build relationship through technical discussions. Provide detailed product demos and pilot opportunities.'
              },
              {
                id: 'person-3',
                name: 'Dmitri Sokolov',
                title: 'IT Director',
                department: 'Information Technology',
                email: 'dmitri.sokolov@company.com',
                buyerRole: 'Stakeholder',
                influence: 60,
                decisionPower: 50,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: getDirectionalIntelligence('Stakeholder', 'IT Director', 'Information Technology')
              },
              {
                id: 'person-4',
                name: 'Elena Kuznetsova',
                title: 'VP of Engineering',
                department: 'Engineering',
                email: 'elena.kuznetsova@company.com',
                buyerRole: 'Decision Maker',
                influence: 85,
                decisionPower: 80,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: getDirectionalIntelligence('Decision Maker', 'VP of Engineering', 'Engineering')
              },
              {
                id: 'person-5',
                name: 'Ivan Petrov',
                title: 'Security Architect',
                department: 'Security',
                email: 'ivan.petrov@company.com',
                buyerRole: 'Champion',
                influence: 75,
                decisionPower: 65,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: getDirectionalIntelligence('Champion', 'Security Architect', 'Security')
              },
              {
                id: 'person-6',
                name: 'Anna Smirnova',
                title: 'Product Manager',
                department: 'Product',
                email: 'anna.smirnova@company.com',
                buyerRole: 'Stakeholder',
                influence: 70,
                decisionPower: 60,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: getDirectionalIntelligence('Stakeholder', 'Product Manager', 'Product')
              },
              {
                id: 'person-7',
                name: 'Sergei Volkov',
                title: 'DevOps Manager',
                department: 'Engineering',
                email: 'sergei.volkov@company.com',
                buyerRole: 'Stakeholder',
                influence: 65,
                decisionPower: 55,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: getDirectionalIntelligence('Stakeholder', 'DevOps Manager', 'Engineering')
              },
              {
                id: 'person-8',
                name: 'Olga Ivanova',
                title: 'Compliance Officer',
                department: 'Legal & Compliance',
                email: 'olga.ivanova@company.com',
                buyerRole: 'Blocker',
                influence: 50,
                decisionPower: 40,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: getDirectionalIntelligence('Blocker', 'Compliance Officer', 'Legal & Compliance')
              },
              {
                id: 'person-9',
                name: 'Mikhail Petrov',
                title: 'Finance Director',
                department: 'Finance',
                email: 'mikhail.petrov@company.com',
                buyerRole: 'Stakeholder',
                influence: 60,
                decisionPower: 50,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity',
                directionalIntelligence: getDirectionalIntelligence('Stakeholder', 'Finance Director', 'Finance')
              }
            ];
            setBuyerGroupMembers(mockMembers);
            } else {
              console.log('🔍 [BUYER GROUP] No company people found and not in demo workspace - showing empty state');
              setBuyerGroupMembers([]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading company and buyer group:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (companyId && user?.activeWorkspaceId && user?.id) {
      loadCompanyAndBuyerGroup();
    }
  }, [companyId, user?.activeWorkspaceId, user?.id]);

  // Handle selected person from URL parameter
  useEffect(() => {
    if (selectedPersonSlug && buyerGroupMembers.length > 0) {
      const foundPerson = buyerGroupMembers.find(member => {
        const memberSlug = generateSlug(member.name, member.id);
        return memberSlug === selectedPersonSlug;
      });
      setSelectedPerson(foundPerson || null);
    } else {
      setSelectedPerson(null);
      setPersonRecord(null);
    }
  }, [selectedPersonSlug, buyerGroupMembers]);

  // Load person record when selected
  useEffect(() => {
    const loadPersonRecord = async () => {
      if (!selectedPerson || !selectedPersonSlug) {
        setPersonRecord(null);
        return;
      }

      setPersonLoading(true);
      try {
        console.log('🔍 [PERSON RECORD] Loading person record for:', selectedPerson.name);
        
        // Load the actual person record from the database
        const personResponse = await fetch(`/api/data/unified?type=people&action=get&id=${selectedPerson.id}`);
        const personResult = await personResponse.json();
        
        if (personResult.success && personResult.data) {
          setPersonRecord(personResult.data);
          console.log('🔍 [PERSON RECORD] Loaded person record:', personResult.data);
        } else {
          // Only create mock records in demo workspace
          const isDemoWorkspace = workspace === 'demo' || workspace === '01K1VBYXHD0J895XAN0HGFBKJP';
          
          if (isDemoWorkspace) {
            // If no real data found, create a comprehensive mock record based on buyer group member
            const mockRecord = {
            id: selectedPerson.id,
            name: selectedPerson.name,
            title: selectedPerson.title,
            jobTitle: selectedPerson.title,
            department: selectedPerson.department,
            company: selectedPerson.company,
            email: `${selectedPerson.name.toLowerCase().replace(' ', '.')}@${selectedPerson.company.toLowerCase()}.com`,
            phone: '+1 (555) 123-4567',
            location: 'San Francisco, CA',
            status: 'active',
            buyerRole: selectedPerson.buyerRole,
            influence: selectedPerson.influence,
            decisionPower: selectedPerson.decisionPower,
            riskStatus: 'low',
            directionalIntelligence: selectedPerson.directionalIntelligence,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Add comprehensive customFields for career and intelligence data
            customFields: {
              // Intelligence Profile Data
              influenceLevel: selectedPerson.buyerRole === 'Decision Maker' ? 'High' : selectedPerson.buyerRole === 'Champion' ? 'Medium' : 'Low',
              engagementStrategy: selectedPerson.buyerRole === 'Decision Maker' ? 'Executive Outreach' : 'Standard Outreach',
              isBuyerGroupMember: true,
              seniority: selectedPerson.buyerRole === 'Decision Maker' ? 'Executive' : 'Mid-Level',
              influenceScore: selectedPerson.influence,
              decisionPower: selectedPerson.decisionPower,
              primaryRole: selectedPerson.title,
              engagementLevel: selectedPerson.buyerRole === 'Decision Maker' ? 'High' : 'Medium',
              communicationStyle: selectedPerson.buyerRole === 'Decision Maker' ? 'Direct and Technical' : 'Professional',
              decisionMaking: selectedPerson.buyerRole === 'Decision Maker' ? 'Data-Driven and Risk-Aware' : 'Collaborative',
              preferredContact: 'Email and LinkedIn',
              responseTime: '24-48 hours',
              
              // Career Data
              department: selectedPerson.department,
              totalExperience: '15+ years',
              
              // Pain Points and Interests
              painPoints: [
                'Cybersecurity threats and compliance',
                'Data protection and privacy regulations',
                'Security infrastructure scalability',
                'Team training and awareness'
              ],
              interests: [
                'Cybersecurity best practices',
                'Risk management frameworks',
                'Security automation',
                'Compliance standards'
              ],
              goals: [
                'Strengthen security posture',
                'Improve compliance posture',
                'Enhance team capabilities',
                'Reduce security incidents'
              ],
              challenges: [
                'Balancing security with usability',
                'Managing security across multiple systems',
                'Keeping up with evolving threats',
                'Budget constraints for security tools'
              ],
              opportunities: [
                'Advanced security solutions',
                'Automated compliance monitoring',
                'Security awareness training',
                'Integrated security platforms'
              ],
              
              // Intelligence Summary
              intelligenceSummary: `${selectedPerson.name} serves as a ${selectedPerson.title} with ${selectedPerson.influence >= 80 ? 'high' : selectedPerson.influence >= 60 ? 'moderate' : 'limited'} influence and ${selectedPerson.decisionPower >= 80 ? 'strong' : selectedPerson.decisionPower >= 60 ? 'moderate' : 'limited'} decision-making authority in their organization. They prefer ${selectedPerson.buyerRole === 'Decision Maker' ? 'direct and technical' : 'professional'} communication and make decisions based on ${selectedPerson.buyerRole === 'Decision Maker' ? 'data-driven and risk-aware' : 'collaborative'} analysis. Current engagement level is ${selectedPerson.buyerRole === 'Decision Maker' ? 'High' : 'Medium'}, indicating ${selectedPerson.buyerRole === 'Decision Maker' ? 'positive' : 'moderate'} receptivity to outreach.`,
              
              // CoreSignal-style data
              coresignal: {
                id: `${selectedPerson.name.toLowerCase().replace(' ', '_')}_001`,
                employeeId: `${selectedPerson.name.toLowerCase().replace(' ', '_')}_001`,
                followersCount: 1250,
                connectionsCount: 850,
                isDecisionMaker: selectedPerson.buyerRole === 'Decision Maker' ? 1 : 0,
                totalExperienceMonths: 180,
                lastEnrichedAt: new Date().toISOString(),
                skills: [
                  'Cybersecurity',
                  'Risk Management',
                  'Compliance',
                  'Security Architecture',
                  'Team Leadership',
                  'Incident Response',
                  'Security Auditing',
                  'Policy Development'
                ],
                education: [
                  {
                    degree: 'Master of Science',
                    field: 'Cybersecurity',
                    institution: 'Carnegie Mellon University',
                    year: '2010'
                  },
                  {
                    degree: 'Bachelor of Science',
                    field: 'Computer Science',
                    institution: 'University of California, Berkeley',
                    year: '2008'
                  }
                ],
                experience: [
                  {
                    company_name: selectedPerson.company,
                    title: selectedPerson.title,
                    department: selectedPerson.department,
                    start_date: '2020-01-01',
                    end_date: null,
                    active_experience: 1,
                    description: `Leading comprehensive ${selectedPerson.department.toLowerCase()} strategy and operations`
                  },
                  {
                    company_name: 'Previous Security Firm',
                    title: 'Senior Security Manager',
                    department: 'Security Operations',
                    start_date: '2017-06-01',
                    end_date: '2019-12-31',
                    active_experience: 0,
                    description: 'Managed security operations and incident response'
                  },
                  {
                    company_name: 'Tech Corporation',
                    title: 'Security Analyst',
                    department: 'Information Security',
                    start_date: '2012-03-01',
                    end_date: '2017-05-31',
                    active_experience: 0,
                    description: 'Conducted security assessments and vulnerability analysis'
                  }
                ],
                active_experience_department: selectedPerson.department,
                total_experience_duration_months: 180,
                inferred_skills: [
                  'Cybersecurity',
                  'Risk Management',
                  'Compliance',
                  'Security Architecture',
                  'Team Leadership',
                  'Incident Response',
                  'Security Auditing',
                  'Policy Development'
                ]
              },
              
              // Buyer Group Data (avoiding duplicates)
              buyerGroupRole: selectedPerson.buyerRole,
              engagementPriority: selectedPerson.buyerRole === 'Decision Maker' ? 'High' : 'Medium',
              decisionMakingStyle: selectedPerson.buyerRole === 'Decision Maker' ? 'Data-Driven and Risk-Aware' : 'Collaborative',
              personalGoals: [
                'Strengthen security posture',
                'Improve compliance posture',
                'Enhance team capabilities',
                'Reduce security incidents'
              ],
              professionalGoals: [
                'Advanced security solutions',
                'Automated compliance monitoring',
                'Security awareness training',
                'Integrated security platforms'
              ]
            }
          };
          setPersonRecord(mockRecord);
          console.log('🔍 [PERSON RECORD] Using comprehensive mock record:', mockRecord);
          } else {
            console.log('🔍 [PERSON RECORD] Not in demo workspace - no mock data generated');
            setPersonRecord(null);
          }
        }
      } catch (error) {
        console.error('🔍 [PERSON RECORD] Error loading person record:', error);
        setPersonRecord(null);
      } finally {
        setPersonLoading(false);
      }
    };

    loadPersonRecord();
  }, [selectedPerson, selectedPersonSlug]);

  // Helper functions for buyer roles and influence
  const getBuyerRoleForIndex = (index: number): string => {
    const roles = ['Decision Maker', 'Decision Maker', 'Champion', 'Champion', 'Stakeholder', 'Stakeholder', 'Stakeholder', 'Stakeholder', 'Blocker', 'Blocker', 'Opener', 'Opener'];
    return roles[index] || 'Stakeholder';
  };

  const getInfluenceForRole = (role: string): number => {
    switch (role) {
      case 'Decision Maker': return 90 + Math.floor(Math.random() * 10);
      case 'Champion': return 80 + Math.floor(Math.random() * 10);
      case 'Stakeholder': return 60 + Math.floor(Math.random() * 20);
      case 'Blocker': return 70 + Math.floor(Math.random() * 15);
      case 'Opener': return 65 + Math.floor(Math.random() * 15);
      default: return 50 + Math.floor(Math.random() * 30);
    }
  };

  const getDecisionPowerForRole = (role: string): number => {
    switch (role) {
      case 'Decision Maker': return 80 + Math.floor(Math.random() * 15);
      case 'Champion': return 60 + Math.floor(Math.random() * 20);
      case 'Stakeholder': return 40 + Math.floor(Math.random() * 20);
      case 'Blocker': return 30 + Math.floor(Math.random() * 15);
      case 'Opener': return 45 + Math.floor(Math.random() * 20);
      default: return 30 + Math.floor(Math.random() * 30);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Decision Maker":
        return "bg-red-100 text-red-800 border-red-200";
      case "Champion":
        return "bg-green-100 text-green-800 border-green-200";
      case "Stakeholder":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Blocker":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Opener":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleMemberClick = async (member: BuyerGroupMember) => {
    console.log('Member clicked:', member);
    
    try {
      // Generate person slug and add as URL parameter
      const personSlug = generateSlug(member.name, member.id);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('person', personSlug);
      router.push(newUrl.pathname + newUrl.search);
    } catch (error) {
      console.error('Error handling member click:', error);
    }
  };

  if (loading) {
    return (
      <AcquisitionOSProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <ProfilePopupProvider>
                <PanelLayout
                  leftPanel={
                    <PipelineLeftPanelStandalone
                      activeSection="sellers"
                      onSectionChange={() => {}}
                    />
                  }
                  middlePanel={<MiddlePanelSkeleton />}
                  rightPanel={<AIRightPanel />}
                  isLeftPanelVisible={true}
                  isRightPanelVisible={true}
                />
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </AcquisitionOSProvider>
    );
  }

  if (error || !company) {
    return (
      <AcquisitionOSProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <ProfilePopupProvider>
                <PanelLayout
                  leftPanel={
                    <PipelineLeftPanelStandalone
                      activeSection="sellers"
                      onSectionChange={() => {}}
                    />
                  }
                  middlePanel={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                      </div>
                    </div>
                  }
                  rightPanel={<AIRightPanel />}
                  isLeftPanelVisible={true}
                  isRightPanelVisible={true}
                />
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </AcquisitionOSProvider>
    );
  }

  return (
    <AcquisitionOSProvider>
      <PipelineProvider>
        <SpeedrunDataProvider>
          <RecordContextProvider>
            <ProfilePopupProvider>
              <PanelLayout
                leftPanel={
                  <PipelineLeftPanelStandalone
                    activeSection="people"
                    onSectionChange={(section) => {
                      console.log('🔄 Left panel section clicked:', section);
                      // Navigate to the appropriate section
                      if (section === 'people') {
                        // Already on people section, do nothing
                        return;
                      } else if (section === 'companies') {
                        // Navigate to companies page
                        router.push(`/${workspace}/sellers/${sellerId}/companies`);
                      } else {
                        // Navigate to other sections
                        router.push(`/${workspace}/${section}`);
                      }
                    }}
                  />
                }
                middlePanel={
                  selectedPerson ? (
                    personLoading ? (
                      <MiddlePanelSkeleton />
                    ) : personRecord ? (
                      <UniversalRecordTemplate
                        record={personRecord}
                        recordType="people"
                        recordIndex={1}
                        onBack={() => {
                          // Navigate back to buyer group without person parameter
                          const newUrl = new URL(window.location.href);
                          newUrl.searchParams.delete('person');
                          router.push(newUrl.pathname + newUrl.search);
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-gray-400 text-6xl mb-4">👤</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Person Not Found</h3>
                          <p className="text-gray-600 mb-4">Unable to load person details.</p>
                          <button
                            onClick={() => {
                              const newUrl = new URL(window.location.href);
                              newUrl.searchParams.delete('person');
                              router.push(newUrl.pathname + newUrl.search);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Back to Buyer Group
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col h-full">
                      {/* Breadcrumb */}
                      <div className="border-b border-gray-200 px-6 py-3 bg-white">
                        <nav className="flex items-center space-x-2 text-sm">
                          <button
                            onClick={() => router.push(`/${workspace}/sellers`)}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Sellers
                          </button>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <button
                            onClick={() => router.push(`/${workspace}/sellers/${sellerId}/companies`)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            Companies
                          </button>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-gray-900 font-medium">Buyer Group</span>
                        </nav>
                      </div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center">
                          <span className="text-gray-700 font-bold text-xl">
                            {company.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">{company.name} - Buyer Group</h1>
                          <p className="text-gray-600">{buyerGroupMembers.length} stakeholders mapped • {company.industry}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          Edit Company
                        </button>
                        <button className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors">
                          Add Action
                        </button>
                      </div>
                    </div>

                    {/* Role Summary Cards */}
                    <div className="p-6 border-b border-gray-200 bg-white">
                      <div className="flex gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {buyerGroupMembers.length}
                          </div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {buyerGroupMembers.filter(m => m.buyerRole === 'Decision Maker').length}
                          </div>
                          <div className="text-sm text-gray-600">Decision Makers</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {buyerGroupMembers.filter(m => m.buyerRole === 'Champion').length}
                          </div>
                          <div className="text-sm text-gray-600">Champions</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {buyerGroupMembers.filter(m => m.buyerRole === 'Stakeholder').length}
                          </div>
                          <div className="text-sm text-gray-600">Stakeholders</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {buyerGroupMembers.filter(m => m.buyerRole === 'Blocker').length}
                          </div>
                          <div className="text-sm text-gray-600">Blockers</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {buyerGroupMembers.filter(m => m.buyerRole === 'Opener').length}
                          </div>
                          <div className="text-sm text-gray-600">Introducers</div>
                        </div>
                      </div>
                    </div>

                    {/* Buyer Group Cards - Full Width Design */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {buyerGroupMembers.length > 0 ? (
                        <div className="space-y-4">
                          {buyerGroupMembers.map((member, index) => {
                            const role = member.buyerRole;
                            const title = member.title || 'Professional';
                            
                            // Assign status and risk based on role for demo
                            const getStatusForRole = (buyerRole: string) => {
                              switch (buyerRole) {
                                case 'Decision Maker': return 'Interested 3/5';
                                case 'Champion': return 'Warming At Risk of Leaving 3/5';
                                case 'Stakeholder': return 'Cold 2/5';
                                case 'Blocker': return 'Cold 1/5';
                                case 'Opener': return 'Warming 4/5';
                                default: return 'Unknown';
                              }
                            };
                            
                            const getRiskStatusForRole = (buyerRole: string) => {
                              switch (buyerRole) {
                                case 'Decision Maker': return 'High Risk';
                                case 'Champion': return 'Medium Risk';
                                case 'Stakeholder': return 'Low Risk';
                                case 'Blocker': return 'High Risk';
                                case 'Opener': return 'Low Risk';
                                default: return 'Unknown';
                              }
                            };
                            
                            const getFallbackRole = (buyerRole: string) => {
                              switch (buyerRole) {
                                case 'Champion': return index === 3 ? 'Fallback' : ''; // Second champion gets fallback
                                default: return '';
                              }
                            };
                            
                            const status = getStatusForRole(role);
                            const riskStatus = getRiskStatusForRole(role);
                            const fallbackRole = getFallbackRole(role);
                            
                            return (
                              <div
                                key={member.id}
                                onClick={() => handleMemberClick(member)}
                                className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow-sm">
                                      <span className="text-gray-700 font-semibold text-sm">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                          {member.name}
                                        </h4>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role)}`}>
                                          {role}
                                        </span>
                                        {fallbackRole && (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                            {fallbackRole}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600 mb-1">
                                        {title}
                                      </div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm text-gray-500">
                                          {status}
                                        </span>
                                        {riskStatus && (
                                          <span className="text-sm text-orange-600 font-medium">
                                            {riskStatus}
                                          </span>
                                        )}
                                      </div>
                                      {member.directionalIntelligence && (
                                        <div className="mt-2">
                                          <div className="text-xs font-medium text-gray-600 mb-1">Directional Intelligence</div>
                                          <div className="text-sm text-gray-700">
                                            {member.directionalIntelligence}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-gray-400 text-6xl mb-4">👥</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Buyer Group Found</h3>
                          <p className="text-gray-600">This company doesn't have any buyer group members mapped yet.</p>
                        </div>
                      )}
                    </div>

                    </div>
                  )
                }
                rightPanel={<AIRightPanel />}
                isLeftPanelVisible={true}
                isRightPanelVisible={true}
              />
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </AcquisitionOSProvider>
  );
}
