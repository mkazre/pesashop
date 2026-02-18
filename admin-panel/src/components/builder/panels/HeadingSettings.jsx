import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import {
  TextControl,
  ColorControl,
  NumberControl,
  SelectControl,
  CustomCSSControl,
} from '@/components/builder/controls/PropertyControls';

function HeadingSettingsForm({ props: p, setProp: sp, activeTab = 'layout' }) {
  const props = p ?? {};
  const updateProp = (name, value) => sp?.((prev) => { prev[name] = value; });
  const updateStyle = (name, value) => sp?.((prev) => {
    if (!prev.style) prev.style = {};
    prev.style[name] = value;
  });
  const isLayout = activeTab === 'layout' || activeTab === 'general';
  const isTypography = activeTab === 'typography';
  const isAdvanced = activeTab === 'advanced';

  if (isLayout) {
    return (
      <div className="space-y-4">
        <TextControl label="Content" value={props.content} onChange={(val) => updateProp('content', val)} placeholder="Enter heading text" />
        <SelectControl label="Heading Level" value={props.level || 2} options={[1,2,3,4,5,6].map((l) => ({ value: l, label: `H${l}` }))} onChange={(val) => updateProp('level', val)} />
        <NumberControl label="Font Size" value={props.style?.fontSize} onChange={(val) => updateStyle('fontSize', val ? `${val}px` : '32px')} unit="px" />
        <ColorControl label="Text Color" value={props.style?.color} onChange={(val) => updateStyle('color', val)} />
      </div>
    );
  }
  if (isTypography) {
    return (
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Typography</h4>
        <NumberControl label="Font Size" value={props.style?.fontSize ? parseFloat(String(props.style.fontSize)) : 32} onChange={(val) => updateStyle('fontSize', val ? `${val}px` : '32px')} unit="px" />
        <SelectControl label="Font Weight" value={props.style?.fontWeight || 'bold'} options={['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']} onChange={(val) => updateStyle('fontWeight', val)} />
        <ColorControl label="Text Color" value={props.style?.color} onChange={(val) => updateStyle('color', val)} />
      </div>
    );
  }
  if (isAdvanced) {
    return (
      <div className="space-y-4">
        <SelectControl label="Font Weight" value={props.style?.fontWeight || 'bold'} options={['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']} onChange={(val) => updateStyle('fontWeight', val)} />
        <SelectControl label="Text Transform" value={props.style?.textTransform || 'none'} options={['none', 'uppercase', 'lowercase', 'capitalize']} onChange={(val) => updateStyle('textTransform', val)} />
        <CustomCSSControl value={props.style?.customCSS} onChange={(val) => updateStyle('customCSS', val)} />
      </div>
    );
  }
  return null;
}

export const HeadingSettings = ({ activeTab = 'general' }) => {
  const { props, setProp } = useNode((node) => ({ props: node.data.props, setProp: node.actions.setProp }));
  return <HeadingSettingsForm props={props} setProp={setProp} activeTab={activeTab} />;
};

export const HeadingSettingsForNode = ({ nodeId, activeTab = 'general' }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props) ?? {};
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return <HeadingSettingsForm props={props} setProp={setProp} activeTab={activeTab} />;
};
