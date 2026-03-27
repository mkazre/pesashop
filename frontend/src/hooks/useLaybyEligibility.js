import { useState, useEffect, useRef } from 'react';
import { laybyPlansAPI } from '@/services/api';

/**
 * Shared cache + batching for layby eligibility checks.
 * Multiple ProductCard instances schedule their product IDs,
 * and a single debounced API call resolves them all at once.
 */
const cache = {};          // productId -> boolean
const pending = new Set(); // productIds waiting to be fetched
let batchTimer = null;
let batchListeners = [];   // callbacks to notify when batch resolves

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
      // On error, mark all as false so badge doesn't show
      for (const id of ids) {
        cache[id] = false;
      }
    }

    // Notify all waiting hooks
    const listeners = [...batchListeners];
    batchListeners = [];
    listeners.forEach((cb) => cb());
  }, 50); // 50ms debounce to collect IDs from the same render cycle
}

/**
 * Hook: returns whether the given product is eligible for any layby plan.
 * Uses a shared batch + cache to avoid N+1 API calls.
 */
export function useLaybyEligibility(productId) {
  const [eligible, setEligible] = useState(cache[productId] ?? null);
  const idRef = useRef(productId);
  idRef.current = productId;

  useEffect(() => {
    if (!productId) {
      setEligible(false);
      return;
    }

    // Already cached
    if (cache[productId] !== undefined) {
      setEligible(cache[productId]);
      return;
    }

    // Add to pending batch
    pending.add(productId);

    const onBatchDone = () => {
      if (cache[idRef.current] !== undefined) {
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

/**
 * Utility to clear the eligibility cache (e.g. after admin changes plans).
 */
export function clearLaybyEligibilityCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}
