"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { WorkbenchDocument } from "../types/document";
import { PitchContent, getDefaultPitchContent } from "@/app/[workspace]/workbench/types/pitch";
import {
  CoverSlide,
  PurposeSlide,
  MissionSlide,
  ValuesSlide,
  ProgressSlide,
  StoriesSlide,
  UnderstandingSlide,
  FrameworksSlide,
  DirectionSlide,
  OutroSlide,
} from "@/frontend/components/pipeline/slides";
import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

interface PitchEditorProps {
  document: WorkbenchDocument;
  onSave: (content: any) => void;
  onAutoSave: (content: any) => void;
}

const slideConfig = [
  { key: 'cover', title: 'Cover', component: CoverSlide },
  { key: 'purpose', title: 'Purpose', component: PurposeSlide },
  { key: 'mission', title: 'Mission', component: MissionSlide },
  { key: 'values', title: 'Values', component: ValuesSlide },
  { key: 'progress', title: 'Progress', component: ProgressSlide },
  { key: 'stories', title: 'Stories', component: StoriesSlide },
  { key: 'understanding', title: 'Understanding', component: UnderstandingSlide },
  { key: 'frameworks', title: 'Frameworks', component: FrameworksSlide },
  { key: 'direction', title: 'Direction', component: DirectionSlide },
  { key: 'outro', title: 'Outro', component: OutroSlide },
];

