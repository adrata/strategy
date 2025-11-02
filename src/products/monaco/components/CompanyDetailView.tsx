import React, { useState } from "react";
import {
  ChevronLeftIcon,
  BuildingOffice2Icon,
  UsersIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import CountryFlag from "./CountryFlag";
import { determineSaleType, getDecisionMakerInfo } from "./SalesIntelligence";

interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: number;
  revenue: string;
  location: string;
  icpScore: number;
  lastUpdated: string;
  status: "active" | "prospecting" | "contacted" | "qualified";
  // Enhanced BrightData fields
  website?: string;
  linkedin?: string;
  description?: string;
  techStack?: string[];
  fundingStage?: string;
  totalFunding?: string;
  recentNews?: string[];
  competitors?: string[];
  keyContacts?: number;
  decisionComplexity: "simple" | "complex";
  productFit: "low" | "medium" | "high";
}

interface Person {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone?: string;
  linkedin?: string;
  location: string;
  department: string;
  seniority: string;
  isDecisionMaker: boolean;
  influenceScore: number;
  recentActivity?: string;
  status: "prospect" | "contacted" | "qualified" | "customer";
}

interface CompanyDetailViewProps {
  company: Company;
  onBack: () => void;
}

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({
  company,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const tabs = ["Overview", "People", "Intelligence", "Activity", "Engagement"];

  const decisionInfo = getDecisionMakerInfo({
    ...company,
    decisionMakerType: company.employeeCount < 50 ? "single" : "group",
  });

  // Sample people data - this would come from BrightData
  const companyPeople: Person[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      title: "CEO",
      company: company.name,
      email: "sarah.johnson@company.com",
      phone: "+1-555-0123",
      linkedin: "linkedin.com/in/sarahjohnson",
      location: company.location,
      department: "Executive",
      seniority: "C-Level",
      isDecisionMaker: true,
      influenceScore: 95,
      recentActivity: "Posted about Q4 growth initiatives",
      status: "prospect",
    },
    {
      id: "2",
      name: "Michael Chen",
      title: "VP of Engineering",
      company: company.name,
      email: "michael.chen@company.com",
      phone: "+1-555-0124",
      linkedin: "linkedin.com/in/michaelchen",
      location: company.location,
      department: "Engineering",
      seniority: "VP",
      isDecisionMaker: false,
      influenceScore: 78,
      recentActivity: "Shared article on tech infrastructure",
      status: "prospect",
    },
    {
      id: "3",
      name: "Lisa Rodriguez",
      title: "Director of Sales",
      company: company.name,
      email: "lisa.rodriguez@company.com",
      linkedin: "linkedin.com/in/lisarodriguez",
      location: company.location,
      department: "Sales",
      seniority: "Director",
      isDecisionMaker:
        decisionInfo['saleType'] === "decision-maker" ? true : false,
      influenceScore: 82,
      recentActivity: "Attended SaaS conference last week",
      status: "contacted",
    },
  ];

  if (selectedPerson) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedPerson(null)}
            className="p-2 rounded-lg hover:bg-hover transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedPerson.name}
            </h1>
            <p className="text-muted">
              {selectedPerson.title} at {selectedPerson.company}
            </p>
          </div>
        </div>

        {/* Person detail content here */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted">
                    Email:
                  </span>
                  <p className="text-foreground">
                    {selectedPerson.email}
                  </p>
                </div>
                {selectedPerson['phone'] && (
                  <div>
                    <span className="text-sm font-medium text-muted">
                      Phone:
                    </span>
                    <p className="text-foreground">
                      {selectedPerson.phone}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted">
                    Location:
                  </span>
                  <div className="flex items-center gap-2">
                    <CountryFlag location={selectedPerson.location} />
                    <span className="text-foreground">
                      {selectedPerson.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Role Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted">
                    Department:
                  </span>
                  <p className="text-foreground">
                    {selectedPerson.department}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted">
                    Seniority:
                  </span>
                  <p className="text-foreground">
                    {selectedPerson.seniority}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted">
                    Decision Maker:
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPerson.isDecisionMaker
                        ? "bg-[#9B59B6] bg-opacity-10 text-[#9B59B6]"
                        : "bg-hover text-muted"
                    }`}
                  >
                    {selectedPerson.isDecisionMaker ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted">
                    Influence Score:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-loading-bg rounded-full h-2">
                      <div
                        className="bg-[#9B59B6] h-2 rounded-full"
                        style={{ width: `${selectedPerson.influenceScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#9B59B6]">
                      {selectedPerson.influenceScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-hover transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-muted" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {company.name}
            </h1>
            <CountryFlag location={company.location} size="md" />
          </div>
          <p className="text-muted">{company.domain}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted">ICP Score</div>
          <div className="text-2xl font-bold text-[#9B59B6]">
            {company.icpScore}%
          </div>
        </div>
      </div>

      {/* Sales Intelligence Banner */}
      <div className="mb-6 p-4 bg-hover rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#9B59B6] bg-opacity-10 flex items-center justify-center">
              {decisionInfo['saleType'] === "decision-maker" ? (
                <UsersIcon className="w-5 h-5 text-[#9B59B6]" />
              ) : (
                <BuildingOffice2Icon className="w-5 h-5 text-[#9B59B6]" />
              )}
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {decisionInfo['saleType'] === "decision-maker"
                  ? "Decision Maker Sale"
                  : "Buyer Group Sale"}
              </div>
              <div className="text-sm text-muted">
                {decisionInfo.description}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted">Timeline</div>
            <div className="font-semibold text-foreground">
              {decisionInfo.timeline}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#9B59B6] text-[#9B59B6]"
                : "border-transparent text-muted hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "People" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {decisionInfo['saleType'] === "decision-maker"
                ? "Key Decision Maker"
                : "Buyer Group Members"}
            </h2>

            {/* People Table */}
            <div className="bg-background border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
                      Decision Power
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
                      Influence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companyPeople.map((person, index) => (
                    <tr
                      key={person.id}
                      className="border-b border-border hover:bg-hover cursor-pointer transition-colors"
                      onClick={() => setSelectedPerson(person)}
                    >
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-lg bg-hover flex items-center justify-center">
                          <span className="text-sm font-bold text-muted">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {person.name}
                        </div>
                        <div className="text-sm text-muted">
                          {person.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {person.title}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {person.department}
                      </td>
                      <td className="px-6 py-4">
                        {person.isDecisionMaker ? (
                          <span className="px-2 py-1 bg-[#9B59B6] bg-opacity-10 text-[#9B59B6] rounded-full text-xs font-medium">
                            High
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-hover text-muted rounded-full text-xs font-medium">
                            Medium
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-loading-bg rounded-full h-1.5 max-w-[60px]">
                            <div
                              className="bg-[#9B59B6] h-1.5 rounded-full"
                              style={{ width: `${person.influenceScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">
                            {person.influenceScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            person['status'] === "contacted"
                              ? "bg-blue-100 text-blue-800"
                              : person['status'] === "qualified"
                                ? "bg-green-100 text-green-800"
                                : "bg-hover text-muted"
                          }`}
                        >
                          {person.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>
              <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BuildingOffice2Icon className="w-5 h-5 text-muted" />
                  <span className="font-medium">Industry:</span>
                  <span className="text-muted">
                    {company.industry}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-muted" />
                  <span className="font-medium">Employees:</span>
                  <span className="text-muted">
                    {company.employeeCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-muted" />
                  <span className="font-medium">Revenue:</span>
                  <span className="text-muted">{company.revenue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5 text-muted" />
                  <CountryFlag location={company.location} />
                  <span className="font-medium">Location:</span>
                  <span className="text-muted">
                    {company.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sales Intelligence</h3>
              <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                <div>
                  <span className="font-medium">Sale Type:</span>
                  <span className="ml-2 text-muted">
                    {decisionInfo.saleType}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Strategy:</span>
                  <span className="ml-2 text-muted">
                    {decisionInfo.strategy}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Complexity:</span>
                  <span className="ml-2 text-muted">
                    {decisionInfo.complexity}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Est. Timeline:</span>
                  <span className="ml-2 text-muted">
                    {decisionInfo.timeline}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
