import React from "react";
import { SpeedrunPerson, CareerData } from "../types/SpeedrunTypes";

interface CareerTabProps {
  person: SpeedrunPerson;
  careerData: CareerData;
}

export function CareerTab({ person, careerData }: CareerTabProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Career Timeline
      </h2>
      <div className="mb-4 bg-background border border-border rounded-lg p-4">
        <span className="font-semibold text-foreground">Summary:</span>{" "}
        {careerData.summary}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-6">
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="mb-2">
            <span className="font-semibold text-foreground">
              Education:
            </span>{" "}
            {careerData.education}
          </div>
          <div>
            <span className="font-semibold text-foreground">
              Certifications:
            </span>{" "}
            {careerData.certifications.join(", ")}
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4">
          <div>
            <span className="font-semibold text-foreground">
              Skills:
            </span>{" "}
            {careerData.skills.join(", ")}
          </div>
        </div>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Timeline
        </h3>
        <ul className="border-l-2 border-primary pl-6">
          {careerData.timeline.map((item, idx) => (
            <li key={idx} className="mb-6 relative">
              <div className="absolute -left-3 top-1 w-3 h-3 bg-primary rounded-full"></div>
              <div className="font-semibold text-foreground">
                {item.year}
              </div>
              <div className="text-foreground">
                {item.title} at {item.company}
              </div>
              <ul className="list-disc pl-6 text-muted">
                {item.achievements.map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
