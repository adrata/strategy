"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";
import { Button } from "@/platform/shared/components/ui/button";
import {
  History,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { safeApiFetch } from "@/platform/safe-api-fetch";

interface ImportLog {
  id: string;
  timestamp: string;
  action: string;
  details: {
    importType: string;
    totalRecords: number;
    importedRecords: number;
    skippedRecords: number;
    errorCount: number;
  };
  user: {
    name: string;
    email: string;
  };
}

export function ImportHistory() {
  const [imports, setImports] = useState<ImportLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if we're in desktop mode where APIs might not be available
      const isDesktop =
        window.location.href.includes("localhost") &&
        (window.navigator.userAgent.includes("Adrata Desktop") ||
          window.location.pathname.includes("grand-central"));

      if (isDesktop) {
        // Simulate import history in desktop mode
        const mockImports = [
          {
            id: "1",
            timestamp: new Date().toISOString(),
            action: "data.imported",
            details: {
              importType: "contacts",
              totalRecords: 10,
              importedRecords: 8,
              skippedRecords: 2,
              errorCount: 0,
            },
            user: {
              name: "Dan User",
              email: "dan@adrata.com",
            },
          },
        ];
        setImports(mockImports);
        return;
      }

      const response = await safeApiFetch(
        "/api/data-import?limit=10",
        {},
        {
          success: false,
          imports: [],
          total: 0,
        },
      );

      if (response.success) {
        setImports(response.imports || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch imports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (importLog: ImportLog) => {
    const { details } = importLog;

    if (details['errorCount'] === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Success
        </span>
      );
    } else if (details.importedRecords > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Partial
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Failed
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading import history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchImports}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Import History
        </CardTitle>
        <CardDescription>Recent data imports to your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {imports['length'] === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data imports yet</p>
            <p className="text-sm">Your import history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {imports.map((importLog) => (
              <div
                key={importLog.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {importLog['details']['importType'] === "contacts" ? (
                          <Users className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-medium capitalize">
                          {importLog.details.importType} Import
                        </span>
                      </div>
                      {getStatusBadge(importLog)}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <strong>{importLog.details.importedRecords}</strong> of{" "}
                        <strong>{importLog.details.totalRecords}</strong>{" "}
                        records imported
                        {importLog.details.skippedRecords > 0 && (
                          <span className="text-yellow-600">
                            {" "}
                            • {importLog.details.skippedRecords} skipped
                          </span>
                        )}
                        {importLog.details.errorCount > 0 && (
                          <span className="text-red-600">
                            {" "}
                            • {importLog.details.errorCount} errors
                          </span>
                        )}
                      </p>
                      <p>
                        Imported by {importLog.user.name} •{" "}
                        {formatDate(importLog.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {importLog['details']['errorCount'] === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : importLog.details.importedRecords > 0 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {imports.length >= 10 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
