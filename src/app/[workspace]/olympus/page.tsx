"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useOlympus } from "./layout";
import { CFO_CRO_PIPELINE_STEPS } from "./types/workflow";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  position: { x: number; y: number };
  isActive: boolean;
}

export default function OlympusPage() {
  const [activeTool, setActiveTool] = useState<'cursor' | 'hand'>('cursor');
  const [draggingStep, setDraggingStep] = useState<string | null>(null);
  const [isDraggingBackground, setIsDraggingBackground] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [positionHistory, setPositionHistory] = useState<Array<typeof workflowSteps>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<string | null>(null);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const { setSelectedStep } = useOlympus();

  // Load active tool from localStorage on mount
  useEffect(() => {
    const savedTool = localStorage.getItem('olympus-active-tool');
    if (savedTool === 'cursor' || savedTool === 'hand') {
      setActiveTool(savedTool);
    } else {
      // Default to cursor if no saved preference
      setActiveTool('cursor');
    }
  }, []);

  // Save active tool to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('olympus-active-tool', activeTool);
  }, [activeTool]);


  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddPopup) {
        const target = event.target as Element;
        if (!target.closest('.add-popup-container')) {
          setShowAddPopup(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddPopup]);

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'company-resolution',
      title: 'Company Resolution',
      description: 'Input company name, resolve domain/ID, detect size',
      position: { x: 100, y: 100 },
      isActive: false
    },
    {
      id: 'executive-discovery',
      title: 'Multi-Strategy Executive Discovery',
      description: '3-tier waterfall: CoreSignal → Executive Research → AI Research (Claude)',
      position: { x: 100, y: 220 },
      isActive: false
    },
    {
      id: 'contact-enrichment',
      title: 'Contact Enrichment',
      description: 'Enhance and validate contact data',
      position: { x: 100, y: 340 },
      isActive: false
    },
    {
      id: 'parallel-verification',
      title: 'Parallel Multi-Source Verification',
      description: 'Run 3 verification types simultaneously (Email/Phone/Person)',
      position: { x: 100, y: 460 },
      isActive: false
    },
    {
      id: 'result-aggregation',
      title: 'Result Aggregation',
      description: 'Merge results with confidence scores',
      position: { x: 100, y: 580 },
      isActive: false
    },
    {
      id: 'efficacy-tracking',
      title: 'Efficacy Tracking',
      description: 'Monitor performance, costs, success rates',
      position: { x: 100, y: 700 },
      isActive: false
    },
    {
      id: 'results-storage',
      title: 'Results Storage',
      description: 'Save with full audit trail',
      position: { x: 100, y: 820 },
      isActive: false
    }
  ]);

  // Initialize position history
  useEffect(() => {
    if (positionHistory.length === 0) {
      setPositionHistory([[...workflowSteps]]);
      setHistoryIndex(0);
    }
  }, [workflowSteps, positionHistory.length]);

  const handleToolClick = (tool: 'cursor' | 'hand') => {
    setActiveTool(tool);
  };

  const workflowCategories = [
    {
      category: 'Data Processing',
      color: 'blue',
      items: [
        { id: 'data-source', title: 'Data Source', description: 'Connect to database or API' },
        { id: 'data-transform', title: 'Transform', description: 'Modify data structure' },
        { id: 'data-filter', title: 'Filter', description: 'Apply conditions to data' },
        { id: 'data-aggregate', title: 'Aggregate', description: 'Group and summarize data' }
      ]
    },
    {
      category: 'Flow Control',
      color: 'purple',
      items: [
        { id: 'condition', title: 'Condition', description: 'If/else branching logic' },
        { id: 'switch', title: 'Switch', description: 'Multiple condition branches' },
        { id: 'loop', title: 'Loop', description: 'Repeat for each item' },
        { id: 'parallel', title: 'Parallel', description: 'Run multiple paths' }
      ]
    },
    {
      category: 'External Actions',
      color: 'green',
      items: [
        { id: 'http-request', title: 'API Call', description: 'Send HTTP request' },
        { id: 'webhook', title: 'Webhook', description: 'Trigger external service' },
        { id: 'delay', title: 'Wait', description: 'Pause execution' },
        { id: 'schedule', title: 'Schedule', description: 'Run at specific time' }
      ]
    }
  ];

  const handleAddItem = (item: { id: string; title: string; description: string }) => {
    const newStep: WorkflowStep = {
      id: `${item.id}-${Date.now()}`,
      title: item.title,
      description: item.description,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      isActive: false
    };
    setWorkflowSteps(prev => [...prev, newStep]);
    setShowAddPopup(false);
  };

  // Helper function to get type color for widgets
  const getTypeColor = (stepId: string) => {
    if (stepId.startsWith('data-')) return 'bg-blue-500';
    if (stepId.startsWith('condition') || stepId.startsWith('switch') || stepId.startsWith('loop') || stepId.startsWith('parallel')) return 'bg-purple-500';
    if (stepId.startsWith('http-request') || stepId.startsWith('webhook') || stepId.startsWith('delay') || stepId.startsWith('schedule')) return 'bg-green-500';
    return 'bg-gray-500'; // Default for existing CFO/CRO pipeline steps
  };

  const handleStepClick = useCallback((stepId: string) => {
    if (activeTool === 'cursor') {
      const clickedStep = workflowSteps.find(step => step.id === stepId);
      if (clickedStep) {
        setSelectedStep(clickedStep);
        setWorkflowSteps(prev => prev.map(step => ({
          ...step,
          isActive: step.id === stepId
        })));
      }
    }
  }, [activeTool, workflowSteps, setSelectedStep]);

  // Memoize connection lines for better performance
  const connectionLines = useMemo(() => {
    return workflowSteps.map((step, index) => {
      if (index === workflowSteps.length - 1) return null;
      const nextStep = workflowSteps[index + 1];
      
      // Calculate widget dimensions to match actual widget size
      const widgetWidth = 200;
      const widgetHeight = 60;
      
      // Start point: right edge of current widget, exactly middle vertically
      const startX = step.position.x + widgetWidth;
      const startY = step.position.y + widgetHeight / 2;
      
      // End point: left edge of next widget, exactly middle vertically
      const endX = nextStep.position.x;
      const endY = nextStep.position.y + widgetHeight / 2;
      
      // Calculate distance and direction for better curve control
      const distance = Math.abs(endX - startX);
      const verticalDiff = endY - startY;
      
      // Dynamic control points based on distance and direction
      const controlOffset = Math.max(30, Math.min(distance * 0.4, 100));
      const verticalOffset = Math.abs(verticalDiff) > 50 ? verticalDiff * 0.2 : 0;
      
      const controlX1 = startX + controlOffset;
      const controlY1 = startY + verticalOffset;
      const controlX2 = endX - controlOffset;
      const controlY2 = endY - verticalOffset;
      
      return (
        <path
          key={`connection-${step.id}-${nextStep.id}`}
          d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
          stroke="#9ca3af"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
  }, [workflowSteps]);

  const handleBackToChat = () => {
    setSelectedStep(null);
    setWorkflowSteps(prev => prev.map(step => ({
      ...step,
      isActive: false
    })));
  };

  const handleExecute = async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setCurrentStepIndex(0);
    
    // Simulate execution through each step
    for (let i = 0; i < workflowSteps.length; i++) {
      setCurrentStepIndex(i);
      
      // Update the current step to running (green)
      setWorkflowSteps(prev => prev.map((step, index) => ({
        ...step,
        isActive: index === i
      })));
      
      // Simulate step execution time
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsExecuting(false);
    setCurrentStepIndex(-1);
  };


  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
    setZoom(newZoom);
  }, [zoom]);

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'hand' && e.target === e.currentTarget) {
      e.preventDefault();
      setIsDraggingBackground(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startPanX = pan.x;
      const startPanY = pan.y;
      
      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        const deltaX = mouseEvent.clientX - startX;
        const deltaY = mouseEvent.clientY - startY;
        setPan({
          x: startPanX + deltaX,
          y: startPanY + deltaY
        });
      };

      const handleMouseUp = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        setIsDraggingBackground(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [activeTool, pan.x, pan.y]);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only dismiss if clicking on the background (not on widgets or other elements)
    if (e.target === e.currentTarget) {
      setSelectedStep(null);
    }
  }, [setSelectedStep]);

  // Save current positions to history
  const saveToHistory = useCallback(() => {
    const newHistory = positionHistory.slice(0, historyIndex + 1);
    newHistory.push([...workflowSteps]);
    setPositionHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [workflowSteps, positionHistory, historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setWorkflowSteps([...positionHistory[historyIndex - 1]]);
    }
  }, [historyIndex, positionHistory]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < positionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setWorkflowSteps([...positionHistory[historyIndex + 1]]);
    }
  }, [historyIndex, positionHistory]);

  const dragStateRef = useRef<{
    stepId: string;
    startX: number;
    startY: number;
    rect: DOMRect;
  } | null>(null);

  const handleStepMouseDown = useCallback((e: React.MouseEvent, stepId: string) => {
    if (activeTool === 'hand') {
      e.preventDefault();
      e.stopPropagation();
      
      setDraggingStep(stepId);
      const step = workflowSteps.find(s => s.id === stepId);
      if (!step) return;
      
      // Calculate offset from mouse to widget center for smooth dragging
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      dragStateRef.current = {
        stepId,
        startX: offsetX,
        startY: offsetY,
        rect
      };
      
      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        if (!dragStateRef.current) return;
        
        const { stepId: currentStepId, startX, startY } = dragStateRef.current;
        const headerHeight = 60;
        const minY = headerHeight + 10; // 10px padding below header
        const newX = Math.max(0, mouseEvent.clientX - startX);
        const newY = Math.max(minY, mouseEvent.clientY - startY);
        
        // Use functional update to avoid dependency on workflowSteps
        setWorkflowSteps(prev => prev.map(s => 
          s.id === currentStepId 
            ? { ...s, position: { x: newX, y: newY } }
            : s
        ));
      };

      const handleMouseUp = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        setDraggingStep(null);
        dragStateRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        // Save to history after drag ends
        setTimeout(() => saveToHistory(), 0);
      };

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [activeTool, saveToHistory]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-700 font-bold text-base">O</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Olympus</h1>
                <p className="text-xs text-gray-600">CFO/CRO Discovery Pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCodeMode(!isCodeMode)}
                className="px-4 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isCodeMode ? 'Build' : 'Code'}
              </button>
              <button className="px-4 py-1 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                Share
              </button>
              <button 
                onClick={handleExecute}
                disabled={isExecuting}
                className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - CFO/CRO Discovery Pipeline Flow */}
      {isCodeMode ? (
        <div className="flex-1 bg-white overflow-hidden">
          <div className="h-full flex">
            {/* Line Numbers */}
            <div className="bg-gray-50 border-r border-gray-200 px-3 py-4 text-sm text-gray-500 font-mono">
              {workflowSteps.map((_, index) => (
                <div key={index} className="leading-6">
                  {index + 1}
                </div>
              ))}
            </div>
            {/* Code Editor */}
            <div className="flex-1 p-4">
              <div className="font-mono text-sm text-gray-800 leading-6">
                {workflowSteps.map((step, index) => (
                  <div key={step.id} className="mb-2">
                    <span className="text-blue-600 font-semibold">step</span>{' '}
                    <span className="text-green-600">"{step.id}"</span>{' '}
                    <span className="text-gray-600">=</span>{' '}
                    <span className="text-purple-600">&#123;</span>
                    <div className="ml-4">
                      <div><span className="text-blue-600">title:</span> <span className="text-green-600">"{step.title}"</span>,</div>
                      <div><span className="text-blue-600">description:</span> <span className="text-green-600">"{step.description}"</span>,</div>
                      <div><span className="text-blue-600">position:</span> <span className="text-purple-600">&#123;</span> <span className="text-blue-600">x:</span> <span className="text-orange-600">{step.position.x}</span>, <span className="text-blue-600">y:</span> <span className="text-orange-600">{step.position.y}</span> <span className="text-purple-600">&#125;</span>,</div>
                      <div><span className="text-blue-600">isActive:</span> <span className="text-orange-600">{step.isActive ? 'true' : 'false'}</span></div>
                    </div>
                    <span className="text-purple-600">&#125;</span>
                    {index < workflowSteps.length - 1 && <span className="text-gray-400">,</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`flex-1 flex items-center justify-center p-8 bg-white overflow-hidden ${
            activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'
          }`}
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
          onWheel={handleWheel}
          onMouseDown={handleBackgroundMouseDown}
          onClick={handleBackgroundClick}
        >
        <div 
          className="relative w-full h-full"
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, width: '100%', height: '100%' }}>
            {connectionLines}
          </svg>

          {/* CFO/CRO Pipeline Step Widgets */}
          {workflowSteps.map((step) => (
            <div
              key={step.id}
              className={`absolute bg-white border rounded-lg p-3 shadow-sm transition-all duration-150 ${
                draggingStep === step.id ? 'scale-105 shadow-xl border-blue-300' : ''
              } ${activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'} ${
                draggingStep === step.id ? 'cursor-grabbing' : ''
              } ${
                isExecuting && currentStepIndex === workflowSteps.findIndex(s => s.id === step.id) 
                  ? 'border-green-500 bg-green-50' 
                  : step.isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-100 hover:border-gray-200'
              }`}
              style={{
                transform: `translate(${step.position.x}px, ${step.position.y}px)`,
                zIndex: draggingStep === step.id ? 1000 : 2,
                width: '200px',
                minHeight: '60px'
              }}
              onMouseDown={(e) => handleStepMouseDown(e, step.id)}
              onClick={() => handleStepClick(step.id)}
            >
              {/* Connection Points */}
              {/* Right side connection point */}
              <div
                className={`absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center transition-all duration-150 ${
                  hoveredConnectionPoint === `${step.id}-right` ? 'scale-125 border-blue-500 bg-blue-50' : 'hover:border-blue-400'
                }`}
                onMouseEnter={() => setHoveredConnectionPoint(`${step.id}-right`)}
                onMouseLeave={() => setHoveredConnectionPoint(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Connect from right side of:', step.title);
                }}
              >
                <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>

              {/* Left side connection point */}
              <div
                className={`absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center transition-all duration-150 ${
                  hoveredConnectionPoint === `${step.id}-left` ? 'scale-125 border-blue-500 bg-blue-50' : 'hover:border-blue-400'
                }`}
                onMouseEnter={() => setHoveredConnectionPoint(`${step.id}-left`)}
                onMouseLeave={() => setHoveredConnectionPoint(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Connect from left side of:', step.title);
                }}
              >
                <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>

              {/* Top side connection point */}
              <div
                className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center transition-all duration-150 ${
                  hoveredConnectionPoint === `${step.id}-top` ? 'scale-125 border-blue-500 bg-blue-50' : 'hover:border-blue-400'
                }`}
                onMouseEnter={() => setHoveredConnectionPoint(`${step.id}-top`)}
                onMouseLeave={() => setHoveredConnectionPoint(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Connect from top side of:', step.title);
                }}
              >
                <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>

              {/* Bottom side connection point */}
              <div
                className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center transition-all duration-150 ${
                  hoveredConnectionPoint === `${step.id}-bottom` ? 'scale-125 border-blue-500 bg-blue-50' : 'hover:border-blue-400'
                }`}
                onMouseEnter={() => setHoveredConnectionPoint(`${step.id}-bottom`)}
                onMouseLeave={() => setHoveredConnectionPoint(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Connect from bottom side of:', step.title);
                }}
              >
                <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>

              <div className="flex items-center gap-2">
                {/* Type indicator */}
                <div className={`w-2 h-2 rounded-full ${getTypeColor(step.id)}`} />
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-medium border ${
                  isExecuting && currentStepIndex === workflowSteps.findIndex(s => s.id === step.id)
                    ? 'bg-green-500 text-white border-green-500'
                    : step.isActive 
                      ? 'bg-gray-200 text-gray-800 border-gray-800' 
                      : 'bg-white text-gray-600 border-gray-300'
                }`}>
                  {workflowSteps.findIndex(s => s.id === step.id) + 1}
                </div>
                <div className="text-xs font-medium text-gray-700">{step.title}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Bottom Toolbar - Floating over dotted area */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-lg">
          {/* Cursor Pointer */}
          <button 
            onClick={() => handleToolClick('cursor')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'cursor' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </button>
          
          {/* Hand Pointer */}
          <button 
            onClick={() => handleToolClick('hand')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'hand' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </button>
          
          {/* Undo Button */}
          <button 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-1.5 transition-colors ${
              historyIndex > 0 
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          {/* Redo Button */}
          <button 
            onClick={handleRedo}
            disabled={historyIndex >= positionHistory.length - 1}
            className={`p-1.5 transition-colors ${
              historyIndex < positionHistory.length - 1 
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          
          {/* Better Plus Button */}
          <div className="relative add-popup-container">
            <button 
              onClick={() => setShowAddPopup(!showAddPopup)}
              className="w-6 h-6 bg-white text-gray-600 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {/* Add Items Popup */}
            {showAddPopup && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[300px] max-h-[400px] overflow-y-auto">
                {workflowCategories.map((category) => (
                  <div key={category.category}>
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-800">{category.category}</span>
                    </div>
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(item.id)}`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">{item.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
