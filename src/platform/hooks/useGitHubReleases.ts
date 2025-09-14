"use client";

import { useState, useEffect } from "react";
import { OSType } from "./useOSDetection";

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  assets: ReleaseAsset[];
}

interface DownloadInfo {
  version: string;
  downloadUrl: string | null;
  fileName: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useGitHubReleases(osType: OSType): DownloadInfo {
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo>({
    version: "",
    downloadUrl: null,
    fileName: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (osType === "unknown" || osType === "ios" || osType === "android") {
      setDownloadInfo((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchLatestRelease = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/adrata/magic/releases/latest",
        );
        if (!response.ok) throw new Error("Failed to fetch");

        const release: GitHubRelease = await response.json();
        const asset = findAssetForOS(release.assets, osType);

        setDownloadInfo({
          version: release.tag_name,
          downloadUrl: asset?.browser_download_url || null,
          fileName: asset?.name || null,
          isLoading: false,
          error: asset ? null : `No ${osType} release found`,
        });
      } catch (error) {
        setDownloadInfo({
          version: "",
          downloadUrl: null,
          fileName: null,
          isLoading: false,
          error: "Failed to fetch releases",
        });
      }
    };

    fetchLatestRelease();
  }, [osType]);

  return downloadInfo;
}

function findAssetForOS(
  assets: ReleaseAsset[],
  osType: OSType,
): ReleaseAsset | null {
  const patterns = {
    macos: /\.(dmg|pkg)$/i,
    windows: /\.(msi|exe)$/i,
    linux: /\.(AppImage|deb)$/i,
  };

  const pattern = patterns[osType as keyof typeof patterns];
  return pattern
    ? assets.find((asset) => pattern.test(asset.name)) || null
    : null;
}
