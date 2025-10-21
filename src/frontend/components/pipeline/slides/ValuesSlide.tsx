import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';

interface ValuesSlideProps {
  data: {
    title: string;
    values: Array<{
      name: string;
      description: string;
    }>;
  };
}

const valueIcons = [
  '👥', '💡', '🔍', '⭐', '🤝'
];

export function ValuesSlide({ data }: ValuesSlideProps) {
  return (
    <div className="h-full w-full flex items-center bg-white px-20">
      <div className="w-full max-w-5xl space-y-12">
        <div>
          <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
          <h2 className="text-4xl font-light text-gray-900">
            {data.title}
          </h2>
        </div>
        
        <div className="space-y-6">
          {data.values.map((value, index) => (
            <div key={index} className="flex gap-10 py-4 border-b border-gray-100 last:border-0">
              <div className="w-1/3">
                <h3 className="text-2xl font-light text-gray-900">
                  {value.name}
                </h3>
              </div>
              <div className="w-2/3">
                <p className="text-lg font-light text-gray-500 leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
