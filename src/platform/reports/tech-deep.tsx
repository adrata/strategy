import React from "react";

export interface TechDeepReportProps {
  company: string;
  data: any;
  onBack?: () => void;
}

export function TechDeepReport({ company, data, onBack }: TechDeepReportProps) {
  return <div>Tech Deep Report for {company}</div>;
}

export default TechDeepReport;
