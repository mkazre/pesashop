import React from 'react';
import { useEditor } from '@craftjs/core';
import { ComprehensiveSettings } from './ComprehensiveSettings';

export const TextSettingsForNode = ({ nodeId, activeTab = 'layout', displayName }) => {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-purple-800">Text</h4>
        </div>
        <p className="text-xs text-purple-700">
          Text element with content editing and typography controls.
        </p>
      </div>
      
      <ComprehensiveSettings 
        nodeId={nodeId} 
        displayName={displayName || 'Text'} 
        activeTab={activeTab} 
      />
    </div>
  );
};
