import React, { useState } from 'react';
import { IoChevronDownOutline } from 'react-icons/io5';

/**
 * Touch-friendly accordion. items = [{ id, label, content, count? }]
 * `defaultOpen` = id (or null). Multiple-open supported by passing array.
 */
export default function KioskAccordion({ items = [], defaultOpen = null }) {
  const [open, setOpen] = useState(() => {
    if (Array.isArray(defaultOpen)) return new Set(defaultOpen);
    return defaultOpen ? new Set([defaultOpen]) : new Set();
  });

  const toggle = (id) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
      {items.map(item => {
        const isOpen = open.has(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="kiosk-tile w-full flex items-center gap-4 px-5 md:px-7 py-5 md:py-6 text-left hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <span className="text-lg md:text-xl font-semibold text-gray-900">{item.label}</span>
                {typeof item.count === 'number' && (
                  <span className="ml-2 text-sm text-gray-500">({item.count})</span>
                )}
              </div>
              <IoChevronDownOutline
                size={26}
                className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 md:px-7 pb-6">
                {typeof item.content === 'function' ? item.content() : item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
