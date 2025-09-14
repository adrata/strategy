"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";

interface Seller {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  isOnline: boolean;
  assignedCompanies: string[];
  assignedProspects: number;
  assignedLeads: number;
  assignedOpportunities: number;
}

export function SellersView() {
  console.log('🔍 [SELLERS VIEW] Component is mounting/rendering');
  
  const { user: authUser } = useUnifiedAuth();
  const router = useRouter();
  const { navigateToPipelineItem } = useWorkspaceNavigation();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  console.log('🔍 [SELLERS VIEW] Current state:', { sellers: sellers.length, loading });

  // Debug: Watch for changes in sellers state
  useEffect(() => {
    console.log('🔍 [SELLERS VIEW] Sellers state changed:', { count: sellers.length, sellers });
  }, [sellers]);

  useEffect(() => {
    const loadSellers = async () => {
      try {
        console.log('🔍 [SELLERS VIEW] Starting to load sellers...');
        setLoading(true);
        
        // Use unified API for demo mode compatibility
        const timestamp = Date.now();
        // Determine the correct workspace ID based on the current demo scenario
        const isZeroPointDemo = typeof window !== "undefined" && window.location.pathname.includes('/demo/zeropoint/');
        const workspaceId = isZeroPointDemo ? 'zeropoint-demo-2025' : 'demo-workspace-2025';
        const response = await fetch(`/api/data/unified?type=sellers&action=get&workspaceId=${workspaceId}&userId=demo-user-2025&t=${timestamp}`);
        console.log('🔍 [SELLERS VIEW] Fetch response status:', response.status);
        const sellersData = await response.json();
        
        console.log('🔍 [SELLERS VIEW] API Response:', sellersData);
        
        if (sellersData['success'] && sellersData.data) {
          // Transform the data to our Seller interface
          const transformedSellers: Seller[] = sellersData.data.map((seller: any) => ({
            id: seller.id,
            name: seller.name,
            email: seller.email,
            title: seller.title || 'Sales Rep',
            company: seller.company || 'Winning Variant',
            isOnline: true, // Simulate online status
            assignedCompanies: seller.assignedCompanies || [],
            assignedProspects: seller.assignedProspects || 0,
            assignedLeads: seller.assignedLeads || 0,
            assignedOpportunities: seller.assignedOpportunities || 0
          }));
          
          console.log('🔍 [SELLERS VIEW] Transformed sellers:', transformedSellers);
          setSellers(transformedSellers);
          console.log('🔍 [SELLERS VIEW] setSellers called with', transformedSellers.length, 'sellers');
        } else {
          console.log('🔍 [SELLERS VIEW] API response was not successful, using fallback demo data');
          // Fallback to demo data
          const demoSellers: Seller[] = [
            {
              id: 'demo-user-2025',
              name: 'Kirk Morales',
              email: 'demo@winning-variant.com',
              title: 'Founder & CEO',
              company: 'Winning Variant',
              isOnline: true,
              assignedCompanies: ['Brex', 'First Premier Bank'],
              assignedProspects: 6,
              assignedLeads: 0,
              assignedOpportunities: 0
            },
            {
              id: 'david-beitler-2025',
              name: 'David Beitler',
              email: 'david@winning-variant.com',
              title: 'Co-Founder',
              company: 'Winning Variant',
              isOnline: true,
              assignedCompanies: ['Match Group'],
              assignedProspects: 3,
              assignedLeads: 0,
              assignedOpportunities: 0
            }
          ];
          console.log('🔍 [SELLERS VIEW] Setting fallback demo sellers:', demoSellers.length);
          setSellers(demoSellers);
        }
      } catch (error) {
        console.error('Error loading sellers:', error);
        console.log('🔍 [SELLERS VIEW] Using error fallback demo data');
        // Fallback to demo data on error
        const demoSellers: Seller[] = [
          {
            id: 'demo-user-2025',
            name: 'Kirk Morales',
            email: 'demo@winning-variant.com',
            title: 'Founder & CEO',
            company: 'Winning Variant',
            isOnline: true,
            assignedCompanies: ['Brex', 'First Premier Bank'],
            assignedProspects: 6,
            assignedLeads: 0,
            assignedOpportunities: 0
          },
          {
            id: 'david-beitler-2025',
            name: 'David Beitler',
            email: 'david@winning-variant.com',
            title: 'Co-Founder',
            company: 'Winning Variant',
            isOnline: true,
            assignedCompanies: ['Match Group'],
            assignedProspects: 3,
            assignedLeads: 0,
            assignedOpportunities: 0
          }
        ];
        console.log('🔍 [SELLERS VIEW] Setting error fallback demo sellers:', demoSellers.length);
        setSellers(demoSellers);
      } finally {
        setLoading(false);
        console.log('🔍 [SELLERS VIEW] Loading completed, final sellers count:', sellers.length);
      }
    };

    loadSellers();
  }, []); // Run on mount only for demo mode

  const handleSellerClick = (seller: Seller) => {
    setSelectedSeller(seller);
    setSelectedCompany(null);
    setSelectedPerson(null);
  };

  // Check if current user is Kirk (leader) to show all records
  const isCurrentUserLeader = authUser?.email === 'demo@winning-variant.com';

  const handleCompanyClick = (company: string) => {
    // Navigate to the company page instead of just setting state
    console.log(`🔗 [SellersView] Navigating to company: ${company}`);
    
    // For demo, we need to find the company ID from the company name
    // This is a simplified approach - in a real app, you'd have the company ID
    const companySlug = company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Use the navigation hook to go to the company page
    navigateToPipelineItem('companies', companySlug, company);
  };

  const handlePersonClick = (person: any) => {
    setSelectedPerson(person);
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setSelectedPerson(null);
  };

  const handleBackToSeller = () => {
    setSelectedSeller(null);
    setSelectedCompany(null);
    setSelectedPerson(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Person detail view
  if (selectedPerson) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToCompanies}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Buyer Group
          </button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xl mr-6">
                {selectedPerson.fullName?.split(' ').map((n: string) => n[0]).join('') || '??'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{selectedPerson.fullName}</h1>
                <p className="text-xl text-gray-600">{selectedPerson.jobTitle}</p>
                <p className="text-lg text-gray-500">{selectedPerson.company}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{selectedPerson.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                    <p className="text-gray-900">{selectedPerson.phone}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <p className="text-gray-900">{selectedPerson.city}, {selectedPerson.state}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">LinkedIn:</span>
                    <a href={selectedPerson.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      View Profile
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Intelligence Profile</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Wants:</span>
                    <p className="text-gray-900">Increase conversion rates, optimize user experience, reduce customer acquisition costs</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Needs:</span>
                    <p className="text-gray-900">Better analytics tools, A/B testing platform, customer journey mapping</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Pain Points:</span>
                    <p className="text-gray-900">Current tools are fragmented, lack of real-time insights, manual reporting processes</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Goals:</span>
                    <p className="text-gray-900">Improve conversion rates by 25%, reduce CAC by 30%, increase customer lifetime value</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Deep Value Report</h4>
                  <p className="text-blue-700 text-sm mb-3">Comprehensive analysis of company needs and opportunities</p>
                  <a href="#" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View Report →
                  </a>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Mini Brief</h4>
                  <p className="text-green-700 text-sm mb-3">Quick overview of key insights and recommendations</p>
                  <a href="#" className="text-green-600 hover:text-green-800 font-medium text-sm">
                    View Brief →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Buyer group view
  if (selectedCompany) {
    // Generate buyer group data based on company
    const getBuyerGroupData = (company: string) => {
      const buyerGroups: Record<string, any[]> = {
        'Brex': [
          {
            id: '1',
            fullName: 'Sarah Chen',
            jobTitle: 'VP of Marketing',
            company: 'Brex',
            email: 'sarah.chen@brex.com',
            phone: '+1 (555) 234-5678',
            city: 'San Francisco',
            state: 'CA',
            linkedinUrl: 'https://linkedin.com/in/sarahchen',
            role: 'Decision Maker',
            flightRisk: 'Low',
            influence: 'High',
            engagement: 'High'
          },
          {
            id: '2',
            fullName: 'Michael Rodriguez',
            jobTitle: 'Head of Growth',
            company: 'Brex',
            email: 'michael.rodriguez@brex.com',
            phone: '+1 (555) 345-6789',
            city: 'San Francisco',
            state: 'CA',
            linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
            role: 'Champion',
            flightRisk: 'Medium',
            influence: 'Medium',
            engagement: 'High'
          },
          {
            id: '3',
            fullName: 'Amanda Foster',
            jobTitle: 'Marketing Manager',
            company: 'Brex',
            email: 'amanda.foster@brex.com',
            phone: '+1 (555) 890-1234',
            city: 'San Francisco',
            state: 'CA',
            linkedinUrl: 'https://linkedin.com/in/amandafoster',
            role: 'User',
            flightRisk: 'High',
            influence: 'Low',
            engagement: 'Medium'
          }
        ],
        'First Premier Bank': [
          {
            id: '4',
            fullName: 'Jennifer Kim',
            jobTitle: 'Chief Marketing Officer',
            company: 'First Premier Bank',
            email: 'jennifer.kim@firstpremier.com',
            phone: '+1 (555) 456-7890',
            city: 'Sioux Falls',
            state: 'SD',
            linkedinUrl: 'https://linkedin.com/in/jenniferkim',
            role: 'Decision Maker',
            flightRisk: 'Low',
            influence: 'High',
            engagement: 'Medium'
          },
          {
            id: '5',
            fullName: 'David Thompson',
            jobTitle: 'VP of Digital Strategy',
            company: 'First Premier Bank',
            email: 'david.thompson@firstpremier.com',
            phone: '+1 (555) 567-8901',
            city: 'Sioux Falls',
            state: 'SD',
            linkedinUrl: 'https://linkedin.com/in/davidthompson',
            role: 'Influencer',
            flightRisk: 'Medium',
            influence: 'High',
            engagement: 'High'
          }
        ],
        'Match Group': [
          {
            id: '6',
            fullName: 'Lisa Wang',
            jobTitle: 'VP of Product',
            company: 'Match Group',
            email: 'lisa.wang@match.com',
            phone: '+1 (555) 678-9012',
            city: 'Dallas',
            state: 'TX',
            linkedinUrl: 'https://linkedin.com/in/lisawang',
            role: 'Decision Maker',
            flightRisk: 'Low',
            influence: 'High',
            engagement: 'High'
          },
          {
            id: '7',
            fullName: 'Robert Johnson',
            jobTitle: 'Head of Engineering',
            company: 'Match Group',
            email: 'robert.johnson@match.com',
            phone: '+1 (555) 789-0123',
            city: 'Dallas',
            state: 'TX',
            linkedinUrl: 'https://linkedin.com/in/robertjohnson',
            role: 'Technical Buyer',
            flightRisk: 'Medium',
            influence: 'Medium',
            engagement: 'Medium'
          }
        ]
      };
      return buyerGroups[company] || [];
    };

    const buyerGroup = getBuyerGroupData(selectedCompany);

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToCompanies}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {selectedSeller?.name}'s Companies
          </button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedCompany} Buyer Group</h1>
          <p className="text-gray-600">Key stakeholders and decision makers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buyerGroup.map((person) => (
            <div 
              key={person.id}
              onClick={() => handlePersonClick(person)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                  {person.fullName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{person.fullName}</h3>
                  <p className="text-gray-600">{person.jobTitle}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Role:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    person['role'] === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                    person['role'] === 'Champion' ? 'bg-green-100 text-green-800' :
                    person['role'] === 'Influencer' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {person.role}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Flight Risk:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    person['flightRisk'] === 'Low' ? 'bg-green-100 text-green-800' :
                    person['flightRisk'] === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {person.flightRisk}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Influence:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    person['influence'] === 'High' ? 'bg-purple-100 text-purple-800' :
                    person['influence'] === 'Medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {person.influence}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Engagement:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    person['engagement'] === 'High' ? 'bg-green-100 text-green-800' :
                    person['engagement'] === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {person.engagement}
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button className="w-full text-blue-600 hover:text-blue-800 font-medium">
                  View Full Profile →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Company list view
  if (selectedSeller) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToSeller}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sellers
          </button>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
              {selectedSeller.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{selectedSeller.name}</h1>
                {isCurrentUserLeader && selectedSeller['id'] === 'demo-user-2025' && (
                  <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Leader
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg">Senior Account Executive - Enterprise West</p>
              <div className="flex items-center mt-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${selectedSeller.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-500">{selectedSeller.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1">89%</div>
            <div className="text-sm text-gray-500">Decision Maker Engagement</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">4.5</div>
            <div className="text-sm text-gray-500">Avg Stakeholders/Group</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-purple-600 mb-1">40/50</div>
            <div className="text-sm text-gray-500">Active Buyer Groups</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-2xl font-bold text-orange-600 mb-1">105%</div>
            <div className="text-sm text-gray-500">% to Goal</div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(isCurrentUserLeader ? ['Brex', 'First Premier Bank', 'Match Group'] : selectedSeller.assignedCompanies).map((company, index) => (
            <div 
              key={index} 
              onClick={() => handleCompanyClick(company)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{company}</h3>
                  <p className="text-gray-600">Technology • 500-1000 employees</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Revenue</div>
                  <div className="text-lg font-semibold text-gray-900">$100M+</div>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Buyer Group Identified</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Complete
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Deal Size</span>
                  <span className="text-sm font-medium text-gray-900">$250K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Buyer Group Engaged</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Priority</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    High
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-right">
                  <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    View Buyer Group →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sellers</h1>
        <p className="text-gray-600 text-lg">Organize momentum</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-2xl font-bold text-blue-600 mb-1">2</div>
          <div className="text-sm text-gray-500">Active Sellers</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-2xl font-bold text-green-600 mb-1">3</div>
          <div className="text-sm text-gray-500">Total Companies</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-2xl font-bold text-purple-600 mb-1">12</div>
          <div className="text-sm text-gray-500">Buyer Groups</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-2xl font-bold text-orange-600 mb-1">89%</div>
          <div className="text-sm text-gray-500">Engagement Rate</div>
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sellers.map((seller) => (
          <div
            key={seller.id}
            onClick={() => handleSellerClick(seller)}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-xl">
                    {seller.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-xl font-semibold text-gray-900">{seller.name}</h3>
                    {isCurrentUserLeader && seller['id'] === 'demo-user-2025' && (
                      <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Leader
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg">{seller.title}</p>
                  <div className="flex items-center mt-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${seller.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-500">{seller.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-lg font-bold text-blue-600 mb-1">{seller.assignedCompanies.length}</div>
                <div className="text-sm text-gray-500">Active Companies</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-lg font-bold text-green-600 mb-1">{seller.assignedProspects + seller.assignedLeads}</div>
                <div className="text-sm text-gray-500">Total Prospects</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Pipeline Progress</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-right">
              <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                View Companies →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
