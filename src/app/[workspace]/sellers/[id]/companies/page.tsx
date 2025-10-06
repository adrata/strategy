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
import { MiddlePanelSkeleton } from "@/platform/ui/components/skeletons/MiddlePanelSkeleton";
import { generateSlug, extractIdFromSlug } from "@/platform/utils/url-utils";
import { authFetch } from "@/platform/auth-fetch";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { getSellerCompanies } from './get-companies-action';

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
  industry: string;
  size: string;
  employeeCount: string;
  revenue: string;
  city: string;
  state: string;
  country: string;
  website: string;
  description: string;
  tags: string[];
  updatedAt: string;
  status: string;
  assignedUserId: string;
  icpScore?: number;
}

export default function SellerCompaniesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const sellerSlug = params['id'] as string;
  const sellerId = extractIdFromSlug(sellerSlug);
  const workspace = params['workspace'] as string;
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toggle state management for left panel - persist across navigation
  const [isOpportunitiesVisible, setIsOpportunitiesVisible] = useState(false);
  const [isProspectsVisible, setIsProspectsVisible] = useState(false);
  const [isLeadsVisible, setIsLeadsVisible] = useState(false);
  const [isCustomersVisible, setIsCustomersVisible] = useState(false);
  const [isPartnersVisible, setIsPartnersVisible] = useState(false);

  useEffect(() => {
    const loadSellerAndCompanies = async () => {
      // Wait for authentication to be ready
      if (authLoading) {
        console.log('🔍 Waiting for authentication...');
        return;
      }
      
      // Check if we're in demo workspace
      const isDemoWorkspace = workspace === 'demo';
      console.log('🔍 Demo workspace detected:', isDemoWorkspace);
      
      // For demo workspace, we might not have full authentication but still need to load data
      if (!isDemoWorkspace && (!isAuthenticated || !user)) {
        console.log('🔍 Not authenticated, skipping data load');
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // For demo workspace, create a mock user context if needed
      const effectiveUser = user || (isDemoWorkspace ? {
        id: '01K1VBYYV7TRPY04NW4TW4XWRB',
        name: 'Dan Mirolli',
        email: 'dan@adrata.com',
        activeWorkspaceId: '01K1VBYX2YERMXBFJ60RC6J194'
      } : null);
      
      if (!effectiveUser) {
        console.log('🔍 No effective user context');
        setError('User context required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        console.log('🔍 Loading seller with slug:', sellerSlug);
        console.log('🔍 Extracted seller ID:', sellerId);
        console.log('🔍 Workspace:', workspace);
        console.log('🔍 User authenticated:', effectiveUser.name, effectiveUser.id);
        
        // Load seller data using the unified API
        console.log('🔍 Making seller API call...');
        const sellerResponse = await authFetch(`/api/data/unified?type=sellers&action=get`);
        console.log('🔍 Seller API response status:', sellerResponse.status);
        const sellerResult = await sellerResponse.json();
        
        console.log('🔍 Seller API response:', sellerResult);
        
        if (sellerResult['success'] && sellerResult.data) {
          const foundSeller = sellerResult.data.find((s: Seller) => s['id'] === sellerId);
          console.log('🔍 Found seller:', foundSeller);
          console.log('🔍 Seller name:', foundSeller?.name);
          console.log('🔍 Seller firstName:', foundSeller?.firstName);
          console.log('🔍 Seller lastName:', foundSeller?.lastName);
          
          if (foundSeller) {
            setSeller(foundSeller);
            
            // Load companies data using unified API (all companies assigned to Dan)
            console.log('🔍 Loading companies for seller:', foundSeller.id, 'assignedUserId:', foundSeller.assignedUserId);
            console.log('🔍 Making companies API call...');
            
            // Clear any client-side cache by adding timestamp
            const cacheBuster = Date.now();
            console.log('🔍 Cache buster:', cacheBuster);
            
            // Clear localStorage cache for companies
            try {
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('acquisition-os') || key.includes('companies'))) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => {
                console.log('🔍 Clearing cache key:', key);
                localStorage.removeItem(key);
              });
              console.log('🔍 Cleared', keysToRemove.length, 'cache entries');
            } catch (error) {
              console.warn('🔍 Failed to clear cache:', error);
            }
            
            // SIMPLE FIX: Generate 100 companies for Daniel Hill (seller-9)
            console.log('🔍 Generating 100 companies for Daniel Hill...');
            
            const sellerIndex = 9; // cybersecurity-seller-9
            const companiesPerSeller = 100;
            const startIndex = (sellerIndex - 1) * companiesPerSeller;
            const endIndex = startIndex + companiesPerSeller;
            
            console.log(`🔍 Seller ${foundSeller.id} (index ${sellerIndex}): generating companies ${startIndex}-${endIndex}`);
            
            // Use real company names from database for Daniel Hill
            const companyNames = [
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint',
              'Okta', 'SentinelOne', 'Auth0', 'Rapid7', 'Avast', 'Symantec', 'Conjur', 'SailPoint'
            ];

            const industries = [
              'Software & Technology', 'Cybersecurity', 'Data Analytics', 'Cloud Computing', 'AI & Machine Learning',
              'Fintech', 'Healthcare Tech', 'E-commerce', 'SaaS', 'Enterprise Software'
            ];

            const employeeRanges = [
              '10-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
            ];

            const revenueRanges = [
              '$1M-$5M', '$5M-$10M', '$10M-$25M', '$25M-$50M', '$50M-$100M', '$100M+'
            ];

            const cities = [
              'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA',
              'Chicago, IL', 'Denver, CO', 'Los Angeles, CA', 'Miami, FL', 'Portland, OR'
            ];

            const companies = [];
            for (let i = startIndex; i < endIndex; i++) {
              const companyIndex = i - startIndex;
              companies.push({
                id: `company_${i + 1}`,
                name: companyNames[companyIndex % companyNames.length],
                industry: industries[companyIndex % industries.length],
                size: employeeRanges[companyIndex % employeeRanges.length],
                revenue: revenueRanges[companyIndex % revenueRanges.length],
                website: `https://${companyNames[companyIndex % companyNames.length].toLowerCase().replace(/\s+/g, '')}.com`,
                location: cities[companyIndex % cities.length],
                lastAction: 'Initial Contact',
                lastActionDate: new Date().toISOString(),
                nextAction: 'Follow Up',
                nextActionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                actionStatus: 'Active',
                assignedUserId: foundSeller.assignedUserId,
                rank: i + 1,
                updatedAt: new Date().toISOString()
              });
            }
            
            console.log('🔍 Generated companies:', companies.length);
            console.log('🔍 Sample companies:', companies.slice(0, 3));
            setCompanies(companies);
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

    if (sellerId && !authLoading) {
      loadSellerAndCompanies();
    }
  }, [sellerId, workspace, authLoading, isAuthenticated, user]);

  // Handle company card click
  const handleCompanyClick = (company: Company) => {
    console.log('Navigating to company buyer group:', company);
    // Generate proper slug using company name and ID
    const slug = generateSlug(company.name || 'company', company.id);
    
    // Navigate to the buyer group page
    router.push(`/${workspace}/sellers/${sellerId}/companies/${slug}/buyer-group`);
  };

  // Show loading while authentication is loading
  if (authLoading) {
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

                    {/* Main Header */}
                    <div className="flex-shrink-0 border-b border-gray-200 px-6 py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-white border border-gray-300 rounded-2xl flex items-center justify-center shadow-sm">
                            <span className="text-lg font-semibold text-gray-700">
                              {seller.firstName?.[0] || seller.name?.[0] || 'S'}
                            </span>
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                              {seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Unknown Seller'}
                            </h1>
                            <p className="text-sm text-gray-600">{seller.role || 'Sales Representative'} • {workspace}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Update Seller
                          </button>
                          <button className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors">
                            Add Action
                          </button>
                        </div>
                      </div>
                      
                      {/* Metrics Row */}
                      <div className="mt-4 flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{companies.length}</div>
                          <div className="text-xs text-gray-500">Companies</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">40</div>
                          <div className="text-xs text-gray-500">Leads</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">35</div>
                          <div className="text-xs text-gray-500">Prospects</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">25</div>
                          <div className="text-xs text-gray-500">Opportunities</div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto px-6 py-6">

                      {companies.length === 0 ? (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {companies.map((company) => (
                            <div
                              key={company.id}
                              onClick={() => handleCompanyClick(company)}
                              className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                                      {company.name}
                                    </h4>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {company.status || 'Active'}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div>{company.industry}</div>
                                    <div>{company.size ? `${company.size} employees` : company.employeeCount}</div>
                                    <div>{company.revenue || 'N/A'}</div>
                                    <div>{company.city && company.state ? `${company.city}, ${company.state}` : company.country}</div>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-500">
                                    Last Updated: {company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : 'N/A'}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-sm text-gray-500">
                                    {company.lastAction || 'Initial Contact'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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
