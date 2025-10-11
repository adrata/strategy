"use client";

import React, { useState } from "react";
import {
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface MonacoSequencesViewProps {
  // Add any props needed for sequences
}

export function MonacoSequencesView({}: MonacoSequencesViewProps) {
  const [activeSequenceSection, setActiveSequenceSection] = useState("active");

  const sequencesLeftPanel = (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col pt-0 pr-2 pb-6 pl-2 overflow-y-auto">
      <div className="flex-1 flex flex-col">
        <div className="mx-2 mt-4 mb-6">
          <h3 className="text-xl font-bold mb-0.5 mt-[2px]">Sequences</h3>
          <p className="text-[var(--muted)] mt-0 mb-1">
            Automated outreach campaigns
          </p>
        </div>

        {/* Sequence Sections */}
        <div>
          <h3 className="text-xs font-bold text-[var(--muted)] uppercase mb-2 pl-2 tracking-widest">
            CAMPAIGNS
          </h3>

          {[
            {
              id: "active",
              name: "Active",
              description: "Running sequences",
              icon: ArrowPathIcon,
              count: 12,
            },
            {
              id: "draft",
              name: "Draft",
              description: "Sequences in progress",
              icon: EnvelopeIcon,
              count: 5,
            },
            {
              id: "scheduled",
              name: "Scheduled",
              description: "Upcoming campaigns",
              icon: ClockIcon,
              count: 8,
            },
            {
              id: "completed",
              name: "Completed",
              description: "Finished sequences",
              icon: CheckCircleIcon,
              count: 24,
            },
          ].map((section) => (
            <div
              key={section.id}
              className={`pl-3 pr-4 py-2 rounded-lg cursor-pointer font-medium text-base transition-colors mb-0.5 ${
                activeSequenceSection === section.id
                  ? "bg-[var(--hover-bg)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setActiveSequenceSection(section.id)}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4" />
                  <span>{section.name}</span>
                </div>
                <span className="text-xs bg-[var(--hover-bg)] text-[var(--foreground)] px-2 py-0.5 rounded-md">
                  {section.count}
                </span>
              </div>
              <div className="text-xs text-[var(--muted)]">
                {section.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSequenceContent = () => {
    switch (activeSequenceSection) {
      case "active":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Active Sequences
            </h2>
            <div className="space-y-4">
              {[
                {
                  name: "SaaS Outreach Q4",
                  prospects: 156,
                  responseRate: "23%",
                  status: "Running",
                },
                {
                  name: "Enterprise Follow-up",
                  prospects: 89,
                  responseRate: "31%",
                  status: "Running",
                },
                {
                  name: "Product Demo Request",
                  prospects: 234,
                  responseRate: "18%",
                  status: "Running",
                },
              ].map((sequence, index) => (
                <div
                  key={index}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{sequence.name}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {sequence.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--muted)]">Prospects: </span>
                      <span className="font-semibold">
                        {sequence.prospects}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)]">
                        Response Rate:{" "}
                      </span>
                      <span className="font-semibold text-[#10B981]">
                        {sequence.responseRate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "draft":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Draft Sequences
            </h2>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Draft Campaigns</h3>
              <p className="text-[var(--muted)]">
                5 sequences in draft mode, ready for review and activation.
              </p>
            </div>
          </div>
        );
      case "scheduled":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Scheduled Sequences
            </h2>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming Campaigns</h3>
              <p className="text-[var(--muted)]">
                8 sequences scheduled to start this week.
              </p>
            </div>
          </div>
        );
      case "completed":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Completed Sequences
            </h2>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Finished Campaigns</h3>
              <p className="text-[var(--muted)]">
                24 completed sequences with full analytics available.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-[var(--background)]">
      {sequencesLeftPanel}
      <div className="flex-1 min-w-0">{renderSequenceContent()}</div>
    </div>
  );
}
