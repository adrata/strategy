/**
 * Utility to clear Speedrun localStorage data that might be causing issues
 * Call this function in browser console or from component to reset progress
 * WARNING: This will clear ALL progress tracking data!
 */
export function clearSpeedrunLocalStorage() {
  console.log("🧹 Clearing Speedrun localStorage data...");
  console.log("⚠️ WARNING: This will clear ALL progress tracking data!");

  // Get all localStorage keys
  const keys = Object.keys(localStorage);

  // Clear all speedrun-related keys (including progress tracking)
  const speedrunKeys = keys.filter(
    (key) =>
      key.startsWith("speedrun-state-") ||
      key.includes("Speedrun") ||
      key.includes("daily-progress") ||
      key.includes("weekly-progress"),
  );

  console.log("🗑️ Found speedrun keys to clear:", speedrunKeys);

  speedrunKeys.forEach((key) => {
    console.log(`   Removing: ${key}`);
    localStorage.removeItem(key);
  });

  console.log("✅ Cleared all speedrun localStorage data");
  console.log("🔄 Refresh the page to see changes");

  return speedrunKeys.length;
}

// Auto-clear on import for development (only if needed)
if (typeof window !== "undefined" && window['location']['hostname'] === "localhost") {
  // Only clear if there's a specific flag or it's been a while
  const lastClear = localStorage.getItem("speedrun-last-clear");
  const daysSinceLastClear = lastClear
    ? (Date.now() - parseInt(lastClear)) / (1000 * 60 * 60 * 24)
    : 999;

  if (daysSinceLastClear > 1) {
    // Clear every day in development
    console.log(
      "🔧 Development mode detected - auto-clearing speedrun localStorage (daily reset)",
    );
    clearSpeedrunLocalStorage();
    localStorage.setItem("speedrun-last-clear", Date.now().toString());
  }
}
