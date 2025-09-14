// Universal API fetch utility for web/desktop
import { getPlatform } from "./platform-detection";

/**
 * safeApiFetch: Only allows /api/* calls in web mode. Throws or uses fallback in desktop mode.
 * @param url - The API endpoint (should be /api/* for web, or full URL for desktop)
 * @param options - Fetch options
 * @param fallback - Optional fallback data for desktop mode
 */
export async function safeApiFetch<T = any>(
  url: string,
  options?: RequestInit,
  fallback?: T,
): Promise<T> {
  const platform = getPlatform();

  // Handle full URLs (including production API calls)
  if (url.startsWith("http")) {
    const res = await fetch(url, {
      credentials: "include",
      ...options,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  // Only allow /api/* in web mode
  if (url.startsWith("/api/")) {
    if (platform === "web") {
      const res = await fetch(url, {
        credentials: "include",
        ...options,
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    } else {
      if (fallback !== undefined) return fallback;
      throw new Error(
        "API route not available in desktop mode. Use external API or static data.",
      );
    }
  }

  // For other URLs, allow in any mode
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
