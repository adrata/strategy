import React from "react";
import { Person } from "../types";

interface PersonProfileHeaderProps {
  person: Person;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
  getInitials: (name: string | null | undefined) => string;
}

export const PersonProfileHeader: React.FC<PersonProfileHeaderProps> = ({
  person,
  getRankNumber,
  getRankingDescription,
  getInitials,
}) => {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-24 h-24 rounded-xl bg-[var(--hover-bg)] flex items-center justify-center text-3xl font-semibold text-[var(--foreground)] border border-[var(--border)]">
          {getInitials(person.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#9B59B6] bg-opacity-10 flex items-center justify-center">
              <span className="text-lg font-bold text-[#9B59B6]">
                {getRankNumber(person)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                {person.name}
              </h1>
              <p className="text-lg text-[var(--muted)]">{person.title}</p>
              <p className="text-lg font-medium text-[var(--foreground)]">
                {person.company}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-[var(--foreground)]">
              {getRankingDescription(person)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
