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
            className="text-blue-600 hover:text-blue-800 hover:underline"
            onClick={handleClick}
          >
            {formattedValue}
          </a>
        );

      case 'email':
        return (
          <a
            href={`mailto:${value}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {formattedValue}
          </a>
        );

      case 'phone':
        return (
          <a
            href={`tel:${value}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {formattedValue}
          </a>
        );

      case 'status':
        const statusColors = {
          'active': 'bg-green-100 text-green-800',
          'inactive': 'bg-gray-100 text-gray-800',
          'pending': 'bg-yellow-100 text-yellow-800',
          'completed': 'bg-blue-100 text-blue-800',
          'cancelled': 'bg-red-100 text-red-800',
          'qualified': 'bg-green-100 text-green-800',
          'unqualified': 'bg-red-100 text-red-800',
          'new': 'bg-blue-100 text-blue-800',
          'contacted': 'bg-yellow-100 text-yellow-800',
          'demo': 'bg-purple-100 text-purple-800',
          'proposal': 'bg-orange-100 text-orange-800',
          'negotiation': 'bg-indigo-100 text-indigo-800',
          'closed-won': 'bg-green-100 text-green-800',
          'closed-lost': 'bg-red-100 text-red-800'
        };
        
        const statusClass = statusColors[formattedValue.toLowerCase()] || 'bg-gray-100 text-gray-800';
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {formattedValue}
          </span>
        );

      case 'badge':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
            {initials}
          </div>
        );

      default:
        return (
          <span 
            className={onClick ? 'cursor-pointer hover:text-blue-600' : ''}
            onClick={handleClick}
          >
            {formattedValue}
          </span>
        );
    }
  };

  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {renderContent()}
    </td>
  );
}