export function PitchEditor({ document, onSave, onAutoSave }: PitchEditorProps) {
  const [content, setContent] = useState<PitchContent>(() => {
    if (document.content && typeof document.content === 'object' && 'slides' in document.content) {
      return document.content as PitchContent;
    }
    return getDefaultPitchContent();
  });

  const [expandedSlides, setExpandedSlides] = useState<Set<string>>(new Set(['cover']));
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const hasUnsavedChanges = useRef(false);

  const toggleSlideExpansion = (slideKey: string) => {
    setExpandedSlides(prev => {
      const next = new Set(prev);
      if (next.has(slideKey)) {
        next.delete(slideKey);
      } else {
        next.add(slideKey);
      }
      return next;
    });
  };

  const handleContentChange = useCallback((slideKey: string, slideData: any) => {
    setContent(prev => {
      const next = {
        ...prev,
        slides: {
          ...prev.slides,
          [slideKey]: slideData,
        },
      };
      hasUnsavedChanges.current = true;

      // Debounced auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        onAutoSave({ slides: next.slides });
        hasUnsavedChanges.current = false;
      }, 3000);

      return next;
    });
  }, [onAutoSave]);

  const handleSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    onSave({ slides: content.slides });
    hasUnsavedChanges.current = false;
  }, [content, onSave]);

  // Sync with document content when it changes externally
  useEffect(() => {
    if (document.content && typeof document.content === 'object' && 'slides' in document.content) {
      const docContent = document.content as PitchContent;
      setContent(docContent);
    }
  }, [document.content]);

  const renderSlideEditor = (slideKey: string) => {
    const slideData = content.slides[slideKey as keyof typeof content.slides];
    if (!slideData) return null;

    const isExpanded = expandedSlides.has(slideKey);

    switch (slideKey) {
      case 'cover': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('cover', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={data.subtitle || ''}
                onChange={(e) => handleContentChange('cover', { ...data, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date
              </label>
              <input
                type="text"
                value={data.date || ''}
                onChange={(e) => handleContentChange('cover', { ...data, date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Presenter
              </label>
              <input
                type="text"
                value={data.presenter || ''}
                onChange={(e) => handleContentChange('cover', { ...data, presenter: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      }
      case 'purpose': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('purpose', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content
              </label>
              <textarea
                value={data.content || ''}
                onChange={(e) => handleContentChange('purpose', { ...data, content: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={data.description || ''}
                onChange={(e) => handleContentChange('purpose', { ...data, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      }
      case 'mission': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('mission', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Targets
              </label>
              <div className="space-y-3">
                {(data.targets || []).map((target: any, index: number) => (
                  <div key={index} className="p-3 border border-border rounded-md space-y-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={target.label || ''}
                      onChange={(e) => {
                        const newTargets = [...(data.targets || [])];
                        newTargets[index] = { ...target, label: e.target.value };
                        handleContentChange('mission', { ...data, targets: newTargets });
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={target.value || ''}
                      onChange={(e) => {
                        const newTargets = [...(data.targets || [])];
                        newTargets[index] = { ...target, value: e.target.value };
                        handleContentChange('mission', { ...data, targets: newTargets });
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted">Progress:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={target.progress || 0}
                        onChange={(e) => {
                          const newTargets = [...(data.targets || [])];
                          newTargets[index] = { ...target, progress: parseInt(e.target.value) || 0 };
                          handleContentChange('mission', { ...data, targets: newTargets });
                        }}
                        className="w-20 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-muted">%</span>
                      {(data.targets || []).length > 1 && (
                        <button
                          onClick={() => {
                            const newTargets = (data.targets || []).filter((_: any, i: number) => i !== index);
                            handleContentChange('mission', { ...data, targets: newTargets });
                          }}
                          className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newTargets = [...(data.targets || []), { label: '', value: '', progress: 0 }];
                    handleContentChange('mission', { ...data, targets: newTargets });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md text-foreground hover:bg-hover flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Target
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'values': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('values', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Values
              </label>
              <div className="space-y-3">
                {(data.values || []).map((value: any, index: number) => (
                  <div key={index} className="p-3 border border-border rounded-md space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={value.name || ''}
                      onChange={(e) => {
                        const newValues = [...(data.values || [])];
                        newValues[index] = { ...value, name: e.target.value };
                        handleContentChange('values', { ...data, values: newValues });
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Description"
                      value={value.description || ''}
                      onChange={(e) => {
                        const newValues = [...(data.values || [])];
                        newValues[index] = { ...value, description: e.target.value };
                        handleContentChange('values', { ...data, values: newValues });
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(data.values || []).length > 1 && (
                      <button
                        onClick={() => {
                          const newValues = (data.values || []).filter((_: any, i: number) => i !== index);
                          handleContentChange('values', { ...data, values: newValues });
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newValues = [...(data.values || []), { name: '', description: '' }];
                    handleContentChange('values', { ...data, values: newValues });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md text-foreground hover:bg-hover flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Value
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'progress': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('progress', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Metrics
              </label>
              <div className="space-y-3">
                {(data.metrics || []).map((metric: any, index: number) => (
                  <div key={index} className="p-3 border border-border rounded-md space-y-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={metric.label || ''}
                      onChange={(e) => {
                        const newMetrics = [...(data.metrics || [])];
                        newMetrics[index] = { ...metric, label: e.target.value };
                        handleContentChange('progress', { ...data, metrics: newMetrics });
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Value"
                        value={metric.value || ''}
                        onChange={(e) => {
                          const newMetrics = [...(data.metrics || [])];
                          newMetrics[index] = { ...metric, value: e.target.value };
                          handleContentChange('progress', { ...data, metrics: newMetrics });
                        }}
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Change"
                        value={metric.change || ''}
                        onChange={(e) => {
                          const newMetrics = [...(data.metrics || [])];
                          newMetrics[index] = { ...metric, change: e.target.value };
                          handleContentChange('progress', { ...data, metrics: newMetrics });
                        }}
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {(data.metrics || []).length > 1 && (
                      <button
                        onClick={() => {
                          const newMetrics = (data.metrics || []).filter((_: any, i: number) => i !== index);
                          handleContentChange('progress', { ...data, metrics: newMetrics });
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newMetrics = [...(data.metrics || []), { label: '', value: '', change: '' }];
                    handleContentChange('progress', { ...data, metrics: newMetrics });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md text-foreground hover:bg-hover flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Metric
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'stories': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('stories', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Stories
              </label>
              <div className="space-y-2">
                {(data.stories || []).map((story: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={story || ''}
                      onChange={(e) => {
                        const newStories = [...(data.stories || [])];
                        newStories[index] = e.target.value;
                        handleContentChange('stories', { ...data, stories: newStories });
                      }}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(data.stories || []).length > 1 && (
                      <button
                        onClick={() => {
                          const newStories = (data.stories || []).filter((_: string, i: number) => i !== index);
                          handleContentChange('stories', { ...data, stories: newStories });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newStories = [...(data.stories || []), ''];
                    handleContentChange('stories', { ...data, stories: newStories });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md text-foreground hover:bg-hover flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Story
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'understanding': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('understanding', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Insights
              </label>
              <div className="space-y-2">
                {(data.insights || []).map((insight: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={insight || ''}
                      onChange={(e) => {
                        const newInsights = [...(data.insights || [])];
                        newInsights[index] = e.target.value;
                        handleContentChange('understanding', { ...data, insights: newInsights });
                      }}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(data.insights || []).length > 1 && (
                      <button
                        onClick={() => {
                          const newInsights = (data.insights || []).filter((_: string, i: number) => i !== index);
                          handleContentChange('understanding', { ...data, insights: newInsights });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newInsights = [...(data.insights || []), ''];
                    handleContentChange('understanding', { ...data, insights: newInsights });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md text-foreground hover:bg-hover flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Insight
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'frameworks': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('frameworks', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Departments
              </label>
              <div className="space-y-3">
                {(data.departments || []).map((dept: any, index: number) => (
                  <div key={index} className="p-3 border border-border rounded-md space-y-2">
                    <input
                      type="text"
                      placeholder="Department Name"
                      value={dept.name || ''}
                      onChange={(e) => {
                        const newDepts = [...(data.departments || [])];
                        newDepts[index] = { ...dept, name: e.target.value };
                        handleContentChange('frameworks', { ...data, departments: newDepts });
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Framework"
                      value={dept.framework || ''}
                      onChange={(e) => {
                        const newDepts = [...(data.departments || [])];
                        newDepts[index] = { ...dept, framework: e.target.value };
                        handleContentChange('frameworks', { ...data, departments: newDepts });
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(data.departments || []).length > 1 && (
                      <button
                        onClick={() => {
                          const newDepts = (data.departments || []).filter((_: any, i: number) => i !== index);
                          handleContentChange('frameworks', { ...data, departments: newDepts });
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newDepts = [...(data.departments || []), { name: '', framework: '' }];
                    handleContentChange('frameworks', { ...data, departments: newDepts });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md text-foreground hover:bg-hover flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Department
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'direction': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('direction', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priorities
              </label>
              <div className="space-y-2">
                {(data.priorities || []).map((priority: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-muted text-white rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <textarea
                      value={priority || ''}
                      onChange={(e) => {
                        const newPriorities = [...(data.priorities || [])];
                        newPriorities[index] = e.target.value;
                        handleContentChange('direction', { ...data, priorities: newPriorities });
                      }}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(data.priorities || []).length > 1 && (
                      <button
                        onClick={() => {
                          const newPriorities = (data.priorities || []).filter((_: string, i: number) => i !== index);
                          handleContentChange('direction', { ...data, priorities: newPriorities });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newPriorities = [...(data.priorities || []), ''];
                    handleContentChange('direction', { ...data, priorities: newPriorities });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md text-foreground hover:bg-hover flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Priority
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'outro': {
        const data = slideData as any;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleContentChange('outro', { ...data, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quote
              </label>
              <textarea
                value={data.quote || ''}
                onChange={(e) => handleContentChange('outro', { ...data, quote: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Author
              </label>
              <input
                type="text"
                value={data.author || ''}
                onChange={(e) => handleContentChange('outro', { ...data, author: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message
              </label>
              <textarea
                value={data.message || ''}
                onChange={(e) => handleContentChange('outro', { ...data, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderSlidePreview = (slideKey: string) => {
    const SlideComponent = slideConfig.find(s => s.key === slideKey)?.component;
    const slideData = content.slides[slideKey as keyof typeof content.slides];
    
    if (!SlideComponent || !slideData) return null;

    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
        <div className="absolute inset-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SlideComponent data={slideData} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="text-sm text-muted">
          {hasUnsavedChanges.current && <span className="text-orange-500">Unsaved changes</span>}
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Save
        </button>
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Preview */}
        <div className="w-1/2 border-r border-border overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-12">
            {slideConfig.map(({ key, title }) => {
              const slideData = content.slides[key as keyof typeof content.slides];
              if (!slideData) return null;
              
              return (
                <div key={key} className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">{title}</h3>
                  {renderSlidePreview(key)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="w-1/2 overflow-y-auto bg-background">
          <div className="p-6 space-y-6">
            {slideConfig.map(({ key, title }) => {
              const slideData = content.slides[key as keyof typeof content.slides];
              if (!slideData) return null;

              const isExpanded = expandedSlides.has(key);

              return (
                <div key={key} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSlideExpansion(key)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-hover hover:bg-hover transition-colors"
                  >
                    <span className="font-medium text-foreground">{title}</span>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5 text-muted" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-muted" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4">
                      {renderSlideEditor(key)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
