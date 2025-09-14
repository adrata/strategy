import React from "react";

export interface CompetitiveDeepReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function CompetitiveDeepReport({
  company,
  data,
  onBack,
}: CompetitiveDeepReportProps) {
  return <div>Competitive Deep Report for {company}</div>;
}

export default CompetitiveDeepReport;
