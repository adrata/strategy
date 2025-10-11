import React, { useState } from 'react';
import { XMarkIcon, PlayIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface StartPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: PipelineConfig) => void;
  onStartWithCommentary: (config: PipelineConfig) => void;
}

interface PipelineConfig {
  companyName: string;
  domain: string;
  expectedSize: string;
  targetRoles: string[];
  customInstructions: string;
}

export const StartPipelineModal: React.FC<StartPipelineModalProps> = ({
  isOpen,
  onClose,
  onStart,
  onStartWithCommentary
}) => {
  const [config, setConfig] = useState<PipelineConfig>({
    companyName: '',
    domain: '',
    expectedSize: 'medium',
    targetRoles: ['CFO', 'CRO'],
    customInstructions: ''
  });

  const handleSubmit = (withCommentary: boolean = false) => {
    if (!config.companyName.trim()) {
      alert('Please enter a company name');
      return;
    }
    
    if (withCommentary) {
      onStartWithCommentary(config);
    } else {
      onStart(config);
    }
    onClose();
  };

  const handleRoleToggle = (role: string) => {
    setConfig(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Configure Pipeline Start</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Set up your CFO/CRO discovery pipeline parameters</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--foreground)]">Company Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="e.g., Acme Corporation"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain (Optional)
              </label>
              <input
                type="text"
                value={config.domain}
                onChange={(e) => setConfig(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="e.g., acme.com"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Company Size
              </label>
              <select
                value={config.expectedSize}
                onChange={(e) => setConfig(prev => ({ ...prev, expectedSize: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="startup">Startup (1-50 employees)</option>
                <option value="small">Small (51-200 employees)</option>
                <option value="medium">Medium (201-1000 employees)</option>
                <option value="large">Large (1001-5000 employees)</option>
                <option value="enterprise">Enterprise (5000+ employees)</option>
              </select>
            </div>
          </div>

          {/* Target Roles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--foreground)]">Target Roles</h3>
            <div className="grid grid-cols-2 gap-3">
              {['CFO', 'CRO', 'CEO', 'CTO', 'CMO', 'VP Finance', 'VP Sales', 'VP Marketing'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleToggle(role)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    config.targetRoles.includes(role)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-[var(--background)] border-[var(--border)] text-gray-700 hover:bg-[var(--panel-background)]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--foreground)]">Custom Instructions (Optional)</h3>
            <textarea
              value={config.customInstructions}
              onChange={(e) => setConfig(prev => ({ ...prev, customInstructions: e.target.value }))}
              placeholder="Any specific requirements or preferences for the discovery process..."
              rows={4}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[var(--border)] bg-[var(--panel-background)]">
          <div className="text-sm text-[var(--muted)]">
            Pipeline will discover and enrich contacts for the selected roles
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[var(--muted)] hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              Start Pipeline
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Start with Commentary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
