import { useQuery } from 'react-query';
import { productPageSettingsAPI } from '@/services/api';

let _cachedSettings = null;

export function useProductPageSettings() {
  const { data, isLoading } = useQuery(
    'productPageSettings',
    () => productPageSettingsAPI.get(),
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

export default useProductPageSettings;
