"use client";

import React, { useEffect } from 'react';
import { formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
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
  OutroSlide 
} from './slides';

interface PitchRegularViewProps {
  slideData: any;
  onPresent: () => void;
  onBack?: () => void;
  hideHeader?: boolean;
}

const slides = [
  { component: CoverSlide, key: 'cover', title: 'Cover' },
  { component: PurposeSlide, key: 'purpose', title: 'Purpose' },
  { component: MissionSlide, key: 'mission', title: 'Mission' },
  { component: ValuesSlide, key: 'values', title: 'Values' },
  { component: ProgressSlide, key: 'progress', title: 'Progress' },
  { component: StoriesSlide, key: 'stories', title: 'Stories' },
  { component: UnderstandingSlide, key: 'understanding', title: 'Understanding' },
  { component: FrameworksSlide, key: 'frameworks', title: 'Frameworks' },
  { component: DirectionSlide, key: 'direction', title: 'Direction' },
  { component: OutroSlide, key: 'outro', title: 'Outro' }
];

export function PitchRegularView({ slideData, onPresent, onBack, hideHeader = false }: PitchRegularViewProps) {
  // Keyboard shortcut for Present (Cmd+Enter)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (!isInput && (event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        onPresent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPresent]);

  return (
    <div className="h-full w-full bg-background">
      {/* Breadcrumb Header - Sticky */}
      {!hideHeader && (
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-hover rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Chronicle</span>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-foreground font-medium">October 2025 Progress Report</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPresent}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                Present ({formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content - Properly Sized Slides */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-white">
        <div className="py-16">
          <div className="space-y-24">
            {slides.map((slide, index) => {
              const SlideComponent = slide.component;
              const slideDataForSlide = slideData.slides[slide.key];
              
              return (
                <div key={index} className="w-full flex justify-center px-8">
                  <div className="w-full max-w-7xl">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
                      <div className="absolute inset-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <SlideComponent data={slideDataForSlide} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
