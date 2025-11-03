"use client";

import React from "react";
import { useApi } from "./layout";
import { ApiMiddlePanel } from "./components/ApiMiddlePanel";
import { ApiDocumentationPanel } from "./components/ApiDocumentationPanel";
import { ApiUsagePanel } from "./components/ApiUsagePanel";
import { ApiWebhooksPanel } from "./components/ApiWebhooksPanel";
import { ApiSettingsPanel } from "./components/ApiSettingsPanel";

export default function ApiKeysPage() {
  const { activeTab } = useApi();

  switch (activeTab) {
    case 'documentation':
      return <ApiDocumentationPanel />;
    case 'usage':
      return <ApiUsagePanel />;
    case 'webhooks':
      return <ApiWebhooksPanel />;
    case 'settings':
      return <ApiSettingsPanel />;
    case 'keys':
    default:
      return <ApiMiddlePanel />;
  }
}
