import React from "react";
import { Person } from "../types";
import CountryFlag from "@/platform/ui/components/monaco/CountryFlag";
import { IntelligentStageProgression } from "../../speedrun/IntelligentStageProgression";

interface PeopleListProps {
  people: Person[];
  highlightedRecords: string[];
  onPersonClick: (person: Person) => void;
  getStatusColor: (status: string) => string;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
  getInitials: (name: string | null | undefined) => string;
}

export const PeopleList: React.FC<PeopleListProps> = ({
  people,
  highlightedRecords,
  onPersonClick,
  getStatusColor,
  getRankNumber,
  getRankingDescription,
  getInitials,
}) => {
  return (
    <div className="space-y-4">
      {/* Sort people by seniority */}
      {[...people]
        .sort((a, b) => getRankNumber(a) - getRankNumber(b))
        .map((person, index) => {
          const isHighlighted = highlightedRecords.includes(person.id);
          
          // Get contextual activity insight
          const activityContext = IntelligentStageProgression.getEnhancedRankingContext(person as any);
          const contextualInsight = IntelligentStageProgression.getContextualInsight(person as any);

          return (
            <div
              key={person.id}
              className={`border rounded-xl p-6 bg-background hover:border-gray-400 transition-all cursor-pointer ${
                isHighlighted
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700"
                  : "border-border"
              }`}
              onClick={() => onPersonClick(person)}
              onMouseEnter={(e) => {
                if (!isHighlighted) {
                  e.currentTarget['style']['borderColor'] = "#9B59B6";
                }
              }}
              onMouseLeave={(e) => {
                if (!isHighlighted) {
                  e.currentTarget['style']['borderColor'] = "";
                }
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-hover rounded-lg flex items-center justify-center text-foreground font-medium text-sm">
                    {getRankNumber(person)}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-hover flex items-center justify-center text-lg font-semibold text-foreground border border-border">
                    {getInitials(person.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {person.name}—{person.company}
                    </h3>
                    <p className="text-sm text-muted mb-2">
                      {person.title}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>
                        Department:{" "}
                        <span className="font-medium text-foreground">
                          {person.department}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Level:{" "}
                        <span className="font-medium text-foreground">
                          {person.seniority}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-2 italic">
                      {getRankingDescription(person).split(": ")[1]}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  {/* Contextual Activity Insight */}
                  {contextualInsight && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activityContext?.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                      activityContext?.priority === 'medium' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-hover text-gray-800 border border-border'
                    }`}>
                      {contextualInsight}
                    </div>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(person.status)}`}
                  >
                    {person.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <div className="flex items-center gap-4">
                  <span>📧 {person.email}</span>
                  <div className="flex items-center gap-1">
                    <CountryFlag location={person.location} />
                    <span>{person.location}</span>
                  </div>
                </div>
                <span>
                  Last contact:{" "}
                  {new Date(person.lastContact).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
};
