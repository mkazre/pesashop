import React from 'react';
import { useEditor } from '@craftjs/core';
import { TextControl, ColorControl, Checkbox } from '@/components/builder/controls/PropertyControls';

export const AccordionSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    items = [],
    allowMultiple = false,
    iconPosition = 'right',
    iconColor = '#3b82f6',
    backgroundColor = '#ffffff',
    borderColor = '#e5e7eb',
    titleColor = '#111827',
    contentColor = '#6b7280',
    titleSize = '16px',
    contentSize = '14px',
    padding = '16px',
    borderRadius = '8px',
    animationDuration = '0.3s'
  } = nodeProps;

  const updateItem = (index, field, value) => {
    setProp((p) => {
      if (!p.items[index]) p.items[index] = { title: '', content: '' };
      p.items[index][field] = value;
    });
  };

  const addItem = () => {
    setProp((p) => {
      p.items = [...(p.items || []), { title: `Accordion Item ${(p.items || []).length + 1}`, content: 'Content for new accordion item.' }];
    });
  };

  const removeItem = (index) => {
    setProp((p) => { p.items = p.items.filter((_, i) => i !== index); });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Accordion Items</h4>
          <button
            onClick={addItem}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="p-3 border rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Item {index + 1}</span>
              <button
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>

            <TextControl
              label="Title"
              value={item.title}
              onChange={(value) => updateItem(index, 'title', value)}
            />

            <TextControl
              label="Content"
              value={item.content}
              onChange={(value) => updateItem(index, 'content', value)}
              multiline
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Settings</h4>

        <Checkbox
          label="Allow Multiple Open"
          checked={allowMultiple}
          onChange={(checked) => setProp((p) => { p.allowMultiple = checked; })}
        />

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Background"
            value={backgroundColor}
            onChange={(value) => setProp((p) => { p.backgroundColor = value; })}
          />

          <ColorControl
            label="Border"
            value={borderColor}
            onChange={(value) => setProp((p) => { p.borderColor = value; })}
          />

          <ColorControl
            label="Title Color"
            value={titleColor}
            onChange={(value) => setProp((p) => { p.titleColor = value; })}
          />

          <ColorControl
            label="Content Color"
            value={contentColor}
            onChange={(value) => setProp((p) => { p.contentColor = value; })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Padding</label>
          <input
            type="text"
            value={padding}
            onChange={(e) => setProp((p) => { p.padding = e.target.value; })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="16px"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Border Radius</label>
          <input
            type="text"
            value={borderRadius}
            onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="8px"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Animation Duration</label>
          <input
            type="text"
            value={animationDuration}
            onChange={(e) => setProp((p) => { p.animationDuration = e.target.value; })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="0.3s"
          />
        </div>
      </div>
    </div>
  );
};

export default AccordionSettings;
