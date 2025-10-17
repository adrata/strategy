"use client";

import React from 'react';

type BentoSize = 'stat' | 'hero' | 'chart' | 'mini';
type BentoColor = 'default' | 'success' | 'warning' | 'danger';

interface BentoCardProps {
  size: BentoSize;
  color?: BentoColor;
  children: React.ReactNode;
  className?: string;
}

export function BentoCard({ 
  size, 
  color = 'default', 
  children,
  className = ''
}: BentoCardProps) {
  const sizeClasses = {
    stat: 'col-span-1 row-span-1',
    hero: 'col-span-2 row-span-1 lg:col-span-2',
    chart: 'col-span-2 row-span-2 lg:col-span-2',
    mini: 'col-span-1 row-span-1'
  };

  const colorClasses = {
    default: 'border-[var(--border)] bg-[var(--background)]',
    success: 'border-green-500 bg-green-100',
    warning: 'border-[var(--border)] bg-white',
    danger: 'border-red-500 bg-red-100'
  };
  
  return (
    <div className={`
      ${sizeClasses[size]}
      p-6 rounded-lg border-2 ${colorClasses[color]}
      transition-all shadow-sm hover:shadow-md
      ${className}
    `}>
      {children}
    </div>
  );
}
