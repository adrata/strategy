import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

export function useMetricsCount() {
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const [count, setCount] = useState<number>(0);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;

  useEffect(() => {
    console.log('🔍 [useMetricsCount] Hook running with workspaceId:', workspaceId);
    
    if (!workspaceId) {
      console.log('🔍 [useMetricsCount] No workspaceId, setting count to 0');
      setCount(0);
      return;
    }

    // Check if this is Notary Everyday workspace
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || workspaceId === 'cmezxb1ez0001pc94yry3ntjk';
    console.log('🔍 [useMetricsCount] isNotaryEveryday:', isNotaryEveryday, 'workspaceId:', workspaceId, 'userId:', user?.id);
    
    if (isNotaryEveryday) {
      // Return 16 immediately for Notary Everyday (16 key metrics)
      console.log('🔍 [useMetricsCount] Setting count to 16 for Notary Everyday');
      setCount(16);
      return;
    }

    // For other workspaces, return 0
    console.log('🔍 [useMetricsCount] Setting count to 0 for other workspace');
    setCount(0);
  }, [workspaceId, user?.id]);

  return { count };
}
