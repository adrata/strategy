"use client";

import React from "react";

interface DatabaseHeaderProps {
  title: string;
  subtitle?: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  actions?: React.ReactNode;
  children?: React.ReactNode; // For additional content like tabs, filters, etc.
}

export function DatabaseHeader({
  title,
  subtitle,
  stats = [],
  actions,
  children
}: DatabaseHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        {/* Left side - Title and subtitle */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {/* Right side - Stats and actions */}
        <div className="flex items-center gap-4">
          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Additional Content (tabs, filters, etc.) */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
