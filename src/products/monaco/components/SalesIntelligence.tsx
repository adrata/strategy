import React from "react";
import {
  UserIcon,
  UsersIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

interface Company {
  id: string;
  name: string;
  employeeCount: number;
  revenue: string;
  industry: string;
  location: string;
  decisionMakerType: "single" | "group";
  decisionComplexity: "simple" | "complex";
  productFit: "low" | "medium" | "high";
  icpScore: number;
}

interface Person {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  department: string;
  seniority: string;
  isDecisionMaker: boolean;
  influenceScore: number;
  decisionPower: number;
}

// Smart decision-making logic
export const determineSaleType = (
  company: Company,
): "decision-maker" | "buyer-group" => {
  const { employeeCount, decisionComplexity, productFit } = company;

  // Small business (< 50 employees) with simple decisions = Decision Maker Sale
  if (employeeCount < 50 && decisionComplexity === "simple") {
    return "decision-maker";
  }

  // Medium/Large companies or complex decisions = Buyer Group Sale
  if (employeeCount >= 50 || decisionComplexity === "complex") {
    return "buyer-group";
  }

  // High product fit with small company = might still be decision maker
  if (employeeCount < 100 && productFit === "high") {
    return "decision-maker";
  }

  // Default to buyer group for safety
  return "buyer-group";
};

export const getDecisionMakerInfo = (company: Company) => {
  const saleType = determineSaleType(company);

  return {
    saleType,
    icon: saleType === "decision-maker" ? UserIcon : UsersIcon,
    description:
      saleType === "decision-maker"
        ? "Single decision maker - direct approach"
        : "Buyer group required - consensus building",
    strategy:
      saleType === "decision-maker"
        ? "Focus on ROI and quick wins"
        : "Map stakeholders and build consensus",
    complexity: saleType === "decision-maker" ? "Low" : "High",
    timeline: saleType === "decision-maker" ? "2-4 weeks" : "3-6 months",
  };
};

export const SalesIntelligenceIndicator: React.FC<{ company: Company }> = ({
  company,
}) => {
  const decisionInfo = getDecisionMakerInfo(company);
  const IconComponent = decisionInfo.icon;

  return (
    <div className="flex items-center gap-2 p-2 bg-hover rounded-lg border border-border">
      <IconComponent className="w-4 h-4 text-[#9B59B6]" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground">
          {decisionInfo['saleType'] === "decision-maker"
            ? "Decision Maker"
            : "Buyer Group"}
        </span>
        <span className="text-xs text-muted">
          {decisionInfo.timeline}
        </span>
      </div>
    </div>
  );
};

export default SalesIntelligenceIndicator;
