import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Progress } from '@/frontend/components/ui/progress';

interface MissionSlideProps {
  data: {
    title: string;
    targets: Array<{
      label: string;
      value: string;
      progress: number;
    }>;
  };
}

export function MissionSlide({ data }: MissionSlideProps) {
  return (
    <div className="h-full w-full flex flex-col justify-center bg-white px-20 py-16">
      <div className="space-y-16">
        <div>
          <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
          <h2 className="text-4xl font-light text-gray-900">
            {data.title}
          </h2>
        </div>
        
        <div className="grid grid-cols-3 gap-12">
          {data.targets.map((target, index) => (
            <div key={index} className="space-y-6">
              <div className="space-y-3">
                <div className="text-6xl font-extralight text-gray-900 leading-none">
                  {target.value}
                </div>
                <div className="text-lg font-light text-gray-500">
                  {target.label}
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-900 transition-all duration-1000 ease-out rounded-full" 
                    style={{ width: `${target.progress}%` }}
                  />
                </div>
                <div className="text-sm font-light text-gray-400">
                  {target.progress}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
