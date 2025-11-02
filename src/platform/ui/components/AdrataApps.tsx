import React from "react";
import { ProfileBox } from "./ProfileBox";

interface AdrataApp {
  name: string;
  slug: string;
  description: string;
}

interface AdrataAppsProps {
  apps: AdrataApp[];
  currentApp: string;
  onAppClick: (slug: string) => void;
  renderProfileBox?: () => React.ReactNode;
}

export const AdrataApps: React.FC<AdrataAppsProps> = ({
  apps,
  currentApp,
  onAppClick,
  renderProfileBox,
}) => {
  // Reorder apps: Action Platform, Speedrun, Monaco, then the rest
  const orderedApps: AdrataApp[] = [];
  const priority = ["aos", "pipeline", "Speedrun", "monaco"];
  priority.forEach((slug) => {
    const found = apps.find((app) => app['slug'] === slug);
    if (found) orderedApps.push(found);
  });
  apps.forEach((app) => {
    if (!priority.includes(app.slug)) orderedApps.push(app);
  });
  return (
    <div className="px-3 pt-1 flex flex-col h-full relative">
      <h3 className="text-lg font-semibold mb-0.5">Adrata Applications</h3>
      <p className="text-[var(--muted,#888)] mt-0 mb-2.5">
        Drive significant results.
      </p>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pb-20">
        {orderedApps.map((app) => {
          const isActive = currentApp === app.slug;
          const activeTextColor = isActive
            ? "text-foreground"
            : "text-[var(--muted,#888)]";
          const activeBorderColor = isActive
            ? "border-active-app-border"
            : "border-border";
          return (
            <div
              key={app.slug}
              className={`flex items-center border rounded-2xl px-[18px] py-4 w-full mb-1 bg-background ${activeBorderColor} ${isActive ? "border-[1.2px]" : ""}`}
              style={{ minHeight: "52px", cursor: "pointer" }}
              onClick={() => {
                onAppClick(app.slug);
              }}
            >
              <div>
                <div className={`${activeTextColor} text-lg font-normal`}>
                  {app.name}
                </div>
                <div className={`${activeTextColor} text-sm`}>
                  {app.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute left-0 bottom-0 w-full mb-0">
        {/* NOTE: If you move your login page, update the callbackUrl in ProfileBox signOut to the new route (e.g., '/login') */}
        {renderProfileBox ? (
          renderProfileBox()
        ) : (
          <ProfileBox
            user={{ name: "Dan Mirolli" }}
            company="Adrata"
            workspace="Adrata"
            isProfileOpen={false}
            setIsProfileOpen={() => {}}
          />
        )}
      </div>
    </div>
  );
};
