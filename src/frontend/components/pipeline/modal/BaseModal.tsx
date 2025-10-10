import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * BaseModal - Reusable modal component with configurable tabs
 * 
 * A flexible modal component that can be configured with different tabs,
 * content, and behaviors. This replaces the monolithic modal components.
 */

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
  description?: string;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tabs?: TabConfig[];
  defaultTab?: string;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children?: React.ReactNode;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  tabs,
  defaultTab,
  footer,
  className = '',
  size = 'lg',
  children
}: BaseModalProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs?.[0]?.id || '');

  // Reset active tab when modal opens
  React.useEffect(() => {
    if (isOpen && tabs && tabs.length > 0) {
      setActiveTab(defaultTab || tabs[0].id);
    }
  }, [isOpen, defaultTab, tabs]);

  if (!isOpen) return null;

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-7xl';
      default:
        return 'max-w-2xl';
    }
  };

  // Get active tab content
  const getActiveTabContent = () => {
    if (!tabs || tabs.length === 0) return children;
    
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    return activeTabConfig?.content || children;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full ${getSizeClasses()} max-h-[90vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 bg-blue-100 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        {tabs && tabs.length > 0 && (
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    {tab.icon && <span>{tab.icon}</span>}
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {getActiveTabContent()}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
