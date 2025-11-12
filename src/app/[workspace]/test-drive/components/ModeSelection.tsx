"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/platform/shared/components/ui/card';
import { Button } from '@/platform/shared/components/ui/button';
import { RocketLaunchIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

interface ModeSelectionProps {
  onSelectRun1: () => void;
  onSelectRunMany: () => void;
}

export function ModeSelection({ onSelectRun1, onSelectRunMany }: ModeSelectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Run 1 Card */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <RocketLaunchIcon className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Run 1</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted mb-6">
            Process a single target company to discover their buyer group. Perfect for quick demonstrations and one-off research.
          </p>
          <Button onClick={onSelectRun1} className="w-full" size="lg">
            Start Single Company Analysis
          </Button>
        </CardContent>
      </Card>

      {/* Run Many Card */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Squares2X2Icon className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Run Many</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted mb-6">
            Process multiple companies at once. Upload an Excel file or paste a list of companies to discover buyer groups in bulk.
          </p>
          <Button onClick={onSelectRunMany} className="w-full" size="lg" variant="outline">
            Start Batch Analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

