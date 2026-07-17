import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// ── Shared styling controls, used identically by every block type ────
// This is the scalability piece: rather than a bespoke settings form per
// element, every block's "Style" tab renders this one component against
// block.props.style. Mirrors the *scope* of the website builder's
// Layout/Typography/Advanced tabs (spacing, typography, colors, borders,
// effects) — written fresh, not copied, and trimmed to what RN's style
// model can actually express (no CSS box-shadow strings, blend modes etc.).

const Section = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

const NumberInput = ({ value, onChange, placeholder }) => (
  <input
    type="number"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    placeholder={placeholder}
    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
  />
);

const ColorInput = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      className="w-9 h-8 border border-gray-300 rounded cursor-pointer"
    />
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="transparent"
      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
    />
  </div>
);

const SelectInput = ({ value, onChange, options }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const FOUR_SIDE = ['Top', 'Right', 'Bottom', 'Left'];

const FourSideControl = ({ prefix, style, setStyle }) => (
  <div className="grid grid-cols-4 gap-2">
    {FOUR_SIDE.map((side) => (
      <div key={side}>
        <label className="block text-[10px] text-gray-400 mb-0.5">{side[0]}</label>
        <input
          type="number"
          value={style[`${prefix}${side}`] ?? ''}
          onChange={(e) => setStyle(`${prefix}${side}`, e.target.value === '' ? undefined : Number(e.target.value))}
          className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs"
        />
      </div>
    ))}
  </div>
);

export default function BlockStylePanel({ style = {}, onChange }) {
  const setStyle = (key, value) => onChange({ ...style, [key]: value });

  return (
    <div className="space-y-2">
      <Section title="Typography" defaultOpen>
        <Field label="Font Size">
          <NumberInput value={style.fontSize} onChange={(v) => setStyle('fontSize', v)} placeholder="16" />
        </Field>
        <Field label="Font Weight">
          <SelectInput
            value={style.fontWeight || 'normal'}
            onChange={(v) => setStyle('fontWeight', v)}
            options={['normal', '400', '500', '600', '700', '800', 'bold'].map((w) => ({ value: w, label: w }))}
          />
        </Field>
        <Field label="Text Align">
          <SelectInput
            value={style.textAlign || 'left'}
            onChange={(v) => setStyle('textAlign', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
          />
        </Field>
        <Field label="Text Color">
          <ColorInput value={style.color} onChange={(v) => setStyle('color', v)} />
        </Field>
        <Field label="Line Height">
          <NumberInput value={style.lineHeight} onChange={(v) => setStyle('lineHeight', v)} placeholder="24" />
        </Field>
        <Field label="Letter Spacing">
          <NumberInput value={style.letterSpacing} onChange={(v) => setStyle('letterSpacing', v)} placeholder="0" />
        </Field>
      </Section>

      <Section title="Spacing">
        <Field label="Padding (px, per side)">
          <FourSideControl prefix="padding" style={style} setStyle={setStyle} />
        </Field>
        <Field label="Margin (px, per side)">
          <FourSideControl prefix="margin" style={style} setStyle={setStyle} />
        </Field>
      </Section>

      <Section title="Background">
        <Field label="Background Color">
          <ColorInput value={style.backgroundColor} onChange={(v) => setStyle('backgroundColor', v)} />
        </Field>
      </Section>

      <Section title="Border">
        <Field label="Border Width">
          <NumberInput value={style.borderWidth} onChange={(v) => setStyle('borderWidth', v)} placeholder="0" />
        </Field>
        <Field label="Border Color">
          <ColorInput value={style.borderColor} onChange={(v) => setStyle('borderColor', v)} />
        </Field>
        <Field label="Border Radius">
          <NumberInput value={style.borderRadius} onChange={(v) => setStyle('borderRadius', v)} placeholder="0" />
        </Field>
      </Section>

      <Section title="Size & Effects">
        <Field label="Width">
          <SelectInput
            value={style.width || 'auto'}
            onChange={(v) => setStyle('width', v)}
            options={[{ value: 'auto', label: 'Auto' }, { value: '100%', label: 'Full width' }, { value: '75%', label: '75%' }, { value: '50%', label: '50%' }, { value: '25%', label: '25%' }]}
          />
        </Field>
        <Field label="Opacity (0-1)">
          <NumberInput value={style.opacity} onChange={(v) => setStyle('opacity', v)} placeholder="1" />
        </Field>
      </Section>
    </div>
  );
}
