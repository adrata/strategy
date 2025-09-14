"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShareLink, PDFButton } from "@/platform/ui/components/ShareBar";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function StakeholderMiniPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const company = searchParams.get("company") || "Company";
  const name = searchParams.get("name") || "";
  const title = searchParams.get("title") || "";
  const role = searchParams.get("role") || "";

  const handleBack = () => {
    router.back();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="h-full w-full overflow-y-auto invisible-scrollbar bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-8 text-[var(--foreground)]">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4 rotate-90" />
            Back to Profile
          </button>
          <div className="flex gap-3">
            <ShareLink />
            <PDFButton />
          </div>
        </div>

        <section>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-6">
            {company} Stakeholder Mapping Mini Report
          </h1>
          <p className="text-xl text-[var(--foreground)] mb-8 leading-relaxed">
            A strategic overview of {company}&apos;s organizational structure,
            key decision makers, and stakeholder influence mapping. This focused
            analysis provides essential insights into decision-making processes,
            authority structures, and engagement strategies.
          </p>

          {/* Executive Highlights */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
              Stakeholder Intelligence Snapshot
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900">15</div>
                <div className="text-sm text-blue-700">Key Stakeholders</div>
                <div className="text-xs text-blue-600 mt-1">
                  Decision Influence Network
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900">5</div>
                <div className="text-sm text-blue-700">Decision Makers</div>
                <div className="text-xs text-blue-600 mt-1">
                  Primary Authority
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-900">8/10</div>
                <div className="text-sm text-blue-700">Influence Score</div>
                <div className="text-xs text-blue-600 mt-1">
                  Stakeholder Power
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                Critical Stakeholder Insights
              </h3>
              <ul className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>
                    <strong>Decision Architecture:</strong> Centralized
                    authority with 5 key decision makers controlling strategic
                    initiatives and budget allocation
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>
                    <strong>Influence Network:</strong> Strong stakeholder
                    network with high internal influence scores indicating
                    effective engagement opportunities
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>
                    <strong>Engagement Strategy:</strong> Multi-stakeholder
                    approach required with emphasis on technical and business
                    decision maker alignment
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Stakeholders */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6">
              Key Stakeholder Profiles
            </h2>

            <div className="space-y-6">
              {/* Decision Makers */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4">
                  👑 Decision Makers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">
                      Chief Executive Officer
                    </h4>
                    <p className="text-green-700 text-sm mb-2">
                      Final authority on strategic initiatives over $500K
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Influence: 10/10</span>
                      <span className="text-green-600">
                        Decision Power: High
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">
                      Chief Technology Officer
                    </h4>
                    <p className="text-green-700 text-sm mb-2">
                      Technology decisions and vendor selection authority
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Influence: 9/10</span>
                      <span className="text-green-600">
                        Decision Power: High
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Influencers */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-orange-900 mb-4">
                  🎯 Key Influencers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2">
                      VP of Operations
                    </h4>
                    <p className="text-orange-700 text-sm mb-2">
                      Operational impact assessment
                    </p>
                    <span className="text-xs text-orange-600">
                      Influence: 7/10
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2">
                      Director of IT
                    </h4>
                    <p className="text-orange-700 text-sm mb-2">
                      Technical implementation oversight
                    </p>
                    <span className="text-xs text-orange-600">
                      Influence: 8/10
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2">CFO</h4>
                    <p className="text-orange-700 text-sm mb-2">
                      Budget approval and ROI evaluation
                    </p>
                    <span className="text-xs text-orange-600">
                      Influence: 9/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Champions & Blockers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">
                    🚀 Champions
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <h4 className="font-semibold text-purple-900">
                        Innovation Director
                      </h4>
                      <p className="text-purple-700 text-sm">
                        Strong advocate for technology advancement
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <h4 className="font-semibold text-purple-900">
                        Head of Digital
                      </h4>
                      <p className="text-purple-700 text-sm">
                        Drives digital transformation initiatives
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-yellow-900 mb-4">
                    ⚠️ Potential Blockers
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900">
                        Head of Security
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        Rigorous security and compliance requirements
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900">
                        Legacy System Manager
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        Concerns about system integration complexity
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Strategy */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-indigo-900 mb-6">
              🎯 Stakeholder Engagement Strategy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-3">
                  Primary Engagement Path
                </h3>
                <ol className="space-y-2 text-indigo-800">
                  <li className="flex items-start">
                    <span className="bg-indigo-200 text-indigo-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      1
                    </span>
                    <span>Engage Innovation Director as internal champion</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-200 text-indigo-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      2
                    </span>
                    <span>
                      Build technical consensus with CTO and IT Director
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-200 text-indigo-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      3
                    </span>
                    <span>
                      Present business case to CFO for budget approval
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-200 text-indigo-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      4
                    </span>
                    <span>Secure CEO endorsement for strategic initiative</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-3">
                  Risk Mitigation
                </h3>
                <ul className="space-y-2 text-indigo-800">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>
                      Address security concerns early with dedicated security
                      review
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>
                      Develop integration plan to address legacy system concerns
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>
                      Create pilot program to demonstrate value with minimal
                      disruption
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex justify-between items-center pt-8 border-t border-[var(--border)]">
          <p className="text-[var(--muted)]">
            © 2025 Adrata Intelligence. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            Back to Top
          </button>
        </div>
      </div>
    </div>
  );
}
