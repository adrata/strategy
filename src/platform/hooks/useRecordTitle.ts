"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth-unified';
// Removed authFetch import - using standard fetch

interface RecordTitleData {
  name?: string;
  fullName?: string;
  title?: string;
  company?: string;
}

export function useRecordTitle() {
  const [recordData, setRecordData] = useState<RecordTitleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const { user } = useUnifiedAuth();

  useEffect(() => {
    const fetchRecordTitle = async () => {
      // Extract record ID from pathname
      const pathParts = pathname.split('/');
      const section = pathParts[pathParts.length - 2];
      const slug = pathParts[pathParts.length - 1];

      console.log('🔍 [RECORD TITLE] Pathname:', pathname);
      console.log('🔍 [RECORD TITLE] Section:', section);
      console.log('🔍 [RECORD TITLE] Slug:', slug);

      // Import the extractIdFromSlug function
      const { extractIdFromSlug } = await import('@/platform/utils/url-utils');
      const recordId = extractIdFromSlug(slug);
      
      console.log('🔍 [RECORD TITLE] Extracted Record ID:', recordId);

      // Check if this is a record detail page
      const isRecordPage = ['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners', 'sellers'].includes(section);
      
      if (!isRecordPage || !recordId || !user?.activeWorkspaceId) {
        console.log('🔍 [RECORD TITLE] Not a record page or missing data:', { isRecordPage, recordId, workspaceId: user?.activeWorkspaceId });
        setRecordData(null);
        return;
      }

      setIsLoading(true);
      
      try {
        // Try to get record data from sessionStorage first (fastest)
        // Check multiple possible cache keys that the app might use
        const possibleCacheKeys = [
          `cached-${section}-${recordId}`,
          `current-record-${section}`,
          `cached-prospects-${recordId}`,
          `cached-${section}-${recordId.split('-').slice(0, -1).join('-')}` // Try without the ID suffix
        ];
        
        let cachedRecord = null;
        for (const key of possibleCacheKeys) {
          const cached = sessionStorage.getItem(key);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              // Check if this record matches our recordId
              if (parsed.id === recordId || parsed.data?.id === recordId || parsed.name?.toLowerCase().includes(recordId.split('-')[0])) {
                cachedRecord = parsed.data || parsed;
                console.log('🔍 [RECORD TITLE] Found cached record with key:', key, { name: cachedRecord.name, fullName: cachedRecord.fullName });
                break;
              }
            } catch (e) {
              // Continue to next key
            }
          }
        }
        
        if (cachedRecord) {
          setRecordData({
            name: cachedRecord.name,
            fullName: cachedRecord.fullName,
            title: cachedRecord.title,
            company: cachedRecord.company
          });
          setIsLoading(false);
          return;
        }

        // Try to get from current-record cache (the format the main app uses)
        const currentRecordKey = `current-record-${section}`;
        const currentRecord = sessionStorage.getItem(currentRecordKey);
        if (currentRecord) {
          try {
            const parsed = JSON.parse(currentRecord);
            if (parsed.data && (parsed.data.id === recordId || parsed.data.name?.toLowerCase().includes(recordId.split('-')[0]))) {
              console.log('🔍 [RECORD TITLE] Found current-record:', { name: parsed.data.name, fullName: parsed.data.fullName });
              setRecordData({
                name: parsed.data.name,
                fullName: parsed.data.fullName,
                title: parsed.data.title,
                company: parsed.data.company
              });
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.log('🔍 [RECORD TITLE] Failed to parse current-record:', e);
          }
        }

        // Try to find any record in sessionStorage that matches the name pattern
        const allSessionKeys = Object.keys(sessionStorage);
        for (const key of allSessionKeys) {
          if (key.includes(section) || key.includes('cached') || key.includes('current')) {
            try {
              const cached = sessionStorage.getItem(key);
              if (cached) {
                const parsed = JSON.parse(cached);
                const record = parsed.data || parsed;
                if (record && record.name && record.name.toLowerCase().includes(recordId.split('-')[0])) {
                  console.log('🔍 [RECORD TITLE] Found matching record in sessionStorage:', { key, name: record.name, fullName: record.fullName });
                  setRecordData({
                    name: record.name,
                    fullName: record.fullName,
                    title: record.title,
                    company: record.company
                  });
                  setIsLoading(false);
                  return;
                }
              }
            } catch (e) {
              // Continue to next key
            }
          }
        }

        // Fallback: try to extract name from URL slug as last resort
        if (slug && slug !== recordId) {
          // Try to extract a human-readable name from the slug
          const nameFromSlug = slug.split('-').slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase());
          if (nameFromSlug && nameFromSlug.length > 1) {
            console.log('🔍 [RECORD TITLE] Using name from slug:', nameFromSlug);
            setRecordData({
              name: nameFromSlug,
              fullName: nameFromSlug,
              title: '',
              company: ''
            });
            setIsLoading(false);
            return;
          }
        }

        // Fallback: fetch from v1 API
        console.log('🔍 [RECORD TITLE] Fetching from v1 API...');
        let response;
        if (section === 'companies') {
          response = await fetch(`/api/v1/companies/${recordId}`);
        } else if (section === 'people') {
          response = await fetch(`/api/v1/people/${recordId}`);
        } else if (section === 'actions') {
          response = await fetch(`/api/v1/actions/${recordId}`);
        } else if (section === 'speedrun') {
          // Speedrun records are people records, so use people API
          response = await fetch(`/api/v1/people/${recordId}`);
        } else {
          console.warn(`⚠️ [RECORD TITLE] No v1 API available for section: ${section}`);
          return null;
        }
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // v1 API returns a single record, not an array
            const record = result.data;
            if (record) {
              console.log('🔍 [RECORD TITLE] Found record from API:', { name: record.name, fullName: record.fullName });
              setRecordData({
                name: record.name,
                fullName: record.fullName,
                title: record.title,
                company: record.company
              });
            } else {
              console.log('🔍 [RECORD TITLE] Record not found in API response');
            }
          }
        } else {
          console.log('🔍 [RECORD TITLE] API request failed:', response.status);
        }
      } catch (error) {
        console.warn('Failed to fetch record title data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordTitle();
  }, [pathname, user?.activeWorkspaceId]);

  return { recordData, isLoading };
}
