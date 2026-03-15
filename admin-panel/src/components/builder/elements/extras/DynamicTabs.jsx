import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const DynamicTabs = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  tabs = [
    { label: 'Tab 1', content: 'Dynamic tab content 1' },
    { label: 'Tab 2', content: 'Dynamic tab content 2' },
    { label: 'Tab 3', content: 'Dynamic tab content 3' },
  ],
  activeColor = '#3b82f6',
  inactiveColor = '#6b7280',
  tabStyle = 'underline',
  orientation = 'horizontal',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  const [active, setActive] = useState(0);

  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ display: orientation === 'vertical' ? 'flex' : 'block', gap: '16px', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <div style={{ display: 'flex', flexDirection: orientation === 'vertical' ? 'column' : 'row', borderBottom: orientation === 'horizontal' && tabStyle === 'underline' ? '2px solid #e5e7eb' : 'none', borderRight: orientation === 'vertical' ? '2px solid #e5e7eb' : 'none', gap: tabStyle === 'pills' ? '8px' : '0', paddingRight: orientation === 'vertical' ? '16px' : '0' }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: active === i ? 600 : 400,
            borderBottom: orientation === 'horizontal' && tabStyle === 'underline' ? (active === i ? `2px solid ${activeColor}` : '2px solid transparent') : 'none',
            background: tabStyle === 'pills' ? (active === i ? activeColor : '#f3f4f6') : 'transparent',
            color: tabStyle === 'pills' ? (active === i ? '#fff' : inactiveColor) : (active === i ? activeColor : inactiveColor),
            borderRadius: tabStyle === 'pills' ? '6px' : '0',
            marginBottom: orientation === 'horizontal' && tabStyle === 'underline' ? '-2px' : '0',
            textAlign: 'left', whiteSpace: 'nowrap',
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ padding: '16px 0', flex: 1 }}>{tabs[active]?.content}</div>
    </div>
  );
};

export const DynamicTabsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Tab Style</label>
      <select value={props.tabStyle || 'underline'} onChange={(e) => setProp((p) => { p.tabStyle = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        <option value="underline">Underline</option>
        <option value="pills">Pills</option>
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Orientation</label>
      <select value={props.orientation || 'horizontal'} onChange={(e) => setProp((p) => { p.orientation = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        <option value="horizontal">Horizontal</option>
        <option value="vertical">Vertical</option>
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Active Color</label>
      <input type="color" value={props.activeColor || '#3b82f6'} onChange={(e) => setProp((p) => { p.activeColor = e.target.value; })}
        style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
    </div>
  );
};

DynamicTabs.craft = {
  displayName: 'Dynamic Tabs',
  props: { tabs: [{ label: 'Tab 1', content: 'Dynamic tab content 1' }, { label: 'Tab 2', content: 'Dynamic tab content 2' }, { label: 'Tab 3', content: 'Dynamic tab content 3' }], activeColor: '#3b82f6', inactiveColor: '#6b7280', tabStyle: 'underline', orientation: 'horizontal', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: DynamicTabsSettings },
};
