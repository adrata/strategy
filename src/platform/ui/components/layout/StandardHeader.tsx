"use client";

import React from "react";

interface StandardHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  stats?: {
    label: string;
    value: string | number;
  }[];
  actions?: React.ReactNode;
}

export function StandardHeader({
  title,
  subtitle,
  stats = [],
  actions
}: StandardHeaderProps) {
  return (
    <div className="bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        {/* Left side - Title and subtitle */}
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{title}</h1>
          {subtitle && (
            <div className="text-sm text-[var(--muted)] mt-1">{subtitle}</div>
          )}
        </div>
        
        {/* Right side - Stats and actions */}
        <div className="flex items-center gap-4">
          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-semibold text-[var(--foreground)]">{stat.value}</div>
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
    </div>
  );
}
