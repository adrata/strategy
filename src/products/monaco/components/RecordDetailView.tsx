import React from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Company, Partner, Person } from "../types";
import { PersonDetailView } from "./PersonDetailView";

interface RecordDetailViewProps {
  selectedRecord: Company | Partner | Person;
  onBack: () => void;
  getStatusColor: (status: string) => string;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
  getInitials: (name: string | null | undefined) => string;
}

export const RecordDetailView: React.FC<RecordDetailViewProps> = ({
  selectedRecord,
  onBack,
  getStatusColor,
  getRankNumber,
  getRankingDescription,
  getInitials,
}) => {
  // Route to appropriate detail view based on record type
  if ("personalIntelligence" in selectedRecord) {
    // Person with full intelligence data
    return (
      <PersonDetailView
        person={selectedRecord as Person}
        onBack={onBack}
        getStatusColor={getStatusColor}
        getRankNumber={getRankNumber}
        getRankingDescription={getRankingDescription}
        getInitials={getInitials}
      />
    );
  }

  // For Company and Partner records, or basic Person records
  return (
    <div className="flex-1 p-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back
      </button>

      {/* Record detail */}
      <div className="max-w-4xl">
        {/* Header with ranking */}
        <div className="flex items-start gap-6 mb-8">
          {"icpScore" in selectedRecord ? (
            // Company header
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-xl bg-[#9B59B6] bg-opacity-10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#9B59B6]">
                    {getRankNumber(selectedRecord)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[var(--foreground)]">
                    {selectedRecord.name}
                  </h1>
                  <p className="text-lg text-[var(--muted)]">
                    {selectedRecord.domain}
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-[var(--foreground)]">
                  {getRankingDescription(selectedRecord)}
                </p>
              </div>
            </div>
          ) : "partnershipType" in selectedRecord ? (
            // Partner header
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-xl bg-[#9B59B6] bg-opacity-10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#9B59B6]">
                    {getRankNumber(selectedRecord)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[var(--foreground)]">
                    {selectedRecord.name}
                  </h1>
                  <p className="text-lg text-[var(--muted)]">
                    {selectedRecord.domain}
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <p className="text-[var(--foreground)]">
                  {getRankingDescription(selectedRecord)}
                </p>
              </div>
            </div>
          ) : (
            // Basic person header (without intelligence)
            <div className="flex-1">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-xl bg-[var(--hover-bg)] flex items-center justify-center text-3xl font-semibold text-[var(--foreground)] border border-[var(--border)]">
                  {getInitials(selectedRecord.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-[#9B59B6] bg-opacity-10 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#9B59B6]">
                        {getRankNumber(selectedRecord)}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-[var(--foreground)]">
                        {selectedRecord.name}
                      </h1>
                      <p className="text-lg text-[var(--muted)]">
                        {(selectedRecord as Person).title}
                      </p>
                      <p className="text-lg font-medium text-[var(--foreground)]">
                        {(selectedRecord as Person).company}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-[var(--foreground)]">
                      {getRankingDescription(selectedRecord)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {"icpScore" in selectedRecord ? (
            // Company details
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                    Company Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Industry:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {selectedRecord.industry}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">
                        Total Employees:
                      </span>
                      <span className="font-medium text-[var(--foreground)]">
                        {selectedRecord.employeeCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Revenue:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {selectedRecord.revenue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Location:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {selectedRecord.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                    Sales Intelligence
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">ICP Score:</span>
                      <span className="text-2xl font-bold text-[#9B59B6]">
                        {selectedRecord.icpScore}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedRecord.status)}`}
                      >
                        {selectedRecord.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Last Updated:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {new Date(
                          selectedRecord.lastUpdated,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : "partnershipType" in selectedRecord ? (
            // Partner details
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                    Partnership Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Type:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {selectedRecord.partnershipType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Region:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {selectedRecord.region}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Revenue:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {selectedRecord.revenue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedRecord.status)}`}
                      >
                        {selectedRecord.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                    Engagement
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Last Contact:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {new Date(
                          selectedRecord.lastContact,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Basic person details
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Email:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {(selectedRecord as Person).email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">LinkedIn:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {(selectedRecord as Person).linkedin}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Location:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {(selectedRecord as Person).location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                    Professional Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Department:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {(selectedRecord as Person).department}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Seniority:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {(selectedRecord as Person).seniority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedRecord.status)}`}
                      >
                        {selectedRecord.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Last Contact:</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {new Date(
                          (selectedRecord as Person).lastContact,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
