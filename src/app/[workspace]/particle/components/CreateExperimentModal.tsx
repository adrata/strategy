"use client";

import React, { useState } from "react";
import { CreateExperimentForm } from "../types/experiment";

interface CreateExperimentModalProps {
  onClose: () => void;
}

export function CreateExperimentModal({ onClose }: CreateExperimentModalProps) {
  const [formData, setFormData] = useState<CreateExperimentForm>({
    name: '',
    description: '',
    hypothesis: '',
    experimentType: 'ab_test',
    targetSampleSize: 1000,
    confidenceLevel: 0.95,
    significanceLevel: 0.05,
    variants: [
      {
        name: 'Control',
        description: 'Current configuration',
        configuration: {},
        isControl: true,
        weight: 0.5
      },
      {
        name: 'Treatment A',
        description: 'Modified configuration',
        configuration: {},
        isControl: false,
        weight: 0.5
      }
    ]
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to create experiment
    console.log('Creating experiment:', formData);
    onClose();
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: `Treatment ${String.fromCharCode(65 + prev.variants.length - 1)}`,
          description: '',
          configuration: {},
          isControl: false,
          weight: 1 / (prev.variants.length + 1)
        }
      ]
    }));
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length > 2) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }));
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Experiment Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pipeline Performance Optimization"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what you're testing and why..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Hypothesis</label>
              <textarea
                value={formData.hypothesis}
                onChange={(e) => setFormData(prev => ({ ...prev, hypothesis: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Using parallel processing will reduce execution time by 30%"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Experiment Type</label>
              <select
                value={formData.experimentType}
                onChange={(e) => setFormData(prev => ({ ...prev, experimentType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ab_test">A/B Test</option>
                <option value="multivariate">Multivariate</option>
                <option value="performance">Performance</option>
                <option value="conversion">Conversion</option>
                <option value="retention">Retention</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Sample Size</label>
              <input
                type="number"
                value={formData.targetSampleSize}
                onChange={(e) => setFormData(prev => ({ ...prev, targetSampleSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                step="100"
              />
              <p className="text-xs text-muted mt-1">
                Larger sample sizes provide more reliable results but take longer to complete
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confidence Level</label>
                <input
                  type="number"
                  value={formData.confidenceLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, confidenceLevel: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.8"
                  max="0.99"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Significance Level</label>
                <input
                  type="number"
                  value={formData.significanceLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, significanceLevel: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.01"
                  max="0.2"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Add Variant
              </button>
            </div>
            
            {formData.variants.map((variant, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">Variant {index + 1}</h4>
                  {formData.variants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <input
                      type="text"
                      value={variant.description}
                      onChange={(e) => updateVariant(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={variant.isControl}
                        onChange={(e) => updateVariant(index, 'isControl', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">Control Group</span>
                    </label>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-foreground mb-1">Traffic Weight</label>
                      <input
                        type="number"
                        value={variant.weight}
                        onChange={(e) => updateVariant(index, 'weight', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="1"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Ready to Create Experiment</h3>
              <p className="text-sm text-blue-800">
                Review your experiment configuration below. You can always modify these settings after creation.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">Name:</span>
                <span className="text-foreground">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Type:</span>
                <span className="text-foreground capitalize">{formData.experimentType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Sample Size:</span>
                <span className="text-foreground">{formData.targetSampleSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Variants:</span>
                <span className="text-foreground">{formData.variants.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Confidence Level:</span>
                <span className="text-foreground">{(formData.confidenceLevel * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Create Experiment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {renderStep()}
          </div>

          <div className="p-6 border-t border-border flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Experiment
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
