import React from 'react';
import { useNode } from '@craftjs/core';
import { ComprehensiveSettings } from '@/components/builder/panels/ComprehensiveSettings';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const TestElement = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { content = "Test Element", className = '', style = {} } = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`test-element ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''} p-4 border border-gray-300 rounded`}
      style={style}
    >
      {content}
    </div>
  );
};

TestElement.craft = {
  displayName: 'Test Element',
  props: {
    content: 'Test Element',
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};

export const TestElementSettings = ({ nodeId, activeTab = 'layout' }) => {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h4 className="text-sm font-medium text-purple-800">Test Element</h4>
        </div>
        <p className="text-xs text-purple-700">
          Test element with comprehensive settings for debugging.
        </p>
      </div>
      
      <ComprehensiveSettings 
        nodeId={nodeId} 
        displayName="Test Element" 
        activeTab={activeTab} 
      />
    </div>
  );
};
