import React, { useState, useRef, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { ArrowUp, ChevronUp } from 'lucide-react';
import { NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const BackToTop = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { className = '', style = {} } = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef(null);

  const {
    position = 'bottom-right',
    distance = 30,
    size = 50,
    backgroundColor = '#3b82f6',
    textColor = '#ffffff',
    icon = 'arrow',
    borderRadius = '50%',
    scrollThreshold = 300,
    showText = false,
    buttonText = 'Back to Top',
    animationDuration = 0.3,
    hoverEffect = true
  } = style;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getPositionStyles = () => {
    const positions = {
      'bottom-right': { bottom: distance, right: distance },
      'bottom-left': { bottom: distance, left: distance },
      'top-right': { top: distance, right: distance },
      'top-left': { top: distance, left: distance },
      'bottom-center': { bottom: distance, left: '50%', transform: 'translateX(-50%)' },
      'top-center': { top: distance, left: '50%', transform: 'translateX(-50%)' }
    };
    return positions[position] || positions['bottom-right'];
  };

  const getIcon = () => {
    const icons = {
      arrow: <ArrowUp size={size * 0.5} />,
      chevron: <ChevronUp size={size * 0.5} />
    };
    return icons[icon] || icons.arrow;
  };

  const buttonStyle = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor,
    color: textColor,
    borderRadius,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${animationDuration}s ease`,
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? 'visible' : 'hidden',
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: `${size * 0.5}px`,
    ...getPositionStyles()
  };

  const hoverStyle = hoverEffect ? {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
    }
  } : {};

  return (
    <>
      <button
        ref={(ref) => {
          connect(drag(ref));
          buttonRef.current = ref;
        }}
        data-craft-id={id}
        className={`back-to-top ${className} ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
        style={buttonStyle}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        {getIcon()}
        {showText && (
          <span className="ml-2 text-sm font-medium">{buttonText}</span>
        )}
      </button>

      <style jsx>{`
        .back-to-top:hover ${hoverStyle['&:hover'] ? Object.keys(hoverStyle['&:hover']).map(prop => `${prop}: ${hoverStyle['&:hover'][prop]}`).join('; ') : ''}
      `}</style>
    </>
  );
};

// Settings Panel Component
export const BackToTopSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    position = 'bottom-right',
      distance = 30,
      size = 50,
      backgroundColor = '#3b82f6',
      textColor = '#ffffff',
      icon = 'arrow',
      borderRadius = '50%',
      scrollThreshold = 300,
      showText = false,
      buttonText = 'Back to Top',
      animationDuration = 0.3,
      hoverEffect = true
  } = nodeProps;

  const positionOptions = [
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'top-center', label: 'Top Center' }
  ];

  const iconOptions = [
    { value: 'arrow', label: 'Arrow' },
    { value: 'chevron', label: 'Chevron' }
  ];

  const borderRadiusOptions = [
    { value: '50%', label: 'Circle' },
    { value: '8px', label: 'Rounded' },
    { value: '0', label: 'Square' }
  ];

  return (
    <div className="space-y-4">
      <SelectControl
        label="Position"
        value={position}
        onChange={(value) => setProp((p) => { p.position = value; })}
        options={positionOptions}
      />

      <NumberControl
        label="Distance from edge (px)"
        value={distance}
        onChange={(value) => setProp((p) => { p.distance = value; })}
        min={10}
        max={100}
      />

      <NumberControl
        label="Button Size (px)"
        value={size}
        onChange={(value) => setProp((p) => { p.size = value; })}
        min={30}
        max={80}
      />

      <SelectControl
        label="Icon"
        value={icon}
        onChange={(value) => setProp((p) => { p.icon = value; })}
        options={iconOptions}
      />

      <div className="grid grid-cols-2 gap-4">
        <ColorControl
          label="Background Color"
          value={backgroundColor}
          onChange={(value) => setProp((p) => { p.backgroundColor = value; })}
        />

        <ColorControl
          label="Text Color"
          value={textColor}
          onChange={(value) => setProp((p) => { p.textColor = value; })}
        />
      </div>

      <SelectControl
        label="Border Radius"
        value={borderRadius}
        onChange={(value) => setProp((p) => { p.borderRadius = value; })}
        options={borderRadiusOptions}
      />

      <NumberControl
        label="Scroll Threshold (px)"
        value={scrollThreshold}
        onChange={(value) => setProp((p) => { p.scrollThreshold = value; })}
        min={100}
        max={1000}
      />

      <NumberControl
        label="Animation Duration (s)"
        value={animationDuration}
        onChange={(value) => setProp((p) => { p.animationDuration = value; })}
        min={0.1}
        max={2}
        step={0.1}
      />

      <div className="space-y-3">
        <Checkbox
          label="Show Text"
          checked={showText}
          onChange={(checked) => setProp((p) => { p.showText = checked; })}
        />

        {showText && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Button Text</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Back to Top"
            />
          </div>
        )}
      </div>

      <Checkbox
        label="Hover Effect"
        checked={hoverEffect}
        onChange={(checked) => setProp((p) => { p.hoverEffect = checked; })}
      />

      {/* Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
        <div className="relative h-32 bg-gray-200 rounded flex items-center justify-center">
          <div
            className="absolute"
            style={{
              width: `${size * 0.6}px`,
              height: `${size * 0.6}px`,
              backgroundColor,
              color: textColor,
              borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${size * 0.3}px`,
              ...getPositionStyles()
            }}
          >
            {icon === 'arrow' ? <ArrowUp size={size * 0.3} /> : <ChevronUp size={size * 0.3} />}
          </div>
        </div>
      </div>
    </div>
  );

  function getPositionStyles() {
    const positions = {
      'bottom-right': { bottom: distance, right: distance },
      'bottom-left': { bottom: distance, left: distance },
      'top-right': { top: distance, right: distance },
      'top-left': { top: distance, left: distance },
      'bottom-center': { bottom: distance, left: '50%', transform: 'translateX(-50%)' },
      'top-center': { top: distance, left: '50%', transform: 'translateX(-50%)' }
    };
    return positions[position] || positions['bottom-right'];
  }
};

// Craft.js Configuration
BackToTop.craft = {
  displayName: 'Back to Top',
  props: {
    className: '',
    style: {
      position: 'bottom-right',
      distance: 30,
      size: 50,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      icon: 'arrow',
      borderRadius: '50%',
      scrollThreshold: 300,
      showText: false,
      buttonText: 'Back to Top',
      animationDuration: 0.3,
      hoverEffect: true
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: BackToTopSettings,
  },
};

export default BackToTop;
