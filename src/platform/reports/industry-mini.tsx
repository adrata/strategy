import React from "react";

export interface IndustryMiniReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function IndustryMiniReport({
  company,
  data,
  onBack,
}: IndustryMiniReportProps) {
  return <div>Industry Mini Report for {company}</div>;
}

export default IndustryMiniReport;
