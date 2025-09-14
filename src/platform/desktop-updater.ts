// Desktop Auto-Updater - Seamless updates like Slack
// Only works in Tauri desktop environment

import { check } from "@tauri-apps/plugin-updater";

let tauriUpdater: any = null;

async function getTauriUpdater() {
  if (typeof window !== "undefined" && (window as any).__TAURI__) {
    try {
      return { check };
    } catch (error) {
      console.warn("Tauri updater not available:", error);
      return null;
    }
  }
  return null;
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  date?: string;
  body?: string;
}

export class DesktopUpdater {
  private static instance: DesktopUpdater;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

  static getInstance(): DesktopUpdater {
    if (!DesktopUpdater.instance) {
      DesktopUpdater['instance'] = new DesktopUpdater();
    }
    return DesktopUpdater.instance;
  }

  async checkForUpdates(): Promise<UpdateInfo> {
    const updater = await getTauriUpdater();
    if (!updater) {
      return { available: false };
    }

    try {
      if (process['env']['NODE_ENV'] === "development") {
        console.log("🔄 Checking for updates...");
      }
      const update = await updater.check();

      if (update?.available) {
        if (process['env']['NODE_ENV'] === "development") {
          console.log("🆕 Update available:", update.version);
        }

        // Show user-friendly notification
        this.showUpdateNotification(update);

        return {
          available: true,
          version: update.version,
          date: update.date,
          body: update.body,
        };
      } else {
        if (process['env']['NODE_ENV'] === "development") {
          console.log("✅ App is up to date");
        }
        return { available: false };
      }
    } catch (error) {
      console.error("❌ Update check failed:", error);
      return { available: false };
    }
  }

  private showUpdateNotification(update: any) {
    // Create a subtle notification - don't interrupt user workflow
    const notification = document.createElement("div");
    notification['style']['cssText'] = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;
      max-width: 300px;
    `;

    notification['innerHTML'] = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 20px;">🚀</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Update Available</div>
          <div style="font-size: 14px; opacity: 0.9;">Version ${update.version} is ready</div>
          <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">Click to install</div>
        </div>
      </div>
    `;

    notification.addEventListener("click", async () => {
      await this.installUpdate(update);
      notification.remove();
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);

    document.body.appendChild(notification);
  }

  private async installUpdate(update: any) {
    try {
      if (process['env']['NODE_ENV'] === "development") {
        console.log("📦 Installing update...");
      }

      // Show progress indicator
      const progress = this.showProgressIndicator();

      // Install the update
      await update.downloadAndInstall();

      progress.remove();

      // App will restart automatically
      if (process['env']['NODE_ENV'] === "development") {
        console.log("✅ Update installed - app will restart");
      }
    } catch (error) {
      console.error("❌ Update installation failed:", error);

      // Show error message
      const errorMsg = document.createElement("div");
      errorMsg['style']['cssText'] = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      errorMsg['textContent'] = "Update failed. Please try again later.";
      document.body.appendChild(errorMsg);

      setTimeout(() => errorMsg.remove(), 5000);
    }
  }

  private showProgressIndicator() {
    const progress = document.createElement("div");
    progress['style']['cssText'] = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 20px;
      border-radius: 12px;
      z-index: 10001;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    progress['innerHTML'] = `
      <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div>Installing update...</div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(progress);
    return progress;
  }

  startPeriodicChecks() {
    // Check immediately on startup
    setTimeout(() => this.checkForUpdates(), 5000); // 5 second delay

    // Then check every hour
    this['checkInterval'] = setInterval(() => {
      this.checkForUpdates();
    }, this.CHECK_INTERVAL);

    console.log("🔄 Auto-updater started - checking every hour");
  }

  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this['checkInterval'] = null;
    }
  }
}

// Auto-start when imported in desktop environment
if (typeof window !== "undefined" && (window as any).__TAURI__) {
  const updater = DesktopUpdater.getInstance();
  updater.startPeriodicChecks();

  // Also check when app becomes visible again
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updater.checkForUpdates();
    }
  });
}

export default DesktopUpdater;
