"use client";

import React from "react";

export function ApiSettingsPanel() {
  return (
    <div className="h-full overflow-y-auto invisible-scrollbar bg-background">
      <div className="max-w-5xl mx-auto pt-8 p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Settings</h1>
          <p className="text-muted mt-1">Configure API preferences and security settings</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <h2 className="font-semibold text-foreground mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Default API Key Expiration
                </label>
                <select className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
                  <option value="never">Never</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
                <p className="text-xs text-muted mt-1">
                  New API keys will use this expiration time by default
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <h2 className="font-semibold text-foreground mb-4">IP Allowlist</h2>
            <p className="text-sm text-muted mb-4">
              Restrict API key usage to specific IP addresses for added security.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="192.168.1.1"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              />
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-hover text-foreground text-sm">
                Add IP Address
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              Leave empty to allow API access from any IP address
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <h2 className="font-semibold text-foreground mb-4">Webhook Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Webhook Signing</h3>
                  <p className="text-sm text-muted">Enable webhook signature verification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

