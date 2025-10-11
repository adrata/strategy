"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useOlympus } from "./layout";
import { CFO_CRO_PIPELINE_STEPS } from "./types/workflow";
import { 
  CircleStackIcon, 
  ArrowPathRoundedSquareIcon, 
  BoltIcon 
} from "@heroicons/react/24/outline";

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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [closestConnectionPoint, setClosestConnectionPoint] = useState<string | null>(null);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [draggingConnection, setDraggingConnection] = useState<{ from: string, fromSide: string } | null>(null);
  const [connections, setConnections] = useState<Array<{ from: string, to: string, fromSide: string, toSide: string }>>([]);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, stepId: string } | null>(null);
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

  // Helper function to get type icon for widgets
  const getTypeIcon = (stepId: string) => {
    if (stepId.startsWith('data-')) return CircleStackIcon;
    if (stepId.startsWith('condition') || stepId.startsWith('switch') || stepId.startsWith('loop') || stepId.startsWith('parallel')) return ArrowPathRoundedSquareIcon;
    if (stepId.startsWith('http-request') || stepId.startsWith('webhook') || stepId.startsWith('delay') || stepId.startsWith('schedule')) return BoltIcon;
    return CircleStackIcon; // Default for existing CFO/CRO pipeline steps
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

  const handleConnectionPointClick = useCallback((stepId: string, side: string) => {
    if (draggingConnection) {
      // Complete the connection
      if (draggingConnection.from !== stepId) {
        setConnections(prev => [...prev, {
          from: draggingConnection.from,
          to: stepId,
          fromSide: draggingConnection.fromSide,
          toSide: side
        }]);
      }
      setDraggingConnection(null);
    } else {
      // Start dragging a connection
      setDraggingConnection({ from: stepId, fromSide: side });
    }
  }, [draggingConnection]);

  const generateWorkflowFromAI = useCallback((description: string) => {
    // Simple pattern matching for workflow generation
    const steps: WorkflowStep[] = [];
    const baseY = 100;
    const stepHeight = 120;
    
    // Parse common workflow patterns
    if (description.toLowerCase().includes('email') || description.toLowerCase().includes('send email')) {
      steps.push({
        id: `email-${Date.now()}`,
        title: 'Send Email',
        description: 'Send automated email',
        position: { x: 300, y: baseY + (steps.length * stepHeight) },
        isActive: false
      });
    }
    
    if (description.toLowerCase().includes('data') || description.toLowerCase().includes('fetch')) {
      steps.push({
        id: `data-${Date.now()}`,
        title: 'Fetch Data',
        description: 'Retrieve data from source',
        position: { x: 300, y: baseY + (steps.length * stepHeight) },
        isActive: false
      });
    }
    
    if (description.toLowerCase().includes('process') || description.toLowerCase().includes('transform')) {
      steps.push({
        id: `process-${Date.now()}`,
        title: 'Process Data',
        description: 'Transform and process information',
        position: { x: 300, y: baseY + (steps.length * stepHeight) },
        isActive: false
      });
    }
    
    if (description.toLowerCase().includes('save') || description.toLowerCase().includes('store')) {
      steps.push({
        id: `save-${Date.now()}`,
        title: 'Save Results',
        description: 'Store processed data',
        position: { x: 300, y: baseY + (steps.length * stepHeight) },
        isActive: false
      });
    }
    
    // Add the generated steps to the workflow
    if (steps.length > 0) {
      setWorkflowSteps(prev => [...prev, ...steps]);
    }
  }, []);

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
          stroke="#d1d5db"
          strokeWidth="1.5"
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
      
      let animationFrameId: number;
      
      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        if (!dragStateRef.current) return;
        
        // Cancel previous animation frame
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
        // Schedule update for next frame
        animationFrameId = requestAnimationFrame(() => {
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
        });
      };

      const handleMouseUp = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        setDraggingStep(null);
        dragStateRef.current = null;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
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
                className="px-4 py-1 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {isCodeMode ? 'Build' : 'Code'}
              </button>
              <button className="px-4 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Share
              </button>
              <button 
                onClick={handleExecute}
                disabled={isExecuting}
                className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
              <button 
                onClick={() => generateWorkflowFromAI('create workflow for sending emails and processing data')}
                className="px-4 py-1 bg-green-100 text-green-600 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
              >
                Test AI
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
            <div className="bg-white border-r border-gray-200 px-3 py-4 text-sm text-gray-500 font-mono">
              {Array.from({ length: 20 }, (_, index) => (
                <div key={index} className="leading-6">
                  {index + 1}
                </div>
              ))}
            </div>
            {/* Code Editor */}
            <div className="flex-1 p-4">
              <textarea
                className="w-full h-full font-mono text-sm text-gray-800 leading-6 bg-transparent border-none outline-none resize-none"
                value={JSON.stringify(workflowSteps, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed)) {
                      setWorkflowSteps(parsed);
                    }
                  } catch (error) {
                    // Invalid JSON, keep current value
                    console.log('Invalid JSON:', error);
                  }
                }}
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white overflow-hidden relative">
          <div 
            className={`absolute inset-0 flex items-center justify-center p-8 ${
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
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, stepId: step.id });
              }}
              onMouseEnter={() => setHoveredCard(step.id)}
              onMouseLeave={() => {
                setHoveredCard(null);
                setClosestConnectionPoint(null);
              }}
              onMouseMove={(e) => {
                if (hoveredCard === step.id) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = e.clientX - rect.left;
                  const mouseY = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  
                  // Calculate distance to each edge
                  const distances = {
                    right: Math.abs(mouseX - rect.width),
                    left: Math.abs(mouseX - 0),
                    top: Math.abs(mouseY - 0),
                    bottom: Math.abs(mouseY - rect.height)
                  };
                  
                  // Find the closest edge
                  const closestEdge = Object.entries(distances).reduce((a, b) => 
                    distances[a[0] as keyof typeof distances] < distances[b[0] as keyof typeof distances] ? a : b
                  )[0];
                  
                  setClosestConnectionPoint(`${step.id}-${closestEdge}`);
                }
              }}
            >
              {/* Connection Points - Only show closest one on hover */}
              {hoveredCard === step.id && closestConnectionPoint && (
                <div
                  className={`absolute w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center transition-all duration-150 hover:border-blue-400 ${
                    closestConnectionPoint === `${step.id}-right` ? '-right-2 top-1/2 transform -translate-y-1/2' :
                    closestConnectionPoint === `${step.id}-left` ? '-left-2 top-1/2 transform -translate-y-1/2' :
                    closestConnectionPoint === `${step.id}-top` ? '-top-2 left-1/2 transform -translate-x-1/2' :
                    closestConnectionPoint === `${step.id}-bottom` ? '-bottom-2 left-1/2 transform -translate-x-1/2' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const side = closestConnectionPoint.split('-')[1];
                    handleConnectionPointClick(step.id, side);
                  }}
                >
                  <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                {/* Type indicator icon */}
                <div className="w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center">
                  {(() => {
                    const IconComponent = getTypeIcon(step.id);
                    return <IconComponent className="w-3 h-3 text-gray-400" />;
                  })()}
                </div>
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
          
          {/* Plus Button */}
          <div className="relative add-popup-container">
            <button 
              onClick={() => setShowAddPopup(!showAddPopup)}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {/* Add Items Popup */}
            {showAddPopup && (
              <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden min-w-[300px] max-h-[400px] overflow-y-auto">
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
                        <div className="w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center">
                          {(() => {
                            const IconComponent = getTypeIcon(item.id);
                            return <IconComponent className="w-3 h-3 text-gray-400" />;
                          })()}
                        </div>
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              const step = workflowSteps.find(s => s.id === contextMenu.stepId);
              if (step) setSelectedStep(step);
              setContextMenu(null);
            }}
          >
            Edit
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              const step = workflowSteps.find(s => s.id === contextMenu.stepId);
              if (step) {
                const newStep = {
                  ...step,
                  id: `${step.id}-copy-${Date.now()}`,
                  position: { x: step.position.x + 20, y: step.position.y + 20 }
                };
                setWorkflowSteps(prev => [...prev, newStep]);
              }
              setContextMenu(null);
            }}
          >
            Duplicate
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              setWorkflowSteps(prev => prev.filter(s => s.id !== contextMenu.stepId));
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
