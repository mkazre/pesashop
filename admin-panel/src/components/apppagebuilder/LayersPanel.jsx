import React from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { getBlockMeta } from './blockRegistry';

export default function LayersPanel({ blocks, selectedId, onSelect }) {
  if (blocks.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-8">No blocks yet.</p>;
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, i) => {
        const meta = getBlockMeta(block.blockType);
        const children = Array.isArray(block.children) ? block.children : [];
        return (
          <div key={block._id}>
            <button
              type="button"
              onClick={() => onSelect(block._id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm ${
                block._id === selectedId ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Layers size={13} className="text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate">{i + 1}. {meta?.label || block.blockType}</span>
              {!block.enabled && <EyeOff size={12} className="text-gray-300 flex-shrink-0" />}
            </button>
            {children.length > 0 && (
              <div className="ml-6 border-l border-gray-100 pl-2 space-y-0.5">
                {children.map((child, j) => (
                  <div key={child._id || j} className="px-2 py-1 text-xs text-gray-400 truncate">
                    ↳ {getBlockMeta(child.blockType)?.label || child.blockType}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
