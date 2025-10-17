import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

export function useChronicleCount() {
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  const [count, setCount] = useState<number>(0);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;

  useEffect(() => {
    console.log('🔍 [useChronicleCount] Hook running with workspaceId:', workspaceId);
    
    if (!workspaceId) {
      console.log('🔍 [useChronicleCount] No workspaceId, setting count to 0');
      setCount(0);
      return;
    }

    // Check if this is Notary Everyday workspace AND Ryan Serrato user
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || workspaceId === 'cmezxb1ez0001pc94yry3ntjk';
    const isRyanSerrato = user?.id === 'cmf0kew2z0000pcsexylorpxp';
    console.log('🔍 [useChronicleCount] isNotaryEveryday:', isNotaryEveryday, 'isRyanSerrato:', isRyanSerrato, 'workspaceId:', workspaceId, 'userId:', user?.id);
    
    if (isNotaryEveryday && isRyanSerrato) {
      // Return 3 immediately for Ryan Serrato in Notary Everyday (mock reports)
      console.log('🔍 [useChronicleCount] Setting count to 3 for Ryan Serrato in Notary Everyday');
      setCount(3);
      return;
    }

    // For all other users/workspaces, return 0
    console.log('🔍 [useChronicleCount] Setting count to 0 for other user/workspace');
    setCount(0);
  }, [workspaceId, user?.id]);

  return { count };
}
