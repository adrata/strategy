import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';

interface FrameworksSlideProps {
  data: {
    title: string;
    departments: Array<{
      name: string;
      framework: string;
    }>;
  };
}

const departmentColors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-teal-100 text-teal-800'
];

export function FrameworksSlide({ data }: FrameworksSlideProps) {
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
              {data.departments.map((dept, index) => (
                <div key={index} className="bg-gray-100 p-10 border-l-[6px] border-black shadow-sm">
                  <div className="space-y-8">
                    <div className="flex justify-center">
                      <span className="px-6 py-3 text-lg font-light tracking-wide bg-black text-white">
                        {dept.name}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-light leading-loose text-lg">
                        {dept.framework}
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
