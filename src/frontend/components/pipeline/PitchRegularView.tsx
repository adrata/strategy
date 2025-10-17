"use client";

import React, { useEffect } from 'react';
import { Button } from '@/frontend/components/ui/button';
import { Kbd, formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
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
    <div className="h-full w-full bg-[var(--background)]">
      {/* Breadcrumb Header - Sticky */}
      {!hideHeader && (
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--muted)]">Chronicle</span>
                <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[var(--foreground)] font-medium">October 2025 Progress Report</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={onPresent}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border border-blue-200 flex items-center gap-2"
              >
                Present
                <Kbd variant="blue" size="sm">{formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}</Kbd>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content - Stacked Slides */}
      <div className="p-8 overflow-y-auto invisible-scrollbar max-w-5xl mx-auto bg-[var(--background)]">
        <div className="space-y-8">
          {slides.map((slide, index) => {
            const SlideComponent = slide.component;
            const slideDataForSlide = slideData.slides[slide.key];
            
            return (
              <div key={index} className="w-full">
                <div className="w-full h-[600px]">
                  <SlideComponent data={slideDataForSlide} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
