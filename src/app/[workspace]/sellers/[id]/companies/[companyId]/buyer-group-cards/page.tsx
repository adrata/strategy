"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
}

export default function CompanyBuyerGroupCardsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUnifiedAuth();
  const sellerId = params['id'] as string;
  const companyId = params['companyId'] as string;
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [buyerGroupMembers, setBuyerGroupMembers] = useState<BuyerGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract company ID from slug
  const getCompanyIdFromSlug = (slug: string) => {
    if (slug.length === 26 && (slug.startsWith('01') || slug.startsWith('c'))) {
      return slug;
    } else {
      const parts = slug.split('-');
      if (parts.length >= 2) {
        const potentialId = parts[parts.length - 1];
        if (potentialId.length === 26 && (potentialId.startsWith('01') || potentialId.startsWith('c'))) {
          return potentialId;
        }
      }
    }
    return slug;
  };

  useEffect(() => {
    const loadCompanyAndBuyerGroup = async () => {
      try {
        setLoading(true);
        setError(null);

        const actualCompanyId = getCompanyIdFromSlug(companyId);
        console.log('Loading company with ID:', actualCompanyId);

        // Load company data
        const companyResponse = await fetch(`/api/data/section?section=companies&workspaceId=${user?.activeWorkspaceId}&userId=${user?.id}&limit=1000`);
        const companyResult = await companyResponse.json();

        if (companyResult['success'] && companyResult.data && companyResult.data.data) {
          const foundCompany = companyResult.data.data.find((c: CompanyData) => c.id === actualCompanyId);
          if (foundCompany) {
            setCompany(foundCompany);
          } else {
            // Fallback: create mock company data
            const mockCompany: CompanyData = {
              id: actualCompanyId,
              name: "ADP",
              industry: "Human Resources",
              size: "10,000+ employees",
              location: "Roseland, NJ",
              website: "adp.com",
              description: "Leading provider of human capital management solutions",
              createdAt: new Date().toISOString(),
              notes: "Demo company for buyer group analysis"
            };
            setCompany(mockCompany);
          }
        } else {
          // Fallback: create mock company data
          const mockCompany: CompanyData = {
            id: actualCompanyId,
            name: "ADP",
            industry: "Human Resources",
            size: "10,000+ employees",
            location: "Roseland, NJ",
            website: "adp.com",
            description: "Leading provider of human capital management solutions",
            createdAt: new Date().toISOString(),
            notes: "Demo company for buyer group analysis"
          };
          setCompany(mockCompany);
        }

        // Load buyer group members (people with this company)
        const peopleResponse = await fetch(`/api/data/section?section=people&workspaceId=${user?.activeWorkspaceId}&userId=${user?.id}&limit=1000`);
        const peopleResult = await peopleResponse.json();

        if (peopleResult['success'] && peopleResult.data && peopleResult.data.data) {
          // Filter people by company and create buyer group members
          const companyPeople = peopleResult.data.data.filter((person: any) => 
            person.company === company?.name || person.companyId === actualCompanyId
          );

          const members: BuyerGroupMember[] = companyPeople.map((person: any, index: number) => ({
            id: person.id,
            name: person.fullName || person.name || 'Unknown',
            title: person.jobTitle || person.title || 'Unknown Title',
            department: person.department || 'Unknown Department',
            email: person.email || 'unknown@company.com',
            linkedinUrl: person.linkedinUrl,
            buyerRole: getBuyerRoleForIndex(index),
            influence: getInfluenceForRole(getBuyerRoleForIndex(index)),
            decisionPower: getDecisionPowerForRole(getBuyerRoleForIndex(index)),
            company: company?.name || 'Unknown Company',
            industry: company?.industry || 'Unknown Industry'
          }));

          setBuyerGroupMembers(members);
        } else {
          // Fallback: create mock buyer group data
          const mockMembers: BuyerGroupMember[] = [
            {
              id: "01HZ8K9M2N3P4Q5R6S7T8U9V0W",
              name: "Sarah Johnson",
              title: "Chief Human Resources Officer",
              department: "Human Resources",
              email: "sarah.johnson@adp.com",
              linkedinUrl: "https://linkedin.com/in/sarah-johnson-chro",
              buyerRole: "Decision Maker",
              influence: 95,
              decisionPower: 90,
              company: company?.name || "ADP",
              industry: company?.industry || "Human Resources"
            },
            {
              id: "01HZ8K9M2N3P4Q5R6S7T8U9V0Z",
              name: "Jennifer Martinez",
              title: "VP of Finance",
              department: "Finance",
              email: "jennifer.martinez@adp.com",
              linkedinUrl: "https://linkedin.com/in/jennifer-martinez-vp-finance",
              buyerRole: "Decision Maker",
              influence: 90,
              decisionPower: 85,
              company: company?.name || "ADP",
              industry: company?.industry || "Human Resources"
            },
            {
              id: "01HZ8K9M2N3P4Q5R6S7T8U9V0X",
              name: "Michael Chen",
              title: "VP of HR Technology",
              department: "Human Resources",
              email: "michael.chen@adp.com",
              linkedinUrl: "https://linkedin.com/in/michael-chen-hr-tech",
              buyerRole: "Champion",
              influence: 85,
              decisionPower: 75,
              company: company?.name || "ADP",
              industry: company?.industry || "Human Resources"
            },
            {
              id: "01HZ8K9M2N3P4Q5R6S7T8U9V1B",
              name: "Amanda Thompson",
              title: "Director of Technology Strategy",
              department: "IT/Technology",
              email: "amanda.thompson@adp.com",
              linkedinUrl: "https://linkedin.com/in/amanda-thompson-tech-strategy",
              buyerRole: "Champion",
              influence: 88,
              decisionPower: 70,
              company: company?.name || "ADP",
              industry: company?.industry || "Human Resources"
            }
          ];
          setBuyerGroupMembers(mockMembers);
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
      // Generate person slug and navigate to people page
      const personSlug = generateSlug(member.name, member.id);
      router.push(`/people/${personSlug}`);
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
                    activeSection="sellers"
                    onSectionChange={() => {}}
                  />
                }
                middlePanel={
                  <div className="flex flex-col h-full">
                    {/* Breadcrumb */}
                    <div className="border-b border-gray-200 px-6 py-3 bg-white">
                      <nav className="flex items-center space-x-2 text-sm">
                        <button
                          onClick={() => router.push('/sellers')}
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
                          onClick={() => router.push(`/sellers/${sellerId}/companies`)}
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
                      <button
                        onClick={() => router.push(`/sellers/${sellerId}/companies`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Companies
                      </button>
                    </div>

                    {/* Role Summary Cards */}
                    <div className="p-6 border-b border-gray-200 bg-white">
                      <div className="flex gap-4">
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
                          <div className="text-sm text-gray-600">Openers</div>
                        </div>
                      </div>
                    </div>

                    {/* Buyer Group Cards */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {buyerGroupMembers.length > 0 ? (
                        <div className="space-y-4">
                          {buyerGroupMembers.map((member, index) => {
                            const role = member.buyerRole;
                            const title = member.title;
                            
                            // Assign status and risk based on role for demo
                            const getStatusForRole = (buyerRole: string) => {
                              switch (buyerRole) {
                                case 'Decision Maker': return 'Interested 3/5';
                                case 'Champion': return 'Warming At Risk of Leaving 3/5';
                                case 'Stakeholder': return 'Interested 4/5';
                                case 'Blocker': return 'Neutral 1/5';
                                case 'Opener': return 'Interested 4/5';
                                default: return 'Neutral 1/5';
                              }
                            };
                            
                            const getRiskStatusForRole = (buyerRole: string) => {
                              switch (buyerRole) {
                                case 'Champion': return 'At Risk of Leaving 3/5';
                                default: return '';
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
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                      <span className="text-white font-semibold text-sm">
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
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                          {status}
                                        </span>
                                        {riskStatus && (
                                          <span className="text-sm text-orange-600 font-medium">
                                            {riskStatus}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <div className="text-gray-500 text-lg mb-2">No buyer group data available</div>
                            <div className="text-gray-400 text-sm">Company data is still loading...</div>
                          </div>
                        </div>
                      )}
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