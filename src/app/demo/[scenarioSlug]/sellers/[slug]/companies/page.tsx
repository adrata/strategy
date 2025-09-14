"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { PipelineLeftPanelStandalone } from "@/products/pipeline/components/PipelineLeftPanelStandalone";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { AIRightPanel } from "@/platform/ui/components/chat/AIRightPanel";
import { FullPanelSkeleton } from "@/platform/ui/components/skeletons/FullPanelSkeleton";
import { generateSlug } from "@/platform/utils/url-utils";

interface Seller {
  id: string;
  userId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  workspaceId: string;
}

interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: string;
  revenue: string;
  location: string;
  icpScore: number;
  lastUpdated: string;
  status: string;
  assignedUserId: string;
}

export default function SellerCompaniesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params['slug'] as string;
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toggle state management for left panel - persist across navigation
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(false); // Default to false for ZeroPoint demo
  const [isProspectsVisible, setIsProspectsVisible] = useState(false); // Default to false for ZeroPoint demo
  const [isLeadsVisible, setIsLeadsVisible] = useState(false); // Default to false for ZeroPoint demo
  const [isCustomersVisible, setIsCustomersVisible] = useState(false); // Default to false for ZeroPoint demo
  const [isPartnersVisible, setIsPartnersVisible] = useState(false); // Default to false for ZeroPoint demo

  useEffect(() => {
    const loadSellerAndCompanies = async () => {
      try {
        setLoading(true);
        
        // Extract seller ID from slug - get the ULID part
        const sellerId = slug.split('-').slice(-1)[0]; // Get the ULID part (01K4TT9AF2PN3SPNRJMZR3BWGA)
        
        // Load seller data
        console.log('🔍 Loading seller with ID:', sellerId);
        const sellerResponse = await fetch(`/api/data/unified?type=sellers&action=get&workspaceId=zeropoint-demo-2025&userId=demo-user-2025`);
        const sellerResult = await sellerResponse.json();
        
        console.log('🔍 Seller API response:', sellerResult);
        
        if (sellerResult['success'] && sellerResult.data) {
          const foundSeller = sellerResult.data.find((s: Seller) => s['id'] === sellerId);
          console.log('🔍 Found seller:', foundSeller);
          
          if (foundSeller) {
            setSeller(foundSeller);
            
            // Load companies data
            console.log('🔍 Loading companies for seller:', foundSeller.userId);
            const companiesResponse = await fetch(`/api/data/unified?type=companies&action=get&workspaceId=zeropoint-demo-2025&userId=demo-user-2025`);
            const companiesResult = await companiesResponse.json();
            
            console.log('🔍 Companies API response:', companiesResult);
            
            if (companiesResult['success'] && companiesResult.data) {
              // Filter companies assigned to this seller
              const sellerCompanies = companiesResult.data.filter((company: Company) => 
                company['assignedUserId'] === foundSeller.userId
              );
              console.log('🔍 Seller companies:', sellerCompanies);
              setCompanies(sellerCompanies);
            } else {
              // Fallback: Load companies directly from demo API
              console.log('🔍 Fallback: Loading companies from demo API');
              const demoCompaniesResponse = await fetch('/api/demo-scenarios/companies');
              const demoCompaniesResult = await demoCompaniesResponse.json();
              
              if (demoCompaniesResult['success'] && demoCompaniesResult.data) {
                const sellerCompanies = demoCompaniesResult.data.filter((company: Company) => 
                  company['assignedUserId'] === foundSeller.userId
                );
                console.log('🔍 Demo seller companies:', sellerCompanies);
                setCompanies(sellerCompanies);
              }
            }
          } else {
            console.log('❌ Seller not found');
            setError('Seller not found');
          }
        } else {
          console.log('❌ Failed to load seller data');
          setError('Failed to load seller data');
        }
      } catch (err) {
        console.error('Error loading seller and companies:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadSellerAndCompanies();
    }
  }, [slug]);

  // Handle company card click
  const handleCompanyClick = (company: Company) => {
    console.log('Navigating to company buyer group:', company);
    // Generate proper slug using company name and ID
    const slug = generateSlug(company.name || 'company', company.id);
    
    // Navigate directly to the buyer group page
    router.push(`/demo/zeropoint/companies/${slug}/buyer-group`);
  };

  if (loading) {
    return <FullPanelSkeleton />;
  }

  if (error || !seller) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Seller not found'}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
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
                    isOpportunitiesVisible={isOpportunitiesVisible}
                    setIsOpportunitiesVisible={setIsOpportunitiesVisible}
                    isProspectsVisible={isProspectsVisible}
                    setIsProspectsVisible={setIsProspectsVisible}
                    isLeadsVisible={isLeadsVisible}
                    setIsLeadsVisible={setIsLeadsVisible}
                    isCustomersVisible={isCustomersVisible}
                    setIsCustomersVisible={setIsCustomersVisible}
                    isPartnersVisible={isPartnersVisible}
                    setIsPartnersVisible={setIsPartnersVisible}
                  />
                }
                middlePanel={
                  <div className="h-full flex flex-col bg-white">
                    {/* Breadcrumb Header */}
                    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.history.back()}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>
                          Sellers
                        </button>
                        <span className="text-sm text-gray-400">/</span>
                        <span className="text-sm text-gray-500">{seller.name}</span>
                        <span className="text-sm text-gray-400">/</span>
                        <span className="text-sm font-medium text-gray-900">Companies</span>
                      </div>
                    </div>

                    {/* Main Header - Monaco Design */}
                    <div className="flex-shrink-0 border-b border-gray-200 px-6 py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
                            <span className="text-lg font-semibold text-white">
                              {seller.firstName?.[0] || seller.name?.[0] || 'S'}
                            </span>
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{seller.name}</h1>
                            <p className="text-sm text-gray-600">{seller.role || 'Senior Account Executive'} • Enterprise West</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Edit Seller
                          </button>
                          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            Add Action
                          </button>
                        </div>
                      </div>
                      
                      {/* Metrics Row */}
                      <div className="mt-4 flex gap-6">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">89%</div>
                          <div className="text-xs text-gray-500">Decision Maker Engagement</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">4.5</div>
                          <div className="text-xs text-gray-500">Avg Stakeholders/Group</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">40/50</div>
                          <div className="text-xs text-gray-500">Active Buyer Groups</div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto px-6 py-6">
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Associated Companies</h2>
                        <p className="text-sm text-gray-600 mb-6">
                          {companies.length} companies assigned to {seller.name}
                        </p>
                      </div>

                      {companies['length'] === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium">No companies assigned</p>
                          <p className="text-sm text-gray-500 mt-1">This seller doesn't have any companies assigned yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {companies.map((company, index) => {
                            // Demo data for Monaco-style company cards
                            const demoData = [
                              {
                                name: 'ADP',
                                industry: 'Human Resources & Payroll',
                                size: '5000+ employees',
                                revenue: '$350,000 revenue',
                                location: 'Roseland',
                                tag: 'Buyer Group Identified',
                                dealSize: '',
                                status: 'Buyer Group Engaged',
                                priority: 'Priority'
                              },
                              {
                                name: 'Adobe',
                                industry: 'Creative Software',
                                size: '1000-5000 employees',
                                revenue: '$220,000 revenue',
                                location: 'San Francisco, CA',
                                tag: 'Buyer Group Identified',
                                dealSize: '',
                                status: 'Buyer Group Engaged',
                                priority: 'Priority'
                              },
                              {
                                name: 'Amazon Web Services',
                                industry: 'Cloud Services',
                                size: '5000+ employees',
                                revenue: '$680,000 revenue',
                                location: 'San Francisco, CA',
                                tag: 'Buyer Group Identified',
                                dealSize: '',
                                status: 'Buyer Group Engaged',
                                priority: 'Priority'
                              },
                              {
                                name: 'Anthem',
                                industry: 'Healthcare Insurance',
                                size: '5000+ employees',
                                revenue: '$1,800,000 revenue',
                                location: 'Indianapolis',
                                tag: 'Buyer Group Identified',
                                dealSize: '',
                                status: 'Buyer Group Engaged',
                                priority: 'Priority'
                              }
                            ];
                            
                            const demo = demoData[index] || demoData[0];
                            
                            return (
                              <div
                                key={company.id}
                                onClick={() => handleCompanyClick(company)}
                                className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                                        {demo.name}
                                      </h4>
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                        {demo.tag}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <div>{demo.industry}</div>
                                      <div>{demo.size}</div>
                                      <div>{demo.revenue}</div>
                                      <div>{demo.location}</div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">
                                      Next: • Timeline:
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="text-sm text-gray-500">{demo.dealSize}</div>
                                    <div className="text-sm text-gray-500">{demo.status}</div>
                                    <div className="text-sm text-gray-500">{demo.priority}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                }
                rightPanel={<AIRightPanel />}
                isLeftPanelVisible={true}
                isRightPanelVisible={true}
                onToggleLeftPanel={() => {}}
                onToggleRightPanel={() => {}}
              />
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </AcquisitionOSProvider>
  );
}
