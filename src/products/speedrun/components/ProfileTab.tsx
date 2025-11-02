import React from "react";
import { SpeedrunPerson, ProfileData } from "../types/SpeedrunTypes";

interface ProfileTabProps {
  person: SpeedrunPerson;
  profileData: ProfileData;
}

export function ProfileTab({ person, profileData }: ProfileTabProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Personal Profile
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background border border-border rounded-lg p-4 mb-4">
          <div className="mb-2">
            <span className="font-semibold text-foreground">
              Personality:
            </span>{" "}
            {profileData.personality}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-foreground">
              Communication Style:
            </span>{" "}
            {profileData.communication}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-foreground">
              Motivators:
            </span>{" "}
            {profileData.motivators}
          </div>
          <div>
            <span className="font-semibold text-foreground">
              Values:
            </span>{" "}
            {profileData.values}
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold text-foreground">
              Social:
            </span>
            {profileData.social ? (
              <a
                href={`https://${profileData.social}`}
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                View{" "}
                {(() => {
                  const social = profileData.social.toLowerCase();
                  if (social.includes("linkedin")) return "LinkedIn";
                  if (social.includes("twitter") || social.includes("x.com"))
                    return "X";
                  if (social.includes("facebook")) return "Facebook";
                  if (social.includes("instagram")) return "Instagram";
                  return "Profile";
                })()}
              </a>
            ) : (
              <span className="text-muted">-</span>
            )}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-foreground">
              Interests:
            </span>{" "}
            {profileData.interests}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-foreground">
              Role in Buying Process:
            </span>{" "}
            {profileData.role}
          </div>
          <div>
            <span className="font-semibold text-foreground">
              Personal Context:
            </span>{" "}
            {profileData.context}
          </div>
        </div>
      </div>
      <div className="mt-8 bg-background border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          How to Win with {person.name.split(" ")[0]}
        </h3>
        <div className="text-foreground">{profileData.tips}</div>
      </div>
    </>
  );
}
