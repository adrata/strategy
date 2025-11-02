"use client";

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getPlatform } from "@/platform/platform-detection";

interface BrowserWindowConfig {
  url: string;
  title?: string;
  width?: number;
  height?: number;
}

interface NavigationResult {
  success: boolean;
  message: string;
}

export function NovaBrowser() {
  const [addressBar, setAddressBar] = useState("https://www.google.com");
  const [isDesktop, setIsDesktop] = useState(false);
  const [browserWindows, setBrowserWindows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if running in desktop environment
  useEffect(() => {
    const platform = getPlatform();
    setIsDesktop(platform === "desktop");
  }, []);

  // Load existing browser windows
  useEffect(() => {
    if (isDesktop) {
      loadBrowserWindows();
    }
  }, [isDesktop]);

  const loadBrowserWindows = async () => {
    try {
      const windows = await invoke<string[]>('list_browser_windows');
      setBrowserWindows(windows);
    } catch (error) {
      console.error('Failed to load browser windows:', error);
    }
  };

  const openBrowser = async (url: string) => {
    if (!isDesktop) {
      alert('Nova Browser is only available in the desktop app');
      return;
    }

    setIsLoading(true);
    try {
      const config: BrowserWindowConfig = {
        url: url,
        title: 'Nova Browser',
        width: 1200,
        height: 800
      };

      const result = await invoke<NavigationResult>('create_browser_window', { config });
      
      if (result.success) {
        setAddressBar(url);
        await loadBrowserWindows();
      } else {
        alert(`Failed to open browser: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to open browser:', error);
      alert('Failed to open browser. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToUrl = (url: string) => {
    openBrowser(url);
  };

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(addressBar);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressBarSubmit(e);
    }
  };

  const openPopularSite = (url: string) => {
    setAddressBar(url);
    navigateToUrl(url);
  };

  if (!isDesktop) {
    return (
      <div className="h-full flex flex-col bg-background items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🌌</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Nova Browser</h2>
          <p className="text-muted mb-6">
            Nova Browser is only available in the desktop app.
          </p>
          <p className="text-sm text-muted">
            Please use the desktop version to access the native browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Browser Header */}
      <div className="flex-shrink-0 bg-panel-background border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Address Bar */}
          <form onSubmit={handleAddressBarSubmit} className="flex-1">
            <input
              type="text"
              value={addressBar}
              onChange={(e) => setAddressBar(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter URL or search..."
            />
          </form>

          {/* Open Browser Button */}
          <button
            onClick={() => navigateToUrl(addressBar)}
            disabled={isLoading}
            className="px-4 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Opening...' : 'Open Browser'}
          </button>

          {/* Galaxy Icon */}
          <div className="text-2xl ml-2">🌌</div>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌌</div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Nova Browser</h1>
            <p className="text-muted mb-6">
              Native web browser that can load any website, including LinkedIn and other restricted sites.
            </p>
          </div>

          {/* Quick Access Sites */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => openPopularSite('https://www.linkedin.com')}
              className="p-4 bg-panel-background border border-border rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="text-2xl mb-2">💼</div>
              <div className="font-medium text-foreground">LinkedIn</div>
              <div className="text-sm text-muted">Professional network</div>
            </button>

            <button
              onClick={() => openPopularSite('https://www.google.com')}
              className="p-4 bg-panel-background border border-border rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-medium text-foreground">Google</div>
              <div className="text-sm text-muted">Search engine</div>
            </button>

            <button
              onClick={() => openPopularSite('https://www.github.com')}
              className="p-4 bg-panel-background border border-border rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="text-2xl mb-2">🐙</div>
              <div className="font-medium text-foreground">GitHub</div>
              <div className="text-sm text-muted">Code repository</div>
            </button>

            <button
              onClick={() => openPopularSite('https://www.twitter.com')}
              className="p-4 bg-panel-background border border-border rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="text-2xl mb-2">🐦</div>
              <div className="font-medium text-foreground">Twitter</div>
              <div className="text-sm text-muted">Social media</div>
            </button>

            <button
              onClick={() => openPopularSite('https://www.youtube.com')}
              className="p-4 bg-panel-background border border-border rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="text-2xl mb-2">📺</div>
              <div className="font-medium text-foreground">YouTube</div>
              <div className="text-sm text-muted">Video platform</div>
            </button>

            <button
              onClick={() => openPopularSite('https://www.reddit.com')}
              className="p-4 bg-panel-background border border-border rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium text-foreground">Reddit</div>
              <div className="text-sm text-muted">Discussion forum</div>
            </button>
          </div>

          {/* Active Browser Windows */}
          {browserWindows.length > 0 && (
            <div className="bg-panel-background border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">Active Browser Windows</h3>
              <div className="space-y-2">
                {browserWindows.map((windowId, index) => (
                  <div key={windowId} className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm text-foreground">Browser Window {index + 1}</span>
                    <span className="text-xs text-muted">{windowId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted">
              Click any site above or enter a URL to open it in a new browser window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
