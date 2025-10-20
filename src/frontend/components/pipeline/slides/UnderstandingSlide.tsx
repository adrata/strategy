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
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="w-full max-w-6xl mx-8">
        <div className="p-24">
          <div className="space-y-20">
            <div className="text-center">
              <div className="w-24 h-1.5 bg-black mx-auto mb-10"></div>
              <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                {data.title}
              </h1>
            </div>
            
            <div className="space-y-10">
              {data.insights.map((insight, index) => (
                <div key={index} className="bg-gray-100 p-10 border-l-[6px] border-black shadow-sm">
                  <div className="flex items-start space-x-8">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-black text-white flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-loose text-xl font-light">
                        {insight}
                      </p>
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
