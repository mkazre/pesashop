import React from 'react';
import { useEditor } from '@craftjs/core';
import { ComprehensiveSettings } from './ComprehensiveSettings';

/**
 * Fallback settings for any element type that doesn't have a dedicated settings panel.
 * Uses the comprehensive Oxygen Builder-style settings with Layout, Typography, and Advanced tabs.
 */
export const GenericNodeSettings = ({ nodeId, displayName, activeTab }) => {
  // Ensure nodeId is a string (it should be now from the fixed SettingsPanel)
  const safeNodeId = typeof nodeId === 'string' ? nodeId : String(nodeId);
  
  if (!safeNodeId) {
    return <div className="p-4 text-sm text-red-500">Error: Invalid node ID</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-blue-800">{displayName || 'Element'}</h4>
        </div>
        <p className="text-xs text-blue-700">
          This element is using the comprehensive settings panel. All styling options are available below.
        </p>
      </div>
      
      <ComprehensiveSettings 
        nodeId={safeNodeId} 
        displayName={displayName || 'Element'} 
        activeTab={activeTab} 
      />
    </div>
  );
};
