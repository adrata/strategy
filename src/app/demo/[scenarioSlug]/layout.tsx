"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { DemoScenarioNavigationService } from '@/platform/services/DemoScenarioNavigationService';
import { demoScenarioService } from '@/platform/services/DemoScenarioService';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
import { AcquisitionOSProvider } from '@/platform/ui/context/AcquisitionOSProvider';

interface DemoLayoutProps {
  children: React.ReactNode;
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isLoading } = useUnifiedAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [scenarioData, setScenarioData] = useState<any>(null);

  useEffect(() => {
    if (isLoading) return;

    const validateDemoScenario = async () => {
      try {
        const scenarioSlug = params['scenarioSlug'] as string;
        
        if (!scenarioSlug) {
          console.log("❌ No scenario slug provided");
          router.push("/workspaces");
          return;
        }

        console.log(`🎯 [DEMO LAYOUT] Validating demo scenario: ${scenarioSlug}`);

        // Check if user is authorized for demo access (Adrata users only)
        const currentUserEmail = authUser?.email;
        const isAdrataUser = currentUserEmail === 'dan@adrata.com' || currentUserEmail === 'ross@adrata.com';
        
        // Allow demo access for demo scenarios (bypass auth check for demo)
        const isDemoScenario = scenarioSlug === 'winning-variant' || scenarioSlug === 'zeropoint';
        
        // For demo scenarios, allow access even without authentication (for hard refresh)
        if (!isDemoScenario && !isAdrataUser) {
          console.log("❌ User not authorized for demo access");
          router.push("/workspaces");
          return;
        }
        
        // For demo scenarios, we can proceed even without auth user (hard refresh case)
        if (isDemoScenario) {
          console.log(`✅ [DEMO LAYOUT] Demo scenario access granted: ${scenarioSlug}`);
        }

        // Set the current scenario in the demo service
        demoScenarioService.setCurrentScenario(scenarioSlug);

        // Load scenario data
        const response = await fetch(`/api/demo-scenarios/${scenarioSlug}`);
        const data = await response.json();

        if (data['success'] && data.scenario) {
          setScenarioData(data.scenario);
          console.log(`✅ [DEMO LAYOUT] Demo scenario validated: ${data.scenario.name}`);
        } else {
          console.log(`❌ Demo scenario not found: ${scenarioSlug}`);
          router.push("/workspaces");
          return;
        }

        setIsValidating(false);
      } catch (error) {
        console.error("❌ [DEMO LAYOUT] Error validating demo scenario:", error);
        router.push("/workspaces");
      }
    };

    validateDemoScenario();
  }, [authUser, isLoading, router, params['scenarioSlug']]);

  if (isLoading || isValidating) {
    return (
      <PipelineSkeleton message={`Loading ${scenarioData?.name || 'demo scenario'}...`} />
    );
  }

  return (
    <AcquisitionOSProvider>
      <div className="demo-scenario-layout">
        {/* Demo Content */}
        {children}
      </div>
    </AcquisitionOSProvider>
  );
}
