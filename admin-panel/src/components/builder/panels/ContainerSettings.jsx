import React from 'react';
import { useEditor } from '@craftjs/core';
import { ComprehensiveSettings } from './ComprehensiveSettings';

/**
 * Container-specific settings using the comprehensive Oxygen Builder-style system
 */
function ContainerSettingsForm({ nodeId, activeTab = 'layout' }) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-green-800">Container</h4>
        </div>
        <p className="text-xs text-green-700">
          Structural container element. Can contain other elements and provides layout control.
        </p>
      </div>
      
      <ComprehensiveSettings 
        nodeId={nodeId}
        displayName="Container" 
        activeTab={activeTab}
      />
    </div>
  );
}

export const ContainerSettingsForNode = ({ nodeId, activeTab = 'layout' }) => {
  return <ContainerSettingsForm nodeId={nodeId} activeTab={activeTab} />;
};
