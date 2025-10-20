import React from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';

interface CoverSlideProps {
  data: {
    title: string;
    subtitle: string;
    date: string;
    presenter: string;
  };
}

export function CoverSlide({ data }: CoverSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="text-center space-y-16 px-20">
        <div className="space-y-12">
          <div className="w-12 h-0.5 bg-gray-400 mx-auto"></div>
          <h1 className="text-8xl font-extralight text-gray-900 tracking-tight leading-none">
            {data.title}
          </h1>
          <p className="text-2xl font-light text-gray-500 tracking-wide">
            {data.subtitle}
          </p>
        </div>
        <div className="pt-16 space-y-6">
          <p className="text-lg font-light text-gray-400">
            {data.date}
          </p>
          <p className="text-base font-light text-gray-400">
            {data.presenter}
          </p>
        </div>
      </div>
    </div>
  );
}
