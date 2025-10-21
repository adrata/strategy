import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';

interface UnderstandingSlideProps {
  data: {
    title: string;
    insights: string[];
  };
}

export function UnderstandingSlide({ data }: UnderstandingSlideProps) {
  return (
    <div className="h-full w-full flex items-center bg-white px-20">
      <div className="max-w-5xl space-y-12">
        <div>
          <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
          <h2 className="text-4xl font-light text-gray-900">
            {data.title}
          </h2>
        </div>
        
        <div className="space-y-6">
          {data.insights.map((insight, index) => (
            <div key={index} className="flex gap-6 py-4">
              <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-3"></div>
              <p className="text-lg font-light text-gray-700 leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
