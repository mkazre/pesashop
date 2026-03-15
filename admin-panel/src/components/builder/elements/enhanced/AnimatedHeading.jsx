import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Type, Zap } from 'lucide-react';
import { TextControl, ColorControl, NumberControl, SelectControl } from '@/components/builder/controls/PropertyControls';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const AnimatedHeading = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { text = 'Animated Heading', className = '', style = {} } = resolved;

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

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0 transform translate-y-4';
    
    const animations = {
      'fadeIn': 'animate-fade-in',
      'slideUp': 'animate-slide-up',
      'slideDown': 'animate-slide-down',
      'slideLeft': 'animate-slide-left',
      'slideRight': 'animate-slide-right',
      'zoomIn': 'animate-zoom-in',
      'typewriter': 'animate-typewriter',
      'bounce': 'animate-bounce',
      'rotate': 'animate-rotate'
    };
    
    return animations[style.animationType] || 'animate-fade-in';
  };

  const getAnimationStyle = () => {
    const baseStyle = {
      ...style,
      transition: `all ${style.animationDuration || 0.6}s ${style.animationEasing || 'ease-out'} ${style.animationDelay || 0}s`,
    };

    if (style.animationType === 'typewriter') {
      return {
        ...baseStyle,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        borderRight: `2px solid ${style.color || '#000'}`,
        animation: `typewriter ${style.animationDuration || 2}s steps(${text.length}) ${style.animationDelay || 0}s ${style.animationEasing || 'ease-out'} forwards`
      };
    }

    return baseStyle;
  };

  return (
    <>
      <h1
        ref={(ref) => {
          connect(drag(ref));
          elementRef.current = ref;
        }}
        data-craft-id={id}
        className={`animated-heading ${className} ${getAnimationClass()} ${
          selected ? 'ring-2 ring-blue-500' : ''
        } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
        style={getAnimationStyle()}
      >
        {text}
      </h1>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-left {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-right {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animate-slide-down { animation: slide-down 0.6s ease-out forwards; }
        .animate-slide-left { animation: slide-left 0.6s ease-out forwards; }
        .animate-slide-right { animation: slide-right 0.6s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.6s ease-out forwards; }
        .animate-typewriter { animation: typewriter 2s steps(40) 1s ease-out forwards; }
        .animate-bounce { animation: bounce 1s ease-out forwards; }
        .animate-rotate { animation: rotate 1s ease-out forwards; }
      `}</style>
    </>
  );
};

// Settings Panel Component
export const AnimatedHeadingSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    text = 'Animated Heading',
      animationType = 'fadeIn',
      animationDuration = 0.6,
      animationDelay = 0,
      animationEasing = 'ease-out',
      color = '#000000',
      fontSize = 32,
      fontWeight = 'bold'
  } = nodeProps;

  const animationOptions = [
    { value: 'fadeIn', label: 'Fade In' },
    { value: 'slideUp', label: 'Slide Up' },
    { value: 'slideDown', label: 'Slide Down' },
    { value: 'slideLeft', label: 'Slide Left' },
    { value: 'slideRight', label: 'Slide Right' },
    { value: 'zoomIn', label: 'Zoom In' },
    { value: 'typewriter', label: 'Typewriter' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'rotate', label: 'Rotate' }
  ];

  const easingOptions = [
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-in-out', label: 'Ease In Out' },
    { value: 'linear', label: 'Linear' }
  ];

  return (
    <div className="space-y-4">
      <TextControl
        label="Text"
        value={text}
        onChange={(value) => setProp((p) => { p.text = value; })}
      />

      <SelectControl
        label="Animation Type"
        value={animationType}
        onChange={(value) => setProp((p) => { p.animationType = value; })}
        options={animationOptions}
      />

      <NumberControl
        label="Duration (seconds)"
        value={animationDuration}
        onChange={(value) => setProp((p) => { p.animationDuration = value; })}
        min={0.1}
        max={10}
        step={0.1}
      />

      <NumberControl
        label="Delay (seconds)"
        value={animationDelay}
        onChange={(value) => setProp((p) => { p.animationDelay = value; })}
        min={0}
        max={10}
        step={0.1}
      />

      <SelectControl
        label="Easing"
        value={animationEasing}
        onChange={(value) => setProp((p) => { p.animationEasing = value; })}
        options={easingOptions}
      />

      <ColorControl
        label="Color"
        value={color}
        onChange={(value) => setProp((p) => { p.color = value; })}
      />

      <NumberControl
        label="Font Size (px)"
        value={fontSize}
        onChange={(value) => setProp((p) => { p.fontSize = value; })}
        min={10}
        max={200}
      />

      <SelectControl
        label="Font Weight"
        value={fontWeight}
        onChange={(value) => setProp((p) => { p.fontWeight = value; })}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'bold', label: 'Bold' },
          { value: 'lighter', label: 'Light' },
          { value: 'bolder', label: 'Bolder' }
        ]}
      />
    </div>
  );
};

// Craft.js Configuration
AnimatedHeading.craft = {
  displayName: 'Animated Heading',
  props: {
    text: 'Animated Heading',
    className: '',
    style: {},
    animationType: 'fadeIn',
    animationDuration: 0.6,
    animationDelay: 0,
    animationEasing: 'ease-out',
    color: '#000000',
    fontSize: 32,
    fontWeight: 'bold',
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: AnimatedHeadingSettings,
  },
};

export default AnimatedHeading;
