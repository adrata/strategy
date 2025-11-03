"use client";

import React, { useState } from "react";

type Language = 'node' | 'python' | 'curl' | 'javascript';

interface CodeExampleProps {
  apiKey: string;
}

const codeExamples: Record<Language, { label: string; code: (apiKey: string) => string }> = {
  node: {
    label: 'Node.js',
    code: (apiKey: string) => `import fetch from 'node-fetch';

const response = await fetch('https://api.adrata.com/api/v1/buyer-groups', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
});

const buyerGroups = await response.json();
console.log(buyerGroups);`
  },
  python: {
    label: 'Python',
    code: (apiKey: string) => `import requests

headers = {
    'Authorization': f'Bearer {apiKey}',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.adrata.com/api/v1/buyer-groups', headers=headers)
buyer_groups = response.json()
print(buyer_groups)`
  },
  curl: {
    label: 'cURL',
    code: (apiKey: string) => `curl -X GET https://api.adrata.com/api/v1/buyer-groups \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`
  },
  javascript: {
    label: 'JavaScript',
    code: (apiKey: string) => `const response = await fetch('https://api.adrata.com/api/v1/buyer-groups', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
});

const buyerGroups = await response.json();
console.log(buyerGroups);`
  }
};

export function CodeExample({ apiKey }: CodeExampleProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('node');
  const [copied, setCopied] = useState(false);

  const currentCode = codeExamples[selectedLanguage].code(apiKey);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    try {
      const response = await fetch('/api/v1/buyer-groups', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`Success! Found ${data.data?.length || 0} buyer groups.`);
      } else {
        alert(`Error: ${data.error || 'Failed to fetch buyer groups'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to fetch buyer groups'}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Language Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(Object.keys(codeExamples) as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedLanguage === lang
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {codeExamples[lang].label}
          </button>
        ))}
      </div>

      {/* Code Block */}
      <div className="relative">
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100 font-mono">
            <code>{currentCode}</code>
          </pre>
        </div>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        Test API
      </button>
    </div>
  );
}
