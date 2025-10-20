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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {data.targets.map((target, index) => (
                <div key={index} className="text-center space-y-8">
                  <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center border-l-[6px] border-black shadow-sm">
                    <div className="text-center">
                      <div className="text-5xl font-light text-black mb-3">
                        {target.value}
                      </div>
                      <div className="text-lg text-gray-600 font-light tracking-wide">
                        {target.label}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="w-full bg-gray-200 h-3">
                      <div 
                        className="bg-black h-full transition-all duration-1000" 
                        style={{ width: `${target.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-lg text-gray-500 font-light">
                      {target.progress}% Complete
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
