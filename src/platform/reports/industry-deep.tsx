import React from "react";

export interface IndustryDeepReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function IndustryDeepReport({
  company,
  data,
  onBack,
}: IndustryDeepReportProps) {
  return <div>Industry Deep Report for {company}</div>;
}

export default IndustryDeepReport;
