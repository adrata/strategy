"use client";

import React, { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { apiFetch } from "@/platform/api-fetch";
import { 
  DocumentTextIcon,
  FolderIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export function StatsView() {
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  
  const workspaceId = ui.activeWorkspace?.id || authUser?.activeWorkspaceId;
  
  const [stats, setStats] = useState<{
    totalDocuments: number;
    totalFolders: number;
    myDocuments: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!workspaceId || !authUser?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch total documents count
        const docsData = await apiFetch<{
          documents?: any[];
          pagination?: { total: number };
        }>(`/api/v1/documents/documents?workspaceId=${workspaceId}&limit=1&status=active`, {}, {
          documents: [],
          pagination: { total: 0 }
        });
        const totalDocuments = docsData?.pagination?.total || 0;
        
        // Fetch my documents count
        const myDocsData = await apiFetch<{
          documents?: any[];
          pagination?: { total: number };
        }>(`/api/v1/documents/documents?workspaceId=${workspaceId}&ownerId=${authUser.id}&limit=1&status=active`, {}, {
          documents: [],
          pagination: { total: 0 }
        });
        const myDocuments = myDocsData?.pagination?.total || 0;
        
        // Fetch folders count
        const foldersData = await apiFetch<any[]>(`/api/v1/documents/folders?workspaceId=${workspaceId}`, {}, []);
        const totalFolders = Array.isArray(foldersData) ? foldersData.length : 0;
        
        setStats({
          totalDocuments,
          totalFolders,
          myDocuments
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats({
          totalDocuments: 0,
          totalFolders: 0,
          myDocuments: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [workspaceId, authUser?.id]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-[var(--loading-bg)] rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-[var(--loading-bg)] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Documents',
      value: stats?.totalDocuments ?? 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'My Documents',
      value: stats?.myDocuments ?? 0,
      icon: UserIcon,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Folders',
      value: stats?.totalFolders ?? 0,
      icon: FolderIcon,
      color: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-[var(--muted)] font-medium">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

