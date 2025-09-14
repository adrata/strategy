import React, { useState } from "react";
import {
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { invoke } from "@tauri-apps/api/core";

function generateDeterministicId(seed: string, length = 10): string {
  // Simple hash function to convert seed string to consistent ID
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert hash to alphanumeric string
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  let num = Math.abs(hash);

  for (let i = 0; i < length; i++) {
    result += chars[num % chars.length];
    num = Math.floor(num / chars.length);
    if (num === 0) num = Math.abs(hash) + i; // Ensure we have enough entropy
  }

  return result;
}

// Detect if we're inside the main platform vs external sharing
function isInsidePlatform(): boolean {
  if (typeof window === "undefined") return false;

  // Check if we're on the main adrata domain or localhost
  const hostname = window.location.hostname;
  return (
    hostname.includes("localhost") ||
    hostname === "adrata.com" ||
    (hostname.endsWith(".adrata.com") && !hostname.startsWith("paper."))
  );
}

// Detect if we're on the external sharing domain or paper route
function isExternalShare(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname.startsWith("paper.") ||
    window.location.pathname.startsWith("/paper/")
  );
}

export function useShareUrl() {
  const [shareUrl, setShareUrl] = React.useState("");
  React.useEffect(() => {
    // Create a deterministic seed based on current page content
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    const currentTitle = typeof document !== "undefined" ? document.title : "";
    const seed = currentPath + currentTitle + "adrata-report";

    // Generate a deterministic report ID based on content
    const reportId = generateDeterministicId(seed, 10);

    // For now, use the main domain until paper.adrata.com is configured
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://localhost:3000";

    // Use /paper/[id] route structure
    const fullUrl = `${baseUrl}/paper/${reportId}`;
    setShareUrl(fullUrl);

    console.log(
      "📄 Generated deterministic share URL:",
      fullUrl,
      "from seed:",
      seed,
    );
  }, []);
  return shareUrl;
}

interface BackToProfileProps {
  onBack?: (() => void) | undefined;
  className?: string;
}

export const BackToProfile: React.FC<BackToProfileProps> = ({
  onBack,
  className,
}) => {
  // Only show back button when inside the platform
  if (!isInsidePlatform() || !onBack) {
    return null;
  }

  return (
    <button
      onClick={onBack}
      className={`flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors ${className || ""}`}
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Back to Profile
    </button>
  );
};

export const ShareLink: React.FC<{ className?: string }> = ({ className }) => {
  const shareUrl = useShareUrl();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleOpen = async () => {
    try {
      // Check if we're in Tauri desktop environment
      if (typeof window !== "undefined" && (window as any).__TAURI__) {
        console.log("🖥️ Tauri desktop detected - opening in system browser");
        try {
          // Use Tauri shell API to open in system browser
          await invoke("open_url_in_browser", { url: shareUrl });
          console.log("✅ URL opened in system browser via Tauri shell");
          return;
        } catch (tauriError) {
          console.warn(
            "⚠️ Tauri shell failed, falling back to window.open:",
            tauriError,
          );
        }
      }

      // Fallback to window.open for web or if Tauri shell fails
      console.log("🌐 Using window.open to open URL");
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      console.log("✅ URL opened via window.open");
    } catch (error) {
      console.error("❌ Failed to open URL:", error);
      // Final fallback
      try {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      } catch (fallbackError) {
        console.error("❌ All methods failed:", fallbackError);
      }
    }
  };

  // Don't show share link on external sharing domain
  if (isExternalShare()) {
    return null;
  }

  const displayUrl = shareUrl;

  return (
    <div
      className={`flex items-center space-x-2 border border-[var(--border)] rounded-lg px-3 py-1.5 ${className || ""}`}
    >
      <span className="text-[var(--foreground)] text-base font-normal truncate">
        {displayUrl}
      </span>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="ml-2 p-1 rounded hover:bg-[var(--hover)] transition-colors"
        title="Copy URL"
      >
        {copied ? (
          <CheckIcon className="w-5 h-5 text-black dark:text-white" />
        ) : (
          <DocumentDuplicateIcon className="w-5 h-5 text-[var(--foreground)]" />
        )}
      </button>

      {/* Launch Button */}
      <button
        onClick={handleOpen}
        className="p-1 rounded hover:bg-[var(--hover)] transition-colors"
        title="Open in browser"
      >
        <ArrowTopRightOnSquareIcon className="w-5 h-5 text-[var(--foreground)]" />
      </button>
    </div>
  );
};

export const PDFButton: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  // Don't show PDF button on external sharing domain
  if (isExternalShare()) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover)] transition-colors h-[38px] ${className || ""}`}
      title="Download PDF"
      type="button"
    >
      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
      <span>PDF</span>
    </button>
  );
};

interface ShareBarProps {
  onBack?: (() => void) | undefined;
  showBackButton?: boolean;
}

export function ShareBar({
  onBack,
  showBackButton = true,
}: ShareBarProps = {}) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Back button on the left (only inside platform) */}
      {showBackButton && <BackToProfile onBack={onBack} />}

      {/* Share controls on the right (only inside platform) */}
      {!isExternalShare() && (
        <div className="flex items-center gap-3">
          <ShareLink />
          <PDFButton />
        </div>
      )}
    </div>
  );
}
