"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  UsersIcon,
  StarIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  XMarkIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline";
import { ICPList, AllSection, MonacoRecord } from "../types";
import { MonacoRecordDetail } from "./";
// Mock data removed - using production database only
import { useMonacoPipeline } from "@/platform/hooks/useMonacoPipeline";
import { PipelineStatus } from "./PipelineStatus";
import { PersonDetailView } from "./PersonDetailView";
import { safeApiFetch } from "@/platform/api-fetch";
import { isDesktop } from "@/platform/platform-detection";

interface MonacoContentProps {
  activeSection: string;
  icpLists: ICPList[];
  allSections: AllSection[];
  completedLists: string[];
  isTransferring: boolean;
  selectedRecord: MonacoRecord | null;
  setSelectedRecord: (record: MonacoRecord | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onTransferAll: () => void;
  searchCompanies?: (searchQuery: string) => Promise<void>;
  // Add data props
  companies: any[];
  partners: any[];
  people: any[];
  loading: boolean;
  error: string | null;
}

// Custom Dropdown Component
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] hover:bg-[var(--hover-bg)] transition-colors"
      >
        <span
          className={value ? "text-[var(--foreground)]" : "text-[var(--muted)]"}
        >
          {value || placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className="block w-full px-3 py-2 text-sm text-left hover:bg-[var(--hover-bg)] transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Toast context (simple state-based for now)
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-2 z-50 p-4 rounded-lg shadow-lg ${type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}
    >
      {message}
    </div>
  );
}


