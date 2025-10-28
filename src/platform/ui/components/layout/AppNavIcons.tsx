import React from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import {
  DocumentDuplicateIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  UserIcon,
  Squares2X2Icon,
  HomeIcon,
  BriefcaseIcon,
  NewspaperIcon,
  BoltIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const appIconConfig: Record<
  string,
  { slug: string; Icon: IconComponent; label: string }[]
> = {
  pipeline: [
    { slug: "pipeline", Icon: HomeIcon, label: "Pipeline" },
    { slug: "companies", Icon: BriefcaseIcon, label: "Companies" },
    { slug: "people", Icon: UserGroupIcon, label: "People" },
  ],
  paper: [
    { slug: "paper", Icon: FolderOpenIcon, label: "Paper" },
    { slug: "folders", Icon: DocumentDuplicateIcon, label: "Folders" },
    { slug: "people", Icon: UserIcon, label: "People" },
  ],
  pitch: [
    { slug: "pitch", Icon: HomeIcon, label: "Pitch" },
    { slug: "audience", Icon: UserGroupIcon, label: "Audience" },
    { slug: "collaborators", Icon: UserIcon, label: "Collaborators" },
  ],
  oasis: [
    { slug: "oasis", Icon: HomeIcon, label: "Oasis" },
    { slug: "feed", Icon: BoltIcon, label: "Feed" },
    { slug: "news", Icon: NewspaperIcon, label: "News" },
  ],
  monaco: [
    { slug: "companies", Icon: BriefcaseIcon, label: "Companies" },
    { slug: "people", Icon: UserGroupIcon, label: "People" },
    { slug: "sellers", Icon: HomeIcon, label: "Sellers" },
  ],
  Speedrun: [
    { slug: "Speedrun", Icon: HomeIcon, label: "Speedrun" },
    { slug: "companies", Icon: BriefcaseIcon, label: "Companies" },
    { slug: "people", Icon: UserGroupIcon, label: "People" },
  ],
};

export type AppNavIconsProps = {
  context: string;
  activeTab: string;
  onTabChange: (slug: string) => void;
  onAppsClick?: () => void;
  showAppSwitcher?: boolean;
  onCloseAppSwitcher?: () => void;
};

export function AppNavIcons({
  context,
  activeTab,
  onTabChange,
  onAppsClick,
  showAppSwitcher,
  onCloseAppSwitcher,
}: AppNavIconsProps) {
  const router = useRouter();
  const { user: authUser } = useUnifiedAuth();
  
  // Check if user is in Adrata workspace
  const isAdrataWorkspace = () => {
    const activeWorkspace = authUser?.workspaces?.find(
      w => w['id'] === authUser?.activeWorkspaceId
    );
    return activeWorkspace?.name?.toLowerCase() === 'adrata';
  };

  // Get icons and filter out Oasis for non-Adrata users
  const getFilteredIcons = () => {
    const baseIcons = appIconConfig[context] || appIconConfig["pipeline"];
    
    // Filter out Oasis-related icons for non-Adrata users
    if (!isAdrataWorkspace()) {
      return baseIcons.filter(icon => icon.slug !== "oasis");
    }
    
    return baseIcons;
  };
  
  const icons = getFilteredIcons();

  const isActiveTab = (slug: string) => {
    if (showAppSwitcher) return false;
    if (context === "pipeline" || context === "demo") {
      if (slug === context) return activeTab === "home";
      return activeTab === slug;
    }
    return activeTab === slug;
  };

  const handleClick = (slug: string) => {
    if (onCloseAppSwitcher) onCloseAppSwitcher();
    onTabChange(slug);
  };

  return (
    <div className="flex flex-row items-center space-x-6 mb-[-7px] mt-0 mx-2">
      {icons?.map(({ slug, Icon, label }) => {
        const isActive = isActiveTab(slug);
        return (
          <Icon
            key={slug}
            className={`w-[33px] h-[69px] cursor-pointer ${isActive ? "text-[var(--foreground)] font-bold" : "text-[var(--muted)]"}`}
            aria-label={label}
            onClick={() => handleClick(slug)}
          />
        );
      })}
      {/* 4th icon: App Switcher */}
      <BuildingOffice2Icon
        className={`w-[33px] h-[69px] cursor-pointer ${showAppSwitcher ? "text-[var(--foreground)] font-bold" : "text-[var(--muted)]"}`}
        aria-label="Apps"
        onClick={() => {
          if (onAppsClick) {
            onAppsClick();
          } else {
            router.push("/applications");
          }
        }}
      />
    </div>
  );
}
