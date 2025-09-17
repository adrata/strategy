"use client";

import { DashboardDetailPage } from '@/frontend/components/pipeline/DashboardDetailPage';
import { DashboardProvider } from '../DashboardProvider';

export default function CallsDetailPage() {
  return (
    <DashboardProvider>
      <DashboardDetailPage statType="calls" />
    </DashboardProvider>
  );
}