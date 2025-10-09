"use client";

import React from 'react';
import { CATEGORY_COLORS, CATEGORY_DESCRIPTIONS } from '@/platform/config/color-palette';

/**
 * Demo component to showcase the category color palette
 * This can be used for testing and reference
 */
export function ColorPaletteDemo() {
  const categories = Object.keys(CATEGORY_COLORS);

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-6">Adrata Category Color Palette</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const colors = CATEGORY_COLORS[category];
          const description = CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS];
          
          return (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.iconBg }}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors.icon }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{category}</h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <span className="text-sm">Primary: {colors.primary}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: colors.light }}
                  />
                  <span className="text-sm">Light: {colors.light}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <span className="text-sm">Background: {colors.bg}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <button 
                  className="w-full px-3 py-2 border rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: colors.light,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.light;
                  }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