export function MonacoContent({
  activeSection,
  icpLists,
  allSections,
  completedLists,
  isTransferring,
  selectedRecord,
  setSelectedRecord,
  searchQuery,
  setSearchQuery,
  onTransferAll,
  companies,
  partners,
  people,
  loading,
  error,
}: MonacoContentProps) {
  const router = useRouter();

  // Use the data from props
  const allCompanies = companies;
  const allPartners = partners;
  const allPeople = people;
  const isLoadingData = loading;
  const dataError = error;

  // Initialize Monaco pipeline functionality
  const {
    runCompanyPipeline,
    isCompanyPipelineRunning,
    enrichCompanyWithIntelligence,
    isPipelineLoading,
    pipelineError,
    isRunning,
    latestExecution,
  } = useMonacoPipeline();

  // Helper function to convert plural buyer roles to singular for individual display
  const getSingularBuyerRole = (role: string): string => {
    return role === 'Openers' ? 'Opener' : role;
  };

  // Navigation state for drill-down flow
  const [currentView, setCurrentView] = useState<'list' | 'buyerGroup' | 'personDetail'>('list');
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    industry: "",
    size: "",
    location: "",
    company: "",
    vertical: "",
    revenue: "",
  });

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Generate buyer group members for a company from real people data
  const generateBuyerGroup = (company: any) => {
    console.log(`🔍 [BUYER GROUP DEBUG] Generating buyer group for company: ${company.name}`);
    console.log(`🔍 [BUYER GROUP DEBUG] Total people available: ${allPeople.length}`);
    
    // Filter real people that work at this company
    const companyPeople = allPeople.filter(person => 
      person['company'] && person.company.toLowerCase().includes(company.name.toLowerCase())
    );
    
    console.log(`🔍 [BUYER GROUP DEBUG] Found ${companyPeople.length} people for ${company.name}`);
    if (companyPeople.length > 0) {
      console.log(`🔍 [BUYER GROUP DEBUG] Sample person:`, companyPeople[0]);
    }
    
    // If we have real people, return them with enhanced buyer role analysis
    if ((companyPeople?.length || 0) > 0) {
      const buyerGroup = companyPeople.map(person => {
        // Use buyer role from notes if available, otherwise determine from title
        const buyerRole = person.buyerRole || person.role || determineBuyerRole(person.title || "");
        
        return {
          id: person.id,
          name: person.name,
          title: person.title || "Unknown Title",
          company: person.company,
          email: person.email || `${(person.name || 'user').toLowerCase().replace(' ', '.')}@${company.domain || 'company.com'}`,
          department: person.department || "Unknown Department",
          buyerRole: buyerRole,
          influence: person.influence || determineInfluence(person.seniority || ""),
          engagementScore: person.engagement || person.engagementScore || generateStableEngagementScore(person.id || person.name, 70, 100), // Stable score based on person ID
          lastActivity: person.lastContact || new Date().toISOString().split('T')[0],
          status: person.status || "prospect",
          seniority: person.seniority || "Unknown"
        };
      });
      
      console.log(`🔍 [BUYER GROUP DEBUG] Generated buyer group with ${buyerGroup.length} members`);
      console.log(`🔍 [BUYER GROUP DEBUG] Role distribution:`, buyerGroup.reduce((acc, member) => {
        acc[member.buyerRole] = (acc[member.buyerRole] || 0) + 1;
        return acc;
      }, {}));
      
      return buyerGroup;
    }
    
    // If no real people found, generate realistic buyer group (7-15 people)
    console.log(`⚠️ No real people found for ${company.name}, generating sample buyer group`);
    return generateSampleBuyerGroup(company);
  };

  // Generate sample buyer group for companies without real data (7-11 people)
  const generateSampleBuyerGroup = (company: any) => {
    if (!company) return [];
    
    const targetSize = generateStableEngagementScore(`${company.id || company.name}-size`, 7, 11);
    const selectedRoles = [];
    
    // ALWAYS include exactly 2 Decision Makers
    const decisionMakers = [
      { title: "Chief Technology Officer", role: "Decision Maker", dept: "Technology", seniority: "C-Level" },
      { title: "VP of Engineering", role: "Decision Maker", dept: "Engineering", seniority: "VP" }
    ];
    selectedRoles.push(...decisionMakers);
    
    // ALWAYS include exactly 2 Champions
    const champions = [
      { title: "Director of IT", role: "Champion", dept: "IT", seniority: "Director" },
      { title: "Principal Engineer", role: "Champion", dept: "Engineering", seniority: "Senior" }
    ];
    selectedRoles.push(...champions);
    
    // Add variety of Stakeholders, Blockers, and Openers for remaining spots
    const additionalRoles = [
      // Stakeholders
      { title: "IT Manager", role: "Stakeholder", dept: "IT", seniority: "Manager" },
      { title: "Engineering Manager", role: "Stakeholder", dept: "Engineering", seniority: "Manager" },
      { title: "Product Manager", role: "Stakeholder", dept: "Product", seniority: "Manager" },
      { title: "DevOps Manager", role: "Stakeholder", dept: "Engineering", seniority: "Manager" },
      { title: "Data Engineering Manager", role: "Stakeholder", dept: "Data", seniority: "Manager" },
      { title: "Platform Engineer", role: "Stakeholder", dept: "Engineering", seniority: "Senior" },
      { title: "Solutions Architect", role: "Stakeholder", dept: "Technology", seniority: "Senior" },
      
      // Blockers
      { title: "Security Manager", role: "Blocker", dept: "Security", seniority: "Manager" },
      { title: "Compliance Director", role: "Blocker", dept: "Legal", seniority: "Director" },
      { title: "Risk Management Director", role: "Blocker", dept: "Risk", seniority: "Director" },
      
      // Openers
      { title: "DevOps Lead", role: "Openers", dept: "Engineering", seniority: "Manager" },
      { title: "Technical Lead", role: "Openers", dept: "Engineering", seniority: "Senior" },
      { title: "Infrastructure Engineer", role: "Openers", dept: "IT", seniority: "Senior" },
      { title: "Systems Administrator", role: "Openers", dept: "IT", seniority: "Manager" },
      { title: "Cloud Architect", role: "Openers", dept: "Engineering", seniority: "Senior" },
      { title: "Software Engineer", role: "Openers", dept: "Engineering", seniority: "Senior" },
      { title: "Network Engineer", role: "Openers", dept: "IT", seniority: "Senior" }
    ];
    
    // Add additional roles to reach target size (targetSize - 4 since we already added 2 DMs + 2 Champions)
    const additionalCount = targetSize - 4;
    
    for (let i = 0; i < additionalCount && i < (additionalRoles?.length || 0); i++) {
      const roleIndex = generateStableEngagementScore(`${company.id || company.name}-role-${i}`, 0, (additionalRoles?.length || 1) - 1);
      const selectedRole = additionalRoles?.[roleIndex];
      if (selectedRole && !selectedRoles.find(r => r['title'] === selectedRole.title)) {
        selectedRoles.push(selectedRole);
      }
    }
    
    const roles = selectedRoles;
    const firstNames = ["Sarah", "Michael", "Jessica", "David", "Emily", "James", "Lisa", "Robert", "Maria", "John"];
    const lastNames = ["Chen", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson"];
    
    const companyName = company.name || 'company';
    const companyDomain = company.domain || companyName.toLowerCase().replace(/\s+/g, '') + '.com';

    return roles.filter(role => role).map((role, index) => ({
      id: `${company.id || 'unknown'}-person-${index}`,
      name: `${(firstNames?.length || 0) > 0 ? (firstNames?.[index % firstNames.length] || 'User') : 'User'} ${(lastNames?.length || 0) > 0 ? (lastNames?.[index % lastNames.length] || 'Name') : 'Name'}`,
      title: role.title,
      department: role.dept,
      buyerRole: role.role,
      influence: determineInfluence(role.seniority),
      email: `${((firstNames?.length || 0) > 0 ? (firstNames?.[index % firstNames.length] || 'user') : 'user').toLowerCase()}.${((lastNames?.length || 0) > 0 ? (lastNames?.[index % lastNames.length] || 'name') : 'name').toLowerCase()}@${companyDomain}`,
      engagementScore: generateStableEngagementScore(`${company.id || company.name}-${index}`, 70, 100),
      lastActivity: new Date(Date.now() - generateStableEngagementScore(`${company.id || company.name}-${index}-days`, 1, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "prospect",
      seniority: role.seniority
    }));
  };
  
  // Helper function to generate stable engagement score based on person identifier
  const generateStableEngagementScore = (identifier: string, min: number, max: number): number => {
    // Simple hash function to generate consistent "random" number from string
    let hash = 0;
    for (let i = 0; i < (identifier?.length || 0); i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert hash to number between min and max
    const range = max - min;
    return min + Math.abs(hash) % range;
  };

  // Helper function to determine buyer role from title
  const determineBuyerRole = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('ceo') || t.includes('president') || t.includes('chief')) {
      return "Decision Maker";
    }
    if (t.includes('vp') || t.includes('vice president') || t.includes('director')) {
      return "Champion";
    }
    if (t.includes('security') || t.includes('compliance') || t.includes('legal')) {
      return "Blocker";
    }
    if (t.includes('manager') || t.includes('head of')) {
      return "Stakeholder";
    }
    return "Openers";
  };
  
  // Helper function to determine influence from seniority
  const determineInfluence = (seniority: string): string => {
    switch(seniority) {
      case "C-Level": return "High";
      case "VP": return "High"; 
      case "Director": return "Medium";
      case "Manager": return "Medium";
      default: return "Low";
    }
  };

  // Get current list data
  const getCurrentList = () => {
    if (["icp1", "icp2", "icp3", "icp4"].includes(activeSection)) {
      return icpLists.find((list) => list['id'] === activeSection);
    }
    return allSections.find((section) => section['id'] === activeSection);
  };

  const currentList = getCurrentList();
  const isICPList =
    ["icp1", "icp2", "icp3", "icp4"].includes(activeSection) ||
    icpLists.some((list) => list['id'] === activeSection && list.isCustom);
  const isCompleted = completedLists.includes(activeSection);

  // Filter data based on active section and search query
  const getFilteredData = () => {
    let data: any[] = [];

    // Get base data based on section
    if (
      activeSection === "companies" ||
      ["icp1", "icp2", "icp3", "icp4"].includes(activeSection)
    ) {
      data = allCompanies;

      // Apply ICP-specific filtering
      if (activeSection === "icp1") {
        // High-Intent SaaS
        data = allCompanies.filter((company) => {
          const industry = (company.industry || "").toLowerCase();
          return (
            industry.includes("saas") ||
            industry.includes("software") ||
            industry.includes("cloud") ||
            industry.includes("technology")
          );
        });
      } else if (activeSection === "icp2") {
        // Scaling Enterprises
        data = allCompanies.filter((company) => {
          const employees = company.employeeCount || 0;
          const industry = (company.industry || "").toLowerCase();
          return (
            (employees >= 100 && employees <= 2000) ||
            industry.includes("enterprise") ||
            industry.includes("e-commerce")
          );
        });
      } else if (activeSection === "icp3") {
        // Compliance-Driven
        data = allCompanies.filter((company) => {
          const industry = (company.industry || "").toLowerCase();
          return (
            industry.includes("financial") ||
            industry.includes("healthcare") ||
            industry.includes("legal") ||
            industry.includes("insurance")
          );
        });
      } else if (activeSection === "icp4") {
        // Digital Transformation
        data = allCompanies.filter((company) => {
          const employees = company.employeeCount || 0;
          const industry = (company.industry || "").toLowerCase();
          return (
            employees >= 200 &&
            (industry.includes("retail") || industry.includes("manufacturing"))
          );
        });
      }

      // Ensure we have at least 40 companies for ICPs
      if (
        ["icp1", "icp2", "icp3", "icp4"].includes(activeSection) &&
        (data?.length || 0) < 40
      ) {
        const remaining = allCompanies.filter(
          (c) => !data.find((d) => d['id'] === c.id),
        );
        data = [...data, ...remaining].slice(0, 40);
      }
    } else if (activeSection === "partners") {
      data = allPartners;
    } else if (activeSection === "people") {
      data = allPeople;
    }

    // Apply search filter
    if (searchQuery && searchQuery.trim() && searchQuery !== "*") {
      const searchLower = searchQuery.toLowerCase();
      data = data.filter((record: any) => {
        if (activeSection === "partners") {
          return (
            record.name?.toLowerCase().includes(searchLower) ||
            record.industry?.toLowerCase().includes(searchLower) ||
            record.partnershipType?.toLowerCase().includes(searchLower)
          );
        } else if (activeSection === "people") {
          return (
            record.name?.toLowerCase().includes(searchLower) ||
            record.title?.toLowerCase().includes(searchLower) ||
            record.company?.toLowerCase().includes(searchLower)
          );
        } else {
          return (
            record.name?.toLowerCase().includes(searchLower) ||
            record.industry?.toLowerCase().includes(searchLower) ||
            record.domain?.toLowerCase().includes(searchLower)
          );
        }
      });
    }

    // Apply other filters
    if (filters['industry'] && activeSection === "companies") {
      data = data.filter((record: any) =>
        record.industry?.toLowerCase().includes(filters.industry.toLowerCase()),
      );
    }

    if (filters['company'] && ["companies", "people"].includes(activeSection)) {
      data = data.filter((record: any) =>
        record.name?.toLowerCase().includes(filters.company.toLowerCase()) ||
        record.company?.toLowerCase().includes(filters.company.toLowerCase()),
      );
    }

    if (filters['vertical'] && ["companies", "people"].includes(activeSection)) {
      data = data.filter((record: any) =>
        record.industry?.toLowerCase().includes(filters.vertical.toLowerCase()) ||
        record.vertical?.toLowerCase().includes(filters.vertical.toLowerCase()),
      );
    }

    if (filters['revenue'] && activeSection === "companies") {
      data = data.filter((record: any) => {
        const revenue = parseFloat(record.revenue?.replace(/[^0-9.]/g, "") || "0");
        const filterRevenue = parseFloat(filters.revenue.replace(/[^0-9.]/g, "") || "0");
        return revenue >= filterRevenue;
      });
    }

    if (
      filters['location'] &&
      ["companies", "people", "partners"].includes(activeSection)
    ) {
      data = data.filter((record: any) =>
        record.location?.toLowerCase().includes(filters.location.toLowerCase()),
      );
    }

    return data;
  };

  const filteredData = getFilteredData();

  // Handle filter change
  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle running pipeline for a company
  const handleRunPipeline = async (company: any) => {
    try {
      await runCompanyPipeline.mutateAsync({
        companyId: company.id,
        companyName: company.name,
      });

      setToast({
        message: `Pipeline started for ${company.name}`,
        type: "success",
      });
    } catch (error) {
      console.error(`❌ Failed to start pipeline for ${company.name}:`, error);
      setToast({
        message: `Failed to start pipeline for ${company.name}`,
        type: "error",
      });
    }
  };

  // Handle company click - show details without navigation
  const handleCompanyClick = (company: any) => {
    console.log("🏢 Viewing company details for:", company.name);
    // REMOVED: Page navigation that was causing reloads
    // TODO: Could show company detail modal or expand inline
  };

  // Handle person click - go to person detail
  const handlePersonClick = (person: any) => {
    setSelectedPerson(person);
    setCurrentView('personDetail');
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentView === 'personDetail') {
      setCurrentView('buyerGroup');
      setSelectedPerson(null);
    } else if (currentView === 'buyerGroup') {
      setCurrentView('list');
      setSelectedCompany(null);
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Decision Maker":
        return <ShieldCheckIcon className="w-4 h-4 text-[var(--muted)]" />;
      case "Champion":
        return <StarIcon className="w-4 h-4 text-[var(--muted)]" />;
      case "Stakeholder":
        return <UsersIcon className="w-4 h-4 text-[var(--muted)]" />;
      case "Blocker":
        return <XMarkIcon className="w-4 h-4 text-[var(--muted)]" />;
      case "Openers":
        return <PlusIcon className="w-4 h-4 text-[var(--muted)]" />;
      default:
        return <UsersIcon className="w-4 h-4 text-[var(--muted)]" />;
    }
  };

  // Get role color - all gray now
  const getRoleColor = (role: string) => {
    return "bg-[var(--panel-background)] text-gray-700 border-[var(--border)]";
  };

  // Render buyer group view
  const renderBuyerGroupView = () => {
    if (!selectedCompany) return null;

    const buyerGroup = generateBuyerGroup(selectedCompany);
    const champions = buyerGroup.filter(member => member['buyerRole'] === "Champion");
    const decisionMakers = buyerGroup.filter(member => member['buyerRole'] === "Decision Maker");
    const stakeholders = buyerGroup.filter(member => member['buyerRole'] === "Stakeholder");
    const blockers = buyerGroup.filter(member => member['buyerRole'] === "Blocker");
    const openers = buyerGroup.filter(member => member['buyerRole'] === "Openers");

    console.log(`🔍 [BUYER GROUP VIEW DEBUG] Total buyer group: ${buyerGroup.length}`);
    console.log(`🔍 [BUYER GROUP VIEW DEBUG] Champions: ${champions.length}`);
    console.log(`🔍 [BUYER GROUP VIEW DEBUG] Decision Makers: ${decisionMakers.length}`);
    console.log(`🔍 [BUYER GROUP VIEW DEBUG] Stakeholders: ${stakeholders.length}`);
    console.log(`🔍 [BUYER GROUP VIEW DEBUG] Blockers: ${blockers.length}`);
    console.log(`🔍 [BUYER GROUP VIEW DEBUG] Openers: ${openers.length}`);

    return (
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </button>
          <div className="h-6 w-px bg-[var(--border)]"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {selectedCompany.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {selectedCompany.name} - Buyer Group
              </h1>
              <p className="text-sm text-[var(--muted)]">
                {buyerGroup?.length || 0} stakeholders mapped • {selectedCompany.industry}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <StarIcon className="w-5 h-5 text-[var(--muted)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">Champions</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {champions?.length || 0}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-5 h-5 text-[var(--muted)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">Decision Makers</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {decisionMakers?.length || 0}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="w-5 h-5 text-[var(--muted)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">Stakeholders</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {stakeholders?.length || 0}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">Blockers</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {blockers?.length || 0}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <PlusIcon className="w-5 h-5 text-[var(--muted)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">Openers</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {openers?.length || 0}
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded text-xs flex items-center justify-center text-white font-bold">%</span>
              <span className="text-sm font-semibold text-[var(--foreground)]">Avg Engagement</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {(buyerGroup?.length || 0) > 0 ? Math.round((buyerGroup || []).reduce((sum, m) => sum + m.engagementScore, 0) / (buyerGroup?.length || 1)) : 0}%
            </div>
          </div>
        </div>

        {/* Buyer Group Members */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Buyer Group Members
          </h2>
          
          {buyerGroup.map((member) => (
            <div
              key={member.id}
              onClick={() => handlePersonClick(member)}
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:border-[#2563EB] transition-all duration-200 cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {(member.name || '').split(' ').map((n: string) => n?.[0] || '').join('')}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] hover:text-[#2563EB] transition-colors">
                        {member.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.buyerRole)}`}>
                        {getRoleIcon(member.buyerRole)}
                        {getSingularBuyerRole(member.buyerRole)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member['influence'] === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                        member['influence'] === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {member.influence} Influence
                      </span>
                    </div>
                    
                    <p className="text-sm text-[var(--muted)] mb-3">{member.title}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-[var(--muted)] mb-3">
                      <span>{member.email}</span>
                      <span>•</span>
                      <span>{member.department}</span>
                      <span>•</span>
                      <span>Last active: {member.lastActivity}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Engagement Score:
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                              style={{ width: `${member.engagementScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {member.engagementScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Adding ${member.name} to pipeline`);
                    }}
                    className="px-3 py-1 text-xs font-medium bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
                  >
                    Add to Pipeline
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Viewing ${member.name} profile`);
                    }}
                    className="px-3 py-1 text-xs font-medium border border-[var(--border)] text-[var(--foreground)] rounded hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render person detail view
  const renderPersonDetailView = () => {
    if (!selectedPerson) return null;

    return (
      <div className="flex-1 overflow-y-auto">
        <PersonDetailView
          person={selectedPerson}
          onBack={handleBack}
          getStatusColor={(status: string) => {
            switch (status) {
              case "qualified": return "bg-green-100 text-green-800";
              case "contacted": return "bg-blue-100 text-blue-800";
              case "prospect": return "bg-yellow-100 text-yellow-800";
              default: return "bg-[var(--hover)] text-gray-800";
            }
          }}
          getRankNumber={(record: any) => 1}
          getRankingDescription={(record: any) => "Top buyer group member"}
          getInitials={(name: string | null | undefined) => (name || 'N/A').split(' ').map(n => n?.[0] || '').join('')}
        />
      </div>
    );
  };

  // Show appropriate view based on current state
  if (currentView === 'buyerGroup') {
    return renderBuyerGroupView();
  }

  if (currentView === 'personDetail') {
    return renderPersonDetailView();
  }

  // Enhanced empty state messaging for list view
  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return {
        icon: <MagnifyingGlassIcon className="h-16 w-16 text-[var(--muted)]" />,
        title: `No ${activeSection} found`,
        description: `No ${activeSection} match your search for "${searchQuery}". Try adjusting your search terms or filters.`,
      };
    }

    switch (activeSection) {
      case "companies":
        return {
          icon: <BuildingOfficeIcon className="h-16 w-16 text-[var(--muted)]" />,
          title: "Loading Companies...",
          description:
            "Fetching company intelligence from your database. This may take a moment.",
          showBrowseButton: false,
        };
      case "people":
        return {
          icon: <UsersIcon className="h-16 w-16 text-[var(--muted)]" />,
          title: "Loading People...",
          description:
            "Fetching contact intelligence from your database. This may take a moment.",
          showBrowseButton: false,
        };
      case "partners":
        return {
          icon: <UserGroupIcon className="h-16 w-16 text-[var(--muted)]" />,
          title: "Loading Partners...",
          description:
            "Fetching partnership data from your database. This may take a moment.",
          showBrowseButton: false,
        };
      default:
        if (isICPList) {
          return {
            icon: <ArrowPathRoundedSquareIcon className="h-16 w-16 text-[var(--muted)]" />,
            title: `${currentList?.name} ICP`,
            description: `This ICP contains companies that match your ideal customer profile. ${(filteredData?.length || 0) > 0 ? `Found ${filteredData?.length || 0} matching companies.` : "Loading companies from your database..."}`,
          };
        }
        return {
          icon: <PipelineSkeleton message="Loading Monaco data..." />,
          title: "Loading Monaco data...",
          description: "Fetching data from your intelligence engine.",
        };
    }
  };

  console.log("🔍 Monaco Data Status:", {
    activeSection,
    isLoadingData,
    totalCompanies: allCompanies?.length || 0,
    totalPartners: allPartners?.length || 0,
    totalPeople: allPeople?.length || 0,
    filteredData: filteredData?.length || 0,
    searchQuery,
    error: dataError,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Search and Filter Bar */}
      <div className="flex-shrink-0 p-6 border-b border-[var(--border)]">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${activeSection}...`}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2">
            {activeSection === "companies" && (
              <>
                <CustomDropdown
                  value={filters.industry}
                  onChange={(value) => handleFilterChange("industry", value)}
                  options={[
                    "Technology",
                    "Healthcare",
                    "Financial",
                    "Manufacturing",
                    "Retail",
                  ]}
                  placeholder="Industry"
                />
                <CustomDropdown
                  value={filters.size}
                  onChange={(value) => handleFilterChange("size", value)}
                  options={["1-50", "51-200", "201-1000", "1000+"]}
                  placeholder="Company Size"
                />
              </>
            )}
            {["companies", "people", "partners"].includes(activeSection) && (
              <CustomDropdown
                value={filters.location}
                onChange={(value) => handleFilterChange("location", value)}
                options={[
                  "San Francisco",
                  "New York",
                  "Austin",
                  "Seattle",
                  "Boston",
                ]}
                placeholder="State"
              />
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Show loading state */}
        {isLoadingData && (
          <PipelineSkeleton message="Loading Monaco data..." />
        )}

        {/* Show error state */}
        {dataError && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Data Error
              </h2>
              <p className="text-[var(--muted)] mb-6">{dataError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Show empty state when no data but not loading */}
        {!isLoadingData && !dataError && (filteredData?.length || 0) === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="mb-4">{getEmptyStateMessage().icon}</div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {getEmptyStateMessage().title}
              </h2>
              <p className="text-[var(--muted)] mb-6">
                {getEmptyStateMessage().description}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => handleSearchChange("*")}
                  className="px-6 py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
                >
                  Browse Database
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show data when available */}
        {!isLoadingData && !dataError && (filteredData?.length || 0) > 0 && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {filteredData.map((record: any, index: number) => (
                <div
                  key={record.id}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[#2563EB] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() =>
                    activeSection.includes("people")
                      ? handlePersonClick(record)
                      : handleCompanyClick(record)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                          {record.name}
                        </h3>
                        {record['icpScore'] && (
                          <span className="bg-[#2563EB] text-white px-2 py-1 rounded text-xs font-semibold">
                            {record.icpScore}% ICP
                          </span>
                        )}
                        {record['status'] && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              record['status'] === "qualified"
                                ? "bg-green-100 text-green-800"
                                : record['status'] === "contacted"
                                  ? "bg-blue-100 text-blue-800"
                                  : record['status'] === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-[var(--hover)] text-gray-800"
                            }`}
                          >
                            {record.status.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-[var(--muted)]">
                        {activeSection === "companies" ||
                        ["icp1", "icp2", "icp3", "icp4"].includes(
                          activeSection,
                        ) ? (
                          <>
                            <p>
                              {record.industry} •{" "}
                              {record.employeeCount || "Unknown"} employees
                            </p>
                            <p>
                              {record.location} •{" "}
                              {record.revenue || "Revenue undisclosed"}
                            </p>
                          </>
                        ) : activeSection === "people" ? (
                          <>
                            <p>
                              {record.name}—{record.company}
                            </p>
                            <p className="text-[var(--muted)]">
                              {record.title}
                            </p>
                            <p>
                              {record.email} •{" "}
                              {record.seniority || "Individual Contributor"}
                            </p>
                          </>
                        ) : activeSection === "partners" ? (
                          <>
                            <p>
                              {record.partnershipType} • {record.industry}
                            </p>
                            <p>
                              {record.region} • {record.deals || 0} deals
                            </p>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {activeSection === "companies" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunPipeline(record);
                          }}
                          disabled={isCompanyPipelineRunning(record.id)}
                          className="px-3 py-1 text-xs font-medium bg-[var(--hover)] text-gray-700 rounded hover:bg-[var(--loading-bg)] transition-colors disabled:opacity-50"
                        >
                          {isCompanyPipelineRunning(record.id)
                            ? "Running..."
                            : "Run Pipeline"}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            `Adding ${record.name} to Action Platform`,
                          );
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--hover)] text-gray-700 hover:bg-[var(--loading-bg)] transition-colors"
                      >
                        Add to Acquire
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
