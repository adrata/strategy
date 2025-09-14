"use client";

/**
 * 🔄 BACKWARD COMPATIBILITY LAYER
 * 
 * This file now re-exports the UniversalRecordTemplate for backward compatibility.
 * The original UniversalRecordDetails functionality has been moved to UniversalRecordTemplate.
 */

import { UniversalRecordTemplate } from './UniversalRecordTemplate';

interface UniversalRecordDetailsProps {
  record: any;
  recordType: 'leads' | 'prospects' | 'opportunities' | 'accounts' | 'contacts' | 'customers' | 'partners';
  onBack: () => void;
  onComplete?: () => void;
  onSnooze?: (recordId: string, duration: string) => void;
  recordIndex?: number;
  totalRecords?: number;
}

export function UniversalRecordDetails(props: UniversalRecordDetailsProps) {
  return <UniversalRecordTemplate {...props} />;
}

// Also export the new template directly
export { UniversalRecordTemplate } from './UniversalRecordTemplate';

// The original implementation has been moved to @/platform/ui/components/UniversalRecordTemplate.tsx
// This maintains backward compatibility while allowing gradual migration
