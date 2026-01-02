"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/platform/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { BarChart3, Building2, Plus, X, Zap, Clock, DollarSign, CheckCircle } from 'lucide-react';
import type { IndustryComparisonFormData, ComparisonTier } from '../types';

interface IndustryComparisonInputProps {
  onSubmit: (data: IndustryComparisonFormData) => void;
  initialData?: IndustryComparisonFormData | null;
}

const AVAILABLE_INDUSTRIES = [
  'B2B SaaS',
  'FinTech',
  'HealthTech',
  'Cybersecurity',
  'E-commerce',
  'Marketing Tech',
  'HR Tech',
  'Legal Tech',
];

const TIER_CONFIG: Record<ComparisonTier, {
  name: string;
  description: string;
  companiesPerIndustry: number;
  deepAnalysis: number;
  time: string;
  creditsPerIndustry: number;
}> = {
  pulse: {
    name: 'Quick Pulse',
    description: 'Fast directional signal - sample companies to get a sense',
    companiesPerIndustry: 10,
    deepAnalysis: 0,
    time: '2-5 min',
    creditsPerIndustry: 12
  },
  scan: {
    name: 'Industry Scan',
    description: 'Solid comparison with real PULL data and top company analysis',
    companiesPerIndustry: 50,
    deepAnalysis: 10,
    time: '10-15 min',
    creditsPerIndustry: 75
  },
  deep: {
    name: 'Deep Market Study',
    description: 'Comprehensive analysis - full PULL mapping and champion detection',
    companiesPerIndustry: 100,
    deepAnalysis: 25,
    time: '30-60 min',
    creditsPerIndustry: 175
  }
};

export function IndustryComparisonInput({ onSubmit, initialData }: IndustryComparisonInputProps) {
  const [yourCompany, setYourCompany] = useState({
    name: initialData?.yourCompany?.name || '',
    website: initialData?.yourCompany?.website || '',
  });

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    initialData?.industries || ['B2B SaaS', 'FinTech']
  );
  const [tier, setTier] = useState<ComparisonTier>(initialData?.tier || 'scan');
  const [errors, setErrors] = useState<{ yourCompany?: string; industries?: string }>({});

  const tierConfig = TIER_CONFIG[tier];

  const costEstimate = useMemo(() => {
    const totalCredits = tierConfig.creditsPerIndustry * selectedIndustries.length;
    return {
      credits: totalCredits,
      cost: (totalCredits * 0.02).toFixed(2)
    };
  }, [tier, selectedIndustries.length, tierConfig.creditsPerIndustry]);

  const addIndustry = (industry: string) => {
    if (!selectedIndustries.includes(industry) && selectedIndustries.length < 5) {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const removeIndustry = (industry: string) => {
    setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
  };

  const validateAndSubmit = () => {
    const newErrors: { yourCompany?: string; industries?: string } = {};

    if (!yourCompany.name.trim()) {
      newErrors.yourCompany = 'Please provide your company name for context';
    }

    if (selectedIndustries.length < 2) {
      newErrors.industries = 'Select at least 2 industries to compare';
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
      industries: selectedIndustries,
      tier,
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">Find Your Best Industry</h3>
            <p className="text-sm text-muted mt-1">
              Compare industries using real data to find where the most companies have PULL.
              Uses 7 scoring dimensions: PULL concentration, market size, growth rate, competition, deal velocity, accessibility, and regulatory pressure.
            </p>
          </div>
        </div>
      </div>

      {/* Your Company */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Your Company
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-foreground mb-1">
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                value={yourCompany.name}
                onChange={(e) => setYourCompany({ ...yourCompany, name: e.target.value })}
                placeholder="e.g., Adrata"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label htmlFor="company-website" className="block text-sm font-medium text-foreground mb-1">
                Website
              </label>
              <input
                id="company-website"
                type="url"
                value={yourCompany.website}
                onChange={(e) => setYourCompany({ ...yourCompany, website: e.target.value })}
                placeholder="e.g., https://adrata.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            <BarChart3 className="w-5 h-5" />
            Industries to Compare
          </CardTitle>
          <p className="text-sm text-muted mt-2">
            Select 2-5 industries you're considering targeting
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Industries */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedIndustries.map((industry) => (
              <span
                key={industry}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium"
              >
                {industry}
                <button
                  onClick={() => removeIndustry(industry)}
                  className="hover:bg-amber-500/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedIndustries.length === 0 && (
              <span className="text-sm text-muted">No industries selected</span>
            )}
          </div>

          {/* Available Industries */}
          <div>
            <p className="text-xs text-muted mb-2">Click to add:</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INDUSTRIES.filter(i => !selectedIndustries.includes(i)).map((industry) => (
                <button
                  key={industry}
                  onClick={() => addIndustry(industry)}
                  disabled={selectedIndustries.length >= 5}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  {industry}
                </button>
              ))}
            </div>
          </div>

          {errors.industries && (
            <p className="text-sm text-destructive">{errors.industries}</p>
          )}
        </CardContent>
      </Card>

      {/* Tier Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Analysis Depth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(TIER_CONFIG) as [ComparisonTier, typeof TIER_CONFIG['pulse']][]).map(([tierKey, config]) => (
              <button
                key={tierKey}
                onClick={() => setTier(tierKey)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  tier === tierKey
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-border hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${tier === tierKey ? 'text-amber-400' : 'text-foreground'}`}>
                    {config.name}
                  </span>
                  {tier === tierKey && <CheckCircle className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-xs text-muted mb-3">{config.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Companies/industry:</span>
                    <span className="text-foreground">{config.companiesPerIndustry}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Deep analysis:</span>
                    <span className="text-foreground">{config.deepAnalysis || 'Pre-screen only'}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Est. time:</span>
                    <span className="text-foreground">{config.time}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Estimation */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-foreground">Estimated Cost</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-amber-400">{selectedIndustries.length}</p>
            <p className="text-xs text-muted">Industries</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-400">{costEstimate.credits}</p>
            <p className="text-xs text-muted">Coresignal Credits</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">~${costEstimate.cost}</p>
            <p className="text-xs text-muted">Total Est.</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <Clock className="w-3 h-3" />
          <span>Estimated time: {tierConfig.time}</span>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          onClick={validateAndSubmit}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          size="lg"
          disabled={selectedIndustries.length < 2}
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Compare {selectedIndustries.length} Industries
        </Button>
        <p className="text-xs text-muted text-center mt-2">
          Will scan {tierConfig.companiesPerIndustry * selectedIndustries.length} total companies across all industries
        </p>
      </div>
    </div>
  );
}
