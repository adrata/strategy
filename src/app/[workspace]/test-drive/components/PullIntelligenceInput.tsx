"use client";

import React, { useState } from 'react';
import { Button } from '@/platform/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Zap, Building2, Target } from 'lucide-react';
import type { PullIntelligenceFormData } from '../types';

interface PullIntelligenceInputProps {
  onSubmit: (data: PullIntelligenceFormData) => void;
  initialData?: PullIntelligenceFormData | null;
}

export function PullIntelligenceInput({ onSubmit, initialData }: PullIntelligenceInputProps) {
  const [yourCompany, setYourCompany] = useState({
    name: initialData?.yourCompany?.name || '',
    website: initialData?.yourCompany?.website || '',
    linkedinUrl: initialData?.yourCompany?.linkedinUrl || '',
  });

  const [targetCompany, setTargetCompany] = useState({
    name: initialData?.targetCompany?.name || '',
    website: initialData?.targetCompany?.website || '',
    linkedinUrl: initialData?.targetCompany?.linkedinUrl || '',
  });

  const [productContext, setProductContext] = useState({
    productName: initialData?.productContext?.productName || '',
    problemStatement: initialData?.productContext?.problemStatement || '',
    targetDepartments: initialData?.productContext?.targetDepartments?.join(', ') || 'security, compliance',
  });

  const [errors, setErrors] = useState<{ yourCompany?: string; targetCompany?: string }>({});

  const validateAndSubmit = () => {
    const newErrors: { yourCompany?: string; targetCompany?: string } = {};

    // Validate your company - at least one field required
    const yourCompanyHasValue = yourCompany.name.trim() || yourCompany.website.trim() || yourCompany.linkedinUrl.trim();
    if (!yourCompanyHasValue) {
      newErrors.yourCompany = 'Please provide at least one identifier (name, website, or LinkedIn URL)';
    }

    // Validate target company - at least one field required
    const targetCompanyHasValue = targetCompany.name.trim() || targetCompany.website.trim() || targetCompany.linkedinUrl.trim();
    if (!targetCompanyHasValue) {
      newErrors.targetCompany = 'Please provide at least one identifier (name, website, or LinkedIn URL)';
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
        linkedinUrl: yourCompany.linkedinUrl.trim() || undefined,
      },
      targetCompany: {
        name: targetCompany.name.trim() || undefined,
        website: targetCompany.website.trim() || undefined,
        linkedinUrl: targetCompany.linkedinUrl.trim() || undefined,
      },
      productContext: {
        productName: productContext.productName.trim() || undefined,
        problemStatement: productContext.problemStatement.trim() || undefined,
        targetDepartments: productContext.targetDepartments.split(',').map(d => d.trim()).filter(Boolean),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-indigo-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">Organizational Behavioral Physics</h3>
            <p className="text-sm text-muted mt-1">
              Analyze structural forces within a company to predict buying behavior.
              OBP identifies champions, calculates organizational tensions, and simulates internal conversations.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Your Company
          </CardTitle>
          <p className="text-sm text-muted mt-2">
            Tell us about your product to customize the PULL analysis
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
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-foreground mb-1">
              Product Name
            </label>
            <input
              id="product-name"
              type="text"
              value={productContext.productName}
              onChange={(e) => setProductContext({ ...productContext, productName: e.target.value })}
              placeholder="e.g., Compliance Automation Platform"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="problem-statement" className="block text-sm font-medium text-foreground mb-1">
              Problem You Solve
            </label>
            <textarea
              id="problem-statement"
              value={productContext.problemStatement}
              onChange={(e) => setProductContext({ ...productContext, problemStatement: e.target.value })}
              placeholder="e.g., Manual compliance processes that drain engineering resources and delay enterprise deals"
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label htmlFor="target-departments" className="block text-sm font-medium text-foreground mb-1">
              Target Departments
            </label>
            <input
              id="target-departments"
              type="text"
              value={productContext.targetDepartments}
              onChange={(e) => setProductContext({ ...productContext, targetDepartments: e.target.value })}
              placeholder="e.g., security, compliance, engineering"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted mt-1">Comma-separated list of departments you typically sell to</p>
          </div>

          {errors.yourCompany && (
            <p className="text-sm text-destructive">{errors.yourCompany}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Target Company
          </CardTitle>
          <p className="text-sm text-muted mt-2">
            The company you want to analyze for PULL signals
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="target-company-name" className="block text-sm font-medium text-foreground mb-1">
              Company Name *
            </label>
            <input
              id="target-company-name"
              type="text"
              value={targetCompany.name}
              onChange={(e) => setTargetCompany({ ...targetCompany, name: e.target.value })}
              placeholder="e.g., Ramp, Stripe, Nike"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="target-company-website" className="block text-sm font-medium text-foreground mb-1">
                Website
              </label>
              <input
                id="target-company-website"
                type="url"
                value={targetCompany.website}
                onChange={(e) => setTargetCompany({ ...targetCompany, website: e.target.value })}
                placeholder="e.g., https://ramp.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="target-company-linkedin" className="block text-sm font-medium text-foreground mb-1">
                LinkedIn URL
              </label>
              <input
                id="target-company-linkedin"
                type="url"
                value={targetCompany.linkedinUrl}
                onChange={(e) => setTargetCompany({ ...targetCompany, linkedinUrl: e.target.value })}
                placeholder="e.g., https://linkedin.com/company/ramp"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {errors.targetCompany && (
            <p className="text-sm text-destructive">{errors.targetCompany}</p>
          )}
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button
          onClick={validateAndSubmit}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          size="lg"
        >
          <Zap className="w-5 h-5 mr-2" />
          Analyze PULL Signals
        </Button>
      </div>
    </div>
  );
}
