import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

export function useMetricsCount() {
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  const [count, setCount] = useState<number>(0);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;

  useEffect(() => {
    console.log('🔍 [useMetricsCount] Hook running with workspaceId:', workspaceId);
    
    if (!workspaceId) {
      console.log('🔍 [useMetricsCount] No workspaceId, setting count to 0');
      setCount(0);
      return;
    }

    // Check if this is Notary Everyday workspace (check both old and new IDs)
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1';
    console.log('🔍 [useMetricsCount] isNotaryEveryday:', isNotaryEveryday, 'workspaceId:', workspaceId);
    
    if (isNotaryEveryday) {
      // Return 9 immediately for Notary Everyday (9 metric cards in 3x3 grid)
      console.log('🔍 [useMetricsCount] Setting count to 9 for Notary Everyday');
      setCount(9);
      return;
    }

    // For other workspaces, return 0
    console.log('🔍 [useMetricsCount] Setting count to 0 for other workspace');
    setCount(0);
  }, [workspaceId]);

  return { count };
}
