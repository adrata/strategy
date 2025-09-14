import React from "react";

export interface GrowthMiniReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function GrowthMiniReport({
  company,
  data,
  onBack,
}: GrowthMiniReportProps) {
  return <div>Growth Mini Report for {company}</div>;
}

export default GrowthMiniReport;
