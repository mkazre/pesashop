import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useRepeaterItem } from '@/components/builder/utils/RepeaterContext';

export const ProductCartButton = ({
  buttonText = 'Add to Cart',
  addedText = 'Added!',
  showQuantity = true,
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  borderRadius = '8px',
  fontSize = '14px',
  fullWidth = true,
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => { setAdded(true); setTimeout(() => setAdded(false), 2000); };

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-cart-btn ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', gap: '8px', alignItems: 'center', ...style }}>
      {showQuantity && (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius }}>
          <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>−</button>
          <span style={{ padding: '8px 12px', fontSize, minWidth: '40px', textAlign: 'center' }}>{qty}</span>
          <button onClick={() => setQty(qty + 1)} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>+</button>
        </div>
      )}
      <button onClick={handleAdd} style={{ flex: fullWidth ? 1 : 'none', padding: '12px 24px', backgroundColor: added ? '#22c55e' : backgroundColor, color: textColor, border: 'none', borderRadius, fontSize, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
        {added ? addedText : buttonText}
      </button>
    </div>
  );
};

export const ProductCartButtonSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { buttonText = '', addedText = '', showQuantity = true, backgroundColor = '#3b82f6', textColor = '#ffffff', borderRadius = '8px', fullWidth = true } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Button</h4>
        <div><label className="block text-sm font-medium text-gray-700">Button Text</label><input type="text" value={buttonText} onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Added Text</label><input type="text" value={addedText} onChange={(e) => setProp((p) => { p.addedText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showQuantity} onChange={(e) => setProp((p) => { p.showQuantity = e.target.checked; })} />Show Quantity Selector</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fullWidth} onChange={(e) => setProp((p) => { p.fullWidth = e.target.checked; })} />Full Width</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

ProductCartButton.craft = {
  displayName: 'Product Cart Button',
  props: { buttonText: 'Add to Cart', addedText: 'Added!', showQuantity: true, backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: '8px', fontSize: '14px', fullWidth: true, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
