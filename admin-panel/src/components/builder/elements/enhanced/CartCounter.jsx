import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { TextControl, NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';

export const CartCounter = ({ className = '', style = {} }) => {
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

  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    showIcon = true,
    showText = true,
    text = 'Cart',
    position = 'top-right',
    size = 40,
    backgroundColor = '#3b82f6',
    textColor = '#ffffff',
    borderRadius = '50%',
    fontSize = 14,
    fontWeight = 'bold',
    animationType = 'bounce',
    animationDuration = 0.3,
    showZero = true,
    pulseOnAdd = true,
    iconSize = 20
  } = style;

  useEffect(() => {
    // Simulate cart count changes (in real app, this would come from global state)
    const interval = setInterval(() => {
      const newCount = Math.floor(Math.random() * 10);
      if (newCount !== count) {
        setCount(newCount);
        if (pulseOnAdd && newCount > count) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), animationDuration * 1000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [count, pulseOnAdd, animationDuration]);

  const getPositionStyles = () => {
    const positions = {
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
      'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
    };
    return positions[position] || positions['top-right'];
  };

  const getAnimationClass = () => {
    if (!isAnimating) return '';
    
    const animations = {
      bounce: 'animate-bounce',
      pulse: 'animate-pulse',
      shake: 'animate-shake',
      rotate: 'animate-rotate',
      scale: 'animate-scale'
    };
    
    return animations[animationType] || 'animate-bounce';
  };

  const getIcon = () => {
    return <ShoppingCart size={iconSize} />;
  };

  return (
    <>
      <div
        ref={(ref) => connect(drag(ref))}
        data-cart-counter-id={id}
        className={`cart-counter ${className} ${getAnimationClass()} ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
        style={{
          ...style,
          position: 'fixed',
          ...getPositionStyles(),
          width: showText && count > 0 ? 'auto' : `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          backgroundColor,
          color: textColor,
          borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: showText ? '8px' : '0',
          padding: showText ? '8px 16px' : '0',
          fontSize: `${fontSize}px`,
          fontWeight,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          opacity: count === 0 && !showZero ? 0 : 1,
          visibility: count === 0 && !showZero ? 'hidden' : 'visible'
        }}
      >
        {showIcon && getIcon()}
        
        {showText && (
          <span className="cart-counter-text">{text}</span>
        )}
        
        {count > 0 && (
          <div
            className="cart-count-badge"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid #ffffff'
            }}
          >
            {count > 99 ? '99+' : count}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        .animate-bounce { animation: bounce 0.6s ease-out; }
        .animate-pulse { animation: pulse 0.6s ease-out; }
        .animate-shake { animation: shake 0.5s ease-out; }
        .animate-rotate { animation: rotate 0.6s ease-out; }
        .animate-scale { animation: scale 0.6s ease-out; }
      `}</style>
    </>
  );
};

// Settings Panel Component
export const CartCounterSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    showIcon = true,
    showText = true,
    text = 'Cart',
    position = 'top-right',
    size = 40,
    backgroundColor = '#3b82f6',
    textColor = '#ffffff',
    borderRadius = '50%',
    fontSize = 14,
    fontWeight = 'bold',
    animationType = 'bounce',
    animationDuration = 0.3,
    showZero = true,
    pulseOnAdd = true,
    iconSize = 20,
    badgeColor = '#ef4444',
    badgeTextColor = '#ffffff',
    badgeBorderColor = '#ffffff'
  } = nodeProps;

  const positionOptions = [
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'bottom-center', label: 'Bottom Center' }
  ];

  const animationOptions = [
    { value: 'bounce', label: 'Bounce' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'shake', label: 'Shake' },
    { value: 'rotate', label: 'Rotate' },
    { value: 'scale', label: 'Scale' }
  ];

  const borderRadiusOptions = [
    { value: '50%', label: 'Circle' },
    { value: '8px', label: 'Rounded' },
    { value: '0', label: 'Square' }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Display</h4>

        <Checkbox
          label="Show Icon"
          checked={showIcon}
          onChange={(checked) => setProp((p) => { p.showIcon = checked; })}
        />

        <Checkbox
          label="Show Text"
          checked={showText}
          onChange={(checked) => setProp((p) => { p.showText = checked; })}
        />

        {showText && (
          <TextControl
            label="Text"
            value={text}
            onChange={(v) => setProp((p) => { p.text = v; })}
          />
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Position</h4>

        <SelectControl
          label="Position"
          value={position}
          onChange={(v) => setProp((p) => { p.position = v; })}
          options={positionOptions}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Appearance</h4>

        <NumberControl
          label="Size (px)"
          value={size}
          onChange={(v) => setProp((p) => { p.size = v; })}
          min={24}
          max={80}
        />

        <NumberControl
          label="Icon Size (px)"
          value={iconSize}
          onChange={(v) => setProp((p) => { p.iconSize = v; })}
          min={12}
          max={32}
        />

        <NumberControl
          label="Font Size (px)"
          value={fontSize}
          onChange={(v) => setProp((p) => { p.fontSize = v; })}
          min={10}
          max={24}
        />

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Background Color"
            value={backgroundColor}
            onChange={(v) => setProp((p) => { p.backgroundColor = v; })}
          />

          <ColorControl
            label="Text Color"
            value={textColor}
            onChange={(v) => setProp((p) => { p.textColor = v; })}
          />
        </div>

        <SelectControl
          label="Border Radius"
          value={borderRadius}
          onChange={(v) => setProp((p) => { p.borderRadius = v; })}
          options={borderRadiusOptions}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Badge</h4>

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Badge Color"
            value={badgeColor}
            onChange={(v) => setProp((p) => { p.badgeColor = v; })}
          />

          <ColorControl
            label="Badge Text Color"
            value={badgeTextColor}
            onChange={(v) => setProp((p) => { p.badgeTextColor = v; })}
          />

          <ColorControl
            label="Badge Border Color"
            value={badgeBorderColor}
            onChange={(v) => setProp((p) => { p.badgeBorderColor = v; })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Animation</h4>

        <SelectControl
          label="Animation Type"
          value={animationType}
          onChange={(v) => setProp((p) => { p.animationType = v; })}
          options={animationOptions}
        />

        <NumberControl
          label="Animation Duration (s)"
          value={animationDuration}
          onChange={(v) => setProp((p) => { p.animationDuration = v; })}
          min={0.1}
          max={2}
          step={0.1}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Behavior</h4>

        <Checkbox
          label="Show When Empty"
          checked={showZero}
          onChange={(checked) => setProp((p) => { p.showZero = checked; })}
        />

        <Checkbox
          label="Animate on Add"
          checked={pulseOnAdd}
          onChange={(checked) => setProp((p) => { p.pulseOnAdd = checked; })}
        />
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
        <div className="relative h-20 bg-gray-200 rounded flex items-center justify-center">
          <div
            style={{
              width: showText && count > 0 ? 'auto' : `${size}px`,
              height: `${size}px`,
              backgroundColor,
              color: textColor,
              borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: showText ? '8px' : '0',
              padding: showText ? '8px 16px' : '0',
              fontSize: `${fontSize}px`,
              fontWeight,
              position: 'relative'
            }}
          >
            {showIcon && <ShoppingCart size={iconSize} />}
            {showText && <span>{text}</span>}
            {count > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: badgeColor,
                  color: badgeTextColor,
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: `2px solid ${badgeBorderColor}`
                }}
              >
                {count > 99 ? '99+' : count}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Craft.js Configuration
CartCounter.craft = {
  displayName: 'Cart Counter',
  props: {
    className: '',
    style: {
      showIcon: true,
      showText: true,
      text: 'Cart',
      position: 'top-right',
      size: 40,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: '50%',
      fontSize: 14,
      fontWeight: 'bold',
      animationType: 'bounce',
      animationDuration: 0.3,
      showZero: true,
      pulseOnAdd: true,
      iconSize: 20,
      badgeColor: '#ef4444',
      badgeTextColor: '#ffffff',
      badgeBorderColor: '#ffffff'
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: CartCounterSettings,
  },
};

export default CartCounter;
