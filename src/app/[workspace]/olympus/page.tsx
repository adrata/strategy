"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useOlympus } from "./layout";
import { WorkflowCanvas } from "./components/WorkflowCanvas";
import { CodeEditor } from "./components/CodeEditor";
import { Toolbar } from "./components/Toolbar";
import { ContextMenu } from "./components/ContextMenu";
import { CommentaryPanel } from "./components/CommentaryPanel";
import { StartPipelineModal } from "./components/StartPipelineModal";
import { useDrag } from "./hooks/useDrag";
import { useZoomPan } from "./hooks/useZoomPan";
import { 
  WorkflowStep, 
  WorkflowConnection, 
  ContextMenuState, 
  ActiveTool 
} from "./types";
import { 
  workflowCategories, 
  getTypeIcon, 
  generateWorkflowFromAI 
} from "./utils/workflowUtils";

export default function OlympusPage() {
  // Set browser title
  useEffect(() => {
    document.title = 'Olympus • Workflows';
  }, []);
  const [activeTool, setActiveTool] = useState<ActiveTool>('cursor');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [positionHistory, setPositionHistory] = useState<Array<WorkflowStep[]>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [closestConnectionPoint, setClosestConnectionPoint] = useState<string | null>(null);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [draggingConnection, setDraggingConnection] = useState<{ from: string, fromSide: string } | null>(null);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showPlayPopup, setShowPlayPopup] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [isCommentaryMode, setIsCommentaryMode] = useState(false);
  const [commentaryLog, setCommentaryLog] = useState<string[]>([]);
  const [stepStatus, setStepStatus] = useState<Record<string, 'success' | 'error' | 'pending'>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { setSelectedStep } = useOlympus();

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

  // Load active tool from localStorage on mount
  useEffect(() => {
    const savedTool = localStorage.getItem('olympus-active-tool');
    if (savedTool === 'cursor' || savedTool === 'hand') {
      setActiveTool(savedTool);
    } else {
      setActiveTool('cursor');
    }
  }, []);

  // Save active tool to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('olympus-active-tool', activeTool);
  }, [activeTool]);

  // Initialize position history
  useEffect(() => {
    if (positionHistory.length === 0) {
      setPositionHistory([[...workflowSteps]]);
      setHistoryIndex(0);
    }
  }, [positionHistory.length]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showAddPopup && !target.closest('.add-popup-container')) {
        setShowAddPopup(false);
      }
      if (showPlayPopup && !target.closest('.play-popup-container')) {
        setShowPlayPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddPopup, showPlayPopup]);

  const saveToHistory = useCallback(() => {
    const newHistory = positionHistory.slice(0, historyIndex + 1);
    newHistory.push([...workflowSteps]);
    setPositionHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [workflowSteps, positionHistory, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setWorkflowSteps([...positionHistory[historyIndex - 1]]);
    }
  }, [historyIndex, positionHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < positionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setWorkflowSteps([...positionHistory[historyIndex + 1]]);
    }
  }, [historyIndex, positionHistory]);

  const handleToolClick = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
  }, []);

  const handleAddItem = useCallback((item: { id: string; title: string; description: string }) => {
    const newStep: WorkflowStep = {
      id: `${item.id}-${Date.now()}`,
      title: item.title,
      description: item.description,
      position: { x: 300, y: 100 + (workflowSteps.length * 120) },
      isActive: false
    };
    setWorkflowSteps(prev => [...prev, newStep]);
    setShowAddPopup(false);
  }, [workflowSteps.length]);

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
      setDraggingConnection({ from: stepId, fromSide: side });
    }
  }, [draggingConnection]);

  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    setCurrentStepIndex(0);
    setIsCommentaryMode(false);
    setCommentaryLog([]);
    setStepStatus({}); // Reset step statuses
    
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= workflowSteps.length - 1) {
          setIsExecuting(false);
          clearInterval(interval);
          intervalRef.current = null;
          return -1;
        }
        
        // Mark current step as successful
        const currentStep = workflowSteps[prev];
        if (currentStep) {
          setStepStatus(prevStatus => ({
            ...prevStatus,
            [currentStep.id]: 'success'
          }));
        }
        
        return prev + 1;
      });
    }, 1000);
    
    intervalRef.current = interval;
  }, [workflowSteps]);

  const handleExecuteWithCommentary = useCallback(() => {
    setIsExecuting(true);
    setCurrentStepIndex(0);
    setIsCommentaryMode(true);
    setCommentaryLog([]);
    setStepStatus({}); // Reset step statuses
    
    // Add initial commentary
    setCommentaryLog(prev => [...prev, "🚀 Starting CFO/CRO Discovery Pipeline execution..."]);
    
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const currentStep = workflowSteps[prev];
        if (currentStep) {
          // Add detailed commentary for each step
          const commentaries = [
            `📊 Step ${prev + 1}: ${currentStep.title} - ${currentStep.description}`,
            `🔍 Processing: ${currentStep.title}`,
            `✅ Completed: ${currentStep.title} - Moving to next step`
          ];
          
          setCommentaryLog(prevLog => [...prevLog, ...commentaries]);
          
          // Mark current step as successful
          setStepStatus(prevStatus => ({
            ...prevStatus,
            [currentStep.id]: 'success'
          }));
        }
        
        if (prev >= workflowSteps.length - 1) {
          setIsExecuting(false);
          setIsCommentaryMode(false);
          setCommentaryLog(prevLog => [...prevLog, "🎉 Pipeline execution completed successfully!"]);
          clearInterval(interval);
          intervalRef.current = null;
          return -1;
        }
        return prev + 1;
      });
    }, 2000); // Slower for commentary
    
    intervalRef.current = interval;
  }, [workflowSteps]);

  const handleStartWithConfig = useCallback((config: any) => {
    // Here you would typically save the config and start the pipeline
    console.log('Starting pipeline with config:', config);
    handleExecute();
  }, [handleExecute]);

  const handleStartWithCommentaryAndConfig = useCallback((config: any) => {
    // Here you would typically save the config and start the pipeline with commentary
    console.log('Starting pipeline with commentary and config:', config);
    handleExecuteWithCommentary();
  }, [handleExecuteWithCommentary]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedStep(null);
    setWorkflowSteps(prev => prev.map(step => ({ ...step, isActive: false })));
  }, [setSelectedStep]);

  const handleStepMouseEnter = useCallback((stepId: string) => {
    setHoveredCard(stepId);
  }, []);

  const handleStepMouseLeave = useCallback(() => {
    setHoveredCard(null);
    setClosestConnectionPoint(null);
  }, []);

  const handleStepMouseMove = useCallback((e: React.MouseEvent, stepId: string) => {
    if (hoveredCard === stepId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const distances = {
        right: Math.abs(mouseX - rect.width),
        left: Math.abs(mouseX - 0),
        top: Math.abs(mouseY - 0),
        bottom: Math.abs(mouseY - rect.height)
      };
      
      const closestEdge = Object.entries(distances).reduce((a, b) => 
        distances[a[0] as keyof typeof distances] < distances[b[0] as keyof typeof distances] ? a : b
      )[0];
      
      setClosestConnectionPoint(`${stepId}-${closestEdge}`);
    }
  }, [hoveredCard]);

  const handleContextMenu = useCallback((e: React.MouseEvent, stepId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, stepId });
  }, []);

  const {
    zoom,
    pan,
    handleWheel,
    handleBackgroundMouseDown,
    handleBackgroundMouseMove,
    handleBackgroundMouseUp
  } = useZoomPan(activeTool);

  // Custom hooks
  const { draggingStep, dragPosition, handleStepMouseDown } = useDrag(
    workflowSteps,
    setWorkflowSteps,
    activeTool,
    saveToHistory,
    zoom,
    pan
  );

  // Add background mouse move/up listeners
  useEffect(() => {
    if (handleBackgroundMouseMove || handleBackgroundMouseUp) {
      document.addEventListener('mousemove', handleBackgroundMouseMove);
      document.addEventListener('mouseup', handleBackgroundMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleBackgroundMouseMove);
        document.removeEventListener('mouseup', handleBackgroundMouseUp);
      };
    }
  }, [handleBackgroundMouseMove, handleBackgroundMouseUp]);

  // ESC key to stop execution
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setSelectedStep(null);
        setWorkflowSteps(prev => prev.map(step => ({ ...step, isActive: false })));
        
        // Stop execution if running
        if (isExecuting && intervalRef.current) {
          setIsExecuting(false);
          setIsCommentaryMode(false);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedStep, isExecuting]);

  return (
    <div className="h-full flex flex-col bg-white">
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
              <button className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isCodeMode ? (
        <CodeEditor 
          workflowSteps={workflowSteps}
          setWorkflowSteps={setWorkflowSteps}
        />
      ) : (
        <WorkflowCanvas
          workflowSteps={workflowSteps}
          setWorkflowSteps={setWorkflowSteps}
          draggingStep={draggingStep}
          dragPosition={dragPosition}
          activeTool={activeTool}
          zoom={zoom}
          pan={pan}
          isExecuting={isExecuting}
          currentStepIndex={currentStepIndex}
          hoveredCard={hoveredCard}
          closestConnectionPoint={closestConnectionPoint}
          stepStatus={stepStatus}
          onStepClick={handleStepClick}
          onStepMouseDown={handleStepMouseDown}
          onStepMouseEnter={handleStepMouseEnter}
          onStepMouseLeave={handleStepMouseLeave}
          onStepMouseMove={handleStepMouseMove}
          onConnectionPointClick={handleConnectionPointClick}
          onContextMenu={handleContextMenu}
          onBackgroundClick={handleBackgroundClick}
          onWheel={handleWheel}
          onBackgroundMouseDown={handleBackgroundMouseDown}
        />
      )}

      {/* Toolbar - Only show in build mode */}
      {!isCodeMode && (
        <Toolbar
          activeTool={activeTool}
          historyIndex={historyIndex}
          positionHistoryLength={positionHistory.length}
          showAddPopup={showAddPopup}
          workflowCategories={workflowCategories}
          isExecuting={isExecuting}
          showPlayPopup={showPlayPopup}
          onToolClick={handleToolClick}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onToggleAddPopup={() => setShowAddPopup(!showAddPopup)}
          onAddItem={handleAddItem}
          onExecute={handleExecute}
          onExecuteWithCommentary={handleExecuteWithCommentary}
          onTogglePlayPopup={() => setShowPlayPopup(!showPlayPopup)}
          onOpenStartModal={() => setShowStartModal(true)}
          getTypeIcon={getTypeIcon}
        />
      )}

      {/* Start Pipeline Modal */}
      <StartPipelineModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStart={handleStartWithConfig}
        onStartWithCommentary={handleStartWithCommentaryAndConfig}
      />

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        workflowSteps={workflowSteps}
        setContextMenu={setContextMenu}
        setSelectedStep={setSelectedStep}
        setWorkflowSteps={setWorkflowSteps}
      />

      {/* AI Commentary Panel */}
      <CommentaryPanel
        isCommentaryMode={isCommentaryMode}
        commentaryLog={commentaryLog}
        isExecuting={isExecuting}
      />
    </div>
  );
}
