import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const PricingBox = ({
  title = 'Pro Plan',
  price = '$29',
  period = '/month',
  description = 'Perfect for growing businesses',
  features = ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
  buttonText = 'Get Started',
  buttonUrl = '#',
  highlighted = false,
  accentColor = '#3b82f6',
  backgroundColor = '#ffffff',
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`pricing-box-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        backgroundColor,
        borderRadius: '12px',
        padding: '32px 24px',
        textAlign: 'center',
        border: highlighted ? `2px solid ${accentColor}` : '1px solid #e5e7eb',
        position: 'relative',
        ...style,
      }}
    >
      {highlighted && (
        <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: accentColor, color: '#fff', padding: '2px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600 }}>
          Popular
        </div>
      )}
      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#111827' }}>{title}</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>{description}</p>
      <div style={{ margin: '0 0 24px 0' }}>
        <span style={{ fontSize: '48px', fontWeight: 700, color: '#111827' }}>{price}</span>
        <span style={{ fontSize: '16px', color: '#6b7280' }}>{period}</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', textAlign: 'left' }}>
        {features.map((f, i) => (
          <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: accentColor }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <a
        href={buttonUrl}
        onClick={(e) => e.preventDefault()}
        style={{
          display: 'block',
          padding: '12px 24px',
          backgroundColor: highlighted ? accentColor : 'transparent',
          color: highlighted ? '#fff' : accentColor,
          border: highlighted ? 'none' : `2px solid ${accentColor}`,
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        {buttonText}
      </a>
    </div>
  );
};

export const PricingBoxSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { title = '', price = '', period = '', description = '', features = [], buttonText = '', buttonUrl = '', highlighted = false, accentColor = '#3b82f6', backgroundColor = '#ffffff' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Description</label><input type="text" value={description} onChange={(e) => setProp((p) => { p.description = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Price</label><input type="text" value={price} onChange={(e) => setProp((p) => { p.price = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Period</label><input type="text" value={period} onChange={(e) => setProp((p) => { p.period = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Button Text</label><input type="text" value={buttonText} onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Button URL</label><input type="text" value={buttonUrl} onChange={(e) => setProp((p) => { p.buttonUrl = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={highlighted} onChange={(e) => setProp((p) => { p.highlighted = e.target.checked; })} />Highlighted (Popular)</label>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Features</h4>
          <button onClick={() => setProp((p) => { p.features = [...(p.features || []), 'New Feature']; })} className="text-xs text-blue-600 hover:text-blue-800">+ Add</button>
        </div>
        {features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={f} onChange={(e) => setProp((p) => { p.features[i] = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
            <button onClick={() => setProp((p) => { p.features = p.features.filter((_, idx) => idx !== i); })} className="text-xs text-red-500">✕</button>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Accent Color</label><input type="color" value={accentColor} onChange={(e) => setProp((p) => { p.accentColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

PricingBox.craft = {
  displayName: 'Pricing Box',
  props: { title: 'Pro Plan', price: '$29', period: '/month', description: 'Perfect for growing businesses', features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'], buttonText: 'Get Started', buttonUrl: '#', highlighted: false, accentColor: '#3b82f6', backgroundColor: '#ffffff', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
