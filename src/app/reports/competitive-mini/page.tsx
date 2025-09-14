"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CompetitiveMiniReport from "@/platform/reports/competitive-mini";

export default function CompetitiveMiniPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const company = searchParams.get("company") || "Company";
  const name = searchParams.get("name") || "";
  const title = searchParams.get("title") || "";
  const role = searchParams.get("role") || "";

  // Enhanced data for the competitive mini report with safety checks
  const competitiveData = {
    marketPosition: "Challenger",
    competitiveAdvantage: 7,
    threatLevel: 6,
    competitors: [
      {
        name: "Market Leader Corp",
        marketShare: 35,
        threat: "high" as const,
        position: "Market Leader",
      },
      {
        name: "Innovation Solutions",
        marketShare: 22,
        threat: "medium" as const,
        position: "Strong Challenger",
      },
      {
        name: "Emerging Tech Co",
        marketShare: 15,
        threat: "high" as const,
        position: "Fast Follower",
      },
      {
        name: "Traditional Player",
        marketShare: 12,
        threat: "low" as const,
        position: "Legacy Provider",
      },
    ],
    opportunities: [
      {
        area: "Product Innovation",
        potential: "high" as const,
        description:
          "Leverage advanced analytics capabilities to differentiate from competitors",
      },
      {
        area: "Market Expansion",
        potential: "medium" as const,
        description: "Enter adjacent market segments with proven solutions",
      },
      {
        area: "Partnership Strategy",
        potential: "high" as const,
        description:
          "Strategic alliances with industry leaders to accelerate growth",
      },
      {
        area: "Customer Experience",
        potential: "medium" as const,
        description:
          "Superior customer experience as competitive differentiator",
      },
    ],
  };

  const handleBack = () => {
    router.back();
  };

  // Data validation
  if (
    !competitiveData ||
    !competitiveData.competitors ||
    !competitiveData.opportunities
  ) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Report Error
          </h1>
          <p className="text-[var(--muted)]">
            Competitive analysis data is missing. Please try again.
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
    <CompetitiveMiniReport
      company={company}
      data={competitiveData}
      onBack={handleBack}
    />
  );
}
