import { useState, useEffect } from 'react';

const PRESETS_STORAGE_KEY = 'craftjs-presets';

export const useComponentPresets = () => {
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    // Load presets from localStorage
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
  }, []);

  const savePreset = (name, componentData, styles) => {
    const newPreset = {
      id: `preset-${Date.now()}`,
      name,
      componentType: componentData.type,
      props: componentData.props,
      styles,
      createdAt: new Date().toISOString(),
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    return newPreset;
  };

  const deletePreset = (presetId) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  };

  const getPresetsByType = (componentType) => {
    return presets.filter((p) => p.componentType === componentType);
  };

  return {
    presets,
    savePreset,
    deletePreset,
    getPresetsByType,
  };
};
