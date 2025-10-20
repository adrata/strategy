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
    <div className="h-full w-full flex items-center bg-white px-20">
      <div className="max-w-5xl space-y-12">
        <div>
          <div className="w-12 h-0.5 bg-gray-400 mb-6"></div>
          <h2 className="text-4xl font-light text-gray-900">
            {data.title}
          </h2>
        </div>
        
        <div className="space-y-6">
          {data.departments.map((dept, index) => (
            <div key={index} className="flex gap-10 py-4 border-b border-gray-100 last:border-0">
              <div className="w-1/3">
                <h3 className="text-2xl font-light text-gray-900">
                  {dept.name}
                </h3>
              </div>
              <div className="w-2/3">
                <p className="text-lg font-light text-gray-500 leading-relaxed">
                  {dept.framework}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
