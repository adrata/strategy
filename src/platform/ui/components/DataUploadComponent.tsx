"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/platform/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";
import { Alert, AlertDescription } from "@/platform/shared/components/ui/alert";
import { Upload, FileText, Check, AlertCircle, Loader2, Settings } from "lucide-react";
import { safeApiFetch } from "@/platform/api-fetch";
import { NaturalLanguageParser } from "@/platform/services/natural-language-parser";
import { AIIntentParser, type AIProcessingIntent } from "@/platform/services/ai-intent-parser";

interface ImportResult {
  success: boolean;
  totalRecords: number;
  importedRecords: number;
  errors: string[];
  skippedRecords: number;
}

interface DataUploadComponentProps {
  onImportComplete?: (result: ImportResult) => void;
}

export function DataUploadComponent({
  onImportComplete,
}: DataUploadComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>("");
  const [importType, setImportType] = useState<"contacts" | "leads">(
    "contacts",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // New state for smart processing
  const [userIntent, setUserIntent] = useState<string>("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [processingLimit, setProcessingLimit] = useState<number | undefined>(undefined);
  const [prioritizationMethod, setPrioritizationMethod] = useState<string>("first");
  const [parsedRequest, setParsedRequest] = useState<any>(null);
  const [aiIntent, setAiIntent] = useState<AIProcessingIntent | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isParsingIntent, setIsParsingIntent] = useState(false);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // Read file content
    const reader = new FileReader();
    reader['onload'] = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
    };
    reader.readAsText(selectedFile);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Handle CSV text area change
  const handleCsvTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvData(e.target.value);
    setFile(null);
    setError(null);
    setResult(null);
  };

  // Handle user intent change and parse with AI
  const handleUserIntentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const intent = e.target.value;
    setUserIntent(intent);
    
    if (intent.trim() && csvData.trim()) {
      setIsParsingIntent(true);
      
      try {
        // Parse CSV to get context for AI
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
        
        // Get CSV context for AI
        const csvContext = AIIntentParser.analyzeCSVContent(headers, dataRows);
        
        // Use AI to parse intent
        const aiParser = new AIIntentParser();
        const aiParsed = await aiParser.parseIntent(intent, csvContext);
        
        setAiIntent(aiParsed);
        
        // Auto-populate fields based on AI intent
        if (aiParsed.limit) {
          setProcessingLimit(aiParsed.limit);
        }
        
        if (aiParsed.prioritization.method) {
          setPrioritizationMethod(aiParsed.prioritization.method);
        }
        
        // Show confirmation if confidence is high
        if (aiParsed.confidence > 0.8) {
          setShowConfirmation(true);
        }
        
        // Fallback to rule-based parsing for display
        const ruleBased = NaturalLanguageParser.parseRequest(intent);
        setParsedRequest(ruleBased);
        
      } catch (error) {
        console.error('AI parsing failed, using fallback:', error);
        
        // Fallback to rule-based parsing
        const parsed = NaturalLanguageParser.parseRequest(intent);
        setParsedRequest(parsed);
        
        if (parsed.limit) {
          setProcessingLimit(parsed.limit);
        }
        
        if (parsed.prioritization) {
          setPrioritizationMethod(parsed.prioritization);
        }
      } finally {
        setIsParsingIntent(false);
      }
    } else {
      setParsedRequest(null);
      setAiIntent(null);
      setShowConfirmation(false);
      setProcessingLimit(undefined);
      setPrioritizationMethod("first");
    }
  };

  // Submit import
  const handleImport = async () => {
    if (!csvData.trim()) {
      setError("Please provide CSV data");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Check if we're in desktop mode where APIs might not be available
      const isDesktop =
        window.location.href.includes("localhost") &&
        (window.navigator.userAgent.includes("Adrata Desktop") ||
          window.location.pathname.includes("grand-central"));

      if (isDesktop) {
        // Simulate successful import in desktop mode
        const lines = csvData.trim().split("\n");
        const totalRecords = Math.max(0, lines.length - 1); // Subtract header

        setResult({
          success: true,
          totalRecords,
          importedRecords: totalRecords,
          errors: [],
          skippedRecords: 0,
        });

        onImportComplete?.({
          success: true,
          totalRecords,
          importedRecords: totalRecords,
          errors: [],
          skippedRecords: 0,
        });

        return;
      }

      const response = await safeApiFetch(
        "/api/data-import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            csvData,
            importType,
            userIntent,
            processingLimit,
            prioritizationMethod,
            parsedRequest,
            aiIntent,
          }),
        },
        {
          success: false,
          message: "Upload failed",
          totalRecords: 0,
          importedRecords: 0,
          errors: [],
          skippedRecords: 0,
        },
      );

      if (response.success) {
        setResult(response);
        onImportComplete?.(response);
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Reset component
  const handleReset = () => {
    setFile(null);
    setCsvData("");
    setResult(null);
    setError(null);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Your Data
        </CardTitle>
        <CardDescription>
          Upload a CSV file with your contact data to import into your workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Smart Processing Intent */}
        <div>
          <label className="block text-sm font-medium mb-2">
            What would you like to do? (Natural Language)
          </label>
          <input
            type="text"
            value={userIntent}
            onChange={handleUserIntentChange}
            placeholder="e.g., 'Find CFOs at the first 10 companies' or 'Get executives from largest companies, limit to 20'"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isParsingIntent && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
              <div className="flex items-center text-sm text-yellow-800 dark:text-yellow-200">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                AI is analyzing your request...
              </div>
            </div>
          )}
          
          {aiIntent && (
            <div className="mt-2 p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
              <div className="text-sm">
                <div className="flex items-center mb-2">
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-medium text-green-800 dark:text-green-200">AI Understanding:</span>
                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                    {Math.round(aiIntent.confidence * 100)}% confident
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-300 mb-3">
                  {aiIntent.suggestedConfirmation}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {aiIntent['limit'] && (
                    <div>
                      <span className="font-medium">Limit:</span> {aiIntent.limit} companies
                    </div>
                  )}
                  {aiIntent['roles'] && aiIntent.roles.length > 0 && (
                    <div>
                      <span className="font-medium">Roles:</span> {aiIntent.roles.join(', ')}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Method:</span> {aiIntent.prioritization.method}
                  </div>
                  <div>
                    <span className="font-medium">Action:</span> {aiIntent.action}
                  </div>
                </div>
                {aiIntent['prioritization']['reasoning'] && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 italic">
                    Reasoning: {aiIntent.prioritization.reasoning}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {parsedRequest && !aiIntent && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <div className="text-sm">
                <span className="font-medium">Rule-based Understanding:</span>
                {parsedRequest['limit'] && <span className="ml-2 text-blue-600">Limit: {parsedRequest.limit}</span>}
                {parsedRequest['roles'] && parsedRequest.roles.length > 0 && (
                  <span className="ml-2 text-green-600">Roles: {parsedRequest.roles.join(', ')}</span>
                )}
                {parsedRequest['prioritization'] && (
                  <span className="ml-2 text-purple-600">Method: {parsedRequest.prioritization}</span>
                )}
                <span className="ml-2 text-muted">Confidence: {Math.round(parsedRequest.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="space-y-4 p-4 bg-panel-background dark:bg-foreground rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Processing Limit</label>
                <input
                  type="number"
                  value={processingLimit || ''}
                  onChange={(e) => setProcessingLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g., 10"
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-muted mt-1">Maximum number of companies to process</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Prioritization Method</label>
                <select
                  value={prioritizationMethod}
                  onChange={(e) => setPrioritizationMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="first">First (as listed)</option>
                  <option value="largest">Largest companies</option>
                  <option value="smallest">Smallest companies</option>
                  <option value="random">Random sampling</option>
                  <option value="revenue">By revenue (desc)</option>
                  <option value="employees">By employee count (desc)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Import Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Import as:</label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="contacts"
                checked={importType === "contacts"}
                onChange={(e) => setImportType(e.target.value as "contacts")}
                className="text-blue-600"
              />
              <span>Contacts</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="leads"
                checked={importType === "leads"}
                onChange={(e) => setImportType(e.target.value as "leads")}
                className="text-blue-600"
              />
              <span>Leads</span>
            </label>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-border dark:border-border hover:border-gray-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileText className="mx-auto h-12 w-12 text-muted mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {file ? file.name : "Drop your CSV file here"}
            </p>
            <p className="text-sm text-muted">
              or{" "}
              <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                browse to upload
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="sr-only"
                />
              </label>
            </p>
          </div>
        </div>

        {/* CSV Data Preview/Edit */}
        {csvData && (
          <div>
            <label className="block text-sm font-medium mb-2">
              CSV Data Preview (editable)
            </label>
            <textarea
              value={csvData}
              onChange={handleCsvTextChange}
              className="w-full h-40 p-3 border border-border rounded-lg font-mono text-sm"
              placeholder="Paste your CSV data here..."
            />
            <p className="text-xs text-muted mt-1">
              Expected columns: company, name, Title, role, Person Linkedin Url,
              Email, Mobile Phone, etc.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>Import completed successfully!</p>
                <p className="text-sm">
                  • {result.importedRecords} records imported •{" "}
                  {result.skippedRecords} records skipped •{" "}
                  {result.errors.length} errors
                </p>
                {result.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      View errors ({result.errors.length})
                    </summary>
                    <ul className="mt-1 text-xs space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-red-600">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={!csvData.trim() || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Data
              </>
            )}
          </Button>

          {(file || csvData) && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>

        {/* Format Help */}
        <div className="bg-panel-background dark:bg-foreground rounded-lg p-4">
          <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
          <ul className="text-sm space-y-1 text-muted dark:text-muted">
            <li>• First row should contain column headers</li>
            <li>
              • Required: name and at least one contact method (email/phone)
            </li>
            <li>
              • Supported columns: company, name, Title, role, Email, Mobile
              Phone, etc.
            </li>
            <li>• Duplicate emails will be skipped automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
