"use client";

import React, { useState } from "react";
import { ParticleExperiment } from "../types/experiment";

interface RunExperimentModalProps {
  experiment: ParticleExperiment;
  onClose: () => void;
}

export function RunExperimentModal({ experiment, onClose }: RunExperimentModalProps) {
  const [formData, setFormData] = useState({
    sampleSize: experiment.targetSampleSize || 1000,
    duration: 60, // minutes
    parallel: true,
    assertions: [] as string[]
  });

  const [isRunning, setIsRunning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    
    try {
      // TODO: Implement API call to start experiment
      console.log('Running experiment:', { experimentId: experiment.id, ...formData });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onClose();
    } catch (error) {
      console.error('Failed to start experiment:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Run Experiment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-muted mt-2">
            Configure and start the experiment: <strong>{experiment.name}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Sample Size */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sample Size
              </label>
              <input
                type="number"
                value={formData.sampleSize}
                onChange={(e) => setFormData(prev => ({ ...prev, sampleSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                step="100"
                required
              />
              <p className="text-xs text-muted mt-1">
                Number of test runs to execute per variant
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Maximum Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="1440"
                required
              />
              <p className="text-xs text-muted mt-1">
                Experiment will stop after this duration, even if sample size isn't reached
              </p>
            </div>

            {/* Parallel Execution */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.parallel}
                  onChange={(e) => setFormData(prev => ({ ...prev, parallel: e.target.checked }))}
                  className="mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Run variants in parallel</span>
                  <p className="text-xs text-muted">
                    Execute all variants simultaneously for faster results
                  </p>
                </div>
              </label>
            </div>

            {/* Experiment Info */}
            <div className="bg-[var(--card)] p-4 rounded-lg border border-border">
              <h3 className="font-medium text-foreground mb-2">Experiment Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Type:</span>
                  <span className="text-foreground capitalize">{experiment.experimentType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Confidence Level:</span>
                  <span className="text-foreground">{(experiment.confidenceLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Variants:</span>
                  <span className="text-foreground">2 (Control + Treatment)</span>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Estimated Completion Time</h4>
              <p className="text-sm text-blue-800">
                {formData.parallel 
                  ? `~${Math.ceil(formData.sampleSize / 10)} minutes (parallel execution)`
                  : `~${Math.ceil(formData.sampleSize / 5)} minutes (sequential execution)`
                }
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-border flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-hover transition-colors"
              disabled={isRunning}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Start Experiment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
