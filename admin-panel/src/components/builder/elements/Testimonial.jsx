import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Testimonial = ({
  quote = 'This product changed my life. Highly recommended!',
  author = 'Jane Doe',
  role = 'CEO, Company',
  avatar = 'https://placehold.co/64x64/e2e8f0/64748b?text=JD',
  rating = 5,
  layout = 'centered',
  quoteColor = '#374151',
  authorColor = '#111827',
  roleColor = '#6b7280',
  backgroundColor = '#f9fafb',
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
      className={`testimonial-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        backgroundColor,
        borderRadius: '12px',
        padding: '24px',
        textAlign: layout === 'centered' ? 'center' : 'left',
        ...style,
      }}
    >
      {rating > 0 && (
        <div style={{ marginBottom: '12px', fontSize: '18px' }}>
          {'★'.repeat(Math.min(5, rating))}{'☆'.repeat(Math.max(0, 5 - rating))}
        </div>
      )}
      <p style={{ fontSize: '16px', lineHeight: 1.6, color: quoteColor, fontStyle: 'italic', margin: '0 0 16px 0' }}>
        "{quote}"
      </p>
      <div style={{ display: 'flex', alignItems: layout === 'centered' ? 'center' : 'flex-start', justifyContent: layout === 'centered' ? 'center' : 'flex-start', gap: '12px' }}>
        {avatar && (
          <img src={avatar} alt={author} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: authorColor }}>{author}</div>
          {role && <div style={{ fontSize: '13px', color: roleColor }}>{role}</div>}
        </div>
      </div>
    </div>
  );
};

export const TestimonialSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { quote = '', author = '', role = '', avatar = '', rating = 5, layout = 'centered', quoteColor = '#374151', authorColor = '#111827', backgroundColor = '#f9fafb' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Quote</label><textarea value={quote} onChange={(e) => setProp((p) => { p.quote = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Author</label><input type="text" value={author} onChange={(e) => setProp((p) => { p.author = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Role / Company</label><input type="text" value={role} onChange={(e) => setProp((p) => { p.role = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Avatar URL</label><input type="text" value={avatar} onChange={(e) => setProp((p) => { p.avatar = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Rating (0-5)</label><input type="number" min={0} max={5} value={rating} onChange={(e) => setProp((p) => { p.rating = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Layout</label><select value={layout} onChange={(e) => setProp((p) => { p.layout = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="centered">Centered</option><option value="left">Left Aligned</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Quote Color</label><input type="color" value={quoteColor} onChange={(e) => setProp((p) => { p.quoteColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

Testimonial.craft = {
  displayName: 'Testimonial',
  props: { quote: 'This product changed my life. Highly recommended!', author: 'Jane Doe', role: 'CEO, Company', avatar: 'https://placehold.co/64x64/e2e8f0/64748b?text=JD', rating: 5, layout: 'centered', quoteColor: '#374151', authorColor: '#111827', roleColor: '#6b7280', backgroundColor: '#f9fafb', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
