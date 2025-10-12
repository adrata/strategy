"use client";

import React from "react";
import { ParticleVariant } from "../types/experiment";

interface VariantComparisonProps {
  variants: ParticleVariant[];
  selectedVariant?: ParticleVariant;
  onSelectVariant?: (variant: ParticleVariant) => void;
}

export function VariantComparison({ variants, selectedVariant, onSelectVariant }: VariantComparisonProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">Variant Comparison</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variants.map((variant) => (
          <div
            key={variant.id}
            onClick={() => onSelectVariant?.(variant)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedVariant?.id === variant.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-[var(--border)] hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[var(--foreground)]">{variant.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                variant.isControl ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {variant.isControl ? 'Control' : 'Treatment'}
              </span>
            </div>
            
            {variant.description && (
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                {variant.description}
              </p>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Traffic Weight:</span>
                <span className="text-[var(--foreground)]">{(variant.weight * 100).toFixed(1)}%</span>
              </div>
              
              {/* Mock metrics - will be replaced with real data */}
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Conversion:</span>
                    <span className="ml-1 text-[var(--foreground)]">12.5%</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Cost:</span>
                    <span className="ml-1 text-[var(--foreground)]">$2.40</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Time:</span>
                    <span className="ml-1 text-[var(--foreground)]">1.2s</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Success:</span>
                    <span className="ml-1 text-[var(--foreground)]">94.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
