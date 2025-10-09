import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Returns a string like '4 weeks ago' or '2 days ago'.
export function formatRelativeDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "No date";

  const now = new Date();
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid date";

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? "s" : ""} ago`;
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`;
  if (diffWeek > 0) return `${diffWeek} week${diffWeek > 1 ? "s" : ""} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  return "just now";
}

// ==================== API UTILITIES ====================
// Dynamic export based on environment
export const dynamic =
  process['env']['TAURI_BUILD'] === "true" ? "force-static" : "force-dynamic";

// Platform detection utilities
export function isDesktopMode(): boolean {
  return (
    process['env']['TAURI_BUILD'] === "true" ||
    process['env']['CAPACITOR_BUILD'] === "true" ||
    process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true"
  );
}

export function isWebMode(): boolean {
  return !isDesktopMode();
}

export function isMobileMode(): boolean {
  return process['env']['CAPACITOR_BUILD'] === "true";
}

export function getTauriPlatform(): "desktop" | "web" | "mobile" {
  if (isDesktopMode()) return "desktop";
  if (isMobileMode()) return "mobile";
  return "web";
}
