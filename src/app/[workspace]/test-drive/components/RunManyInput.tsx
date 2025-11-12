"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/platform/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/platform/shared/components/ui/tabs';
import type { RunManyFormData, CompanyInput, RunManyCompanyInput } from '../types';

interface RunManyInputProps {
  onSubmit: (data: RunManyFormData) => void;
  initialData?: RunManyFormData | null;
}

export function RunManyInput({ onSubmit, initialData }: RunManyInputProps) {
  const [yourCompany, setYourCompany] = useState<CompanyInput>({
    name: initialData?.yourCompany?.name || '',
    website: initialData?.yourCompany?.website || '',
    linkedinUrl: initialData?.yourCompany?.linkedinUrl || '',
  });

  const [targetCompanies, setTargetCompanies] = useState<RunManyCompanyInput[]>(
    initialData?.targetCompanies || []
  );

  const [pasteText, setPasteText] = useState('');
  const [activeTab, setActiveTab] = useState<'excel' | 'paste'>('excel');
  const [errors, setErrors] = useState<{ yourCompany?: string; targetCompanies?: string }>({});
  const [parsingError, setParsingError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectColumnIndex = (headers: string[], patterns: string[]): number | null => {
    for (const pattern of patterns) {
      const index = headers.findIndex(h => 
        h.toLowerCase().includes(pattern.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return null;
  };

  const parseExcelFile = async (file: File) => {
    try {
      const { UniversalDocumentParser } = await import('@/platform/services/universal-document-parser');
      const parsedData = await UniversalDocumentParser.parseExcelData(file);
      
      if (!parsedData.tables || parsedData.tables.length === 0) {
        throw new Error('No data found in Excel file');
      }

      const data = parsedData.tables[0];
      if (data.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      const headers = (data[0] as string[]).map(h => String(h || '').trim());
      const rows = data.slice(1) as any[][];

      // Auto-detect columns
      const nameIndex = detectColumnIndex(headers, ['company', 'name', 'organization']);
      const websiteIndex = detectColumnIndex(headers, ['website', 'url', 'web']);
      const linkedinIndex = detectColumnIndex(headers, ['linkedin', 'linkedinurl', 'linkedin_url']);

      const parsedCompanies: RunManyCompanyInput[] = [];

      for (const row of rows) {
        const name = nameIndex !== null ? String(row[nameIndex] || '').trim() : '';
        const website = websiteIndex !== null ? String(row[websiteIndex] || '').trim() : '';
        const linkedin = linkedinIndex !== null ? String(row[linkedinIndex] || '').trim() : '';

        // If no specific columns found, try first column as name
        if (!name && !website && !linkedin && row.length > 0) {
          const firstCell = String(row[0] || '').trim();
          if (firstCell) {
            // Check if it looks like a URL
            if (firstCell.startsWith('http')) {
              if (firstCell.includes('linkedin.com')) {
                parsedCompanies.push({ linkedinUrl: firstCell });
              } else {
                parsedCompanies.push({ website: firstCell });
              }
            } else {
              parsedCompanies.push({ name: firstCell });
            }
          }
        } else if (name || website || linkedin) {
          parsedCompanies.push({
            name: name || undefined,
            website: website || undefined,
            linkedinUrl: linkedin || undefined,
          });
        }
      }

      if (parsedCompanies.length === 0) {
        throw new Error('No companies found in Excel file. Please check the format.');
      }

      setTargetCompanies(parsedCompanies);
      setParsingError(null);
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : 'Failed to parse Excel file');
      setTargetCompanies([]);
    }
  };

  const parsePasteText = () => {
    try {
      const lines = pasteText.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length === 0) {
        throw new Error('Please paste at least one company');
      }

      const parsedCompanies: RunManyCompanyInput[] = [];

      for (const line of lines) {
        // Check if it's CSV format
        if (line.includes(',')) {
          const parts = line.split(',').map(p => p.trim()).filter(p => p);
          const company: RunManyCompanyInput = {};
          
          for (const part of parts) {
            if (part.startsWith('http')) {
              if (part.includes('linkedin.com')) {
                company.linkedinUrl = part;
              } else {
                company.website = part;
              }
            } else if (!company.name) {
              company.name = part;
            }
          }
          
          if (company.name || company.website || company.linkedinUrl) {
            parsedCompanies.push(company);
          }
        } else {
          // Single value per line
          if (line.startsWith('http')) {
            if (line.includes('linkedin.com')) {
              parsedCompanies.push({ linkedinUrl: line });
            } else {
              parsedCompanies.push({ website: line });
            }
          } else {
            parsedCompanies.push({ name: line });
          }
        }
      }

      if (parsedCompanies.length === 0) {
        throw new Error('No valid companies found in pasted text');
      }

      setTargetCompanies(parsedCompanies);
      setParsingError(null);
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : 'Failed to parse pasted text');
      setTargetCompanies([]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await parseExcelFile(file);
    }
  };

  const validateAndSubmit = () => {
    const newErrors: { yourCompany?: string; targetCompanies?: string } = {};

    // Validate your company
    const yourCompanyHasValue = yourCompany.name?.trim() || yourCompany.website?.trim() || yourCompany.linkedinUrl?.trim();
    if (!yourCompanyHasValue) {
      newErrors.yourCompany = 'Please provide at least one identifier for your company';
    }

    // Validate target companies
    if (targetCompanies.length === 0) {
      newErrors.targetCompanies = 'Please provide at least one target company';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      yourCompany: {
        name: yourCompany.name?.trim() || undefined,
        website: yourCompany.website?.trim() || undefined,
        linkedinUrl: yourCompany.linkedinUrl?.trim() || undefined,
      },
      targetCompanies: targetCompanies.map((company, index) => ({
        ...company,
        id: company.id || `company-${index}`,
      })),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <p className="text-sm text-muted mt-2">
          Enter your company information and the target companies you're going after
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
              <label htmlFor="run-many-your-company-name" className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <input
                id="run-many-your-company-name"
                type="text"
                value={yourCompany.name || ''}
                onChange={(e) => setYourCompany({ ...yourCompany, name: e.target.value })}
                placeholder="e.g., Adrata"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="run-many-your-company-website" className="block text-sm font-medium text-foreground mb-1">
                Website
              </label>
              <input
                id="run-many-your-company-website"
                type="url"
                value={yourCompany.website || ''}
                onChange={(e) => setYourCompany({ ...yourCompany, website: e.target.value })}
                placeholder="e.g., https://adrata.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="run-many-your-company-linkedin" className="block text-sm font-medium text-foreground mb-1">
                LinkedIn URL
              </label>
              <input
                id="run-many-your-company-linkedin"
                type="url"
                value={yourCompany.linkedinUrl || ''}
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

        {/* Target Companies */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Target Companies</h3>
            <p className="text-sm text-muted">The companies you want to discover buyer groups for</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'excel' | 'paste')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="excel">Upload Excel</TabsTrigger>
              <TabsTrigger value="paste">Paste List</TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Choose Excel File
                </Button>
                <p className="text-xs text-muted mt-2">
                  Supports .xlsx and .xls files. Auto-detects columns for company name, website, and LinkedIn URL.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <div>
                <label htmlFor="paste-companies" className="block text-sm font-medium text-foreground mb-1">
                  Paste Company List
                </label>
                <textarea
                  id="paste-companies"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="One company per line, or CSV format:&#10;Salesforce&#10;Microsoft&#10;https://linkedin.com/company/apple"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={parsePasteText}
                  className="mt-2"
                  disabled={!pasteText.trim()}
                >
                  Parse Companies
                </Button>
                <p className="text-xs text-muted mt-2">
                  Paste one company per line (name, website, or LinkedIn URL). CSV format also supported.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {parsingError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{parsingError}</p>
            </div>
          )}

          {targetCompanies.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm font-medium text-foreground mb-2">
                Found {targetCompanies.length} {targetCompanies.length === 1 ? 'company' : 'companies'}
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {targetCompanies.slice(0, 10).map((company, index) => (
                  <div key={index} className="text-xs text-muted">
                    {company.name || company.website || company.linkedinUrl || `Company ${index + 1}`}
                  </div>
                ))}
                {targetCompanies.length > 10 && (
                  <div className="text-xs text-muted">... and {targetCompanies.length - 10} more</div>
                )}
              </div>
            </div>
          )}

          {errors.targetCompanies && (
            <p className="text-sm text-destructive">{errors.targetCompanies}</p>
          )}
        </div>

        <div className="pt-4">
          <Button
            onClick={validateAndSubmit}
            className="w-full"
            size="lg"
            disabled={targetCompanies.length === 0}
          >
            Start Batch Buyer Group Discovery
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

