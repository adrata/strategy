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
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";

interface PipelineFiltersProps {
  activeSection: string;
}

export function PipelineFilters({ activeSection }: PipelineFiltersProps) {
  const { data } = useRevenueOS();
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
    const people = data.acquireData.people || [];
    const companies = data.acquireData.companies || [];
    const clients = data.acquireData.clients || [];

    switch (activeSection) {
      case 'leads':
        return getLeadFilterOptions(leads);
      case 'prospects':
        return getProspectFilterOptions(prospects);
      case 'opportunities':
        return getOpportunityFilterOptions(opportunities);
      case 'people':
        return getContactFilterOptions(people);
      case 'companies':
        return getAccountFilterOptions(companies);
      case 'clients':
        return getCustomerFilterOptions(clients);
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
                activeSection === 'companies' ? 'Search companies' :
                activeSection === 'people' ? 'Search people' :
                activeSection === 'opportunities' ? 'Search opportunities' :
                activeSection === 'clients' ? 'Search clients' :
                'Search records'
              }
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted)] hover:text-[var(--muted)]"
              >
                ✕
              </button>
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
        
        {activeSection === 'companies' && (
          <>
            {(filterOptions.industry || []).length > 0 && (
              <div className="flex-1">
                <DynamicFilterDropdown
                  label="Industry"
                  value={filters.industry}
                  options={filterOptions.industry || []}
                  onChange={(value) => updateFilter('industry', value)}
                  placeholder="All Industries"
                />
              </div>
            )}
            {(filterOptions.size || []).length > 0 && (
              <div className="flex-1">
                <DynamicFilterDropdown
                  label="Size"
                  value={filters.size}
                  options={filterOptions.size || []}
                  onChange={(value) => updateFilter('size', value)}
                  placeholder="All Sizes"
                />
              </div>
            )}
            {(filterOptions.location || []).length > 0 && (
              <div className="flex-1">
                <DynamicFilterDropdown
                  label="State"
                  value={filters.location}
                  options={filterOptions.location || []}
                  onChange={(value) => updateFilter('location', value)}
                  placeholder="All States"
                />
              </div>
            )}
          </>
        )}
        
        {activeSection === 'people' && (
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

        {activeSection === 'clients' && (
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
