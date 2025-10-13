import React from "react";
import {
  ChevronLeftIcon,
  PlusIcon,
  CheckIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Person } from "../../types";
import { validatePhoneNumber } from "@/platform/utils/phone-validator";
import { PipelineProgress } from "@/platform/shared/components/ui/PipelineProgress";

interface PersonDetailHeaderProps {
  person: Person;
  onBack: () => void;
  getStatusColor: (status: string) => string;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
  getInitials: (name: string | null | undefined) => string;
  sourceSection?: string;
  // Navigation props for Speedrun
  currentIndex?: number;
  totalRecords?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onMarkCompleted?: () => void;
  isCompleted?: boolean;
  // Company click handler
  onCompanyClick?: (companyName: string) => void;
}

export function PersonDetailHeader({
  person,
  onBack,
  getStatusColor,
  getRankNumber,
  getRankingDescription,
  getInitials,
  sourceSection,
  currentIndex,
  totalRecords,
  onPrevious,
  onNext,
  onMarkCompleted,
  isCompleted,
  onCompanyClick,
}: PersonDetailHeaderProps) {
  const hasEmailContact = person['email'] && 
    person.email !== "Not Available" && 
    person.email !== "Unknown" && 
    person.email !== "-" && 
    person.email.trim() !== '';
  const hasPhoneContact = person['phone'] && validatePhoneNumber(person.phone).isValid;
  const hasValidTitle = person['title'] && 
    person.title.toLowerCase() !== 'unknown' && 
    person.title.toLowerCase() !== 'unknown title' && 
    person.title !== '-' && 
    person.title.trim() !== '';

  return (
    <div className="flex-none bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>

          {/* Speedrun Navigation */}
          {currentIndex !== undefined && totalRecords !== undefined && (
            <div className="flex items-center gap-3">
              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeftIcon className="w-4 h-4 text-[var(--muted)]" />
              </button>
              
              <span className="text-sm text-[var(--muted)]">
                {currentIndex + 1} of {totalRecords}
              </span>
              
              <button
                onClick={onNext}
                disabled={currentIndex === totalRecords - 1}
                className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRightIcon className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>
          )}
        </div>

        {/* Mark Completed Button */}
        {onMarkCompleted && (
          <button
            onClick={onMarkCompleted}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isCompleted
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <CheckIcon className="w-4 h-4" />
            {isCompleted ? "Completed" : "Mark Complete"}
          </button>
        )}
      </div>

      {/* Person Profile Header */}
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            {getInitials(person.name)}
          </div>
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
                {person.name}
              </h1>
              
              {hasValidTitle && (
                <p className="text-lg text-[var(--muted)] mb-2">
                  {person.title}
                </p>
              )}

              {/* Contact Info with Company */}
              <div className="flex items-center gap-4 text-sm text-[var(--muted)] mb-3">
                {person.company && person.company !== "-" && person.company.trim() !== '' && (
                  <button
                    onClick={() => onCompanyClick?.(person.company || "")}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span className="font-medium">{person.company}</span>
                  </button>
                )}
                
                {hasEmailContact && (
                  <div className="flex items-center gap-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    <span>{person.email}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{hasPhoneContact ? person.phone : '-'}</span>
                </div>
                
                {person['location'] && (
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{person.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status and Ranking */}
            <div className="flex flex-col items-end gap-3">
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(person.stage || "")}`}>
                {person.stage}
              </div>

              {/* Ranking */}
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  #{getRankNumber(person)}
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {getRankingDescription(person)}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Row */}
          <div className="flex items-center gap-6 mt-4 text-sm text-[var(--muted)]">
            {person['department'] && (
              <div className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4" />
                <span>{person.department}</span>
              </div>
            )}
            
            {person['seniority'] && (
              <div className="flex items-center gap-1">
                <BriefcaseIcon className="w-4 h-4" />
                <span>{person.seniority}</span>
              </div>
            )}
            
            {person['buyerGroupRole'] && (
              <div className="flex items-center gap-1">
                <SparklesIcon className="w-4 h-4" />
                <span>{person.buyerGroupRole}</span>
              </div>
            )}
          </div>

          {/* Pipeline Progress */}
          {person['stage'] && (
            <div className="mt-4">
              <PipelineProgress currentStage={person.stage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
