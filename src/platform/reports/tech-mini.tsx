import React from "react";

export interface TechMiniReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function TechMiniReport({ company, data, onBack }: TechMiniReportProps) {
  return <div>Tech Mini Report for {company}</div>;
}

export default TechMiniReport;
