"use client";

import React, { useState } from 'react';

interface ContextSelectorProps {
  inputMode: 'one' | 'many' | 'prompt';
  onInputModeChange: (mode: 'one' | 'many' | 'prompt') => void;
  onFormSubmit: (data: any) => void;
  pipelineType: 'company' | 'buyer-group' | 'person' | 'role';
  isLoading?: boolean;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  inputMode,
  onInputModeChange,
  onFormSubmit,
  pipelineType,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<any>({});
  const [promptText, setPromptText] = useState('');

  const getFormFields = () => {
    switch (pipelineType) {
      case 'company':
        return {
          one: [
            { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Salesforce' },
            { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., SaaS' },
            { name: 'employeeRange', label: 'Employee Range', type: 'text', placeholder: 'e.g., 100-1000' }
          ],
          many: [
            { name: 'industries', label: 'Industries', type: 'text', placeholder: 'e.g., SaaS, FinTech, Healthcare' },
            { name: 'employeeRange', label: 'Employee Range', type: 'text', placeholder: 'e.g., 100-1000' },
            { name: 'minScore', label: 'Minimum Score', type: 'number', placeholder: '70' }
          ]
        };
      
      case 'buyer-group':
        return {
          one: [
            { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Salesforce' },
            { name: 'companyDomain', label: 'Company Domain', type: 'text', placeholder: 'e.g., salesforce.com' }
          ],
          many: [
            { name: 'companyNames', label: 'Company Names', type: 'textarea', placeholder: 'Enter company names, one per line' }
          ]
        };
      
      case 'person':
        return {
          one: [
            { name: 'personName', label: 'Person Name', type: 'text', placeholder: 'e.g., John Smith' },
            { name: 'company', label: 'Company', type: 'text', placeholder: 'e.g., Salesforce' },
            { name: 'title', label: 'Title', type: 'text', placeholder: 'e.g., VP Marketing' }
          ],
          many: [
            { name: 'names', label: 'Person Names', type: 'textarea', placeholder: 'Enter names, one per line' },
            { name: 'companies', label: 'Companies', type: 'textarea', placeholder: 'Enter companies, one per line' }
          ]
        };
      
      case 'role':
        return {
          one: [
            { name: 'roleTitle', label: 'Role Title', type: 'text', placeholder: 'e.g., VP Marketing' },
            { name: 'company', label: 'Company', type: 'text', placeholder: 'e.g., Salesforce' },
            { name: 'seniority', label: 'Seniority Level', type: 'select', options: ['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor'] }
          ],
          many: [
            { name: 'roleTitles', label: 'Role Titles', type: 'textarea', placeholder: 'Enter role titles, one per line' },
            { name: 'companies', label: 'Companies', type: 'textarea', placeholder: 'Enter companies, one per line' },
            { name: 'seniority', label: 'Seniority Level', type: 'select', options: ['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor'] }
          ]
        };
      
      default:
        return { one: [], many: [] };
    }
  };

  const getPromptSuggestions = () => {
    switch (pipelineType) {
      case 'company':
        return [
          "Find SaaS companies with 100-1000 employees that are early adopters of new technology",
          "Show me fintech companies that have recently hired CFOs",
          "Find companies in the healthcare industry that are struggling with manual processes"
        ];
      case 'buyer-group':
        return [
          "Find the buying committee for Salesforce's marketing technology decisions",
          "Show me the decision makers for enterprise software at Microsoft",
          "Identify the key stakeholders for digital transformation at Nike"
        ];
      case 'person':
        return [
          "Research John Smith at Salesforce - what's his innovation profile and buying authority?",
          "Find the VP of Marketing at HubSpot and analyze their influence network",
          "Show me the CFO at Stripe and their career trajectory"
        ];
      case 'role':
        return [
          "Find all VP of Marketing roles at SaaS companies with 500+ employees",
          "Show me C-level executives at fintech startups",
          "Find directors of sales at enterprise software companies"
        ];
      default:
        return [];
    }
  };

  const fields = getFormFields();
  const suggestions = getPromptSuggestions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'prompt') {
      onFormSubmit({ prompt: promptText });
    } else {
      onFormSubmit(formData);
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Configure {pipelineType.charAt(0).toUpperCase() + pipelineType.slice(1)} Discovery
      </h2>

      {/* Input Mode Selection */}
      <div className="mb-6">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="one"
              checked={inputMode === 'one'}
              onChange={() => onInputModeChange('one')}
              className="text-blue-600"
            />
            <span className="text-sm font-medium">Find One</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="many"
              checked={inputMode === 'many'}
              onChange={() => onInputModeChange('many')}
              className="text-blue-600"
            />
            <span className="text-sm font-medium">Find Many</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="prompt"
              checked={inputMode === 'prompt'}
              onChange={() => onInputModeChange('prompt')}
              className="text-blue-600"
            />
            <span className="text-sm font-medium">Use Prompt</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {inputMode === 'prompt' ? (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              AI Prompt
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              required
            />
            
            {/* Prompt Suggestions */}
            <div className="mt-3">
              <p className="text-xs text-muted mb-2">Try these prompts:</p>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPromptText(suggestion)}
                    className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {fields[inputMode]?.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : `Start ${pipelineType.charAt(0).toUpperCase() + pipelineType.slice(1)} Discovery`}
        </button>
      </form>
    </div>
  );
};
