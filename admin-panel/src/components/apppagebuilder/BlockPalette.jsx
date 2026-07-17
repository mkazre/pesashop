import React from 'react';
import { BLOCK_CATEGORIES, BLOCK_REGISTRY } from './blockRegistry';
import { Layers } from 'lucide-react';

export default function BlockPalette({ onInsert }) {
  const byCategory = BLOCK_CATEGORIES.map((cat) => ({
    category: cat,
    types: Object.entries(BLOCK_REGISTRY).filter(([, meta]) => meta.category === cat),
  }));

  const hasAny = byCategory.some((c) => c.types.length > 0);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {!hasAny && (
        <p className="text-xs text-gray-400 text-center py-8">
          No elements available yet — they'll appear here as they're added.
        </p>
      )}
      {byCategory.map(({ category, types }) => (
        types.length > 0 && (
          <div key={category}>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">{category}</h3>
            <div className="grid grid-cols-2 gap-2">
              {types.map(([blockType, meta]) => (
                <button
                  key={blockType}
                  type="button"
                  onClick={() => onInsert(blockType)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                >
                  <Layers size={18} className="text-gray-500" />
                  <span className="text-xs text-gray-700 leading-tight">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
