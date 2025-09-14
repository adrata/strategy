"use client";

import React from "react";
import { DynamicFilterDropdown } from "@/platform/ui/components/DynamicFilterDropdown";
import { 
  getLeadFilterOptions, 
  getProspectFilterOptions, 
  getOpportunityFilterOptions, 
  getContactFilterOptions, 
  getAccountFilterOptions, 
  getCustomerFilterOptions 
} from "@/platform/utils/filter-helpers";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";

interface PipelineFiltersProps {
  activeSection: string;
}

export function PipelineFilters({ activeSection }: PipelineFiltersProps) {
  const { data } = useAcquisitionOS();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filters, setFilters] = React.useState({
    status: 'all',
    source: 'all',
    company: 'all',
    industry: 'all',
    size: 'all',
    location: 'all',
    title: 'all',
    department: 'all',
    vertical: 'all',
    year: 'all'
  });

  // Generate dynamic filter options from real data
  const filterOptions = React.useMemo(() => {
    const opportunities = data.acquireData.opportunities || [];
    const leads = data.acquireData.leads || [];
    const prospects = data.acquireData.prospects || [];
    const contacts = data.acquireData.contacts || [];
    const accounts = data.acquireData.accounts || [];
    const customers = data.acquireData.customers || [];

    switch (activeSection) {
      case 'leads':
        return getLeadFilterOptions(leads);
      case 'prospects':
        return getProspectFilterOptions(prospects);
      case 'opportunities':
        return getOpportunityFilterOptions(opportunities);
      case 'people':
        return getContactFilterOptions(contacts);
      case 'companies':
        return getAccountFilterOptions(accounts);
      case 'customers':
        return getCustomerFilterOptions(customers);
      default:
        return {};
    }
  }, [activeSection, data]);

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="px-0 pt-4 pb-2">
      <div className="flex items-center gap-4 w-full">
        {/* Search Input - Wider */}
        <div className="flex-[2]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSection === 'leads' ? 'Search leads' : 
                activeSection === 'accounts' ? 'Search companies' :
                activeSection === 'contacts' ? 'Search contacts' :
                activeSection === 'opportunities' ? 'Search opportunities' :
                activeSection === 'customers' ? 'Search customers' :
                'Search records'
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Dynamic Filters Based on Section */}
        {activeSection === 'leads' && (
          <div className="flex-1">
            <DynamicFilterDropdown
              label="Vertical"
              value={filters.vertical}
              options={filterOptions.vertical || []}
              onChange={(value) => updateFilter('vertical', value)}
              placeholder="All Verticals"
            />
          </div>
        )}
        
        {activeSection === 'prospects' && (
          <div className="flex-1">
            <DynamicFilterDropdown
              label="Vertical"
              value={filters.vertical}
              options={filterOptions.vertical || []}
              onChange={(value) => updateFilter('vertical', value)}
              placeholder="All Verticals"
            />
          </div>
        )}
        
        {activeSection === 'opportunities' && (
          <div className="flex-1">
            <DynamicFilterDropdown
              label="Stage"
              value={filters.status}
              options={filterOptions.status || []}
              onChange={(value) => updateFilter('status', value)}
              placeholder="All Stages"
            />
          </div>
        )}
        
        {activeSection === 'accounts' && (
          <>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="Industry"
                value={filters.industry}
                options={filterOptions.industry || []}
                onChange={(value) => updateFilter('industry', value)}
                placeholder="All Industries"
              />
            </div>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="Size"
                value={filters.size}
                options={filterOptions.size || []}
                onChange={(value) => updateFilter('size', value)}
                placeholder="All Sizes"
              />
            </div>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="State"
                value={filters.location}
                options={filterOptions.location || []}
                onChange={(value) => updateFilter('location', value)}
                placeholder="All States"
              />
            </div>
          </>
        )}
        
        {activeSection === 'contacts' && (
          <>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="Company"
                value={filters.company}
                options={filterOptions.company || []}
                onChange={(value) => updateFilter('company', value)}
                placeholder="All Companies"
              />
            </div>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="Title"
                value={filters.title}
                options={filterOptions.title || []}
                onChange={(value) => updateFilter('title', value)}
                placeholder="All Titles"
              />
            </div>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="Department"
                value={filters.department}
                options={filterOptions.department || []}
                onChange={(value) => updateFilter('department', value)}
                placeholder="All Departments"
              />
            </div>
          </>
        )}

        {activeSection === 'customers' && (
          <>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="Status"
                value={filters.status}
                options={filterOptions.status || []}
                onChange={(value) => updateFilter('status', value)}
                placeholder="All Status"
              />
            </div>
            <div className="flex-1">
              <DynamicFilterDropdown
                label="Size"
                value={filters.size}
                options={filterOptions.size || []}
                onChange={(value) => updateFilter('size', value)}
                placeholder="All Sizes"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
