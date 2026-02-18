import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const defaultSettings = {
  detailPage: { titleLines: 0, descriptionLines: 0, shortDescriptionLines: 0, reviewLines: 0 },
  otherLocations: { titleLines: 2, descriptionLines: 3, shortDescriptionLines: 2, reviewLines: 3 }
};

let cachedSettings = null;
let fetchPromise = null;

async function fetchSettings() {
  if (cachedSettings) return cachedSettings;
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = fetch(`${API_URL}/settings/product-display`)
    .then(res => res.json())
    .then(data => {
      cachedSettings = data?.data || defaultSettings;
      return cachedSettings;
    })
    .catch(() => {
      cachedSettings = defaultSettings;
      return defaultSettings;
    });
  
  return fetchPromise;
}

/**
 * Returns CSS style object for line clamping.
 * @param {number} lines - Number of lines to clamp (0 = no clamp)
 */
export function clampStyle(lines) {
  if (!lines || lines <= 0) return {};
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

/**
 * Hook to get product display settings.
 * @param {'detail' | 'other'} location - 'detail' for product detail page, 'other' for grids/lists/archives
 * @returns {{ titleLines, descriptionLines, shortDescriptionLines, reviewLines, clampStyle }}
 */
export function useProductDisplay(location = 'other') {
  const [settings, setSettings] = useState(cachedSettings || defaultSettings);

  useEffect(() => {
    fetchSettings().then(s => setSettings(s));
  }, []);

  const loc = location === 'detail' ? settings.detailPage : settings.otherLocations;

  return {
    titleLines: loc?.titleLines || 0,
    descriptionLines: loc?.descriptionLines || 0,
    shortDescriptionLines: loc?.shortDescriptionLines || 0,
    reviewLines: loc?.reviewLines || 0,
    clampStyle,
  };
}

export default useProductDisplay;
