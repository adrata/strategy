import React from "react";

export interface GrowthDeepReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function GrowthDeepReport({
  company,
  data,
  onBack,
}: GrowthDeepReportProps) {
  return <div>Growth Deep Report for {company}</div>;
}

export default GrowthDeepReport;
