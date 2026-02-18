import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useRepeaterItem } from '@/components/builder/utils/RepeaterContext';

export const ProductImages = ({
  mainImage = 'https://placehold.co/600x600/e2e8f0/64748b?text=Product+Image',
  thumbnails = [
    'https://placehold.co/100x100/e2e8f0/64748b?text=1',
    'https://placehold.co/100x100/e2e8f0/64748b?text=2',
    'https://placehold.co/100x100/e2e8f0/64748b?text=3',
  ],
  borderRadius = '8px',
  thumbnailGap = '8px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const repeaterItem = useRepeaterItem();
  const displayMainImage = repeaterItem?.featuredImage || repeaterItem?.images?.[0] || mainImage;
  const displayThumbnails = repeaterItem?.images?.length > 1 ? repeaterItem.images.slice(1) : thumbnails;
  const [activeImg, setActiveImg] = useState(displayMainImage);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-images ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <div style={{ borderRadius, overflow: 'hidden', marginBottom: '12px' }}>
        <img src={activeImg} alt="Product" style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }} />
      </div>
      {thumbnails.length > 0 && (
        <div style={{ display: 'flex', gap: thumbnailGap }}>
          {[mainImage, ...thumbnails].map((t, i) => (
            <button key={i} onClick={() => setActiveImg(t)} style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: activeImg === t ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', padding: 0, background: 'none' }}>
              <img src={t} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductImagesSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { mainImage = '', thumbnails = [], borderRadius = '8px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Product Images</h4>
        <div><label className="block text-sm font-medium text-gray-700">Main Image URL</label><input type="text" value={mainImage} onChange={(e) => setProp((p) => { p.mainImage = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Thumbnails</h4><button onClick={() => setProp((p) => { p.thumbnails = [...(p.thumbnails||[]), 'https://placehold.co/100x100/e2e8f0/64748b?text=New']; })} className="text-xs text-blue-600">+ Add</button></div>
        {thumbnails.map((t, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={t} onChange={(e) => setProp((p) => { p.thumbnails[i] = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
            <button onClick={() => setProp((p) => { p.thumbnails = p.thumbnails.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

ProductImages.craft = {
  displayName: 'Product Images',
  props: { mainImage: 'https://placehold.co/600x600/e2e8f0/64748b?text=Product+Image', thumbnails: ['https://placehold.co/100x100/e2e8f0/64748b?text=1', 'https://placehold.co/100x100/e2e8f0/64748b?text=2', 'https://placehold.co/100x100/e2e8f0/64748b?text=3'], borderRadius: '8px', thumbnailGap: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
