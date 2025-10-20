import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';

interface ProgressSlideProps {
  data: {
    title: string;
    metrics: Array<{
      label: string;
      value: string;
      change: string;
    }>;
  };
}

export function ProgressSlide({ data }: ProgressSlideProps) {
  return (
    <div className="h-full w-full flex flex-col justify-center bg-white px-20 py-16">
      <div className="space-y-12">
        <div>
          <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
          <h2 className="text-4xl font-light text-gray-900">
            {data.title}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
          {data.metrics.map((metric, index) => (
            <div key={index} className="space-y-3">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                {metric.label}
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-5xl font-extralight text-gray-900">
                  {metric.value}
                </div>
                <div className="text-xl font-light text-green-600">
                  {metric.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
