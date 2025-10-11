"use client";

import React from "react";

interface DatabaseHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
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
  icon = "🗄️",
  stats = [],
  actions,
  children
}: DatabaseHeaderProps) {
  return (
    <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
      {/* Main Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-lg">{icon}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex items-center gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.label}
                  </div>
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
