"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useWorkshop } from "../layout";
import { WorkshopDocument } from "../types/document";
import { 
  ChartBarIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface MatrixEditorProps {
  document: WorkshopDocument;
  onSave: (content: any) => void;
  onAutoSave: (content: any) => void;
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar';
  title: string;
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  color: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

const chartTypes = [
  { id: 'bar', name: 'Bar Chart', icon: '📊' },
  { id: 'line', name: 'Line Chart', icon: '📈' },
  { id: 'pie', name: 'Pie Chart', icon: '🥧' },
  { id: 'area', name: 'Area Chart', icon: '📉' },
  { id: 'scatter', name: 'Scatter Plot', icon: '⚪' },
  { id: 'radar', name: 'Radar Chart', icon: '🕸️' },
];

const colors = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ffff00'
];

const sampleData = [
  { name: 'Jan', value: 400, sales: 240, profit: 200 },
  { name: 'Feb', value: 300, sales: 139, profit: 150 },
  { name: 'Mar', value: 200, sales: 980, profit: 300 },
  { name: 'Apr', value: 278, sales: 390, profit: 250 },
  { name: 'May', value: 189, sales: 480, profit: 180 },
  { name: 'Jun', value: 239, sales: 380, profit: 220 },
];

export function MatrixEditor({ document, onSave, onAutoSave }: MatrixEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [showAddChart, setShowAddChart] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [dataSource, setDataSource] = useState<any[]>(sampleData);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial data from document
  useEffect(() => {
    if (document.content) {
      try {
        const content = typeof document.content === 'string' 
          ? JSON.parse(document.content) 
          : document.content;
        
        if (content.charts) {
          setCharts(content.charts);
        }
        if (content.dataSource) {
          setDataSource(content.dataSource);
        }
      } catch (error) {
        console.error('Error loading document content:', error);
      }
    }
  }, [document.content]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const content = {
        charts,
        dataSource,
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
  }, [onSave, charts, dataSource]);

  const handleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const content = {
        charts,
        dataSource,
        lastModified: new Date().toISOString(),
      };
      onAutoSave(content);
    }, 3000);
  }, [onAutoSave, charts, dataSource]);

  const addChart = useCallback((type: string) => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: type as any,
      title: `${chartTypes.find(t => t.id === type)?.name} ${charts.length + 1}`,
      data: dataSource,
      xAxisKey: 'name',
      yAxisKey: 'value',
      color: colors[charts.length % colors.length],
      width: 400,
      height: 300,
      x: 50 + (charts.length % 2) * 450,
      y: 50 + Math.floor(charts.length / 2) * 350,
    };
    
    setCharts(prev => [...prev, newChart]);
    setSelectedChart(newChart.id);
    setShowAddChart(false);
    handleAutoSave();
  }, [charts.length, dataSource, handleAutoSave]);

  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
    handleAutoSave();
  }, [handleAutoSave]);

  const deleteChart = useCallback((chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
    if (selectedChart === chartId) {
      setSelectedChart(null);
    }
    handleAutoSave();
  }, [selectedChart, handleAutoSave]);

  const renderChart = (chart: ChartConfig) => {
    const commonProps = {
      width: chart.width,
      height: chart.height,
      data: chart.data,
    };

    switch (chart.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={chart.yAxisKey} fill={chart.color} />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={chart.yAxisKey} stroke={chart.color} strokeWidth={2} />
          </LineChart>
        );
      
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={chart.data}
              cx={chart.width / 2}
              cy={chart.height / 2}
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={chart.yAxisKey}
            >
              {chart.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xAxisKey} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey={chart.yAxisKey} stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
          </AreaChart>
        );
      
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid />
            <XAxis dataKey={chart.xAxisKey} />
            <YAxis dataKey={chart.yAxisKey} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter dataKey={chart.yAxisKey} fill={chart.color} />
          </ScatterChart>
        );
      
      case 'radar':
        return (
          <RadarChart {...commonProps}>
            <PolarGrid />
            <PolarAngleAxis dataKey={chart.xAxisKey} />
            <PolarRadiusAxis />
            <Radar name="Value" dataKey={chart.yAxisKey} stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
          </RadarChart>
        );
      
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const exportDashboard = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // This is a simplified export - in a real implementation, you'd use a library like html2canvas
    const dataStr = JSON.stringify({ charts, dataSource }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.title}-dashboard.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [charts, dataSource, document.title]);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Minimal Header - Olympus Style */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--foreground)]">{document.title}</h1>
                <p className="text-xs text-[var(--muted)]">
                  {charts.length} chart{charts.length !== 1 ? 's' : ''} 
                  {saveStatus === 'saved' && ' • ✓ Saved'}
                  {saveStatus === 'saving' && ' • Saving...'}
                  {saveStatus === 'error' && ' • Error'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Page Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Sidebar - Collapsible */}
        {!isPreviewMode && !isSidebarCollapsed && (
          <div className="absolute left-0 top-0 bottom-0 w-80 border-r border-[var(--border)] bg-[var(--panel-background)] flex flex-col z-20 shadow-lg">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-medium text-gray-700">Charts</h3>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chart List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {charts.map((chart) => (
                  <div
                    key={chart.id}
                    onClick={() => setSelectedChart(chart.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChart === chart.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-[var(--foreground)]">{chart.title}</h4>
                        <p className="text-xs text-[var(--muted)] capitalize">{chart.type} Chart</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChart(chart.id);
                        }}
                        className="p-1 text-[var(--muted)] hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Toggle Button when collapsed */}
        {!isPreviewMode && isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute left-4 top-4 z-20 p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg hover:bg-[var(--panel-background)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Canvas */}
        <div className="h-full relative overflow-auto bg-[var(--hover)]">
          {charts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No charts yet</h3>
                <p className="text-[var(--muted)] mb-4">Create your first chart to get started</p>
                <button
                  onClick={() => setShowAddChart(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Chart
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="relative" style={{ width: '100%', height: '100%' }}>
                {charts.map((chart) => (
                  <div
                    key={chart.id}
                    className={`absolute border-2 rounded-lg bg-[var(--background)] shadow-lg ${
                      selectedChart === chart.id ? 'border-blue-500' : 'border-[var(--border)]'
                    }`}
                    style={{
                      left: chart.x,
                      top: chart.y,
                      width: chart.width,
                      height: chart.height,
                    }}
                    onClick={() => setSelectedChart(chart.id)}
                  >
                    <div className="p-3 border-b border-[var(--border)] bg-[var(--panel-background)] rounded-t-lg">
                      <h4 className="text-sm font-medium text-[var(--foreground)]">{chart.title}</h4>
                    </div>
                    <div className="p-2">
                      <ResponsiveContainer width="100%" height={chart.height - 60}>
                        {renderChart(chart)}
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating Toolbar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1.5 shadow-lg">
            <button
              onClick={() => setShowAddChart(true)}
              className="p-1.5 text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)] transition-colors"
              title="Add Chart"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-[var(--border)]" />
            
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`p-1.5 rounded transition-colors ${
                isPreviewMode
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)]'
              }`}
              title="Preview Mode"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportDashboard}
              className="p-1.5 text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)] transition-colors"
              title="Export"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`p-1.5 rounded transition-colors ${
                isSaving
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Save"
            >
              {saveStatus === 'saved' ? (
                <CheckIcon className="w-4 h-4" />
              ) : saveStatus === 'saving' ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Cog6ToothIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Chart Modal */}
      {showAddChart && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-[var(--panel-background)]0 bg-opacity-75 transition-opacity" onClick={() => setShowAddChart(false)} />
            
            <div className="relative bg-[var(--background)] rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Add Chart</h3>
                <button
                  onClick={() => setShowAddChart(false)}
                  className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {chartTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => addChart(type.id)}
                      className="p-4 text-left border border-[var(--border)] rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <h4 className="font-medium text-[var(--foreground)] group-hover:text-blue-600 transition-colors">
                        {type.name}
                      </h4>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
