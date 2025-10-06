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
import { authFetch } from "@/platform/auth-fetch";

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

export default function BuyerGroupPage() {
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
        const companyResponse = await authFetch(`/api/data/unified?type=companies&action=get`);
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
        const peopleResponse = await authFetch(`/api/data/unified?type=people&action=get`);
        const peopleResult = await peopleResponse.json();

        if (peopleResult['success'] && peopleResult.data) {
          // Filter people assigned to this company
          const companyPeople = peopleResult.data.filter((person: any) => 
            person.companyId === actualCompanyId || person.company === company?.name
          );

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
              industry: company?.industry || 'Unknown Industry'
            }));
            setBuyerGroupMembers(members);
          } else {
            // Create mock buyer group data
            const mockMembers: BuyerGroupMember[] = [
              {
                id: 'person-1',
                name: 'Alexei Volkov',
                title: 'Chief Information Security Officer',
                department: 'IT Security',
                email: 'alexei.volkov@kaspersky.com',
                buyerRole: 'Decision Maker',
                influence: 95,
                decisionPower: 90,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity'
              },
              {
                id: 'person-2',
                name: 'Maria Petrov',
                title: 'Security Operations Manager',
                department: 'IT Security',
                email: 'maria.petrov@kaspersky.com',
                buyerRole: 'Champion',
                influence: 85,
                decisionPower: 70,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity'
              },
              {
                id: 'person-3',
                name: 'Dmitri Sokolov',
                title: 'IT Director',
                department: 'Information Technology',
                email: 'dmitri.sokolov@kaspersky.com',
                buyerRole: 'Stakeholder',
                influence: 75,
                decisionPower: 60,
                company: company?.name || 'Auth0',
                industry: 'Cybersecurity'
              }
            ];
            setBuyerGroupMembers(mockMembers);
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
                      </div>
                    </div>

                    {/* Buyer Group Cards - Full Width Design */}
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
                        <div className="text-center py-12">
                          <div className="text-gray-400 text-6xl mb-4">👥</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Buyer Group Found</h3>
                          <p className="text-gray-600">This company doesn't have any buyer group members mapped yet.</p>
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
