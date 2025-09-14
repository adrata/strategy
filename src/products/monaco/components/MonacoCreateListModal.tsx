"use client";

import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ICPList, CustomListFilters } from "../types";

interface MonacoCreateListModalProps {
  onClose: () => void;
  onCreate: (
    listData: Omit<ICPList, "id" | "isCompleted" | "isCustom">,
  ) => void;
}

export function MonacoCreateListModal({
  onClose,
  onCreate,
}: MonacoCreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<CustomListFilters>({});
  const [estimatedCount, setEstimatedCount] = useState(0);

  const filterOptions = {
    location: [
      "California",
      "New York",
      "Texas",
      "Washington",
      "Massachusetts",
      "Illinois",
      "Florida",
    ],
    industry: [
      "Enterprise Software",
      "Data Analytics",
      "Cloud Infrastructure",
      "Cybersecurity",
      "Financial Technology",
      "Healthcare Tech",
      "E-commerce",
    ],
    sector: [
      "Technology",
      "Healthcare",
      "Financial Services",
      "Manufacturing",
      "Retail",
      "Energy",
      "Real Estate",
    ],
    vertical: [
      "SaaS",
      "E-commerce",
      "Fintech",
      "Healthtech",
      "Edtech",
      "Insurtech",
      "PropTech",
    ],
    department: [
      "Engineering",
      "Sales",
      "Marketing",
      "Product",
      "Operations",
      "Finance",
      "HR",
    ],
    role: [
      "CEO",
      "CTO",
      "VP Engineering",
      "VP Sales",
      "Head of Product",
      "Director",
      "Manager",
    ],
    size: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    revenue: [
      "<$1M",
      "$1M-$5M",
      "$5M-$10M",
      "$10M-$50M",
      "$50M-$100M",
      "$100M+",
    ],
  };

  const handleFilterChange = (
    filterType: keyof CustomListFilters,
    value: string,
  ) => {
    setFilters((prev) => {
      const currentValues = (prev[filterType] as string[]) || [];
      const isSelected = currentValues.includes(value);

      return {
        ...prev,
        [filterType]: isSelected
          ? currentValues.filter((v: string) => v !== value)
          : [...currentValues, value],
      };
    });

    // Update estimated count based on filters
    const totalFilters = Object.values(filters).reduce(
      (acc, values) => acc + (values?.length || 0),
      0,
    );
    // Generate stable variation based on filter combination
    const filterHash = Object.values(filters).flat().join('');
    let hash = 0;
    for (let i = 0; i < filterHash.length; i++) {
      hash = ((hash << 5) - hash) + filterHash.charCodeAt(i);
      hash = hash & hash;
    }
    const stableVariation = Math.abs(hash) % 20;
    setEstimatedCount(
      Math.max(5, 150 - totalFilters * 15 + stableVariation),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description:
        description.trim() || `Custom list based on selected criteria`,
      count: estimatedCount,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Create Custom List
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              List Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High-Growth SaaS Companies"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes this list special and why these companies are targeted..."
              rows={3}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
            />
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Filters
            </h3>

            {Object.entries(filterOptions).map(([filterType, options]) => (
              <div key={filterType}>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2 capitalize">
                  {filterType === "size" ? "Company Size" : filterType}
                </label>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => {
                    const isSelected =
                      filters[filterType as keyof CustomListFilters]?.includes(
                        option,
                      ) || false;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          handleFilterChange(
                            filterType as keyof CustomListFilters,
                            option,
                          )
                        }
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-[#2563EB] text-white"
                            : "bg-[var(--hover-bg)] text-[var(--foreground)] hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Results */}
          <div className="bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--foreground)] font-medium">
                Estimated Results:
              </span>
              <span className="text-[#2563EB] font-bold text-lg">
                {estimatedCount} companies
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">
              Based on your selected filters. Actual results may vary.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                name.trim()
                  ? "bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Create List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
