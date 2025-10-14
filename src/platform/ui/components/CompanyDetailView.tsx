"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { safeApiFetch } from "@/platform/api-fetch";

interface CompanyDetailViewProps {
  companyName: string;
  onBack: () => void;
}

export function CompanyDetailView({
  companyName,
  onBack,
}: CompanyDetailViewProps) {
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedBuyerGroup, setSelectedBuyerGroup] = useState<any>(null);

  const tabs = [
    "Overview",
    "Buyer Groups",
    "People",
    "Opportunities",
    "Activity",
    "Intelligence",
  ];

  const fetchCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await safeApiFetch(
        `/api/companies/${encodeURIComponent(companyName)}`,
        {},
        null,
      );
      if (data) {
        setCompanyData(data);
      } else {
        console.error("Failed to fetch company data");
        setCompanyData(null);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      // Fallback to null in desktop mode
      setCompanyData(null);
    } finally {
      setLoading(false);
    }
  }, [companyName]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "contacted":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "qualified":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed won":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "closed lost":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-[var(--hover)] text-gray-800 border-[var(--border)]";
    }
  };

  const getOpportunityStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case "discovery":
        return "bg-blue-100 text-blue-800";
      case "proposal":
        return "bg-purple-100 text-purple-800";
      case "negotiation":
        return "bg-orange-100 text-orange-800";
      case "closed won":
        return "bg-green-100 text-green-800";
      case "closed lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-[var(--hover)] text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--muted)] border-t-[#10B981] rounded-full animate-spin"></div>
          <span className="text-[var(--muted)]">Loading company data...</span>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            Company Not Found
          </h3>
          <p className="text-[var(--muted)] mb-4">
            Could not find data for &ldquo;{companyName}&rdquo;
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--background)] overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] p-6 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">
                  {companyData.name}
                </h1>
                <p className="text-[var(--muted)]">
                  {companyData.industry} • {companyData.size}
                </p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4 text-[var(--muted)]" />
                <span className="text-[var(--muted)]">
                  {companyData.totalContacts} contacts
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CurrencyDollarIcon className="w-4 h-4 text-[var(--muted)]" />
                <span className="text-[var(--muted)]">
                  {formatCurrency(companyData.totalOpportunityValue)} pipeline
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ChartBarIcon className="w-4 h-4 text-[var(--muted)]" />
                <span className="text-[var(--muted)]">
                  {companyData.winRate}% win rate
                </span>
              </div>
              {companyData['hasAccount'] && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#10B981] text-[#10B981]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === "Buyer Groups" && companyData.buyerGroups.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#10B981]/10 text-[#10B981] rounded-full text-xs">
                  {companyData.buyerGroups.length}
                </span>
              )}
              {tab === "People" && companyData.totalContacts > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {companyData.totalContacts}
                </span>
              )}
              {tab === "Opportunities" &&
                companyData.activeOpportunities > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                    {companyData.activeOpportunities}
                  </span>
                )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Industry
                      </span>
                      <p className="text-[var(--foreground)]">
                        {companyData.industry}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Employee Count
                      </span>
                      <p className="text-[var(--foreground)]">
                        {companyData.size}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Revenue
                      </span>
                      <p className="text-[var(--foreground)]">
                        {companyData.revenue}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Website
                      </span>
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#10B981] hover:text-[#059669] flex items-center gap-1"
                      >
                        <GlobeAltIcon className="w-4 h-4" />
                        {companyData.website.replace("https://", "")}
                      </a>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Headquarters
                      </span>
                      <p className="text-[var(--foreground)]">
                        {companyData.headquarters}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Founded
                      </span>
                      <p className="text-[var(--foreground)]">
                        {companyData.foundedYear || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Business Type
                      </span>
                      <p className="text-[var(--foreground)]">
                        {companyData.businessType}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Market Segment
                      </span>
                      <p className="text-[var(--foreground)]">
                        {companyData.marketSegment}
                      </p>
                    </div>
                  </div>
                </div>

                {companyData['description'] && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <span className="text-sm font-medium text-[var(--muted)]">
                      Description
                    </span>
                    <p className="text-[var(--foreground)] mt-1">
                      {companyData.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {companyData.leads.slice(0, 3).map((lead: any) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 p-3 bg-[var(--hover-bg)] rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--foreground)]">
                          {lead.name}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          Lead • {formatDate(lead.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </div>
                  ))}

                  {companyData.opportunities.slice(0, 2).map((opp: any) => (
                    <div
                      key={opp.id}
                      className="flex items-center gap-3 p-3 bg-[var(--hover-bg)] rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--foreground)]">
                          {opp.name}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {formatCurrency(parseFloat(opp.amount || "0"))} •{" "}
                          {formatDate(opp.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getOpportunityStageColor(opp.stage)}`}
                      >
                        {opp.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Key Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Total Leads</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {companyData.totalLeads}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">
                      Active Opportunities
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {companyData.activeOpportunities}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Pipeline Value</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {formatCurrency(companyData.totalOpportunityValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Win Rate</span>
                    <span className="font-semibold text-green-600">
                      {companyData.winRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Contact */}
              {companyData['primaryContact'] && (
                <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                    Primary Contact
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-[var(--foreground)]">
                        {companyData.primaryContact.name}
                      </h4>
                      <p className="text-[var(--muted)]">
                        {companyData.primaryContact.title}
                      </p>
                    </div>
                    {companyData['primaryContact']['email'] && (
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-[var(--muted)]" />
                        <a
                          href={`mailto:${companyData.primaryContact.email}`}
                          className="text-[#10B981] hover:text-[#059669]"
                        >
                          {companyData.primaryContact.email}
                        </a>
                      </div>
                    )}
                    {companyData['primaryContact']['phone'] && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-[var(--muted)]" />
                        <a
                          href={`tel:${companyData.primaryContact.phone}`}
                          className="text-[#10B981] hover:text-[#059669]"
                        >
                          {companyData.primaryContact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement Timeline */}
              <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Engagement Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">
                      First Engagement
                    </span>
                    <span className="text-[var(--foreground)]">
                      {formatDate(companyData.firstEngagement)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Last Activity</span>
                    <span className="text-[var(--foreground)]">
                      {formatDate(new Date(companyData.lastActivity))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Days Active</span>
                    <span className="text-[var(--foreground)]">
                      {Math.floor(
                        (Date.now() -
                          new Date(
                            companyData.firstEngagement || Date.now(),
                          ).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Buyer Groups" && (
          <div className="space-y-6">
            {companyData['buyerGroups']['length'] === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                  No Buyer Groups Found
                </h3>
                <p className="text-[var(--muted)]">
                  This company doesn&apos;t have any buyer groups configured
                  yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {companyData.buyerGroups.map((group: any) => (
                  <div
                    key={group.id}
                    className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setSelectedBuyerGroup(group)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                          {group.name}
                        </h3>
                        {group['description'] && (
                          <p className="text-[var(--muted)] mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-xs font-medium">
                        {group.members.length} members
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-[var(--foreground)]">
                        Decision Makers
                      </h4>
                      {group.decisionMakers.slice(0, 3).map((dm: any) => (
                        <div key={dm.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-[#10B981]">
                              {dm.person.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {dm.person.name}
                            </p>
                            <p className="text-sm text-[var(--muted)]">
                              {dm.role}
                            </p>
                          </div>
                        </div>
                      ))}

                      {group.decisionMakers.length > 3 && (
                        <p className="text-sm text-[var(--muted)]">
                          +{group.decisionMakers.length - 3} more decision
                          makers
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "People" && (
          <div className="space-y-6">
            <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--hover-bg)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...companyData.contacts, ...companyData.leads].map(
                    (person: any, index: number) => (
                      <tr
                        key={person.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--hover-bg)]"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-[var(--foreground)]">
                            {person.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[var(--foreground)]">
                            {person.title || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {person['email'] && (
                              <a
                                href={`mailto:${person.email}`}
                                className="text-[#10B981] hover:text-[#059669] block"
                              >
                                {person.email}
                              </a>
                            )}
                            {person['phone'] && (
                              <a
                                href={`tel:${person.phone}`}
                                className="text-[#10B981] hover:text-[#059669] block"
                              >
                                {person.phone}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(person.status || "Active")}`}
                          >
                            {person.status || "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[var(--foreground)]">
                            {formatDate(
                              person.lastActionDate || person.updatedAt,
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Opportunities" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {companyData.opportunities.map((opp: any) => (
                <div
                  key={opp.id}
                  className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {opp.name}
                      </h3>
                      <p className="text-2xl font-bold text-[#10B981] mt-2">
                        {formatCurrency(parseFloat(opp.amount || "0"))}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getOpportunityStageColor(opp.stage)}`}
                    >
                      {opp.stage}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Probability</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {opp.probability}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">
                        Expected Close
                      </span>
                      <span className="font-medium text-[var(--foreground)]">
                        {formatDate(opp.expectedCloseDate)}
                      </span>
                    </div>
                    {opp['primaryContact'] && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Contact</span>
                        <span className="font-medium text-[var(--foreground)]">
                          {opp.primaryContact.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="space-y-6">
            <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Recent Action Timeline
              </h3>
              <div className="space-y-4">
                {[
                  ...companyData.leads,
                  ...companyData.contacts,
                  ...companyData.opportunities,
                ]
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime(),
                  )
                  .slice(0, 10)
                  .map((item: any, index: number) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-start gap-4"
                    >
                      <div className="w-2 h-2 bg-[#10B981] rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--foreground)]">
                          {item.amount
                            ? "Opportunity"
                            : item.title
                              ? "Contact"
                              : "Lead"}
                          : {item.name}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {formatDate(item.updatedAt)} •
                          {item['amount'] &&
                            ` ${formatCurrency(parseFloat(item.amount))}`}
                          {item['status'] && ` • ${item.status}`}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Intelligence" && (
          <div className="space-y-6">
            <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Company Intelligence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-3">
                    Data Sources
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon
                        className={`w-4 h-4 ${companyData.hasAccount ? "text-green-500" : "text-[var(--muted)]"}`}
                      />
                      <span className="text-[var(--foreground)]">
                        Pipeline Account
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon
                        className={`w-4 h-4 ${companyData.hasBuyerProfile ? "text-green-500" : "text-[var(--muted)]"}`}
                      />
                      <span className="text-[var(--foreground)]">
                        Buyer Profile
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon
                        className={`w-4 h-4 ${companyData.hasLeads ? "text-green-500" : "text-[var(--muted)]"}`}
                      />
                      <span className="text-[var(--foreground)]">
                        Lead Data
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon
                        className={`w-4 h-4 ${companyData.hasOpportunities ? "text-green-500" : "text-[var(--muted)]"}`}
                      />
                      <span className="text-[var(--foreground)]">
                        Opportunity Data
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[var(--foreground)] mb-3">
                    Engagement Score
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--muted)]">
                          Lead Quality
                        </span>
                        <span className="text-[var(--foreground)]">
                          {Math.round(
                            (companyData.totalLeads /
                              Math.max(companyData.totalLeads, 10)) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-[var(--loading-bg)] rounded-full h-2">
                        <div
                          className="bg-[#10B981] h-2 rounded-full"
                          style={{
                            width: `${Math.round((companyData.totalLeads / Math.max(companyData.totalLeads, 10)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--muted)]">
                          Opportunity Strength
                        </span>
                        <span className="text-[var(--foreground)]">
                          {companyData.winRate}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--loading-bg)] rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${companyData.winRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
