/**
 * State Ranking Manager Component
 * 
 * Modal for managing state-based ranking preferences
 */

"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronUpIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { authFetch } from '@/platform/api-fetch';
import type { StateRankingData, StateRankingValidation } from '../types/StateRankingTypes';

interface StateRankingManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { mode: 'global' | 'state-based', stateOrder: string[] }) => void;
  currentMode: 'global' | 'state-based';
  currentStateOrder: string[];
}

export function StateRankingManager({ 
  isOpen, 
  onClose, 
  onSave, 
  currentMode, 
  currentStateOrder 
}: StateRankingManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stateData, setStateData] = useState<StateRankingData[]>([]);
  const [validation, setValidation] = useState<StateRankingValidation | null>(null);
  const [rankingMode, setRankingMode] = useState<'global' | 'state-based'>(currentMode);
  const [stateOrder, setStateOrder] = useState<string[]>(currentStateOrder);
  const [isSaving, setIsSaving] = useState(false);

  // Load state data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadStateData();
    }
  }, [isOpen]);

  const loadStateData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/v1/speedrun/state-data');
      if (response.ok) {
        const data = await response.json();
        setStateData(data.stateRankings || []);
        setValidation(data.validation);
        
        // Initialize state order if not set
        if (!stateOrder.length && data.stateRankings) {
          setStateOrder(data.stateRankings.map((s: StateRankingData) => s.state));
        }
      }
    } catch (error) {
      console.error('Error loading state data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const moveStateUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...stateOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setStateOrder(newOrder);
    }
  };

  const moveStateDown = (index: number) => {
    if (index < stateOrder.length - 1) {
      const newOrder = [...stateOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setStateOrder(newOrder);
    }
  };

  const resetToDefault = () => {
    const defaultOrder = stateData
      .sort((a, b) => {
        if (b.companyCount !== a.companyCount) {
          return b.companyCount - a.companyCount;
        }
        return a.state.localeCompare(b.state);
      })
      .map(s => s.state);
    setStateOrder(defaultOrder);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        mode: rankingMode,
        stateOrder: stateOrder
      });
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            State-Based Ranking Settings
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Validation Warning */}
              {validation && !validation.isValid && (
                <div className="mb-6 p-4 bg-warning/10 border border-warning rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-warning">
                        Limited State Data Available
                      </h3>
                      <div className="mt-2 text-sm text-foreground">
                        <p>
                          Only {validation.stateDataPercentage.toFixed(1)}% of companies have state data. 
                          State-based ranking may not be effective with this coverage.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranking Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Ranking Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="global"
                      checked={rankingMode === 'global'}
                      onChange={(e) => setRankingMode(e.target.value as 'global')}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-foreground">Global Ranking</div>
                      <div className="text-sm text-muted">
                        Rank all prospects globally by company value and individual score
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="state-based"
                      checked={rankingMode === 'state-based'}
                      onChange={(e) => setRankingMode(e.target.value as 'state-based')}
                      className="mr-3"
                      disabled={!validation?.isValid}
                    />
                    <div>
                      <div className="font-medium text-foreground">State-Based Ranking</div>
                      <div className="text-sm text-muted">
                        Rank by state priority, then company, then person within each state
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* State Ordering */}
              {rankingMode === 'state-based' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                      State Priority Order
                    </label>
                    <button
                      onClick={resetToDefault}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Reset to Default
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {stateOrder.map((state, index) => {
                      const stateInfo = stateData.find(s => s.state === state);
                      return (
                        <div
                          key={state}
                          className="flex items-center justify-between p-3 bg-panel-background rounded-lg border border-border"
                        >
                          <div className="flex items-center">
                            <Bars3Icon className="w-5 h-5 text-muted mr-3" />
                            <div>
                              <div className="font-medium text-foreground">{state}</div>
                              <div className="text-sm text-muted">
                                {stateInfo?.companyCount || 0} companies, {stateInfo?.peopleCount || 0} people
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => moveStateUp(index)}
                              disabled={index === 0}
                              className="p-1 text-muted hover:text-foreground disabled:opacity-50"
                            >
                              <ChevronUpIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveStateDown(index)}
                              disabled={index === stateOrder.length - 1}
                              className="p-1 text-muted hover:text-foreground disabled:opacity-50"
                            >
                              <ChevronDownIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-panel-background">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
