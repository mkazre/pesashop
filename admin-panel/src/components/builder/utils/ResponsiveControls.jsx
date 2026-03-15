import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { resolveStyles } from './resolveStyles';

const BREAKPOINTS = {
  desktop: { name: 'Desktop', icon: Monitor, width: '100%' },
  tablet: { name: 'Tablet', icon: Tablet, width: '768px' },
  mobile: { name: 'Mobile', icon: Smartphone, width: '375px' },
};

export const ResponsiveControls = ({ currentBreakpoint, onBreakpointChange }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {Object.entries(BREAKPOINTS).map(([key, config]) => {
        const Icon = config.icon;
        return (
          <button
            key={key}
            onClick={() => onBreakpointChange(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              currentBreakpoint === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={config.name}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{config.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export const useResponsiveStyles = (styles, breakpoint) => {
  // Get all styles for the current breakpoint.
  // Desktop = flat keys on the style object (excluding 'responsive').
  // Tablet/Phone = desktop base merged with style.responsive.{breakpoint} overrides.
  const getCurrentStyles = () => {
    if (!styles || typeof styles !== 'object') return {};

    // Build desktop base: everything except the 'responsive' key
    const { responsive, ...desktopBase } = styles;

    const merged = (breakpoint === 'desktop' || !responsive)
      ? desktopBase
      : { ...desktopBase, ...(responsive[breakpoint] || {}) };

    // Auto-resolve nested style objects (padding/margin/border objects)
    return resolveStyles(merged);
  };

  // Get a single style property for the current breakpoint
  const getStyle = (property) => {
    const merged = getCurrentStyles();
    return merged[property] ?? '';
  };

  return { getStyle, getCurrentStyles };
};

export { BREAKPOINTS };
