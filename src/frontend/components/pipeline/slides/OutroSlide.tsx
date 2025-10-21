import React from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';

interface OutroSlideProps {
  data: {
    title: string;
    quote: string;
    author: string;
    message: string;
  };
}

export function OutroSlide({ data }: OutroSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="text-center space-y-12 px-16">
        <div className="space-y-6">
          <div className="w-12 h-0.5 bg-gray-400 mx-auto"></div>
          <h1 className="text-4xl font-light text-gray-700 tracking-tight leading-tight">
            {data.title}
          </h1>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <blockquote className="text-3xl font-light text-gray-600 leading-relaxed">
            {data.quote}
          </blockquote>
          <cite className="text-lg font-light text-gray-500 block">
            — {data.author}
          </cite>
        </div>
        
        <div className="pt-6">
          <p className="text-xl font-light text-gray-500 leading-relaxed max-w-3xl mx-auto">
            {data.message}
          </p>
        </div>
      </div>
    </div>
  );
}
