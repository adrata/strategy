import React, { useState, useRef, useEffect } from "react";
import {
  PlusIcon,
  ClockIcon,
  XMarkIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  SearchPill,
  SearchResults,
  ChatMessage,
  Company,
  Person,
} from "../types";
import { SearchPillComponent } from "./SearchPillComponent";
import { AdrataIntelligence } from "@/platform/ui/components/AdrataIntelligence";

interface AIChatPanelProps {
  isVisible: boolean;
  onClose: () => void;
  chatMessages: ChatMessage[];
  activePills: SearchPill[];
  currentSearchResults: SearchResults | null;
  onNewChat: () => void;
  onTogglePill: (pillId: string) => void;
  onUpdatePillValue: (pillId: string, newValue: string) => void;
  onRemovePill: (pillId: string) => void;
  onRecordClick: (record: Company | Person, section: string) => void;
  onSendMessage: (message: string) => void;
  getInitials: (name: string | null | undefined) => string;
  getWelcomeMessage: () => string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isVisible,
  onClose,
  chatMessages,
  activePills,
  currentSearchResults,
  onNewChat,
  onTogglePill,
  onUpdatePillValue,
  onRemovePill,
  onRecordClick,
  onSendMessage,
  getInitials,
  getWelcomeMessage,
}) => {
  const [chatInput, setChatInput] = useState("");
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentMode, setCurrentMode] = useState("assist");
  
  // Resizable panel state
  const [panelHeight, setPanelHeight] = useState(400);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragLineRef = useRef<HTMLDivElement>(null);
  
  const minHeight = 80; // Minimum height (input + button on same line)
  const maxHeight = 600; // Maximum height
  const collapsedHeight = 80; // Height when collapsed

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(panelHeight);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = dragStartY - e.clientY; // Inverted for intuitive dragging
    const newHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeight + deltaY));
    
    setPanelHeight(newHeight);
    
    // Auto-collapse when dragged very small
    if (newHeight <= minHeight + 20) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Double-click handler
  const handleDoubleClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setPanelHeight(400);
    } else {
      setIsCollapsed(true);
      setPanelHeight(collapsedHeight);
    }
  };

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isVisible) return null;

  const currentHeight = isCollapsed ? collapsedHeight : panelHeight;

  return (
    <div 
      ref={panelRef}
      className="flex-1 bg-background flex flex-col justify-end relative transition-all duration-200"
      style={{ height: `${currentHeight}px` }}
    >
      {/* Drag handle */}
      <div
        ref={dragLineRef}
        className="absolute top-0 left-0 right-0 h-1 bg-border hover:bg-muted cursor-row-resize z-20 group"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="absolute inset-0 bg-muted opacity-0 group-hover:opacity-50 transition-opacity" />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-muted rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {!isCollapsed && (
        <>
          {/* Chat header row fixed to top */}
          <div
            className="absolute left-0 w-full z-10 flex flex-row items-center justify-between px-6 pt-6"
            style={{ top: "4px" }}
          >
            <div className="bg-background border border-border rounded-lg px-4 py-2 text-foreground">
              <span className="font-medium text-lg">Adrata (Search)</span>
            </div>
            <div className="flex flex-row items-center space-x-3">
              <PlusIcon
                className="w-5 h-5 text-muted cursor-pointer hover:text-foreground transition-colors"
                title="New Chat"
                onClick={onNewChat}
              />
              <div className="relative">
                <ClockIcon
                  className="w-5 h-5 text-muted cursor-pointer hover:text-foreground transition-colors"
                  title="Chat History"
                  onClick={() => setShowChatHistory(!showChatHistory)}
                />
                {showChatHistory && (
                  <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-64 max-h-80 overflow-y-auto">
                    <div className="p-3">
                      <div className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">
                        Chat History
                      </div>
                      {(chatMessages?.length || 0) > 0 ? (
                        chatMessages
                          .filter((m) => m['type'] === "user")
                          .map((message, idx) => (
                            <button
                              key={idx}
                              onClick={() => setShowChatHistory(false)}
                              className="block w-full text-left p-2 hover:bg-hover rounded transition-colors mb-1"
                            >
                              <div className="text-sm text-foreground truncate">
                                {message.content.slice(0, 40)}...
                              </div>
                              <div className="text-xs text-muted">
                                {message.timestamp.toLocaleDateString()}
                              </div>
                            </button>
                          ))
                      ) : (
                        <div className="text-sm text-muted italic">
                          No chat history yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <XMarkIcon
                className="w-5 h-5 text-muted cursor-pointer hover:text-foreground transition-colors"
                title="Close"
                onClick={onClose}
              />
            </div>
          </div>

          {/* Active Search Pills */}
          {(activePills?.length || 0) > 0 && (
            <div
              className="absolute left-0 w-full z-10 px-6"
              style={{ top: "70px" }}
            >
              <div className="bg-background border border-border rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-4 h-4 text-[#9B59B6]" />
                  <span className="text-sm font-medium text-foreground">
                    Active Search Filters
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activePills.map((pill) => (
                    <SearchPillComponent
                      key={pill.id}
                      pill={pill}
                      onToggle={onTogglePill}
                      onUpdateValue={onUpdatePillValue}
                      onRemove={onRemovePill}
                    />
                  ))}
                </div>
                {currentSearchResults && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted">
                      {currentSearchResults.totalResults} results found
                      {(currentSearchResults.companies?.length || 0) > 0 &&
                        ` • ${currentSearchResults.companies?.length || 0} companies`}
                      {(currentSearchResults.people?.length || 0) > 0 &&
                        ` • ${currentSearchResults.people?.length || 0} people`}
                      {(currentSearchResults.partners?.length || 0) > 0 &&
                        ` • ${currentSearchResults.partners?.length || 0} partners`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div
            className="w-full px-6 flex flex-col gap-[20px] mb-2 invisible-scrollbar"
            style={{
              maxHeight: `${currentHeight - 140}px`,
              overflowY: "auto",
              paddingTop: (activePills?.length || 0) > 0 ? "140px" : "80px",
            }}
          >
            {/* Welcome message */}
            {(chatMessages?.length || 0) === 0 && (
              <div className="bg-transparent px-0 py-0 text-base text-foreground w-fit max-w-full mb-2 leading-snug">
                {getWelcomeMessage()}
              </div>
            )}

            {/* Chat History */}
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className="bg-transparent px-0 py-0 text-base text-foreground w-fit max-w-full mb-2 leading-snug"
              >
                {message['type'] === "user" ? (
                  <div className="bg-hover rounded-lg px-3 py-2 w-full">
                    {message.content}
                  </div>
                ) : (
                  <div className="whitespace-pre-line">
                    {message.content}

                    {/* Enhanced search results display */}
                    {message['searchResults'] &&
                      message.searchResults.totalResults > 0 && (
                        <div className="mt-4 p-4 bg-hover rounded-lg border border-border">
                          <div className="flex items-center gap-2 mb-3">
                            <MagnifyingGlassIcon className="w-4 h-4 text-[#9B59B6]" />
                            <span className="font-medium text-foreground">
                              Search Results
                            </span>
                          </div>

                          {/* Companies Results */}
                          {(message.searchResults.companies?.length || 0) > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Companies ({message.searchResults.companies?.length || 0})
                              </h4>
                              <div className="space-y-2">
                                {message.searchResults.companies
                                  .slice(0, 3)
                                  .map((company) => (
                                    <div
                                      key={company.id}
                                      className="flex items-center justify-between p-2 bg-background rounded border border-border hover:border-[#9B59B6] transition-colors cursor-pointer"
                                      onClick={() =>
                                        onRecordClick(company, "companies")
                                      }
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-foreground text-sm">
                                          {company.name}
                                        </div>
                                        <div className="text-xs text-muted">
                                          {company.industry} • {company.location}
                                        </div>
                                      </div>
                                      <div className="text-xs font-medium text-[#9B59B6]">
                                        {company.icpScore}% ICP
                                      </div>
                                    </div>
                                  ))}
                                {(message.searchResults.companies?.length || 0) > 3 && (
                                  <div className="text-xs text-muted text-center py-1">
                                    +{(message.searchResults.companies?.length || 0) - 3}{" "}
                                    more companies
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* People Results */}
                          {(message.searchResults.people?.length || 0) > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                People ({message.searchResults.people?.length || 0})
                              </h4>
                              <div className="space-y-2">
                                {message.searchResults.people
                                  .slice(0, 3)
                                  .map((person) => (
                                    <div
                                      key={person.id}
                                      className="flex items-center justify-between p-2 bg-background rounded border border-border hover:border-[#9B59B6] transition-colors cursor-pointer"
                                      onClick={() =>
                                        onRecordClick(person, "people")
                                      }
                                    >
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-6 h-6 rounded bg-hover flex items-center justify-center text-xs font-medium">
                                          {getInitials(person.name)}
                                        </div>
                                        <div>
                                          <div className="font-medium text-foreground text-sm">
                                            {person.name}
                                          </div>
                                          <div className="text-xs text-muted">
                                            {person.title} at {person.company}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-xs font-medium text-[#9B59B6]">
                                        {person.seniority}
                                      </div>
                                    </div>
                                  ))}
                                {(message.searchResults.people?.length || 0) > 3 && (
                                  <div className="text-xs text-muted text-center py-1">
                                    +{(message.searchResults.people?.length || 0) - 3} more
                                    people
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Chat input - always visible */}
      <div className="px-6 pb-6 relative flex-shrink-0">
        <form onSubmit={handleSendMessage}>
          <div className="flex flex-row gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground placeholder-[var(--muted)] focus:border-[#9B59B6] focus:outline-none focus:ring-1 focus:ring-[#9B59B6]"
                rows={1}
                style={{ minHeight: "44px", maxHeight: isCollapsed ? "44px" : "120px" }}
                onKeyDown={(e) => {
                  if (e['key'] === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-4 py-3 bg-black border border-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              style={{ minHeight: "44px" }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </form>
        
        {/* Adrata Intelligence in bottom left - only show when not collapsed */}
        {!isCollapsed && (
          <div className="absolute left-6 bottom-6 z-10">
            <AdrataIntelligence
              currentMode={currentMode}
              onModeChange={setCurrentMode}
            />
          </div>
        )}
      </div>
    </div>
  );
};
