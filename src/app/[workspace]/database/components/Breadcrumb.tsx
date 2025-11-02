import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="border-b border-border bg-background px-6 py-3">
      <div className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-muted hover:text-foreground transition-colors"
              >
                {index === 0 && '← '}{item.label}
              </button>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
            {index < items.length - 1 && <span className="text-muted">/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
