"use client";

import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

export function ApiWebhooksPanel() {
  return (
    <div className="h-full overflow-y-auto invisible-scrollbar bg-background">
      <div className="max-w-5xl mx-auto pt-8 p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
            <p className="text-muted mt-1">Configure webhooks to receive real-time events</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 text-foreground hover:bg-gray-200 rounded-lg font-medium transition-colors">
            <PlusIcon className="w-4 h-4" />
            Add Webhook
          </button>
        </div>

        {/* Coming Soon */}
        <div className="p-12 border border-border rounded-lg bg-panel-background text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Webhooks Coming Soon</h2>
          <p className="text-muted max-w-md mx-auto">
            Webhook management is currently under development. You'll be able to configure webhooks to receive real-time notifications when events occur in your workspace.
          </p>
        </div>
      </div>
    </div>
  );
}

