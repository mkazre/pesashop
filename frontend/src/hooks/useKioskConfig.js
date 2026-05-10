import { useQuery } from 'react-query';
import { digitalKioskAPI } from '@/services/api';
import { useKioskStore } from '@/store/kioskStore';

export function useKioskConfig() {
  const deviceId = useKioskStore(s => s.deviceId);

  const { data, isLoading, error, refetch } = useQuery(
    ['kiosk-config', deviceId],
    () => digitalKioskAPI.getConfig(deviceId).then(r => r.data?.data),
    {
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  return { config: data, isLoading, error, refetch };
}
