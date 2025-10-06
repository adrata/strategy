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
import { useUnifiedAuth } from "@/platform/auth-unified";

interface Seller {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  workspaceId: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  employeeCount: string;
  revenue: string;
  location: string;
  assignedUserId: string;
  workspaceId: string;
}

export default function SellerCompaniesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUnifiedAuth();
  const sellerId = params['id'] as string;
  
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
      try {
        setLoading(true);
        
        // Extract seller ID from slug - look for ULID pattern first, then seller pattern
        const slugParts = sellerId.split('-');
        let actualSellerId = null;
        
        // Look for ULID pattern (26 characters starting with 01)
        for (let i = slugParts.length - 1; i >= 0; i--) {
          const part = slugParts[i];
          if (part.length === 26 && (part.startsWith('01') || part.startsWith('c'))) {
            actualSellerId = part;
            break;
          }
        }
        
        // If no ULID found, look for seller pattern (cybersecurity-seller-X)
        if (!actualSellerId && slugParts.length >= 3) {
          const lastThreeParts = slugParts.slice(-3);
          if (lastThreeParts[0] === 'cybersecurity' && lastThreeParts[1] === 'seller' && !isNaN(parseInt(lastThreeParts[2]))) {
            actualSellerId = lastThreeParts.join('-');
          }
        }
        
        // If still no ID found, extract name from slug for matching
        const sellerName = slugParts.slice(0, -3).join(' ').replace(/-/g, ' ');
        
        console.log('🔍 Slug parts:', slugParts);
        console.log('🔍 Extracted seller ID:', actualSellerId);
        console.log('🔍 Extracted seller name:', sellerName);
        const sellerResponse = await fetch(`/api/data/section?section=sellers&workspaceId=${user?.activeWorkspaceId}&userId=${user?.id}&limit=1000`);
        const sellerResult = await sellerResponse.json();
        
        console.log('🔍 Seller API response:', sellerResult);
        console.log('🔍 Available sellers:', sellerResult.data?.data?.map((s: Seller) => ({
          id: s.id,
          name: s.name,
          firstName: s.firstName,
          lastName: s.lastName
        })));
        
        if (sellerResult['success'] && sellerResult.data && sellerResult.data.data) {
          let foundSeller = null;
          
          // First try to find by ID if we have one
          if (actualSellerId) {
            foundSeller = sellerResult.data.data.find((s: Seller) => s['id'] === actualSellerId);
            console.log('🔍 Found seller by ID:', foundSeller);
          }
          
          // If not found by ID, try to find by name
          if (!foundSeller && sellerName) {
            foundSeller = sellerResult.data.data.find((s: Seller) => {
              const sellerFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
              const sellerNameLower = sellerName.toLowerCase();
              return sellerFullName.includes(sellerNameLower) || 
                     s.name?.toLowerCase().includes(sellerNameLower) ||
                     sellerNameLower.includes(sellerFullName);
            });
            console.log('🔍 Found seller by name:', foundSeller);
          }
          
          console.log('🔍 Final found seller:', foundSeller);
          
          if (foundSeller) {
            setSeller(foundSeller);
            
            // Load companies data
            console.log('🔍 Loading companies for seller:', foundSeller.id);
            const companiesResponse = await fetch(`/api/data/section?section=companies&workspaceId=${user?.activeWorkspaceId}&userId=${user?.id}&limit=1000`);
            const companiesResult = await companiesResponse.json();
            
            console.log('🔍 Companies API response:', companiesResult);
            console.log('🔍 Companies data type:', typeof companiesResult.data);
            console.log('🔍 Companies data is array:', Array.isArray(companiesResult.data));
            
            if (companiesResult['success'] && companiesResult.data && companiesResult.data.data && Array.isArray(companiesResult.data.data)) {
              // Filter companies assigned to this seller
              const sellerCompanies = companiesResult.data.data.filter((company: Company) => 
                company['assignedUserId'] === foundSeller.id
              );
              console.log('🔍 Seller companies:', sellerCompanies);
              console.log('🔍 Found seller ID:', foundSeller.id);
              console.log('🔍 Company assigned user IDs:', companiesResult.data.data.map((c: Company) => c.assignedUserId));
              setCompanies(sellerCompanies);
            } else {
              console.log('❌ Companies data is not an array or API failed');
              console.log('❌ API success:', companiesResult['success']);
              console.log('❌ Data exists:', !!companiesResult.data);
              console.log('❌ Data.data exists:', !!companiesResult.data?.data);
              console.log('❌ Data type:', typeof companiesResult.data);
              console.log('❌ Data.data type:', typeof companiesResult.data?.data);
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

    if (sellerId && user?.activeWorkspaceId && user?.id) {
      loadSellerAndCompanies();
    }
  }, [sellerId, user?.activeWorkspaceId, user?.id]);

  // Handle company card click
  const handleCompanyClick = (company: Company) => {
    console.log('Navigating to company buyer group:', company);
    // Generate proper slug using company name and ID
    const slug = generateSlug(company.name || 'company', company.id);
    
    // Navigate to the buyer group cards page
    router.push(`/sellers/${sellerId}/companies/${slug}/buyer-group-cards`);
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
                          {/* Avatar - White with gray border like person records */}
                          <div className="w-12 h-12 bg-white border border-gray-300 rounded-2xl flex items-center justify-center shadow-sm">
                            <span className="text-lg font-semibold text-gray-700">
                              {seller.firstName?.[0] || seller.name?.[0] || 'S'}
                            </span>
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{seller.name}</h1>
                            <p className="text-sm text-gray-600">{seller.title || 'Senior Account Executive'} • {seller.department || 'Sales'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Edit Seller
                          </button>
                          <button className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors">
                            Add Action
                          </button>
                        </div>
                      </div>
                      
                      {/* Metrics Row */}
                      <div className="mt-4 flex gap-6">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{companies.length}</div>
                          <div className="text-xs text-gray-500">Companies Assigned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">4.5</div>
                          <div className="text-xs text-gray-500">Avg Stakeholders/Company</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">89%</div>
                          <div className="text-xs text-gray-500">Decision Maker Engagement</div>
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
                        <div className="space-y-4">
                          {companies.map((company, index) => {
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
                                        {company.name}
                                      </h4>
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                        Active
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <div>{company.industry}</div>
                                      <div>{company.employeeCount} employees</div>
                                      <div>{company.revenue} revenue</div>
                                      <div>{company.location}</div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">
                                      Click to view buyer group →
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="text-sm text-gray-500">Buyer Group</div>
                                    <div className="text-sm text-gray-500">Active</div>
                                    <div className="text-sm text-gray-500">Priority</div>
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