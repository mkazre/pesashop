import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const AuthorBox = ({
  name = 'John Doe',
  bio = 'A passionate writer and developer sharing insights about web development and design.',
  avatar = 'https://placehold.co/80x80/e2e8f0/64748b?text=JD',
  showSocial = true,
  socialLinks = [{ platform: 'twitter', url: '#' }, { platform: 'linkedin', url: '#' }],
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {avatar && <img src={avatar} alt={name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
      <div>
        <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>{name}</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{bio}</p>
      </div>
    </div>
  );
};

export const AuthorBoxSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      {[{ key: 'name', label: 'Name' }, { key: 'avatar', label: 'Avatar URL' }].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</label>
          <input type="text" value={props[key] || ''} onChange={(e) => setProp((p) => { p[key] = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      ))}
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Bio</label>
      <textarea value={props.bio || ''} onChange={(e) => setProp((p) => { p.bio = e.target.value; })} rows={3}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }} />
    </div>
  );
};

AuthorBox.craft = {
  displayName: 'Author Box',
  props: { name: 'John Doe', bio: 'A passionate writer and developer.', avatar: 'https://placehold.co/80x80/e2e8f0/64748b?text=JD', showSocial: true, socialLinks: [], className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: AuthorBoxSettings },
};
