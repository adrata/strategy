"use client";

import { useState, useEffect } from "react";

export type OSType =
  | "macos"
  | "windows"
  | "linux"
  | "ios"
  | "android"
  | "unknown";

interface OSInfo {
  type: OSType;
  name: string;
  icon: string;
  isDesktop: boolean;
  isMobile: boolean;
}

export function useOSDetection(): OSInfo {
  const [osInfo, setOSInfo] = useState<OSInfo>({
    type: "unknown",
    name: "Unknown",
    icon: "💻",
    isDesktop: false,
    isMobile: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform?.toLowerCase() || "";

    let detectedOS: OSInfo;

    // Mobile detection first
    if (/iphone|ipad|ipod/.test(userAgent)) {
      detectedOS = {
        type: "ios",
        name: "iOS",
        icon: "📱",
        isDesktop: false,
        isMobile: true,
      };
    } else if (/android/.test(userAgent)) {
      detectedOS = {
        type: "android",
        name: "Android",
        icon: "📱",
        isDesktop: false,
        isMobile: true,
      };
    }
    // Desktop detection
    else if (/mac|darwin/.test(platform) || /mac/.test(userAgent)) {
      detectedOS = {
        type: "macos",
        name: "macOS",
        icon: "🍎",
        isDesktop: true,
        isMobile: false,
      };
    } else if (/win/.test(platform) || /windows/.test(userAgent)) {
      detectedOS = {
        type: "windows",
        name: "Windows",
        icon: "🪟",
        isDesktop: true,
        isMobile: false,
      };
    } else if (/linux/.test(platform) || /linux/.test(userAgent)) {
      detectedOS = {
        type: "linux",
        name: "Linux",
        icon: "🐧",
        isDesktop: true,
        isMobile: false,
      };
    } else {
      detectedOS = {
        type: "unknown",
        name: "Unknown",
        icon: "💻",
        isDesktop: false,
        isMobile: false,
      };
    }

    setOSInfo(detectedOS);
  }, []);

  return osInfo;
}
