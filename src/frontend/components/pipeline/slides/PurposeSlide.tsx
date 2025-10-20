import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';

interface PurposeSlideProps {
  data: {
    title: string;
    content: string;
    description: string;
  };
}

export function PurposeSlide({ data }: PurposeSlideProps) {
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
            
            <div className="text-center">
              <div className="inline-block bg-gray-100 px-16 py-10 border-l-[6px] border-black shadow-sm">
                <p className="text-4xl font-light text-black leading-loose">
                  {data.content}
                </p>
              </div>
            </div>
            
            <div className="text-center max-w-5xl mx-auto">
              <p className="text-2xl text-gray-600 leading-loose font-light">
                {data.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
