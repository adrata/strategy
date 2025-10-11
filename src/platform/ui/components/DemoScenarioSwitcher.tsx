import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { demoScenarioService } from '@/platform/services/DemoScenarioService';

interface DemoScenario {
  id: string;
  name: string;
  slug: string;
  description: string;
  industry: string;
  targetAudience: string;
  config?: any;
}

interface DemoScenarioSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioSelect: (scenarioSlug: string) => void;
  currentScenario?: string;
}

export function DemoScenarioSwitcher({
  isOpen,
  onClose,
  onScenarioSelect,
  currentScenario
}: DemoScenarioSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [loading, setLoading] = useState(false);

  // Load available demo scenarios from the service
  useEffect(() => {
    if (isOpen) {
      loadAvailableScenarios();
    }
  }, [isOpen]);

  const loadAvailableScenarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/demo-scenarios');
      const data = await response.json();
      
      if (data.success) {
        setScenarios(data.scenarios);
      } else {
        console.error('❌ Failed to load scenarios:', data.error);
        setScenarios([]);
      }
    } catch (error) {
      console.error('❌ Error loading demo scenarios:', error);
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scenario.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scenario.targetAudience.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScenarioSelect = (scenarioSlug: string) => {
    onScenarioSelect(scenarioSlug);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Demo Scenarios
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-3 w-5 h-5 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Scenarios List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-[var(--muted)]">Loading scenarios...</div>
            </div>
          ) : filteredScenarios['length'] === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-[var(--muted)]">No scenarios found</div>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredScenarios.map((scenario) => {
                // Get demo user info from scenario
                const demoUser = scenario.demoUser;
                const userName = demoUser?.name || 'Demo User';
                const userTitle = demoUser?.role || 'Unknown Title';
                const userCompany = demoUser?.company || 'Unknown Company';
                
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handleScenarioSelect(scenario.slug)}
                    className={`w-full text-left p-6 hover:bg-[var(--panel-background)] transition-colors border-b border-gray-100 last:border-b-0 ${
                      currentScenario === scenario.slug ? 'bg-[var(--hover)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-[var(--foreground)]">
                            {scenario.name}
                          </h3>
                          {currentScenario === scenario['slug'] && (
                            <span className="px-2 py-1 text-xs font-medium bg-[var(--foreground)] text-white rounded">
                              Current
                            </span>
                          )}
                        </div>
                        
                        <p className="text-[var(--muted)] text-sm mb-3 leading-relaxed">
                          {scenario.description}
                        </p>
                        
                        {/* Demo User Info */}
                        <div className="mb-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                          <div className="text-sm font-medium text-gray-800">{userName}</div>
                          <div className="text-xs text-[var(--muted)]">{userTitle} at {userCompany}</div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                          <span className="font-medium">
                            Industry: {scenario.industry}
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            Target: {scenario.targetAudience}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] bg-[var(--panel-background)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--muted)]">
              Select a scenario to experience different client perspectives
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 