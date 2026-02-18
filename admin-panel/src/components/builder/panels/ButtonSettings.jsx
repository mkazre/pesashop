import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import {
  TextControl,
  ColorControl,
  SelectControl,
  NumberControl,
  CustomCSSControl,
} from '@/components/builder/controls/PropertyControls';

function ButtonSettingsForm({ props, setProp, activeTab = 'general' }) {
  const updateProp = (propName, value) => {
    setProp((props) => {
      props[propName] = value;
    });
  };

  const updateStyle = (styleProp, value) => {
    setProp((props) => {
      if (!props.style) props.style = {};
      props.style[styleProp] = value;
    });
  };

  if (activeTab === 'general') {
    return (
      <div className="space-y-4">
        <TextControl
          label="Button Text"
          value={props.text}
          onChange={(val) => updateProp('text', val)}
          placeholder="Click me"
        />

        <TextControl
          label="Link URL"
          value={props.link}
          onChange={(val) => updateProp('link', val)}
          placeholder="#"
        />

        <SelectControl
          label="Size"
          value={props.size || 'md'}
          options={['sm', 'md', 'lg']}
          onChange={(val) => updateProp('size', val)}
        />

        <SelectControl
          label="Variant"
          value={props.variant || 'primary'}
          options={['primary', 'secondary', 'outline']}
          onChange={(val) => updateProp('variant', val)}
        />

        <ColorControl
          label="Background Color"
          value={props.style?.backgroundColor}
          onChange={(val) => updateStyle('backgroundColor', val)}
        />

        <ColorControl
          label="Text Color"
          value={props.style?.color}
          onChange={(val) => updateStyle('color', val)}
        />
      </div>
    );
  }

  if (activeTab === 'advanced') {
    return (
      <div className="space-y-4">
        <NumberControl
          label="Border Width"
          value={props.style?.borderWidth}
          onChange={(val) => updateStyle('borderWidth', val ? `${val}px` : '0')}
          unit="px"
        />

        <ColorControl
          label="Border Color"
          value={props.style?.borderColor}
          onChange={(val) => updateStyle('borderColor', val)}
        />

        <NumberControl
          label="Border Radius"
          value={props.style?.borderRadius}
          onChange={(val) => updateStyle('borderRadius', val ? `${val}px` : '4px')}
          unit="px"
        />

        <SelectControl
          label="Box Shadow"
          value={props.style?.boxShadow || 'none'}
          options={[
            'none',
            '0 1px 3px rgba(0,0,0,0.12)',
            '0 4px 6px rgba(0,0,0,0.1)',
            '0 10px 20px rgba(0,0,0,0.15)',
          ]}
          onChange={(val) => updateStyle('boxShadow', val)}
        />

        <TextControl
          label="Hover Background Color"
          value={props.style?.hoverBackgroundColor}
          onChange={(val) => updateStyle('hoverBackgroundColor', val)}
          placeholder="#000000"
        />

        <CustomCSSControl
          value={props.style?.customCSS}
          onChange={(val) => updateStyle('customCSS', val)}
        />
      </div>
    );
  }

  return null;
}

export const ButtonSettings = ({ activeTab = 'general' }) => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));
  return <ButtonSettingsForm props={props} setProp={setProp} activeTab={activeTab} />;
};

export const ButtonSettingsForNode = ({ nodeId, activeTab = 'general' }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props) ?? {};
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return <ButtonSettingsForm props={props} setProp={setProp} activeTab={activeTab} />;
};
