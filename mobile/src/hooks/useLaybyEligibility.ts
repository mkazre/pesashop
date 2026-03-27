import { useState, useEffect, useRef } from 'react';
import { laybyPlansAPI } from '@/services/api';

/**
 * Shared cache + batching for layby eligibility checks.
 * Multiple ProductCard instances schedule their product IDs,
 * and a single debounced API call resolves them all at once.
 */
const cache: Record<string, boolean> = {};
const pending = new Set<string>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let batchListeners: Array<() => void> = [];

function scheduleBatch() {
  if (batchTimer) return;
  batchTimer = setTimeout(async () => {
    batchTimer = null;
    const ids = [...pending];
    pending.clear();
    if (ids.length === 0) return;

    try {
      const res = await laybyPlansAPI.checkProducts(ids);
      const data = res.data?.data || {};
      for (const id of ids) {
        cache[id] = !!data[id];
      }
    } catch {
      for (const id of ids) {
        cache[id] = false;
      }
    }

    const listeners = [...batchListeners];
    batchListeners = [];
    listeners.forEach((cb) => cb());
  }, 50);
}

/**
 * Hook: returns whether the given product is eligible for any layby plan.
 * Uses a shared batch + cache to avoid N+1 API calls.
 */
export function useLaybyEligibility(productId: string | undefined): boolean | null {
  const [eligible, setEligible] = useState<boolean | null>(
    productId && cache[productId] !== undefined ? cache[productId] : null
  );
  const idRef = useRef(productId);
  idRef.current = productId;

  useEffect(() => {
    if (!productId) {
      setEligible(false);
      return;
    }

    if (cache[productId] !== undefined) {
      setEligible(cache[productId]);
      return;
    }

    pending.add(productId);

    const onBatchDone = () => {
      if (idRef.current && cache[idRef.current] !== undefined) {
        setEligible(cache[idRef.current]);
      }
    };

    batchListeners.push(onBatchDone);
    scheduleBatch();

    return () => {
      const idx = batchListeners.indexOf(onBatchDone);
      if (idx !== -1) batchListeners.splice(idx, 1);
    };
  }, [productId]);

  return eligible;
}

export function clearLaybyEligibilityCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
