"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, CellValueChangedEvent } from "ag-grid-community";
import { WorkshopDocument } from "../types/document";
import {
  TableCellsIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface GridEditorProps {
  document: WorkshopDocument;
  onSave: (content: any) => void;
  onAutoSave: (content: any) => void;
}

interface GridData {
  rows: string[][];
  columns: string[];
  rowCount: number;
  columnCount: number;
}

const DEFAULT_ROWS = 10;
const DEFAULT_COLUMNS = 10;

// Generate column headers (A, B, C, ...)
function generateColumnHeader(index: number): string {
  let result = '';
  let num = index;
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
}

export function GridEditor({ document, onSave, onAutoSave }: GridEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [rowCount, setRowCount] = useState(DEFAULT_ROWS);
  const [columnCount, setColumnCount] = useState(DEFAULT_COLUMNS);
  const [gridData, setGridData] = useState<GridData>({
    rows: [],
    columns: [],
    rowCount: DEFAULT_ROWS,
    columnCount: DEFAULT_COLUMNS,
  });
  
  const gridApiRef = useRef<GridApi | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize grid data from document or create default
  useEffect(() => {
    if (document.content) {
      try {
        const content = typeof document.content === 'string' 
          ? JSON.parse(document.content) 
          : document.content;
        
        if (content.rows && Array.isArray(content.rows)) {
          setGridData({
            rows: content.rows,
            columns: content.columns || [],
            rowCount: content.rowCount || content.rows.length || DEFAULT_ROWS,
            columnCount: content.columnCount || (content.rows[0]?.length || DEFAULT_COLUMNS),
          });
          setRowCount(content.rowCount || content.rows.length || DEFAULT_ROWS);
          setColumnCount(content.columnCount || (content.rows[0]?.length || DEFAULT_COLUMNS));
        } else {
          initializeEmptyGrid();
        }
      } catch (error) {
        console.error('Error loading document content:', error);
        initializeEmptyGrid();
      }
    } else {
      initializeEmptyGrid();
    }
  }, [document.content]);

  const initializeEmptyGrid = useCallback(() => {
    const rows: string[][] = [];
    for (let i = 0; i < DEFAULT_ROWS; i++) {
      rows.push(new Array(DEFAULT_COLUMNS).fill(''));
    }
    const columns = Array.from({ length: DEFAULT_COLUMNS }, (_, i) => generateColumnHeader(i));
    
    setGridData({
      rows,
      columns,
      rowCount: DEFAULT_ROWS,
      columnCount: DEFAULT_COLUMNS,
    });
    setRowCount(DEFAULT_ROWS);
    setColumnCount(DEFAULT_COLUMNS);
  }, []);

  // Convert grid data to AG Grid row format
  const rowData = useMemo(() => {
    return gridData.rows.map((row, rowIndex) => {
      const rowObj: Record<string, any> = { __rowIndex: rowIndex };
      gridData.columns.forEach((col, colIndex) => {
        rowObj[col] = row[colIndex] || '';
      });
      return rowObj;
    });
  }, [gridData]);

  // Generate column definitions
  const columnDefs = useMemo<ColDef[]>(() => {
    return gridData.columns.map((col) => ({
      field: col,
      headerName: col,
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      width: 150,
      minWidth: 100,
    }));
  }, [gridData.columns]);

  const defaultColDef = useMemo<ColDef>(() => ({
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  }), []);

  const handleCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    if (!gridApiRef.current) return;

    const { rowIndex, colId, newValue } = event;
    const updatedRows = [...gridData.rows];
    
    if (updatedRows[rowIndex]) {
      const colIndex = gridData.columns.indexOf(colId || '');
      if (colIndex >= 0) {
        updatedRows[rowIndex] = [...updatedRows[rowIndex]];
        updatedRows[rowIndex][colIndex] = newValue || '';
        
        setGridData(prev => ({
          ...prev,
          rows: updatedRows,
        }));
        
        triggerAutoSave(updatedRows);
      }
    }
  }, [gridData.rows, gridData.columns]);

  const triggerAutoSave = useCallback((rows: string[][]) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const content = {
        rows,
        columns: gridData.columns,
        rowCount: rows.length,
        columnCount: gridData.columns.length,
        lastModified: new Date().toISOString(),
      };
      onAutoSave(content);
    }, 2000);
  }, [gridData.columns, onAutoSave]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const content = {
        rows: gridData.rows,
        columns: gridData.columns,
        rowCount: gridData.rows.length,
        columnCount: gridData.columns.length,
        lastModified: new Date().toISOString(),
      };
      
      await onSave(content);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, gridData]);

  const handleAddRow = useCallback(() => {
    const newRow = new Array(columnCount).fill('');
    const updatedRows = [...gridData.rows, newRow];
    
    setGridData(prev => ({
      ...prev,
      rows: updatedRows,
      rowCount: updatedRows.length,
    }));
    setRowCount(updatedRows.length);
    triggerAutoSave(updatedRows);
    
    // Scroll to new row
    setTimeout(() => {
      if (gridApiRef.current) {
        gridApiRef.current.ensureIndexVisible(updatedRows.length - 1);
      }
    }, 100);
  }, [gridData.rows, columnCount, triggerAutoSave]);

  const handleAddColumn = useCallback(() => {
    const newColHeader = generateColumnHeader(columnCount);
    const updatedColumns = [...gridData.columns, newColHeader];
    const updatedRows = gridData.rows.map(row => [...row, '']);
    
    setGridData(prev => ({
      ...prev,
      rows: updatedRows,
      columns: updatedColumns,
      columnCount: updatedColumns.length,
    }));
    setColumnCount(updatedColumns.length);
    triggerAutoSave(updatedRows);
  }, [gridData, columnCount, triggerAutoSave]);

  const handleDeleteRow = useCallback(() => {
    if (!gridApiRef.current || gridData.rows.length <= 1) return;
    
    const selectedNodes = gridApiRef.current.getSelectedNodes();
    if (selectedNodes.length === 0) {
      // Delete last row if none selected
      const updatedRows = gridData.rows.slice(0, -1);
      setGridData(prev => ({
        ...prev,
        rows: updatedRows,
        rowCount: updatedRows.length,
      }));
      setRowCount(updatedRows.length);
      triggerAutoSave(updatedRows);
    } else {
      // Delete selected rows
      const selectedIndices = selectedNodes
        .map(node => node.rowIndex)
        .filter(index => index !== null && index !== undefined)
        .sort((a, b) => b! - a!) as number[];
      
      const updatedRows = gridData.rows.filter((_, index) => !selectedIndices.includes(index));
      
      if (updatedRows.length === 0) {
        // Keep at least one empty row
        const rows: string[][] = [];
        for (let i = 0; i < DEFAULT_ROWS; i++) {
          rows.push(new Array(columnCount).fill(''));
        }
        const columns = Array.from({ length: columnCount }, (_, i) => generateColumnHeader(i));
        
        setGridData({
          rows,
          columns,
          rowCount: DEFAULT_ROWS,
          columnCount: columnCount,
        });
        setRowCount(DEFAULT_ROWS);
        setColumnCount(columnCount);
        triggerAutoSave(rows);
      } else {
        setGridData(prev => ({
          ...prev,
          rows: updatedRows,
          rowCount: updatedRows.length,
        }));
        setRowCount(updatedRows.length);
        triggerAutoSave(updatedRows);
      }
    }
  }, [gridData.rows, columnCount, triggerAutoSave]);

  const onGridReady = useCallback((params: any) => {
    gridApiRef.current = params.api;
  }, []);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <TableCellsIcon className="w-6 h-6 text-green-600" />
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{document.title}</h1>
            <p className="text-sm text-[var(--muted)]">Spreadsheet Editor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Grid Stats */}
          <div className="text-sm text-[var(--muted)]">
            {rowCount} row{rowCount !== 1 ? 's' : ''} × {columnCount} column{columnCount !== 1 ? 's' : ''}
          </div>
          
          {/* Save Status */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckIcon className="w-4 h-4" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-600">
                <XMarkIcon className="w-4 h-4" />
                <span className="text-sm">Error</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="px-3 py-1 text-sm bg-[var(--hover)] text-gray-700 rounded hover:bg-[var(--loading-bg)] transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Row
            </button>
            <button
              onClick={handleAddColumn}
              className="px-3 py-1 text-sm bg-[var(--hover)] text-gray-700 rounded hover:bg-[var(--loading-bg)] transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Column
            </button>
            <button
              onClick={handleDeleteRow}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Row
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onCellValueChanged={handleCellValueChanged}
            rowSelection="multiple"
            animateRows={true}
            enableRangeSelection={true}
            suppressRowClickSelection={false}
            domLayout="normal"
          />
        </div>
      </div>
    </div>
  );
}

