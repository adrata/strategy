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
    <div className="h-full w-full flex items-center bg-white px-20">
      <div className="max-w-5xl space-y-12">
        <div className="space-y-6">
          <div className="w-12 h-0.5 bg-gray-400"></div>
          <h2 className="text-4xl font-light text-gray-900 leading-tight">
            {data.title}
          </h2>
        </div>
        <div className="space-y-8">
          <p className="text-5xl font-light text-gray-900 leading-tight">
            {data.content}
          </p>
          <p className="text-xl font-light text-gray-500 leading-relaxed max-w-4xl">
            {data.description}
          </p>
        </div>
      </div>
    </div>
  );
}
