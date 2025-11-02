import React from 'react';

/**
 * FormField - Reusable form field component
 * 
 * A flexible form field component that can render different types of inputs
 * with proper validation and styling.
 */

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'radio';
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  options = [],
  rows = 3,
  min,
  max,
  step,
  className = '',
  inputClassName = '',
  labelClassName = ''
}: FormFieldProps) {

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    onChange(newValue);
  };

  // Get input classes
  const getInputClasses = () => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
    const errorClasses = error ? 'border-red-300 focus:ring-red-500' : 'border-border';
    const disabledClasses = disabled ? 'bg-panel-background cursor-not-allowed' : 'bg-background';
    
    return `${baseClasses} ${errorClasses} ${disabledClasses} ${inputClassName}`.trim();
  };

  // Get label classes
  const getLabelClasses = () => {
    const baseClasses = 'block text-sm font-medium text-foreground mb-1';
    const errorClasses = error ? 'text-red-700 dark:text-red-300' : '';
    
    return `${baseClasses} ${errorClasses} ${labelClassName}`.trim();
  };

  // Render different input types
  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value: value || '',
      onChange: handleChange,
      placeholder,
      required,
      disabled,
      className: getInputClasses()
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={Boolean(value)}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded"
            />
            <label htmlFor={name} className="ml-2 block text-sm text-foreground">
              {label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${name}-${option.value}`}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={disabled || option.disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border"
                />
                <label htmlFor={`${name}-${option.value}`} className="ml-2 block text-sm text-foreground">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={type}
            {...commonProps}
            min={min}
            max={max}
            step={step}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {type !== 'checkbox' && (
        <label htmlFor={name} className={getLabelClasses()}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-muted">
          {helpText}
        </p>
      )}
    </div>
  );
}
