import React, { useState, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const RichText = ({
  content = '<p>Rich text content. Double-click to edit.</p>',
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [editing, setEditing] = useState(false);
  const editorRef = useRef(null);

  const handleBlur = () => {
    setEditing(false);
    if (editorRef.current) {
      setProp((p) => { p.content = editorRef.current.innerHTML; });
    }
  };

  if (editing) {
    return (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: content }}
        onBlur={handleBlur}
        className={`rich-text-element ${className} ring-2 ring-blue-500 outline-none`}
        style={{ minHeight: '40px', padding: '4px', ...style }}
      />
    );
  }

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      onDoubleClick={() => setEditing(true)}
      className={`rich-text-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ minHeight: '40px', cursor: 'text', ...style }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export const RichTextSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { content = '' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content (HTML)</h4>
        <textarea
          value={content}
          onChange={(e) => setProp((p) => { p.content = e.target.value; })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
          rows={6}
          placeholder="<p>Enter HTML content</p>"
        />
        <p className="text-xs text-gray-500">Supports HTML tags: p, strong, em, a, ul, ol, li, h1-h6, br</p>
      </div>
    </div>
  );
};

RichText.craft = {
  displayName: 'Rich Text',
  props: { content: '<p>Rich text content. Double-click to edit.</p>', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
