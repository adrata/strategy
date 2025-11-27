"use client";

import React, { useCallback } from 'react';
import { InChatTodoList } from './InChatTodoList';
import { TypewriterText } from './TypewriterText';
import { FileDisplayWidget } from './FileDisplayWidget';
import { EnrichmentProgressTracker, createCFOEnrichmentSteps } from './EnrichmentProgressTracker';
import { MicrophoneIcon } from "@heroicons/react/24/solid";
// import { ReasoningWindow } from './ReasoningWindow'; // Removed - reasoning box disabled

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

// Hyperminimal typing indicator - just periods appearing in sequence
function TypingIndicator() {
  const [dots, setDots] = React.useState(1);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d >= 3 ? 1 : d + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  return <span>{'.'.repeat(dots)}</span>;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'todos';
  content: string;
  timestamp: Date;
  isTypewriter?: boolean;
  isVoiceInput?: boolean; // True if message was input via voice
  todos?: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  }>;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  // Context quality indicators
  reasoning?: {
    contextAwareness?: {
      recordType?: string;
      recordName?: string;
      companyName?: string;
      workspaceContext?: string;
      dataPoints?: number;
    };
    dataSources?: Array<{
      type: 'record' | 'intelligence' | 'workspace' | 'history';
      name: string;
      description: string;
    }>;
    confidence?: number;
    model?: string;
  };
  model?: string;
  provider?: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  chatEndRef: React.RefObject<HTMLDivElement>;
  onUpdateChatSessions: (updater: (prev: any) => any) => void;
  activeSubApp: string;
  onRecordSearch?: (recordName: string) => void;
  scrollToBottom?: () => void; // Optional scroll callback for typewriter updates
  onTypewriterComplete?: (messageId: string) => void; // Callback when typewriter completes
  liveVoiceTranscript?: string; // Live voice transcript being spoken
  isVoiceListening?: boolean; // Whether voice is currently listening
}

// Copyable Email component with copy-to-clipboard functionality
function CopyableEmail({ email }: { email: string }) {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };
  
  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer border ${
        copied 
          ? 'bg-green-50 text-green-700 border-green-200' 
          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border-purple-200 hover:border-purple-300'
      }`}
      title={copied ? 'Copied!' : 'Click to copy email'}
    >
      {email}
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
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
  scrollToBottom,
  onTypewriterComplete,
  liveVoiceTranscript,
  isVoiceListening
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
    // Update chat sessions
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
    
    // Also update conversations state if callback provided
    if (onTypewriterComplete) {
      onTypewriterComplete(messageId);
    }
  }, [onUpdateChatSessions, activeSubApp, scrollToBottom, onTypewriterComplete]);
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
              {/* Voice transcription pill badge */}
              {message.isVoiceInput && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <MicrophoneIcon className="w-3 h-3" />
                    <span>Transcribed</span>
                  </span>
                </div>
              )}
              <span className="text-base text-foreground">{message.content}</span>
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
            <div className="text-base text-muted-foreground">
              <TypingIndicator />
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
                speed={message.typewriterSpeed || 35} // Use custom speed if provided, otherwise default to 35ms
                onComplete={() => handleTypewriterComplete(message.id)}
                onUpdate={scrollToBottom}
              />
            ) : (
              <div className="whitespace-pre-line text-base">
                {/* Enhanced content rendering with smart links and record references */}
                {(() => {
                  // Split by smart link patterns first, then handle markdown
                  // Use non-capturing groups (?:...) for inner patterns to prevent duplicate matches in split result
                  // Only the outer group should capture the full match
                  return message.content.split(/(\bhttps?:\/\/[^\s]+|\[(?:[^\]]+)\]\((?:[^)]+)\)|@(?:\w+)|"(?:[A-Z][a-z]+ [A-Z][a-z]+)"|(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(?:\([0-9]{3}\) [0-9]{3}-[0-9]{4}))/g).map((part, index) => {
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
                  
                  // Handle email addresses - click to copy
                  const emailMatch = part.match(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
                  if (emailMatch) {
                    const [, email] = emailMatch;
                    return (
                      <CopyableEmail key={index} email={email} />
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
          
          {/* Context Quality Indicator - Small, non-intrusive badge */}
          {message.type === 'assistant' && message.reasoning?.contextAwareness && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Context-aware
              </span>
              {message.reasoning.contextAwareness.recordName && (
                <span className="text-muted">
                  Using: {message.reasoning.contextAwareness.recordName}
                  {message.reasoning.contextAwareness.companyName && ` @ ${message.reasoning.contextAwareness.companyName}`}
                </span>
              )}
              {message.reasoning.contextAwareness.dataPoints && message.reasoning.contextAwareness.dataPoints > 0 && (
                <span className="text-muted">
                  ({message.reasoning.contextAwareness.dataPoints} data points)
                </span>
              )}
            </div>
          )}
          
          {/* Model/Provider indicator for transparency */}
          {/* Model/provider info removed - not needed in UI */}
        </div>
      ))}
      
      {/* Live voice transcript - shown while speaking */}
      {isVoiceListening && liveVoiceTranscript && (
        <div
          className="bg-transparent px-0 py-0 text-base text-black w-fit max-w-full leading-snug p-3"
          style={{ marginBottom: '16px' }}
        >
          <div className="bg-hover rounded-lg px-3 py-2 w-full">
            {/* Transcribing pill badge */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                <MicrophoneIcon className="w-3 h-3" />
                <span>Transcribing...</span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              </span>
            </div>
            <span className="text-muted-foreground italic">{liveVoiceTranscript}</span>
          </div>
        </div>
      )}
      
      <div ref={chatEndRef} />
    </div>
  );
}
