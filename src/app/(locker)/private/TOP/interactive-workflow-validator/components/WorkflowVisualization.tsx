"use client";

import React, { useEffect, useRef } from 'react';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  dependencies: string[];
  parallel: boolean;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

interface WorkflowVisualizationProps {
  steps: WorkflowStep[];
  selectedStep?: string | null;
  onStepSelect?: (stepId: string) => void;
}

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  steps,
  selectedStep,
  onStepSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const width = 800;
    const height = 600;
    
    // Clear previous content
    svg.innerHTML = '';

    // Create groups for different layers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    // Add gradients
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'runningGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3B82F6');
    gradient.appendChild(stop1);
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#1D4ED8');
    gradient.appendChild(stop2);
    
    defs.appendChild(gradient);

    // Position steps in a flow layout
    const stepPositions = new Map<string, { x: number; y: number }>();
    const stepWidth = 120;
    const stepHeight = 60;
    const horizontalSpacing = 150;
    const verticalSpacing = 100;

    // Calculate positions based on dependencies and parallel execution
    let currentX = 50;
    let currentY = 50;
    const processedSteps = new Set<string>();

    const positionStep = (step: WorkflowStep, level: number = 0) => {
      if (processedSteps.has(step.id)) return;

      // Find parallel steps at the same level
      const parallelSteps = steps.filter(s => 
        s.dependencies.length === step.dependencies.length &&
        s.dependencies.every(dep => step.dependencies.includes(dep)) &&
        s.parallel === step.parallel
      );

      if (parallelSteps.length > 1) {
        // Position parallel steps side by side
        const startX = currentX;
        parallelSteps.forEach((parallelStep, index) => {
          if (!processedSteps.has(parallelStep.id)) {
            stepPositions.set(parallelStep.id, {
              x: startX + (index * horizontalSpacing),
              y: currentY + (level * verticalSpacing)
            });
            processedSteps.add(parallelStep.id);
          }
        });
        currentX += (parallelSteps.length - 1) * horizontalSpacing;
      } else {
        // Position single step
        stepPositions.set(step.id, {
          x: currentX,
          y: currentY + (level * verticalSpacing)
        });
      }

      processedSteps.add(step.id);
      currentX += horizontalSpacing;
    };

    // Process steps in dependency order
    const processSteps = (level: number = 0) => {
      const stepsAtLevel = steps.filter(step => 
        step.dependencies.length === level &&
        !processedSteps.has(step.id)
      );

      if (stepsAtLevel.length === 0) return;

      stepsAtLevel.forEach(step => positionStep(step, level));
      processSteps(level + 1);
    };

    processSteps();

    // Draw connections between steps
    steps.forEach(step => {
      step.dependencies.forEach(depId => {
        const depPos = stepPositions.get(depId);
        const stepPos = stepPositions.get(step.id);
        
        if (depPos && stepPos) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', (depPos.x + stepWidth / 2).toString());
          line.setAttribute('y1', (depPos.y + stepHeight).toString());
          line.setAttribute('x2', (stepPos.x + stepWidth / 2).toString());
          line.setAttribute('y2', stepPos.y.toString());
          line.setAttribute('stroke', '#6B7280');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('marker-end', 'url(#arrowhead)');
          svg.appendChild(line);
        }
      });
    });

    // Add arrow marker
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#6B7280');
    marker.appendChild(polygon);
    defs.appendChild(marker);

    // Draw step boxes
    steps.forEach(step => {
      const pos = stepPositions.get(step.id);
      if (!pos) return;

      const isSelected = selectedStep === step.id;
      const isRunning = step.status === 'running';
      const isCompleted = step.status === 'completed';
      const isError = step.status === 'error';

      // Step box
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', pos.x.toString());
      rect.setAttribute('y', pos.y.toString());
      rect.setAttribute('width', stepWidth.toString());
      rect.setAttribute('height', stepHeight.toString());
      rect.setAttribute('rx', '8');
      rect.setAttribute('ry', '8');
      
      let fillColor = '#F3F4F6'; // Default gray
      let strokeColor = '#D1D5DB';
      let strokeWidth = '2';

      if (isSelected) {
        strokeColor = '#3B82F6';
        strokeWidth = '3';
      }

      if (isRunning) {
        fillColor = 'url(#runningGradient)';
        strokeColor = '#1D4ED8';
      } else if (isCompleted) {
        fillColor = '#10B981';
        strokeColor = '#059669';
      } else if (isError) {
        fillColor = '#EF4444';
        strokeColor = '#DC2626';
      }

      rect.setAttribute('fill', fillColor);
      rect.setAttribute('stroke', strokeColor);
      rect.setAttribute('stroke-width', strokeWidth);
      
      if (onStepSelect) {
        rect.setAttribute('style', 'cursor: pointer');
        rect.addEventListener('click', () => onStepSelect(step.id));
      }

      svg.appendChild(rect);

      // Step name
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (pos.x + stepWidth / 2).toString());
      text.setAttribute('y', (pos.y + stepHeight / 2 - 5).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', isRunning || isCompleted || isError ? 'white' : '#374151');
      text.textContent = step.name;
      svg.appendChild(text);

      // Step type indicator
      const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      typeText.setAttribute('x', (pos.x + stepWidth / 2).toString());
      typeText.setAttribute('y', (pos.y + stepHeight / 2 + 10).toString());
      typeText.setAttribute('text-anchor', 'middle');
      typeText.setAttribute('font-family', 'Arial, sans-serif');
      typeText.setAttribute('font-size', '8');
      typeText.setAttribute('fill', isRunning || isCompleted || isError ? 'white' : '#6B7280');
      typeText.textContent = step.parallel ? '⚡ Parallel' : '➡️ Sequential';
      svg.appendChild(typeText);

      // Status indicator
      if (step.status !== 'pending') {
        const statusCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        statusCircle.setAttribute('cx', (pos.x + stepWidth - 15).toString());
        statusCircle.setAttribute('cy', (pos.y + 15).toString());
        statusCircle.setAttribute('r', '6');
        
        let statusColor = '#6B7280';
        if (isRunning) statusColor = '#3B82F6';
        else if (isCompleted) statusColor = '#10B981';
        else if (isError) statusColor = '#EF4444';
        
        statusCircle.setAttribute('fill', statusColor);
        svg.appendChild(statusCircle);

        // Status text
        const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        statusText.setAttribute('x', (pos.x + stepWidth - 15).toString());
        statusText.setAttribute('y', (pos.y + 18).toString());
        statusText.setAttribute('text-anchor', 'middle');
        statusText.setAttribute('font-family', 'Arial, sans-serif');
        statusText.setAttribute('font-size', '8');
        statusText.setAttribute('fill', 'white');
        statusText.setAttribute('font-weight', 'bold');
        
        if (isRunning) statusText.textContent = '⏳';
        else if (isCompleted) statusText.textContent = '✅';
        else if (isError) statusText.textContent = '❌';
        
        svg.appendChild(statusText);
      }

      // Duration display
      if (step.duration) {
        const durationText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        durationText.setAttribute('x', (pos.x + stepWidth / 2).toString());
        durationText.setAttribute('y', (pos.y + stepHeight + 15).toString());
        durationText.setAttribute('text-anchor', 'middle');
        durationText.setAttribute('font-family', 'Arial, sans-serif');
        durationText.setAttribute('font-size', '8');
        durationText.setAttribute('fill', '#6B7280');
        durationText.textContent = `${step.duration}ms`;
        svg.appendChild(durationText);
      }
    });

    // Add parallel execution indicators
    const parallelGroups = new Map<string, WorkflowStep[]>();
    steps.forEach(step => {
      if (step.parallel) {
        const key = step.dependencies.join(',');
        if (!parallelGroups.has(key)) {
          parallelGroups.set(key, []);
        }
        parallelGroups.get(key)!.push(step);
      }
    });

    parallelGroups.forEach((group, key) => {
      if (group.length > 1) {
        const positions = group.map(step => stepPositions.get(step.id)).filter(Boolean);
        if (positions.length > 1) {
          const minX = Math.min(...positions.map(p => p!.x));
          const maxX = Math.max(...positions.map(p => p!.x + stepWidth));
          const y = positions[0]!.y - 20;

          // Parallel execution bracket
          const bracket = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          bracket.setAttribute('d', `M ${minX} ${y} L ${minX} ${y - 10} L ${maxX} ${y - 10} L ${maxX} ${y}`);
          bracket.setAttribute('stroke', '#8B5CF6');
          bracket.setAttribute('stroke-width', '2');
          bracket.setAttribute('fill', 'none');
          bracket.setAttribute('stroke-dasharray', '5,5');
          svg.appendChild(bracket);

          // Parallel label
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', ((minX + maxX) / 2).toString());
          label.setAttribute('y', (y - 15).toString());
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('font-family', 'Arial, sans-serif');
          label.setAttribute('font-size', '10');
          label.setAttribute('fill', '#8B5CF6');
          label.setAttribute('font-weight', 'bold');
          label.textContent = `⚡ Parallel Execution (${group.length} steps)`;
          svg.appendChild(label);
        }
      }
    });

  }, [steps, selectedStep, onStepSelect]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Visualization</h3>
      <div className="overflow-auto">
        <svg
          ref={svgRef}
          width="800"
          height="600"
          viewBox="0 0 800 600"
          className="border border-gray-200 rounded-lg"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Running</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Error</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-600 font-bold">⚡</span>
          <span>Parallel Execution</span>
        </div>
      </div>
    </div>
  );
};

