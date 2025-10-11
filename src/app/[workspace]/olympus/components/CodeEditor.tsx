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
  return (
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
  );
};
