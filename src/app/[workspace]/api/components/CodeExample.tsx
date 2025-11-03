"use client";

import React, { useState } from "react";

type Language = 'node' | 'rust' | 'python' | 'curl' | 'javascript';

interface CodeExampleProps {
  apiKey: string;
  muted?: boolean;
  onTestSuccess?: () => void;
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
  rust: {
    label: 'Rust',
    code: (apiKey: string) => `use reqwest;
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    
    let response = client
        .get("https://api.adrata.com/api/v1/buyer-groups")
        .header("Authorization", format!("Bearer {}", apiKey))
        .header("Content-Type", "application/json")
        .send()
        .await?;
    
    let buyer_groups: Value = response.json().await?;
    println!("{:?}", buyer_groups);
    
    Ok(())
}`
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

export function CodeExample({ apiKey, muted = false, onTestSuccess }: CodeExampleProps) {
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
        // Call success callback if provided
        if (onTestSuccess) {
          onTestSuccess();
        }
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
                ? muted 
                  ? 'border-gray-200 text-gray-300'
                  : 'border-gray-400 text-foreground'
                : muted
                  ? 'border-transparent text-gray-300 hover:text-gray-300'
                  : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {codeExamples[lang].label}
          </button>
        ))}
      </div>

      {/* Code Block */}
      <div className="relative">
        <div className={`bg-black rounded-lg p-4 overflow-x-auto ${muted ? 'opacity-75' : ''}`}>
          <pre className={`text-sm font-mono ${muted ? 'text-gray-300' : 'text-white'}`}>
            <code>{currentCode}</code>
          </pre>
        </div>
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 px-3 py-1.5 text-sm rounded-md transition-colors flex items-center justify-center ${
            muted 
              ? 'bg-gray-600 hover:bg-gray-500 text-white'
              : 'bg-gray-600 hover:bg-gray-500 text-white'
          }`}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            'Copy'
          )}
        </button>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={muted}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-colors ${
          muted
            ? 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-100 cursor-not-allowed'
            : 'bg-gray-100 border-gray-300 text-foreground hover:bg-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        Test API
      </button>
    </div>
  );
}

