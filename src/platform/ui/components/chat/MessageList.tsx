"use client";

import React, { useCallback } from 'react';
import { InChatTodoList } from './InChatTodoList';
import { TypewriterText } from './TypewriterText';
import { FileDisplayWidget } from './FileDisplayWidget';
import { EnrichmentProgressTracker, createCFOEnrichmentSteps } from './EnrichmentProgressTracker';

// Progress component with state management
function EnrichmentProgressComponent({ message }: { message: any }) {
  const progressData = JSON.parse(message.content.replace('ENRICHMENT_PROGRESS:', ''));
  const [steps, setSteps] = React.useState(createCFOEnrichmentSteps());
  const [currentRecord, setCurrentRecord] = React.useState(0);
  const [isComplete, setIsComplete] = React.useState(false);

  // Simulate progress updates
  React.useEffect(() => {
    const progressInterval = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const currentStepIndex = newSteps.findIndex(step => step['status'] === 'in_progress');
        
        if (currentStepIndex === -1) {
          // Start first step
          newSteps[0].status = 'in_progress';
          return newSteps;
        }
        
        // Complete current step and start next
        if (Math.random() > 0.3) { // 70% chance to complete step
          newSteps[currentStepIndex].status = 'completed';
          
          if (currentStepIndex < newSteps.length - 1) {
            newSteps[currentStepIndex + 1].status = 'in_progress';
          } else {
            // All steps complete
            setIsComplete(true);
            clearInterval(progressInterval);
          }
        }
        
        return newSteps;
      });
      
      // Update record progress
      setCurrentRecord(prev => {
        const next = prev + Math.floor(Math.random() * 2) + 1;
        return Math.min(next, progressData.totalRecords);
      });
    }, 2000);

    return () => clearInterval(progressInterval);
  }, [progressData.totalRecords]);

  return (
    <div className="my-2">
      <EnrichmentProgressTracker
        totalRecords={progressData.totalRecords}
        currentRecord={currentRecord}
        currentStep="enriching"
        steps={steps}
        isComplete={isComplete}
      />
    </div>
  );
}

// Cycling dots animation component
function CyclingDots() {
  const [dotState, setDotState] = React.useState(0);
  const dots = ['.', '..', '...'];
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDotState(prev => (prev + 1) % 3);
    }, 250);
    return () => clearInterval(interval);
  }, []);
  
  return <span>{dots[dotState]}</span>;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'todos';
  content: string;
  timestamp: Date;
  isTypewriter?: boolean;
  todos?: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  }>;
}

interface MessageListProps {
  messages: ChatMessage[];
  chatEndRef: React.RefObject<HTMLDivElement>;
  onUpdateChatSessions: (updater: (prev: any) => any) => void;
  activeSubApp: string;
  onRecordSearch?: (recordName: string) => void;
}

export function MessageList({ 
  messages, 
  chatEndRef, 
  onUpdateChatSessions, 
  activeSubApp,
  onRecordSearch
}: MessageListProps) {
  
  // Handle record search functionality
  const handleRecordSearch = (recordName: string) => {
    if (onRecordSearch) {
      onRecordSearch(recordName);
    } else {
      // Fallback: try to navigate to a search or find the record
      console.log(`Searching for record: ${recordName}`);
      // You could implement a generic search here
    }
  };

  // Memoized callback to prevent infinite re-renders
  const handleTypewriterComplete = useCallback((messageId: string) => {
    onUpdateChatSessions(prev => {
      const currentMessages = prev[activeSubApp] || [];
      const updatedMessages = currentMessages.map((msg: ChatMessage) => 
        msg['id'] === messageId ? { ...msg, isTypewriter: false } : msg
      );
      
      // Only update if there's actually a change
      const hasChange = currentMessages.some((msg, index) => 
        msg['id'] === messageId && msg.isTypewriter !== updatedMessages[index]?.isTypewriter
      );
      
      if (!hasChange) {
        return prev; // Return same reference to prevent re-render
      }
      
      return {
        ...prev,
        [activeSubApp]: updatedMessages
      };
    });
  }, [onUpdateChatSessions, activeSubApp]);
  return (
    <div style={{ 
      paddingTop: messages['length'] === 0 ? '0' : '12px',
      marginBottom: 0
    }}>
      {messages.map((message) => (
        <div
          key={message.id}
          className="bg-transparent px-0 py-0 text-base text-[var(--foreground)] w-fit max-w-full leading-snug"
          style={{ marginBottom: '16px' }}
        >
          {message['type'] === 'user' ? (
            <div className="bg-[var(--hover-bg)] rounded-lg px-3 py-2 w-full">
              {message.content}
            </div>
          ) : message['type'] === 'todos' ? (
            <InChatTodoList 
              todos={message.todos || []} 
              autoProgress={true}
              onTaskComplete={(taskIndex) => {
                console.log(`✅ Task ${taskIndex} completed:`, message.todos?.[taskIndex]);
              }}
            />
          ) : message['content'] === 'typing' ? (
            <div className="space-y-1">
              <div className="text-base text-[var(--muted)]">
                <CyclingDots />
              </div>
            </div>
          ) : message.content.startsWith('FILE_WIDGET:') ? (
            <div className="my-2">
              {(() => {
                try {
                  const fileData = JSON.parse(message.content.replace('FILE_WIDGET:', ''));
                  return (
                    <FileDisplayWidget
                      fileName={fileData.fileName}
                      fileSize={fileData.fileSize}
                      fileType={fileData.fileType}
                    />
                  );
                } catch (error) {
                  return <div className="text-red-500 text-sm">Error displaying file</div>;
                }
              })()}
            </div>
          ) : message.content.startsWith('ENRICHMENT_PROGRESS:') ? (
            <EnrichmentProgressComponent message={message} />
          ) : (
            message.isTypewriter ? (
              <TypewriterText 
                text={message.content}
                speed={19}
                onComplete={() => handleTypewriterComplete(message.id)}
              />
            ) : (
              <div className="whitespace-pre-line">
                {/* Render content with clickable links and record references */}
                {message.content.split(/(\bhttps?:\/\/[^\s]+|\[([^\]]+)\]\(([^)]+)\)|@(\w+))/g).map((part, index) => {
                  // Handle markdown-style links [text](url)
                  const markdownLinkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                  if (markdownLinkMatch) {
                    const [, linkText, linkUrl] = markdownLinkMatch;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          // Use in-app navigation for internal links
                          if (linkUrl.startsWith('/')) {
                            window['location']['href'] = linkUrl;
                          } else {
                            window.open(linkUrl, '_blank');
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        {linkText}
                      </button>
                    );
                  }
                  
                  // Handle external URLs
                  if (part.match(/^https?:\/\//)) {
                    return (
                      <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {part}
                      </a>
                    );
                  }
                  
                  // Handle @mentions (record references)
                  const mentionMatch = part.match(/^@(\w+)$/);
                  if (mentionMatch) {
                    const [, recordName] = mentionMatch;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          // Search for and navigate to the record
                          handleRecordSearch(recordName);
                        }}
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer bg-blue-50 px-1 rounded"
                      >
                        @{recordName}
                      </button>
                    );
                  }
                  
                  return part;
                })}
              </div>
            )
          )}
        </div>
      ))}
      
      <div ref={chatEndRef} />
    </div>
  );
}
