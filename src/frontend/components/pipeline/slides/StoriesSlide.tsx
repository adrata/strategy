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
    <div className="h-full w-full flex items-center bg-white px-20">
      <div className="max-w-5xl space-y-12">
        <div>
          <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
          <h2 className="text-4xl font-light text-gray-900">
            {data.title}
          </h2>
        </div>
        
        <div className="space-y-8">
          {data.stories.slice(0, 2).map((story, index) => (
            <div key={index} className="space-y-4 py-6">
              <p className="text-2xl font-light text-gray-900 leading-relaxed">
                {story}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
