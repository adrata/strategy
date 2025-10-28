import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

export function useChronicleCount() {
  const { user } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const [count, setCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || user?.activeWorkspaceId;

  useEffect(() => {
    console.log('🔍 [useChronicleCount] Hook running with workspaceId:', workspaceId);
    
    if (!workspaceId) {
      console.log('🔍 [useChronicleCount] No workspaceId, setting count to 0');
      setCount(0);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Check if this is Notary Everyday workspace
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || workspaceId === 'cmezxb1ez0001pc94yry3ntjk';
    console.log('🔍 [useChronicleCount] isNotaryEveryday:', isNotaryEveryday, 'workspaceId:', workspaceId, 'userId:', user?.id);
    
    if (isNotaryEveryday) {
      // Fetch real data from API
      const fetchCount = async () => {
        try {
          const response = await fetch(`/api/v1/chronicle/reports?workspaceId=${workspaceId}&limit=20`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 [useChronicleCount] API response:', data);
            setCount(data.data?.total || 0);
            setUnreadCount(data.data?.unreadCount || 0);
          } else {
            console.log('🔍 [useChronicleCount] API failed, setting count to 0');
            setCount(0);
            setUnreadCount(0);
          }
        } catch (error) {
          console.error('🔍 [useChronicleCount] Error fetching count:', error);
          setCount(0);
          setUnreadCount(0);
        } finally {
          setLoading(false);
        }
      };

      fetchCount();
      return;
    }

    // For other workspaces, return 0
    console.log('🔍 [useChronicleCount] Setting count to 0 for other workspace');
    setCount(0);
    setUnreadCount(0);
    setLoading(false);
  }, [workspaceId, user?.id]);

  return { count, unreadCount, loading };
}
