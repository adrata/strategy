"use client";

import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface ArchetypeBadgeProps {
  archetype: {
    id: string;
    name: string;
    role: string;
    description?: string;
  };
  showTooltip?: boolean;
}

export function ArchetypeBadge({ archetype, showTooltip = true }: ArchetypeBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const roleColors = {
    'Champion': 'bg-green-100 text-green-800 border-green-200',
    'Stakeholder': 'bg-blue-100 text-blue-800 border-blue-200',
    'Blocker': 'bg-red-100 text-red-800 border-red-200',
    'Decision Maker': 'bg-purple-100 text-purple-800 border-purple-200',
    'Introducer': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const roleColor = roleColors[archetype.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColor}`}>
          {archetype.role}
        </span>
        <span className="text-sm text-muted">
          {archetype.name}
        </span>
        {showTooltip && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-muted hover:text-foreground transition-colors"
            title="View archetype details"
          >
            <InformationCircleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {showDetails && showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-lg z-10 p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-foreground text-sm">
                {archetype.name}
              </h4>
              <p className="text-xs text-muted mt-1">
                {archetype.role} Archetype
              </p>
            </div>
            
            {archetype.description && (
              <div>
                <p className="text-sm text-foreground">
                  {archetype.description}
                </p>
              </div>
            )}
            
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => setShowDetails(false)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
