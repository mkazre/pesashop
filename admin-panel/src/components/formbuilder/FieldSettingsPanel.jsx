import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FIELD_TYPES } from './fieldRegistry';

export default function FieldSettingsPanel({ field, onChange }) {
  const meta = FIELD_TYPES[field.fieldType];
  const set = (key, value) => onChange({ ...field, [key]: value });

  const updateOption = (i, value) => {
    const next = [...(field.options || [])];
    next[i] = value;
    set('options', next);
  };
  const addOption = () => set('options', [...(field.options || []), `Option ${(field.options || []).length + 1}`]);
  const removeOption = (i) => set('options', (field.options || []).filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{field.fieldType === 'section-break' ? 'Section Title' : 'Label'}</label>
        <input type="text" value={field.label || ''} onChange={(e) => set('label', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
      </div>

      {meta?.hasPlaceholder && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
          <input type="text" value={field.placeholder || ''} onChange={(e) => set('placeholder', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
      )}

      {meta?.hasOptions && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
          <div className="space-y-2">
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-1">
                <input type="text" value={opt} onChange={(e) => updateOption(i, e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
                <button type="button" onClick={() => removeOption(i)} className="text-red-500 hover:text-red-700"><Trash2 size={12} /></button>
              </div>
            ))}
            <button type="button" onClick={addOption} className="w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600">
              <Plus size={12} /> Add option
            </button>
          </div>
        </div>
      )}

      {field.fieldType !== 'section-break' && field.fieldType !== 'hidden' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!field.required} onChange={(e) => set('required', e.target.checked)} className="rounded text-blue-600" />
          <span className="text-sm text-gray-600">Required</span>
        </label>
      )}

      {field.fieldType === 'hidden' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Default Value</label>
          <input type="text" value={field.placeholder || ''} onChange={(e) => set('placeholder', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
        <select
          value={field.style?.width ?? 100}
          onChange={(e) => set('style', { ...(field.style || {}), width: Number(e.target.value) })}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
        >
          <option value={100}>Full width</option>
          <option value={50}>Half width</option>
        </select>
      </div>
    </div>
  );
}
