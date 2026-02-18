import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { pageTemplatesAPI } from '@/services/api';

/**
 * Fetches a published page-builder template by its templateType (e.g. 'single-product', 'cart', 'checkout', 'shop').
 * Returns { components, isLoading, hasTemplate } so the consuming page can render via PageRenderer
 * when a template exists, or fall back to its hardcoded layout otherwise.
 */
export function usePageTemplate(templateType) {
  const { data, isLoading, isError } = useQuery(
    ['page-template', templateType],
    () => pageTemplatesAPI.getByType(templateType),
    {
      retry: false,
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const rawComponents = data?.data?.data?.components;

  const components = useMemo(() => {
    if (!rawComponents) return null;
    if (typeof rawComponents === 'object' && rawComponents !== null && !Array.isArray(rawComponents)) {
      return Object.keys(rawComponents).length > 0 ? rawComponents : null;
    }
    if (typeof rawComponents === 'string') {
      try {
        const parsed = JSON.parse(rawComponents);
        return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0 ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }, [rawComponents]);

  return {
    components,
    isLoading: isLoading && !isError,
    hasTemplate: !!components,
  };
}
