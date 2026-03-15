import { useQuery } from 'react-query';
import { productArchiveSettingsAPI } from '@/services/api';

let _cachedSettings = null;

export function useProductArchiveSettings() {
  const { data, isLoading } = useQuery(
    'productArchiveSettings',
    () => productArchiveSettingsAPI.get(),
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      onSuccess: (res) => {
        _cachedSettings = res?.data?.data || null;
      },
    }
  );

  const settings = data?.data?.data || _cachedSettings || null;

  return { settings, isLoading };
}

export default useProductArchiveSettings;
