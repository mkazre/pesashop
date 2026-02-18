import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Modal = ({
  triggerText = 'Open Modal',
  title = 'Modal Title',
  content = 'Modal content goes here.',
  triggerStyle = 'button',
  overlayColor = 'rgba(0,0,0,0.5)',
  maxWidth = '500px',
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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`modal-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
    >
      {triggerStyle === 'button' ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
        >
          {triggerText}
        </button>
      ) : (
        <a onClick={() => setIsOpen(true)} style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
          {triggerText}
        </a>
      )}

      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: overlayColor, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth, width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{title}</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{content}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ModalSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const { triggerText = '', title = '', content = '', triggerStyle = 'button', overlayColor = 'rgba(0,0,0,0.5)', maxWidth = '500px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Trigger</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Trigger Text</label>
          <input type="text" value={triggerText} onChange={(e) => setProp((p) => { p.triggerText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Trigger Style</label>
          <select value={triggerStyle} onChange={(e) => setProp((p) => { p.triggerStyle = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="button">Button</option>
            <option value="link">Link</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Modal Content</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <textarea value={content} onChange={(e) => setProp((p) => { p.content = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={4} />
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Width</label>
          <input type="text" value={maxWidth} onChange={(e) => setProp((p) => { p.maxWidth = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="500px" />
        </div>
      </div>
    </div>
  );
};

Modal.craft = {
  displayName: 'Modal',
  props: { triggerText: 'Open Modal', title: 'Modal Title', content: 'Modal content goes here.', triggerStyle: 'button', overlayColor: 'rgba(0,0,0,0.5)', maxWidth: '500px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
};
