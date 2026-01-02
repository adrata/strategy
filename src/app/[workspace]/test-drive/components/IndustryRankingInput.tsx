"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/platform/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { TrendingUp, Building2, Globe, Users, DollarSign, Sliders } from 'lucide-react';
import type { IndustryRankingFormData } from '../types';

interface IndustryRankingInputProps {
  onSubmit: (data: IndustryRankingFormData) => void;
  initialData?: IndustryRankingFormData | null;
}

const INDUSTRIES = [
  { value: 'B2B SaaS', label: 'B2B SaaS' },
  { value: 'FinTech', label: 'FinTech' },
  { value: 'HealthTech', label: 'HealthTech' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Marketing Tech', label: 'Marketing Tech' },
  { value: 'HR Tech', label: 'HR Tech' },
  { value: 'Legal Tech', label: 'Legal Tech' },
  { value: 'Computer Software', label: 'Computer Software (Generic)' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Information Technology and Services', label: 'IT Services' },
];

const LOCATIONS = [
  { value: '', label: 'Global (All Countries)' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Australia', label: 'Australia' },
];

export function IndustryRankingInput({ onSubmit, initialData }: IndustryRankingInputProps) {
  const [yourCompany, setYourCompany] = useState({
    name: initialData?.yourCompany?.name || '',
    website: initialData?.yourCompany?.website || '',
  });

  const [industry, setIndustry] = useState(initialData?.industry || 'B2B SaaS');
  const [location, setLocation] = useState(initialData?.location || '');
  const [employeeMin, setEmployeeMin] = useState(initialData?.employeeRange?.min || 50);
  const [employeeMax, setEmployeeMax] = useState(initialData?.employeeRange?.max || 1000);
  const [maxCompanies, setMaxCompanies] = useState(initialData?.maxCompanies || 50);
  const [deepAnalysisCount, setDeepAnalysisCount] = useState(initialData?.deepAnalysisCount || 20);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<{ yourCompany?: string; industry?: string }>({});

  // Cost estimation
  const estimatedCost = useMemo(() => {
    const searchCredits = 2; // ES DSL search
    const profileCredits = maxCompanies; // 1 credit per profile
    const employeeCredits = deepAnalysisCount * 2; // 2 credits per employee search
    const totalCredits = searchCredits + profileCredits + employeeCredits;

    // Estimate Claude cost
    const claudeCost = deepAnalysisCount * 0.05; // ~$0.05 per analysis

    return {
      coresignalCredits: totalCredits,
      claudeCost: claudeCost.toFixed(2),
      totalEstimate: (totalCredits * 0.02 + claudeCost).toFixed(2) // Assuming $0.02 per credit
    };
  }, [maxCompanies, deepAnalysisCount]);

  const validateAndSubmit = () => {
    const newErrors: { yourCompany?: string; industry?: string } = {};

    if (!yourCompany.name.trim()) {
      newErrors.yourCompany = 'Please provide your company name for context';
    }

    if (!industry) {
      newErrors.industry = 'Please select an industry to scan';
    }

    if (employeeMin >= employeeMax) {
      newErrors.industry = 'Minimum employees must be less than maximum';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      yourCompany: {
        name: yourCompany.name.trim() || undefined,
        website: yourCompany.website.trim() || undefined,
      },
      industry,
      employeeRange: { min: employeeMin, max: employeeMax },
      location: location || undefined,
      maxCompanies,
      deepAnalysisCount,
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">Industry PULL Ranking</h3>
            <p className="text-sm text-muted mt-1">
              Scan an entire industry and rank companies by PULL score. Find the hottest opportunities
              based on organizational tensions and champion signals.
            </p>
          </div>
        </div>
      </div>

      {/* Your Company Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Your Company
          </CardTitle>
          <p className="text-sm text-muted mt-2">
            Provide context about your product for accurate PULL scoring
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="your-company-name" className="block text-sm font-medium text-foreground mb-1">
                Company Name *
              </label>
              <input
                id="your-company-name"
                type="text"
                value={yourCompany.name}
                onChange={(e) => setYourCompany({ ...yourCompany, name: e.target.value })}
                placeholder="e.g., Adrata"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="your-company-website" className="block text-sm font-medium text-foreground mb-1">
                Website
              </label>
              <input
                id="your-company-website"
                type="url"
                value={yourCompany.website}
                onChange={(e) => setYourCompany({ ...yourCompany, website: e.target.value })}
                placeholder="e.g., https://adrata.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          {errors.yourCompany && (
            <p className="text-sm text-destructive">{errors.yourCompany}</p>
          )}
        </CardContent>
      </Card>

      {/* Industry Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Target Industry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-foreground mb-1">
              Industry *
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Employee Range
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={employeeMin}
                  onChange={(e) => setEmployeeMin(parseInt(e.target.value) || 50)}
                  min={10}
                  max={10000}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-muted mt-1">Min</p>
              </div>
              <span className="text-muted">to</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={employeeMax}
                  onChange={(e) => setEmployeeMax(parseInt(e.target.value) || 1000)}
                  min={50}
                  max={50000}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-muted mt-1">Max</p>
              </div>
            </div>
          </div>

          {errors.industry && (
            <p className="text-sm text-destructive">{errors.industry}</p>
          )}
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sliders className="w-5 h-5" />
            Scan Settings
            <span className="ml-auto text-sm text-muted">
              {showAdvanced ? '▲' : '▼'}
            </span>
          </CardTitle>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="max-companies" className="block text-sm font-medium text-foreground mb-1">
                Companies to Scan
              </label>
              <input
                id="max-companies"
                type="range"
                value={maxCompanies}
                onChange={(e) => setMaxCompanies(parseInt(e.target.value))}
                min={10}
                max={100}
                step={10}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>10</span>
                <span className="font-medium text-foreground">{maxCompanies} companies</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <label htmlFor="deep-analysis" className="block text-sm font-medium text-foreground mb-1">
                Deep Analysis Count
              </label>
              <input
                id="deep-analysis"
                type="range"
                value={deepAnalysisCount}
                onChange={(e) => setDeepAnalysisCount(parseInt(e.target.value))}
                min={5}
                max={Math.min(30, maxCompanies)}
                step={5}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>5</span>
                <span className="font-medium text-foreground">{deepAnalysisCount} companies</span>
                <span>{Math.min(30, maxCompanies)}</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Full OBP analysis (champion detection, dialogue) runs on top companies
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cost Estimation */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-foreground">Estimated Cost</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-emerald-400">{estimatedCost.coresignalCredits}</p>
            <p className="text-xs text-muted">Coresignal Credits</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-purple-400">${estimatedCost.claudeCost}</p>
            <p className="text-xs text-muted">Claude API</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">~${estimatedCost.totalEstimate}</p>
            <p className="text-xs text-muted">Total Est.</p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          onClick={validateAndSubmit}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          size="lg"
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          Scan Industry for PULL
        </Button>
        <p className="text-xs text-muted text-center mt-2">
          This will scan {maxCompanies} companies and run deep analysis on top {deepAnalysisCount}
        </p>
      </div>
    </div>
  );
}
