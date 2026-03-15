import { useQuery } from 'react-query';
import { homePageConfigAPI } from '../services/api';

export function useHomePageConfig() {
  return useQuery(
    'homePageConfig',
    async () => {
      const res = await homePageConfigAPI.getPublic();
      return res.data?.data || { blocks: [], isPublished: true };
    },
    {
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}
