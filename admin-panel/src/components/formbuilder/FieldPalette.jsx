import React from 'react';
import { FIELD_TYPES } from './fieldRegistry';

export default function FieldPalette({ onInsert }) {
  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fields</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(FIELD_TYPES).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => onInsert(type)}
            className="px-2 py-2.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors text-left"
          >
            {meta.label}
          </button>
        ))}
      </div>
    </div>
  );
}
