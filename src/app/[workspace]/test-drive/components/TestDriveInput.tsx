"use client";

import React, { useState } from 'react';
import { Button } from '@/platform/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import type { TestDriveFormData } from '../types';

interface TestDriveInputProps {
  onSubmit: (data: TestDriveFormData) => void;
  initialData?: TestDriveFormData | null;
}

export function TestDriveInput({ onSubmit, initialData }: TestDriveInputProps) {
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
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <p className="text-sm text-muted mt-2">
          Enter information about your company and the target company you're going after
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Your Company */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Your Company</h3>
            <p className="text-sm text-muted">The company you represent (used for buyer group analysis)</p>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="your-company-name" className="block text-sm font-medium text-foreground mb-1">
                Company Name
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
            <div>
              <label htmlFor="your-company-linkedin" className="block text-sm font-medium text-foreground mb-1">
                LinkedIn URL
              </label>
              <input
                id="your-company-linkedin"
                type="url"
                value={yourCompany.linkedinUrl}
                onChange={(e) => setYourCompany({ ...yourCompany, linkedinUrl: e.target.value })}
                placeholder="e.g., https://linkedin.com/company/adrata"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {errors.yourCompany && (
              <p className="text-sm text-destructive">{errors.yourCompany}</p>
            )}
          </div>
        </div>

        {/* Target Company */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Target Company</h3>
            <p className="text-sm text-muted">The company you want to discover the buyer group for</p>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="target-company-name" className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <input
                id="target-company-name"
                type="text"
                value={targetCompany.name}
                onChange={(e) => setTargetCompany({ ...targetCompany, name: e.target.value })}
                placeholder="e.g., Salesforce"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="target-company-website" className="block text-sm font-medium text-foreground mb-1">
                Website
              </label>
              <input
                id="target-company-website"
                type="url"
                value={targetCompany.website}
                onChange={(e) => setTargetCompany({ ...targetCompany, website: e.target.value })}
                placeholder="e.g., https://salesforce.com"
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
                placeholder="e.g., https://linkedin.com/company/salesforce"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {errors.targetCompany && (
              <p className="text-sm text-destructive">{errors.targetCompany}</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={validateAndSubmit}
            className="w-full"
            size="lg"
          >
            Start Buyer Group Discovery
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

