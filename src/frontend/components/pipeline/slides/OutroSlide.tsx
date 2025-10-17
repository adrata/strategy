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
      <div className="w-full max-w-6xl mx-8">
        <div className="p-24 text-center">
          <div className="space-y-20">
            <div className="space-y-10">
              <div className="w-24 h-1.5 bg-black mx-auto"></div>
              <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                {data.title}
              </h1>
              
              <div className="max-w-5xl mx-auto">
                <blockquote className="text-4xl text-gray-700 italic leading-loose font-light">
                  {data.quote}
                </blockquote>
                <cite className="text-xl text-gray-500 mt-8 block font-light">
                  — {data.author}
                </cite>
              </div>
            </div>
            
            <div className="pt-12">
              <p className="text-2xl text-gray-600 leading-loose max-w-4xl mx-auto font-light">
                {data.message}
              </p>
            </div>
            
            <div className="flex justify-center pt-16">
              <div className="w-28 h-28 bg-black text-white flex items-center justify-center">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
