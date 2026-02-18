import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Tabs = ({
  tabs = [
    { label: 'Tab 1', content: 'Content for tab 1' },
    { label: 'Tab 2', content: 'Content for tab 2' },
    { label: 'Tab 3', content: 'Content for tab 3' },
  ],
  activeColor = '#3b82f6',
  inactiveColor = '#6b7280',
  tabStyle = 'underline',
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`tabs-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
    >
      <div style={{ display: 'flex', borderBottom: tabStyle === 'underline' ? '2px solid #e5e7eb' : 'none', gap: tabStyle === 'pills' ? '8px' : '0' }}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: activeTab === i ? 600 : 400,
              background: tabStyle === 'pills' ? (activeTab === i ? activeColor : '#f3f4f6') : 'transparent',
              color: tabStyle === 'pills' ? (activeTab === i ? '#fff' : inactiveColor) : (activeTab === i ? activeColor : inactiveColor),
              border: 'none',
              borderBottom: tabStyle === 'underline' ? (activeTab === i ? `2px solid ${activeColor}` : '2px solid transparent') : 'none',
              borderRadius: tabStyle === 'pills' ? '6px' : '0',
              cursor: 'pointer',
              marginBottom: tabStyle === 'underline' ? '-2px' : '0',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '16px 0' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
          {tabs[activeTab]?.content || ''}
        </p>
      </div>
    </div>
  );
};

export const TabsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const { tabs = [], activeColor = '#3b82f6', inactiveColor = '#6b7280', tabStyle = 'underline' } = props;

  const addTab = () => {
    setProp((p) => {
      if (!p.tabs) p.tabs = [];
      p.tabs = [...p.tabs, { label: `Tab ${p.tabs.length + 1}`, content: `Content for tab ${p.tabs.length + 1}` }];
    });
  };

  const removeTab = (index) => {
    setProp((p) => { p.tabs = p.tabs.filter((_, i) => i !== index); });
  };

  const updateTab = (index, key, value) => {
    setProp((p) => { if (p.tabs[index]) p.tabs[index][key] = value; });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tab Style</label>
          <select value={tabStyle} onChange={(e) => setProp((p) => { p.tabStyle = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="underline">Underline</option>
            <option value="pills">Pills</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Active Color</label>
            <input type="color" value={activeColor} onChange={(e) => setProp((p) => { p.activeColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Inactive Color</label>
            <input type="color" value={inactiveColor} onChange={(e) => setProp((p) => { p.inactiveColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Tabs</h4>
          <button onClick={addTab} className="text-xs text-blue-600 hover:text-blue-800">+ Add Tab</button>
        </div>
        {tabs.map((tab, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Tab {i + 1}</span>
              <button onClick={() => removeTab(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <input type="text" value={tab.label} onChange={(e) => updateTab(i, 'label', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Tab label" />
            <textarea value={tab.content} onChange={(e) => updateTab(i, 'content', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" rows={2} placeholder="Tab content" />
          </div>
        ))}
      </div>
    </div>
  );
};

Tabs.craft = {
  displayName: 'Tabs',
  props: {
    tabs: [
      { label: 'Tab 1', content: 'Content for tab 1' },
      { label: 'Tab 2', content: 'Content for tab 2' },
      { label: 'Tab 3', content: 'Content for tab 3' },
    ],
    activeColor: '#3b82f6',
    inactiveColor: '#6b7280',
    tabStyle: 'underline',
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
};
