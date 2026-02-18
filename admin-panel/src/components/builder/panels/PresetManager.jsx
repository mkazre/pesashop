import React, { useState } from 'react';
import { useComponentPresets } from '@/components/builder/utils/ComponentPresets';
import { Save, Trash2, Package } from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';

export const PresetManager = ({ componentType, onLoadPreset }) => {
  const { presets, savePreset, deletePreset, getPresetsByType } = useComponentPresets();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  const componentPresets = getPresetsByType(componentType);

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    // Get current component data from editor
    // This would need to be passed from the parent
    const componentData = {
      type: componentType,
      props: {}, // Would be populated from current component
      styles: {}, // Would be populated from current component
    };

    savePreset(presetName, componentData, {});
    setShowSaveModal(false);
    setPresetName('');
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Component Presets</h4>
        <button
          onClick={() => setShowSaveModal(true)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Save size={14} />
          Save Preset
        </button>
      </div>

      {componentPresets.length === 0 ? (
        <p className="text-xs text-gray-500">No presets saved for this component type</p>
      ) : (
        <div className="space-y-2">
          {componentPresets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                <span className="text-sm text-gray-700">{preset.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLoadPreset(preset)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Load
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this preset?')) {
                      deletePreset(preset.id);
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveModal && (
        <Modal isOpen onClose={() => setShowSaveModal(false)} title="Save Preset">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preset Name
              </label>
              <Input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreset}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
