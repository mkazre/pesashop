import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

const DEFAULT_ICONS = [
  { platform: 'facebook', url: '#', label: 'Facebook' },
  { platform: 'twitter', url: '#', label: 'Twitter' },
  { platform: 'instagram', url: '#', label: 'Instagram' },
  { platform: 'linkedin', url: '#', label: 'LinkedIn' },
];

const PLATFORM_SVGS = {
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
  twitter: <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>,
  instagram: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>,
  linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>,
  youtube: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></>,
  github: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>,
  tiktok: <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>,
  pinterest: <><path d="M8 12a4 4 0 1 0 8 0c0-2.2-1.8-4-4-4s-4 1.8-4 4z"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M10 16l-1 4"/></>,
};

export const SocialIcons = ({
  icons = DEFAULT_ICONS,
  iconSize = '24px',
  iconColor = '#6b7280',
  hoverColor = '#3b82f6',
  gap = '12px',
  iconStyle = 'plain',
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
      className={`social-icons-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', gap, alignItems: 'center', flexWrap: 'wrap', ...style }}
    >
      {icons.map((icon, i) => (
        <a
          key={i}
          href={icon.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          title={icon.label || icon.platform}
          onClick={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconStyle !== 'plain' ? `calc(${iconSize} + 16px)` : iconSize,
            height: iconStyle !== 'plain' ? `calc(${iconSize} + 16px)` : iconSize,
            color: iconColor,
            backgroundColor: iconStyle === 'filled' ? '#f3f4f6' : 'transparent',
            border: iconStyle === 'outlined' ? `1px solid ${iconColor}` : 'none',
            borderRadius: iconStyle !== 'plain' ? '50%' : '0',
            transition: 'color 0.2s',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {PLATFORM_SVGS[icon.platform] || <circle cx="12" cy="12" r="10"/>}
          </svg>
        </a>
      ))}
    </div>
  );
};

export const SocialIconsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { icons = [], iconSize = '24px', iconColor = '#6b7280', gap = '12px', iconStyle = 'plain' } = props;

  const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'github', 'tiktok', 'pinterest'];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Icon Style</label>
          <select value={iconStyle} onChange={(e) => setProp((p) => { p.iconStyle = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="plain">Plain</option><option value="filled">Filled Circle</option><option value="outlined">Outlined Circle</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Icon Size</label><input type="text" value={iconSize} onChange={(e) => setProp((p) => { p.iconSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Gap</label><input type="text" value={gap} onChange={(e) => setProp((p) => { p.gap = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Icon Color</label><input type="color" value={iconColor} onChange={(e) => setProp((p) => { p.iconColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Icons</h4>
          <button onClick={() => setProp((p) => { p.icons = [...(p.icons || []), { platform: 'facebook', url: '#', label: 'Facebook' }]; })} className="text-xs text-blue-600 hover:text-blue-800">+ Add</button>
        </div>
        {icons.map((icon, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <select value={icon.platform} onChange={(e) => setProp((p) => { p.icons[i].platform = e.target.value; p.icons[i].label = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1); })} className="px-2 py-1 border border-gray-300 rounded text-xs">
                {platforms.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <button onClick={() => setProp((p) => { p.icons = p.icons.filter((_, idx) => idx !== i); })} className="text-xs text-red-500">✕</button>
            </div>
            <input type="text" value={icon.url} onChange={(e) => setProp((p) => { p.icons[i].url = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="URL" />
          </div>
        ))}
      </div>
    </div>
  );
};

SocialIcons.craft = {
  displayName: 'Social Icons',
  props: { icons: DEFAULT_ICONS, iconSize: '24px', iconColor: '#6b7280', hoverColor: '#3b82f6', gap: '12px', iconStyle: 'plain', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
