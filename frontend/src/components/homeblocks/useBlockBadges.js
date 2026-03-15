import { useQuery } from 'react-query';
import api from '../../services/api';

/**
 * Fetch badges by IDs for home page blocks.
 * Uses the public active badges endpoint, then filters by provided IDs.
 */
export function useBlockBadges(badgeIds = [], enabled = true) {
  return useQuery(
    ['blockBadges', badgeIds.join(',')],
    async () => {
      if (!badgeIds.length) return [];
      const res = await api.get('/api/badges/active/list');
      const allBadges = res.data?.data || [];
      return allBadges.filter(b => badgeIds.includes(b._id));
    },
    {
      enabled: enabled && badgeIds.length > 0,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
}
