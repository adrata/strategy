"use client";

import React, { useCallback } from 'react';
import { InChatTodoList } from './InChatTodoList';
import { TypewriterText } from './TypewriterText';
import { FileDisplayWidget } from './FileDisplayWidget';
import { EnrichmentProgressTracker, createCFOEnrichmentSteps } from './EnrichmentProgressTracker';
import { ReasoningWindow } from './ReasoningWindow';

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
  scrollToBottom?: () => void; // Optional scroll callback for typewriter updates
}

// Helper function to render markdown with proper styling
const renderMarkdown = (content: string): React.ReactNode => {
  // Split content by markdown patterns while preserving the patterns
  const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  
  return parts.map((part, index) => {
    if (!part) return null;
    
    // Handle bold text **text**
    if (part.match(/^\*\*.*\*\*$/)) {
      const text = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-foreground">
          {text}
        </strong>
      );
    }
    
    // Handle italic text *text*
    if (part.match(/^\*.*\*$/)) {
      const text = part.slice(1, -1);
      return (
        <em key={index} className="italic text-foreground">
          {text}
        </em>
      );
    }
    
    // Handle code `text`
    if (part.match(/^`.*`$/)) {
      const text = part.slice(1, -1);
      return (
        <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
          {text}
        </code>
      );
    }
    
    // Regular text
    return (
      <span key={index} className="text-foreground">
        {part}
      </span>
    );
  });
};

export function MessageList({ 
  messages, 
  chatEndRef, 
  onUpdateChatSessions, 
  activeSubApp,
  onRecordSearch,
  scrollToBottom
}: MessageListProps) {
  
  // Handle record search functionality
  const handleRecordSearch = (recordName: string) => {
    if (onRecordSearch) {
      onRecordSearch(recordName);
    } else {
      // Fallback: try to navigate to a search or find the record
      if (process.env.NODE_ENV === 'development') {
        console.log(`Searching for record: ${recordName}`);
      }
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
      
      // Scroll to bottom when typewriter completes (so user can read the end)
      if (scrollToBottom) {
        setTimeout(() => scrollToBottom(), 100);
      }
      
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
          className="bg-transparent px-0 py-0 text-base text-black w-fit max-w-full leading-snug p-3"
          style={{ marginBottom: '16px' }}
        >
          {message['type'] === 'user' ? (
            <div className="bg-hover rounded-lg px-3 py-2 w-full">
              {message.content}
            </div>
          ) : message['type'] === 'todos' ? (
            <InChatTodoList 
              todos={message.todos || []} 
              autoProgress={true}
              onTaskComplete={(taskIndex) => {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`✅ Task ${taskIndex} completed:`, message.todos?.[taskIndex]);
                }
              }}
            />
          ) : message['content'] === 'typing' ? (
            <div className="space-y-1">
              <div className="text-base text-muted">
                <CyclingDots />
              </div>
            </div>
          ) : message['content'] === 'browsing' ? (
            <div className="space-y-1">
              <div className="text-base text-muted flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Browsing the web...</span>
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
                speed={35} // Optimized: 35ms per character for optimal readability (30-50ms range)
                onComplete={() => handleTypewriterComplete(message.id)}
                onUpdate={scrollToBottom}
              />
            ) : (
              <div className="whitespace-pre-line">
                {/* Enhanced content rendering with smart links and record references */}
                {(() => {
                  // Split by smart link patterns first, then handle markdown
                  return message.content.split(/(\bhttps?:\/\/[^\s]+|\[([^\]]+)\]\(([^)]+)\)|@(\w+)|"([A-Z][a-z]+ [A-Z][a-z]+)"|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\([0-9]{3}\) [0-9]{3}-[0-9]{4}))/g).map((part, index) => {
                  // CRITICAL: Handle undefined parts from split operation
                  if (!part) {
                    return null;
                  }
                  
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
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 cursor-pointer border border-blue-200 hover:border-blue-300"
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
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
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
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 cursor-pointer border border-blue-200 hover:border-blue-300"
                      >
                        @{recordName}
                      </button>
                    );
                  }
                  
                  // Handle quoted person names "John Smith"
                  const quotedPersonMatch = part.match(/^"([A-Z][a-z]+ [A-Z][a-z]+)"$/);
                  if (quotedPersonMatch) {
                    const [, personName] = quotedPersonMatch;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          handleRecordSearch(personName);
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors duration-200 cursor-pointer border border-green-200 hover:border-green-300"
                      >
                        {personName}
                      </button>
                    );
                  }
                  
                  // Handle email addresses
                  const emailMatch = part.match(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
                  if (emailMatch) {
                    const [, email] = emailMatch;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          handleRecordSearch(email);
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 transition-colors duration-200 cursor-pointer border border-purple-200 hover:border-purple-300"
                      >
                        {email}
                      </button>
                    );
                  }
                  
                  // Handle phone numbers
                  const phoneMatch = part.match(/^(\([0-9]{3}\) [0-9]{3}-[0-9]{4})$/);
                  if (phoneMatch) {
                    const [, phone] = phoneMatch;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          handleRecordSearch(phone);
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-colors duration-200 cursor-pointer border border-orange-200 hover:border-orange-300"
                      >
                        {phone}
                      </button>
                    );
                  }
                  
                  // For regular text, render markdown properly
                  return renderMarkdown(part);
                });
                })()}
              </div>
            )
          )}
          
          {/* Display web sources if available */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 text-blue-600">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-800">Web Sources</span>
              </div>
              <div className="space-y-2">
                {message.sources.slice(0, 3).map((source, index) => (
                  <div key={index} className="text-sm">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {source.title}
                    </a>
                    {source.snippet && (
                      <p className="text-muted text-xs mt-1 line-clamp-2">
                        {source.snippet}
                      </p>
                    )}
                  </div>
                ))}
                {message.sources.length > 3 && (
                  <p className="text-xs text-muted">
                    +{message.sources.length - 3} more sources
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Display AI Reasoning Window for assistant messages */}
          {message.type === 'assistant' && message.reasoning && (
            <ReasoningWindow reasoning={message.reasoning} />
          )}
        </div>
      ))}
      
      <div ref={chatEndRef} />
    </div>
  );
}
