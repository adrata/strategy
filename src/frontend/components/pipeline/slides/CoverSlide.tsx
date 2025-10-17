import React from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';

interface CoverSlideProps {
  data: {
    title: string;
    subtitle: string;
    date: string;
    presenter: string;
  };
}

export function CoverSlide({ data }: CoverSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="w-full max-w-6xl mx-8">
        <div className="p-24 text-center">
          <div className="space-y-20">
            <div className="space-y-8">
              <div className="w-32 h-1.5 bg-black mx-auto"></div>
              <h1 className="text-8xl font-light text-black tracking-tight leading-tight">
                {data.title}
              </h1>
              <h2 className="text-3xl text-gray-600 font-light tracking-wide leading-loose">
                {data.subtitle}
              </h2>
            </div>
            
            <div className="space-y-6 pt-16">
              <div className="w-20 h-1 bg-gray-300 mx-auto"></div>
              <p className="text-xl text-gray-500 font-light leading-loose">
                {data.date}
              </p>
              <p className="text-lg text-gray-400 font-light leading-loose">
                {data.presenter}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
