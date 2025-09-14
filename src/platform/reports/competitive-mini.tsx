import React from "react";

export interface CompetitiveMiniReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function CompetitiveMiniReport({
  company,
  data,
  onBack,
}: CompetitiveMiniReportProps) {
  return <div>Competitive Mini Report for {company}</div>;
}

export default CompetitiveMiniReport;
