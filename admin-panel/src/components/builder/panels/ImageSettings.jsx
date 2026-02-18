import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import {
  TextControl,
  NumberControl,
  SelectControl,
  CustomCSSControl,
} from '@/components/builder/controls/PropertyControls';
import Button from '@/components/common/Button';

function updateProp(setProp, propName, value) {
  setProp((props) => {
    props[propName] = value;
  });
}
function updateStyle(setProp, styleProp, value) {
  setProp((props) => {
    if (!props.style) props.style = {};
    props.style[styleProp] = value;
  });
}

export const ImageSettingsForm = ({ props: nodeProps = {}, setProp, activeTab = 'general', imageUploadId = 'image-upload' }) => {
  const uploadId = typeof imageUploadId === 'string' ? imageUploadId : 'image-upload';
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProp(setProp, 'src', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const props = nodeProps;

  if (activeTab === 'general') {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image Source</label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id={uploadId}
            />
            <Button
              onClick={() => document.getElementById(uploadId)?.click()}
              variant="outline"
              className="w-full"
            >
              Upload Image
            </Button>
            <TextControl
              label="Or enter URL"
              value={props.src}
              onChange={(val) => updateProp(setProp, 'src', val)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <TextControl
          label="Alt Text"
          value={props.alt}
          onChange={(val) => updateProp(setProp, 'alt', val)}
          placeholder="Image description"
        />

        <div className="grid grid-cols-2 gap-2">
          <NumberControl
            label="Width"
            value={props.width}
            onChange={(val) => updateProp(setProp, 'width', val ? `${val}px` : '100%')}
            unit="px"
          />
          <NumberControl
            label="Height"
            value={props.height}
            onChange={(val) => updateProp(setProp, 'height', val ? `${val}px` : 'auto')}
            unit="px"
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'advanced') {
    return (
      <div className="space-y-4">
        <SelectControl
          label="Object Fit"
          value={props.style?.objectFit || 'contain'}
          options={['contain', 'cover', 'fill', 'none', 'scale-down']}
          onChange={(val) => updateStyle(setProp, 'objectFit', val)}
        />

        <NumberControl
          label="Border Radius"
          value={props.style?.borderRadius}
          onChange={(val) => updateStyle(setProp, 'borderRadius', val ? `${val}px` : '0')}
          unit="px"
        />

        <SelectControl
          label="Filter"
          value={props.style?.filter || 'none'}
          options={[
            'none',
            'grayscale(100%)',
            'sepia(100%)',
            'blur(5px)',
            'brightness(1.2)',
            'contrast(1.2)',
          ]}
          onChange={(val) => updateStyle(setProp, 'filter', val)}
        />

        <CustomCSSControl
          value={props.style?.customCSS}
          onChange={(val) => updateStyle(setProp, 'customCSS', val)}
        />
      </div>
    );
  }

  return null;
};

export const ImageSettings = ({ activeTab = 'general' }) => {
  const { props, setProp } = useNode((node) => ({ props: node.data.props, setProp: node.actions.setProp }));
  return <ImageSettingsForm props={props} setProp={setProp} activeTab={activeTab} />;
};

export const ImageSettingsForNode = ({ nodeId, activeTab = 'general' }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props) ?? {};
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return <ImageSettingsForm props={props} setProp={setProp} activeTab={activeTab} imageUploadId={nodeId} />;
};
