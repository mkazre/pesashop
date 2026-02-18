import React from 'react';

/**
 * Minimal safe version of ComprehensiveSettings to isolate the error
 */
export const ComprehensiveSettings = ({ nodeId, displayName, activeTab }) => {
  console.log('ComprehensiveSettings rendered:', { nodeId, displayName, activeTab });
  
  // Safety check for nodeId
  if (!nodeId) {
    return <div className="p-4 text-sm text-gray-500">No element selected</div>;
  }
  
  // Ensure nodeId is a string
  const safeNodeId = typeof nodeId === 'string' ? nodeId : String(nodeId);
  console.log('Using safeNodeId:', safeNodeId);
  
  return (
    <div className="space-y-4">
      {/* Debug Section */}
      <div className="border border-red-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-red-800 mb-3">DEBUG - MINIMAL VERSION</h4>
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            NodeId: {safeNodeId}
          </div>
          <div className="text-xs text-gray-500">
            DisplayName: {displayName || 'undefined'}
          </div>
          <div className="text-xs text-gray-500">
            ActiveTab: {activeTab}
          </div>
        </div>
      </div>
      
      {/* Simple Test Input */}
      <div className="border border-gray-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-800 mb-3">Simple Test</h4>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Test Input</label>
          <input
            type="text"
            placeholder="Type here to test"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            onChange={(e) => console.log('Input changed:', e.target.value)}
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        This is a minimal version to test if the error still occurs.
      </div>
    </div>
  );
};
