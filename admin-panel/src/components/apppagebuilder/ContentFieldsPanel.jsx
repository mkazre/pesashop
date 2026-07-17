import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';
import IconPicker from '@/components/common/IconPicker';
import { formsAPI } from '@/services/api';

function FormField({ value, onChange }) {
  const { data } = useQuery('forms-picker', () => formsAPI.getAll());
  const forms = data?.data?.data || [];
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
      <option value="">Select a form...</option>
      {forms.map((f) => <option key={f._id} value={f._id}>{f.title}</option>)}
    </select>
  );
}

// ── Generic content-field renderer ────────────────────────────────────
// Renders a block's small set of *content* fields (text, image, items
// list, etc.) from a declarative schema (block.contentFields, see
// blockRegistry.js) rather than a bespoke settings form per block type.
// Styling is handled entirely separately by BlockStylePanel.

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

function ImageField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const isVideo = value && VIDEO_EXT_RE.test(value);
  return (
    <div>
      {value ? (
        <div className="relative border border-gray-200 rounded overflow-hidden">
          {isVideo ? (
            <video src={value} className="w-full h-28 object-cover" muted />
          ) : (
            <img src={value} alt="" className="w-full h-28 object-cover" />
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-1 py-6 border border-dashed border-gray-300 rounded text-gray-400 hover:border-blue-400 hover:text-blue-600"
        >
          <ImageIcon size={20} />
          <span className="text-xs">Choose image or video</span>
        </button>
      )}
      <MediaLibraryModal isOpen={open} onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false); }} />
    </div>
  );
}

function ItemsArrayField({ value, onChange, itemFields }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, key, val) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it));
    onChange(next);
  };
  const addItem = () => onChange([...items, {}]);
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded p-2 space-y-2 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
            <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
              <Trash2 size={12} />
            </button>
          </div>
          {(itemFields || [{ key: 'text', label: 'Text', type: 'text' }]).map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === 'image' ? (
                <ImageField value={item[f.key] || ''} onChange={(v) => updateItem(i, f.key, v)} />
              ) : f.type === 'icon' ? (
                <IconPicker value={item[f.key]} onChange={(v) => updateItem(i, f.key, v)} allow={['emoji', 'icon']} />
              ) : (
                <input
                  type="text"
                  value={item[f.key] || ''}
                  onChange={(e) => updateItem(i, f.key, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              )}
            </Field>
          ))}
        </div>
      ))}
      <button type="button" onClick={addItem} className="w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600">
        <Plus size={12} /> Add item
      </button>
    </div>
  );
}

export default function ContentFieldsPanel({ fields, props, onChange }) {
  if (!fields || fields.length === 0) {
    return <p className="text-xs text-gray-400 py-4 text-center">No content settings for this block.</p>;
  }

  const setField = (key, value) => onChange({ ...props, [key]: value });

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.type === 'text' && (
            <input type="text" value={props[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          )}
          {f.type === 'richtext' && (
            <textarea value={props[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} rows={5} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          )}
          {f.type === 'number' && (
            <input type="number" value={props[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value === '' ? undefined : Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          )}
          {f.type === 'color' && (
            <div className="flex items-center gap-2">
              <input type="color" value={props[f.key] || '#000000'} onChange={(e) => setField(f.key, e.target.value)} className="w-9 h-8 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={props[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
          )}
          {f.type === 'select' && (
            <select value={props[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
              {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          {f.type === 'toggle' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!props[f.key]} onChange={(e) => setField(f.key, e.target.checked)} className="rounded text-blue-600" />
              <span className="text-sm text-gray-600">{props[f.key] ? 'On' : 'Off'}</span>
            </label>
          )}
          {f.type === 'image' && (
            <ImageField value={props[f.key] || ''} onChange={(v) => setField(f.key, v)} />
          )}
          {f.type === 'icon' && (
            <IconPicker value={props[f.key]} onChange={(v) => setField(f.key, v)} allow={['emoji', 'icon']} />
          )}
          {f.type === 'items-array' && (
            <ItemsArrayField value={props[f.key]} onChange={(v) => setField(f.key, v)} itemFields={f.itemFields} />
          )}
          {f.type === 'form' && (
            <FormField value={props[f.key]} onChange={(v) => setField(f.key, v)} />
          )}
        </Field>
      ))}
    </div>
  );
}
