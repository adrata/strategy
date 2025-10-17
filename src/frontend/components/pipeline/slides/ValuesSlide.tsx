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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {data.values.map((value, index) => (
                <div key={index} className="bg-gray-100 p-10 border-l-[6px] border-black shadow-sm">
                  <div className="space-y-6">
                    <div className="text-4xl mb-6">
                      {valueIcons[index] || '💎'}
                    </div>
                    <h3 className="text-2xl font-light text-black tracking-wide leading-tight">
                      {value.name}
                    </h3>
                    <p className="text-gray-600 text-lg leading-loose font-light">
                      {value.description}
                    </p>
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
