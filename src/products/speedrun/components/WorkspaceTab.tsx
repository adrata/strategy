import React from "react";
import { SpeedrunPerson, WorkspaceData } from "../types/SpeedrunTypes";

interface WorkspaceTabProps {
  person: SpeedrunPerson;
  workspaceData: WorkspaceData;
}

export function WorkspaceTab({ person, workspaceData }: WorkspaceTabProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
        Workspace & Company
      </h2>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="mb-2">
            <span className="font-semibold text-[var(--foreground)]">
              Company:
            </span>{" "}
            {workspaceData.company}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-[var(--foreground)]">
              Industry:
            </span>{" "}
            {workspaceData.industry}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-[var(--foreground)]">
              Size:
            </span>{" "}
            {workspaceData.size}
          </div>
          <div>
            <span className="font-semibold text-[var(--foreground)]">HQ:</span>{" "}
            {workspaceData.hq}
          </div>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
          <div className="mb-2">
            <span className="font-semibold text-[var(--foreground)]">
              Mission:
            </span>{" "}
            {workspaceData.mission}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-[var(--foreground)]">
              Tech Stack:
            </span>{" "}
            {workspaceData.techStack.join(", ")}
          </div>
          <div>
            <span className="font-semibold text-[var(--foreground)]">
              Day-to-Day:
            </span>{" "}
            {workspaceData.dayToDay}
          </div>
        </div>
      </div>
      <div className="mb-8 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Org Chart
        </h3>
        <ul className="pl-6">
          {(workspaceData.orgChart || []).map((person, idx) => (
            <li key={idx} className="mb-2">
              <span className="font-semibold text-[var(--foreground)]">
                {person.name}
              </span>{" "}
              — <span className="text-[var(--muted)]">{person.title}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
        <div className="mb-2">
          <span className="font-semibold text-[var(--foreground)]">
            Recent News:
          </span>
        </div>
        <ul className="list-disc pl-6 text-[var(--muted)]">
          {(workspaceData.news || []).map((newsItem, idx) => (
            <li key={idx}>{newsItem}</li>
          ))}
        </ul>
        <div className="mt-2">
          <span className="font-semibold text-[var(--foreground)]">
            Solution Fit:
          </span>{" "}
          {workspaceData.fit}
        </div>
      </div>
    </>
  );
}
