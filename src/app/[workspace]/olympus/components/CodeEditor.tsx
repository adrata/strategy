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
  const lineCount = codeString.split('\n').length;

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="h-full flex bg-white">
        {/* Line Numbers - Fluid with content */}
        <div className="bg-gray-50 px-4 py-4 text-sm text-gray-500 font-mono select-none">
          {Array.from({ length: Math.max(lineCount, 20) }, (_, index) => (
            <div key={index} className="leading-6 h-6 flex items-center">
              {index + 1}
            </div>
          ))}
        </div>
        {/* Code Editor */}
        <div className="flex-1 py-4 pr-4">
          <textarea
            className="w-full h-full font-mono text-sm text-gray-800 leading-6 bg-transparent border-none outline-none resize-none"
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
            style={{ tabSize: 2 }}
          />
        </div>
      </div>
    </div>
  );
};
