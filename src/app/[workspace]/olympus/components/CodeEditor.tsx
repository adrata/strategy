import React from 'react';
import { WorkflowStep } from '../types';

interface CodeEditorProps {
  workflowSteps: WorkflowStep[];
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  workflowSteps,
  setWorkflowSteps
}) => {
  const codeString = JSON.stringify(workflowSteps, null, 2);
  const lines = codeString.split('\n');
  const lineCount = lines.length;

  return (
    <div className="flex-1 bg-background overflow-hidden">
      <div className="h-full flex">
        {/* Line Numbers */}
        <div className="bg-panel-background text-muted font-mono text-sm select-none flex-shrink-0" style={{ width: '50px' }}>
          {lines.map((_, index) => (
            <div 
              key={index} 
              className="h-6 flex items-center justify-end pr-3"
              style={{ lineHeight: '24px' }}
            >
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Code Editor */}
        <div className="flex-1 relative">
          <textarea
            className="absolute inset-0 w-full h-full font-mono text-sm text-gray-800 bg-transparent border-none outline-none resize-none p-0 m-0"
            value={codeString}
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
            style={{ 
              lineHeight: '24px',
              tabSize: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }}
          />
        </div>
      </div>
    </div>
  );
};
