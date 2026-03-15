import React, { useState, useRef, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ColorControl, NumberControl, TextControl } from '@/components/builder/controls/PropertyControls';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const BeforeAfter = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { className = '', style = {} } = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    setPosition(clampedPercentage);
    setProp((p) => { p.sliderPosition = clampedPercentage; });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={(ref) => {
        connect(drag(ref));
        containerRef.current = ref;
      }}
      data-craft-id={id}
      className={`before-after-container relative overflow-hidden ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ 
        ...style, 
        position: 'relative',
        minHeight: '300px',
        cursor: isDragging ? 'col-resize' : 'default'
      }}
    >
      {/* Before Image */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
          style={{
            backgroundImage: 'url(https://picsum.photos/seed/before/800/600.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            Before
          </div>
        </div>
      </div>

      {/* After Image */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
          style={{
            backgroundImage: 'url(https://picsum.photos/seed/after/800/600.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            After
          </div>
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize transform -translate-x-1/2 shadow-lg"
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg p-1">
          <div className="flex items-center gap-1">
            <ArrowLeft size={16} className="text-gray-600" />
            <ArrowRight size={16} className="text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component
export const BeforeAfterSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    sliderPosition = 50,
      beforeImage = '',
      afterImage = '',
      beforeLabel = 'Before',
      afterLabel = 'After',
      sliderColor = '#ffffff'
  } = nodeProps;

  return (
    <div className="space-y-4">
      <TextControl
        label="Before Label"
        value={beforeLabel}
        onChange={(value) => setProp((p) => { p.beforeLabel = value; })}
      />

      <TextControl
        label="After Label"
        value={afterLabel}
        onChange={(value) => setProp((p) => { p.afterLabel = value; })}
      />

      <TextControl
        label="Before Image URL"
        value={beforeImage}
        onChange={(value) => setProp((p) => { p.beforeImage = value; })}
        placeholder="https://example.com/before.jpg"
      />

      <TextControl
        label="After Image URL"
        value={afterImage}
        onChange={(value) => setProp((p) => { p.afterImage = value; })}
        placeholder="https://example.com/after.jpg"
      />

      <NumberControl
        label="Initial Slider Position (%)"
        value={sliderPosition}
        onChange={(value) => setProp((p) => { p.sliderPosition = value; })}
        min={0}
        max={100}
      />

      <ColorControl
        label="Slider Color"
        value={sliderColor}
        onChange={(value) => setProp((p) => { p.sliderColor = value; })}
      />
    </div>
  );
};

// Craft.js Configuration
BeforeAfter.craft = {
  displayName: 'Before After',
  props: {
    className: '',
    style: {},
    sliderPosition: 50,
    beforeImage: '',
    afterImage: '',
    beforeLabel: 'Before',
    afterLabel: 'After',
    sliderColor: '#ffffff',
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: BeforeAfterSettings,
  },
};

export default BeforeAfter;
