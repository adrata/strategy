import React from "react";
import { Person } from "../types";

interface PersonCareerJourneyProps {
  person: Person;
}

export const PersonCareerJourney: React.FC<PersonCareerJourneyProps> = ({
  person,
}) => {
  const careerPath = person.personalIntelligence?.background.careerPath || [
    "Current Role: Director of Sales (3 years)",
    "Previous: Senior Sales Manager at TechCorp (2 years)",
    "Previous: Sales Manager at InnovateCo (3 years)",
    "Started: Account Executive at StartupX (2 years)",
  ];

  const previousCompanies = person.personalIntelligence?.background
    .previousCompanies || ["TechCorp Solutions", "InnovateCo", "StartupX"];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span>🗺️</span> Career Journey
        </h3>
        <div className="space-y-4">
          {careerPath.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#9B59B6] rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span>🏢</span> Previous Companies
        </h3>
        <div className="space-y-2">
          {previousCompanies.map((company, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="text-sm text-foreground">
                {company}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
