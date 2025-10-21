import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';

interface DirectionSlideProps {
  data: {
    title: string;
    priorities: string[];
  };
}

export function DirectionSlide({ data }: DirectionSlideProps) {
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
          {data.priorities.map((priority, index) => (
            <div key={index} className="flex gap-6 py-4">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-light">
                {index + 1}
              </div>
              <p className="text-lg font-light text-gray-700 leading-relaxed">
                {priority}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
