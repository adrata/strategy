"use client";

import React, { useState, useEffect } from "react";
import { useDatabase } from "../layout";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  record?: Record<string, any> | null;
  mode: 'create' | 'edit';
}

export function RecordModal({ isOpen, onClose, tableName, record, mode }: RecordModalProps) {
  const { refreshData } = useDatabase();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch table schema when modal opens
  useEffect(() => {
    if (isOpen && tableName) {
      fetchSchema();
    }
  }, [isOpen, tableName]);

  // Initialize form data when record or schema changes
  useEffect(() => {
    if (schema) {
      if (mode === 'edit' && record) {
        // Pre-populate with existing record data
        const initialData: Record<string, any> = {};
        schema.columns.forEach((column: any) => {
          if (record[column.name] !== undefined) {
            initialData[column.name] = record[column.name];
          }
        });
        setFormData(initialData);
      } else {
        // Initialize with default values for new record
        const initialData: Record<string, any> = {};
        schema.columns.forEach((column: any) => {
          if (column.defaultValue !== undefined) {
            initialData[column.name] = column.defaultValue;
          } else if (column.nullable) {
            initialData[column.name] = null;
          }
        });
        setFormData(initialData);
      }
    }
  }, [schema, record, mode]);

  const fetchSchema = async () => {
    try {
      const response = await fetch(`/api/database/tables/${tableName}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSchema(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = '/api/database/record';
      const method = mode === 'create' ? 'POST' : 'PATCH';
      
      const payload = {
        tableName,
        data: formData,
        ...(mode === 'edit' && record && { where: { id: record.id } })
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        refreshData();
        onClose();
      } else {
        setError(result.error || 'Operation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (column: any) => {
    const value = formData[column.name];
    const isRequired = !column.nullable && !column.defaultValue;

    switch (column.type) {
      case 'BOOLEAN':
        return (
          <select
            value={value === null ? '' : String(value)}
            onChange={(e) => handleFieldChange(column.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={isRequired}
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'INTEGER':
      case 'Int':
        return (
          <input
            type="number"
            value={value === null ? '' : value}
            onChange={(e) => handleFieldChange(column.name, e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={isRequired}
          />
        );

      case 'REAL':
      case 'Float':
        return (
          <input
            type="number"
            step="any"
            value={value === null ? '' : value}
            onChange={(e) => handleFieldChange(column.name, e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={isRequired}
          />
        );

      case 'TIMESTAMP':
      case 'DateTime':
        return (
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleFieldChange(column.name, e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={isRequired}
          />
        );

      case 'JSONB':
      case 'Json':
        return (
          <textarea
            value={value ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(column.name, parsed);
              } catch {
                handleFieldChange(column.name, e.target.value);
              }
            }}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter valid JSON..."
            required={isRequired}
          />
        );

      default:
        if (column.kind === 'enum') {
          // Handle enum types - this would need to be expanded based on actual enum values
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(column.name, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isRequired}
            />
          );
        }

        // Default to text input
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(column.name, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={isRequired}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {mode === 'create' ? 'Add New Record' : 'Edit Record'}
            </h2>
            <p className="text-sm text-muted">
              {tableName} • {mode === 'create' ? 'Create new record' : 'Update existing record'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {schema && (
            <div className="space-y-4">
              {schema.columns
                .filter((column: any) => !column.isPrimaryKey || mode === 'create')
                .map((column: any) => (
                <div key={column.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.name}
                    {!column.nullable && !column.defaultValue && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {column.isPrimaryKey && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                        Primary Key
                      </span>
                    )}
                    {column.isForeignKey && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                        Foreign Key
                      </span>
                    )}
                  </label>
                  
                  <div className="text-xs text-muted mb-1">
                    Type: {column.type} • {column.nullable ? 'Nullable' : 'Required'}
                    {column.defaultValue && ` • Default: ${column.defaultValue}`}
                  </div>
                  
                  {renderField(column)}
                  
                  {column.description && (
                    <div className="text-xs text-muted mt-1">
                      {column.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Record' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
