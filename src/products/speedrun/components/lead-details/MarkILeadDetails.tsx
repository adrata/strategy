"use client";

/**
 * 🔄 BACKWARD COMPATIBILITY LAYER
 * 
 * This file now re-exports the SpeedrunRecordTemplate for backward compatibility.
 * The original MarkILeadDetails functionality has been moved to SpeedrunRecordTemplate.
 */

import { SpeedrunRecordTemplate } from "../SpeedrunRecordTemplate";
import { SpeedrunLeadDetailsProps } from "./LeadDetailsTypes";

export function SpeedrunLeadDetails(props: SpeedrunLeadDetailsProps) {
  return <SpeedrunRecordTemplate {...props} />;
}

// Legacy export for backward compatibility
export { SpeedrunLeadDetails as MarkILeadDetails };

// Also export the new template directly
export { SpeedrunRecordTemplate } from "../SpeedrunRecordTemplate";

// The original implementation has been moved to ../SpeedrunRecordTemplate.tsx
// This maintains backward compatibility while allowing gradual migration