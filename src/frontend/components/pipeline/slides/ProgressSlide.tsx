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
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="w-full max-w-7xl mx-8">
        <div className="p-24">
          <div className="space-y-20">
            <div className="text-center">
              <div className="w-24 h-1.5 bg-black mx-auto mb-10"></div>
              <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                {data.title}
              </h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {data.metrics.map((metric, index) => (
                <div key={index} className="bg-gray-100 p-14 border-l-[6px] border-black shadow-sm">
                  <div className="text-center space-y-8">
                    <div className="text-6xl font-light text-black">
                      {metric.value}
                    </div>
                    <div className="text-xl text-gray-600 font-light tracking-wide">
                      {metric.label}
                    </div>
                    <div className="flex justify-center">
                      <span className={`px-6 py-3 text-lg font-light tracking-wide ${
                        metric.change.startsWith('+') 
                          ? 'bg-black text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
