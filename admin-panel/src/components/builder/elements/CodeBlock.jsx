import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const CodeBlock = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  code = '<div class="custom">\n  <p>Hello World</p>\n</div>',
  language = 'html',
  showLineNumbers = true,
  backgroundColor = '#1e1e2e',
  textColor = '#cdd6f4',
  fontSize = '13px',
  className = '',
  style = {},
} = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const lines = code.split('\n');

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`code-block-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ borderRadius: '8px', overflow: 'hidden', ...style }}
    >
      <div style={{ backgroundColor: '#181825', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6c7086', textTransform: 'uppercase' }}>{language}</span>
      </div>
      <pre style={{ margin: 0, padding: '16px', backgroundColor, color: textColor, fontSize, lineHeight: 1.6, overflow: 'auto', fontFamily: "Fira Code, Consolas, monospace" }}>
        <code>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex' }}>
              {showLineNumbers && (
                <span style={{ color: '#585b70', minWidth: '32px', textAlign: 'right', marginRight: '16px', userSelect: 'none' }}>{i + 1}</span>
              )}
              <span>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export const CodeBlockSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { code = '', language = 'html', showLineNumbers = true, backgroundColor = '#1e1e2e', textColor = '#cdd6f4', fontSize = '13px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Code</h4>
        <div><label className="block text-sm font-medium text-gray-700">Language</label>
          <select value={language} onChange={(e) => setProp((p) => { p.language = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="html">HTML</option><option value="css">CSS</option><option value="javascript">JavaScript</option><option value="php">PHP</option><option value="python">Python</option><option value="json">JSON</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Code</label>
          <textarea value={code} onChange={(e) => setProp((p) => { p.code = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono" rows={8} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showLineNumbers} onChange={(e) => setProp((p) => { p.showLineNumbers = e.target.checked; })} />Show Line Numbers</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

CodeBlock.craft = {
  displayName: 'Code Block',
  props: { code: '<div class="custom">\n  <p>Hello World</p>\n</div>', language: 'html', showLineNumbers: true, backgroundColor: '#1e1e2e', textColor: '#cdd6f4', fontSize: '13px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
