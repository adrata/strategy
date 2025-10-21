"use client";

import React from 'react';

interface ArchetypeBadgeProps {
  archetype: {
    id: string;
    name: string;
    role: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function ArchetypeBadge({ archetype, size = 'md' }: ArchetypeBadgeProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Champion': return 'bg-green-100 text-green-800 border-green-200';
      case 'Stakeholder': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Blocker': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Decision Maker': return 'bg-red-100 text-red-800 border-red-200';
      case 'Introducer': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs';
      case 'lg': return 'px-4 py-2 text-base';
      default: return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border font-medium ${getRoleColor(archetype.role)} ${getSizeClasses(size)}`}>
      <div className="w-2 h-2 bg-current rounded-full"></div>
      {archetype.name}
    </div>
  );
}
