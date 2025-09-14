"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GrowthMiniReport from "@/platform/reports/growth-mini";

export default function GrowthMiniPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const company = searchParams.get("company") || "Company";
  const name = searchParams.get("name") || "";
  const title = searchParams.get("title") || "";
  const role = searchParams.get("role") || "";

  // Enhanced data for the growth mini report - with comprehensive validation
  const growthData = {
    revenueGrowth: 24,
    digitalSales: 68,
    customerAcquisitionCost: 350,
    quickWins: [
      {
        action: "Optimize digital marketing campaigns",
        timeline: "30 days",
        impact: "Reduce CAC by 15% and increase conversion rates",
      },
      {
        action: "Implement referral program",
        timeline: "45 days",
        impact: "Lower acquisition costs and improve customer loyalty",
      },
      {
        action: "Enhance onboarding experience",
        timeline: "60 days",
        impact: "Increase customer retention by 25%",
      },
      {
        action: "Launch customer success program",
        timeline: "90 days",
        impact: "Boost upselling revenue by 35%",
      },
      {
        action: "Expand into adjacent market segments",
        timeline: "6 months",
        impact: "Open new revenue streams worth $2M annually",
      },
      {
        action: "Develop strategic partnerships",
        timeline: "4 months",
        impact: "Access new customer segments and reduce acquisition costs",
      },
      {
        action: "Implement AI-driven analytics",
        timeline: "3 months",
        impact: "Improve decision-making and operational efficiency by 30%",
      },
      {
        action: "Enhance customer data platform",
        timeline: "4 months",
        impact: "Better personalization leading to 20% revenue increase",
      },
    ],
    challenges: [
      {
        issue:
          "Customer acquisition costs have increased by 40% over the past year, impacting profitability and scaling efficiency.",
        solution:
          "Implement multi-channel attribution analysis, optimize high-performing channels, and develop referral programs to reduce dependency on paid acquisition.",
      },
      {
        issue:
          "Digital transformation progress is slower than competitors, limiting growth in online channels and customer experience.",
        solution:
          "Accelerate digital infrastructure investments, implement customer data platform, and enhance digital customer touchpoints for improved conversion.",
      },
      {
        issue:
          "Customer retention rates have declined as the company focuses heavily on new customer acquisition.",
        solution:
          "Develop comprehensive customer success program, implement predictive churn analysis, and create loyalty initiatives to maximize lifetime value.",
      },
      {
        issue:
          "Platform integration complexity is slowing down innovation and increasing operational overhead.",
        solution:
          "Implement unified platform architecture to streamline operations and accelerate product development cycles.",
      },
    ],
  };

  const handleBack = () => {
    router.back();
  };

  // Add safety check for data
  if (!growthData || !growthData.quickWins || !growthData.challenges) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Report Error
          </h1>
          <p className="text-[var(--muted)]">
            Unable to load report data. Please try again.
          </p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <GrowthMiniReport company={company} data={growthData} onBack={handleBack} />
  );
}
