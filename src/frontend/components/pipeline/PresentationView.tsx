"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/frontend/components/ui/button';
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

interface PresentationViewProps {
  slideData: any;
  onClose: () => void;
}

const slides = [
  { component: CoverSlide, key: 'cover' },
  { component: PurposeSlide, key: 'purpose' },
  { component: MissionSlide, key: 'mission' },
  { component: ValuesSlide, key: 'values' },
  { component: ProgressSlide, key: 'progress' },
  { component: StoriesSlide, key: 'stories' },
  { component: UnderstandingSlide, key: 'understanding' },
  { component: FrameworksSlide, key: 'frameworks' },
  { component: DirectionSlide, key: 'direction' },
  { component: OutroSlide, key: 'outro' }
];

export function PresentationView({ slideData, onClose }: PresentationViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showGoodLuck, setShowGoodLuck] = useState(true);

  // Auto-dismiss good luck message
  useEffect(() => {
    if (showGoodLuck) {
      const timer = setTimeout(() => {
        setShowGoodLuck(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showGoodLuck]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setCurrentSlide(prev => Math.max(prev - 1, 0));
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'Home':
          event.preventDefault();
          setCurrentSlide(0);
          break;
        case 'End':
          event.preventDefault();
          setCurrentSlide(slides.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  const CurrentSlideComponent = slides[currentSlide].component;
  const currentSlideData = slideData.slides[slides[currentSlide].key];

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Success Message at Top */}
      {showGoodLuck && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-white text-black text-center py-3 px-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Good luck. Exit by press "Esc"</span>
          </div>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-16 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Slide Counter */}
      <div className="absolute top-16 left-4 z-10 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Navigation Arrows */}
      {currentSlide > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {currentSlide < slides.length - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Slide Content */}
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full h-full">
          <CurrentSlideComponent data={currentSlideData} />
        </div>
      </div>

      {/* Slide Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs">
        <div className="space-y-1">
          <div>← → Navigate</div>
          <div>ESC Close</div>
          <div>Home/End First/Last</div>
        </div>
      </div>
    </div>
  );
}
