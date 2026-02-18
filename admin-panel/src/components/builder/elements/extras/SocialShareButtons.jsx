import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const SocialShareButtons = ({
  platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'email'],
  shareUrl = 'https://example.com',
  shareText = 'Check this out!',
  buttonStyle = 'filled',
  size = '36px',
  gap = '8px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  const colors = { facebook: '#1877f2', twitter: '#1da1f2', linkedin: '#0a66c2', whatsapp: '#25d366', email: '#6b7280', pinterest: '#e60023', reddit: '#ff4500' };
  const labels = { facebook: 'f', twitter: '𝕏', linkedin: 'in', whatsapp: '💬', email: '✉', pinterest: 'P', reddit: 'r' };

  return (
    <div ref={(ref) => connect(drag(ref))} className={`social-share ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', gap, flexWrap: 'wrap', ...style }}>
      {platforms.map((p) => (
        <button key={p} onClick={(e) => e.preventDefault()} title={`Share on ${p}`}
          style={{
            width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', border: buttonStyle === 'outlined' ? `2px solid ${colors[p] || '#6b7280'}` : 'none',
            backgroundColor: buttonStyle === 'filled' ? (colors[p] || '#6b7280') : 'transparent',
            color: buttonStyle === 'filled' ? '#fff' : (colors[p] || '#6b7280'),
            fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s',
          }}>
          {labels[p] || p[0].toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export const SocialShareButtonsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { platforms = [], shareUrl = '', shareText = '', buttonStyle = 'filled', size = '36px', gap = '8px' } = props;
  const allPlatforms = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'pinterest', 'reddit'];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Share Settings</h4>
        <div><label className="block text-sm font-medium text-gray-700">Share URL</label><input type="text" value={shareUrl} onChange={(e) => setProp((p) => { p.shareUrl = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Share Text</label><input type="text" value={shareText} onChange={(e) => setProp((p) => { p.shareText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Platforms</h4>
        {allPlatforms.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={platforms.includes(p)} onChange={(e) => setProp((pr) => { pr.platforms = e.target.checked ? [...(pr.platforms||[]), p] : (pr.platforms||[]).filter(x => x !== p); })} />{p}</label>
        ))}
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Button Style</label><select value={buttonStyle} onChange={(e) => setProp((p) => { p.buttonStyle = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="filled">Filled</option><option value="outlined">Outlined</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Size</label><input type="text" value={size} onChange={(e) => setProp((p) => { p.size = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Gap</label><input type="text" value={gap} onChange={(e) => setProp((p) => { p.gap = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
    </div>
  );
};

SocialShareButtons.craft = {
  displayName: 'Social Share Buttons',
  props: { platforms: ['facebook', 'twitter', 'linkedin', 'whatsapp', 'email'], shareUrl: 'https://example.com', shareText: 'Check this out!', buttonStyle: 'filled', size: '36px', gap: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
