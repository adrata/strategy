import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';

interface StoriesSlideProps {
  data: {
    title: string;
    stories: string[];
  };
}

export function StoriesSlide({ data }: StoriesSlideProps) {
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
              {data.stories.map((story, index) => (
                <div key={index} className="bg-gray-100 p-10 border-l-[6px] border-black shadow-sm">
                  <div className="flex items-start space-x-8">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-black text-white flex items-center justify-center text-xl font-light">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-loose text-xl font-light">
                        {story}
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
