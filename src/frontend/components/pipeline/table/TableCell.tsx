import React from 'react';

/**
 * TableCell - Reusable table cell component
 * 
 * A flexible table cell component that can render different types of content
 * and handle various data types with proper formatting.
 */

export interface TableCellProps {
  value: any;
  type?: 'text' | 'email' | 'phone' | 'date' | 'currency' | 'number' | 'status' | 'badge' | 'link' | 'avatar';
  className?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  format?: (value: any) => string;
  children?: React.ReactNode;
}

export function TableCell({ 
  value, 
  type = 'text', 
  className = '', 
  onClick, 
  href, 
  target,
  format,
  children 
}: TableCellProps) {
  // Handle click events
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Format the value based on type
  const formatValue = (val: any): string => {
    if (format) {
      return format(val);
    }

    if (val === null || val === undefined) {
      return '-';
    }

    switch (type) {
      case 'email':
        return val;
      case 'phone':
        return val;
      case 'date':
        if (val instanceof Date) {
          return val.toLocaleDateString();
        }
        if (typeof val === 'string') {
          return new Date(val).toLocaleDateString();
        }
        return val;
      case 'currency':
        if (typeof val === 'number') {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(val);
        }
        return val;
      case 'number':
        if (typeof val === 'number') {
          return val.toLocaleString();
        }
        return val;
      case 'status':
        return val;
      default:
        return String(val);
    }
  };

  // Render different cell types
  const renderContent = () => {
    if (children) {
      return children;
    }

    const formattedValue = formatValue(value);

    switch (type) {
      case 'link':
        return (
          <a
            href={href || '#'}
            target={target}
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
            onClick={handleClick}
          >
            {formattedValue}
          </a>
        );

      case 'email':
        return (
          <a
            href={`mailto:${value}`}
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
          >
            {formattedValue}
          </a>
        );

      case 'phone':
        return (
          <a
            href={`tel:${value}`}
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
          >
            {formattedValue}
          </a>
        );

      case 'status':
        const statusColors = {
          'active': 'bg-[var(--badge-qualified-bg)] text-[var(--badge-qualified-text)]',
          'inactive': 'bg-[var(--hover)] text-[var(--muted)]',
          'pending': 'bg-[var(--badge-contacted-bg)] text-[var(--badge-contacted-text)]',
          'completed': 'bg-[var(--badge-qualified-bg)] text-[var(--badge-qualified-text)]',
          'cancelled': 'bg-[var(--badge-lost-bg)] text-[var(--badge-lost-text)]',
          'qualified': 'bg-[var(--badge-qualified-bg)] text-[var(--badge-qualified-text)]',
          'unqualified': 'bg-[var(--badge-lost-bg)] text-[var(--badge-lost-text)]',
          'new': 'bg-[var(--badge-new-bg)] text-[var(--badge-new-text)]',
          'contacted': 'bg-[var(--badge-contacted-bg)] text-[var(--badge-contacted-text)]',
          'demo': 'bg-[var(--badge-contacted-bg)] text-[var(--badge-contacted-text)]',
          'proposal': 'bg-[var(--badge-contacted-bg)] text-[var(--badge-contacted-text)]',
          'negotiation': 'bg-[var(--badge-contacted-bg)] text-[var(--badge-contacted-text)]',
          'closed-won': 'bg-[var(--badge-qualified-bg)] text-[var(--badge-qualified-text)]',
          'closed-lost': 'bg-[var(--badge-lost-bg)] text-[var(--badge-lost-text)]'
        };
        
        const statusClass = statusColors[formattedValue.toLowerCase()] || 'bg-[var(--hover)] text-[var(--muted)]';
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {formattedValue}
          </span>
        );

      case 'badge':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--hover)] text-[var(--muted)]">
            {formattedValue}
          </span>
        );

      case 'avatar':
        if (typeof value === 'string' && value.startsWith('http')) {
          return (
            <img
              src={value}
              alt="Avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
          );
        }
        // Fallback to initials
        const initials = formattedValue
          .split(' ')
          .map((word: string) => word.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2);
        
        return (
          <div className="h-8 w-8 rounded-full bg-[var(--hover)] flex items-center justify-center text-xs font-medium text-[var(--muted)]">
            {initials}
          </div>
        );

      default:
        return (
          <span 
            className={onClick ? 'cursor-pointer hover:text-[var(--accent)]' : ''}
            onClick={handleClick}
          >
            {formattedValue}
          </span>
        );
    }
  };

  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)] ${className}`}>
      {renderContent()}
    </td>
  );
}
