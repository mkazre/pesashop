import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const CopyToClipboard = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  textToCopy = 'npm install my-package',
  displayText = 'npm install my-package',
  buttonText = 'Copy',
  copiedText = 'Copied!',
  backgroundColor = '#f3f4f6',
  textColor = '#374151',
  buttonColor = '#3b82f6',
  borderRadius = '8px',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(textToCopy).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div ref={(ref) => connect(drag(ref))} className={`copy-clipboard ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor, padding: '10px 16px', borderRadius, ...style }}>
      <code style={{ flex: 1, fontSize: '13px', color: textColor, fontFamily: 'monospace' }}>{displayText}</code>
      <button onClick={handleCopy} style={{ padding: '6px 14px', backgroundColor: copied ? '#22c55e' : buttonColor, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
        {copied ? copiedText : buttonText}
      </button>
    </div>
  );
};

export const CopyToClipboardSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { textToCopy = '', displayText = '', buttonText = '', copiedText = '', backgroundColor = '#f3f4f6', buttonColor = '#3b82f6', borderRadius = '8px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Text to Copy</label><input type="text" value={textToCopy} onChange={(e) => setProp((p) => { p.textToCopy = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Display Text</label><input type="text" value={displayText} onChange={(e) => setProp((p) => { p.displayText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Button Text</label><input type="text" value={buttonText} onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Copied Text</label><input type="text" value={copiedText} onChange={(e) => setProp((p) => { p.copiedText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Button Color</label><input type="color" value={buttonColor} onChange={(e) => setProp((p) => { p.buttonColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

CopyToClipboard.craft = {
  displayName: 'Copy to Clipboard',
  props: { textToCopy: 'npm install my-package', displayText: 'npm install my-package', buttonText: 'Copy', copiedText: 'Copied!', backgroundColor: '#f3f4f6', textColor: '#374151', buttonColor: '#3b82f6', borderRadius: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
