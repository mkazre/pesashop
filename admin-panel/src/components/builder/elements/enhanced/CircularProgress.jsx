import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Circle, Target } from 'lucide-react';
import { NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const CircularProgress = (rawProps) => {
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

  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  const {
    value = 75,
    size = 120,
    strokeWidth = 8,
    backgroundColor = '#e5e7eb',
    progressColor = '#3b82f6',
    showPercentage = true,
    showText = true,
    text = 'Progress',
    fontSize = 16,
    textColor = '#374151',
    animationDuration = 1.5,
    animationType = 'ease-out',
    clockwise = true,
    startAngle = -90,
    endAngle = 270,
    rounded = false,
    gradient = false,
    gradientStart = '#3b82f6',
    gradientEnd = '#10b981',
    animateOnMount = true,
    showTrack = true,
    innerRadius = null
  } = style;

  useEffect(() => {
    if (animateOnMount) {
      setIsAnimating(true);
      const startTime = Date.now();
      const duration = animationDuration * 1000;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing functions
        const easingFunctions = {
          'linear': t => t,
          'ease-out': t => 1 - Math.pow(1 - t, 3),
          'ease-in': t => Math.pow(t, 3),
          'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        };

        const easing = easingFunctions[animationType] || easingFunctions['ease-out'];
        setProgress(easing(progress) * value);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animate();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      setProgress(value);
    }
  }, [value, animationDuration, animationType, animateOnMount]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getGradientId = () => `gradient-${id}`;
  const getStroke = () => {
    if (gradient) {
      return `url(#${getGradientId()})`;
    }
    return progressColor;
  };

  const getStrokeLinecap = () => {
    return rounded ? 'round' : 'butt';
  };

  const getRotation = () => {
    return clockwise ? 0 : 180;
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`circular-progress ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        ...style,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: `rotate(${getRotation()}deg)` }}
      >
        {/* Gradient Definition */}
        {gradient && (
          <defs>
            <linearGradient id={getGradientId()} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
        )}

        {/* Background Circle */}
        {showTrack && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            strokeLinecap={getStrokeLinecap()}
          />
        )}

        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStroke()}
          strokeWidth={strokeWidth}
          strokeLinecap={getStrokeLinecap()}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transform: `rotate(${startAngle}deg)`,
            transformOrigin: 'center',
            transition: `stroke-dashoffset ${animationDuration}s ${animationType}`
          }}
        />
      </svg>

      {/* Center Content */}
      <div
        className="circular-progress-content"
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: textColor,
          fontSize: `${fontSize}px`
        }}
      >
        {showPercentage && (
          <div className="circular-progress-percentage" style={{ fontWeight: 'bold' }}>
            {Math.round(progress)}%
          </div>
        )}
        {showText && (
          <div className="circular-progress-text" style={{ fontSize: `${fontSize * 0.8}px` }}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Panel Component
export const CircularProgressSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    value = 75,
    size = 120,
    strokeWidth = 8,
    backgroundColor = '#e5e7eb',
    progressColor = '#3b82f6',
    showPercentage = true,
    showText = true,
    text = 'Progress',
    fontSize = 16,
    textColor = '#374151',
    animationDuration = 1.5,
    animationType = 'ease-out',
    clockwise = true,
    startAngle = -90,
    endAngle = 270,
    rounded = false,
    gradient = false,
    gradientStart = '#3b82f6',
    gradientEnd = '#10b981',
    animateOnMount = true,
    showTrack = true,
    innerRadius = null
  } = nodeProps;

  const animationOptions = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-in-out', label: 'Ease In Out' }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Progress</h4>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Value: {value}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setProp((p) => { p.value = parseInt(e.target.value); })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>{value}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Appearance</h4>

        <NumberControl
          label="Size (px)"
          value={size}
          onChange={(v) => setProp((p) => { p.size = v; })}
          min={40}
          max={300}
        />

        <NumberControl
          label="Stroke Width (px)"
          value={strokeWidth}
          onChange={(v) => setProp((p) => { p.strokeWidth = v; })}
          min={1}
          max={20}
        />

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Background Color"
            value={backgroundColor}
            onChange={(v) => setProp((p) => { p.backgroundColor = v; })}
          />

          <ColorControl
            label="Progress Color"
            value={progressColor}
            onChange={(v) => setProp((p) => { p.progressColor = v; })}
            disabled={gradient}
          />
        </div>

        <Checkbox
          label="Show Track"
          checked={showTrack}
          onChange={(checked) => setProp((p) => { p.showTrack = checked; })}
        />

        <Checkbox
          label="Rounded Ends"
          checked={rounded}
          onChange={(checked) => setProp((p) => { p.rounded = checked; })}
        />

        <Checkbox
          label="Clockwise"
          checked={clockwise}
          onChange={(checked) => setProp((p) => { p.clockwise = checked; })}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Gradient</h4>

        <Checkbox
          label="Enable Gradient"
          checked={gradient}
          onChange={(checked) => setProp((p) => { p.gradient = checked; })}
        />

        {gradient && (
          <div className="grid grid-cols-2 gap-4">
            <ColorControl
              label="Gradient Start"
              value={gradientStart}
              onChange={(v) => setProp((p) => { p.gradientStart = v; })}
            />

            <ColorControl
              label="Gradient End"
              value={gradientEnd}
              onChange={(v) => setProp((p) => { p.gradientEnd = v; })}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Text</h4>

        <Checkbox
          label="Show Percentage"
          checked={showPercentage}
          onChange={(checked) => setProp((p) => { p.showPercentage = checked; })}
        />

        <Checkbox
          label="Show Text"
          checked={showText}
          onChange={(checked) => setProp((p) => { p.showText = checked; })}
        />

        {showText && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setProp((p) => { p.text = e.target.value; })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Progress"
            />
          </div>
        )}

        <NumberControl
          label="Font Size (px)"
          value={fontSize}
          onChange={(v) => setProp((p) => { p.fontSize = v; })}
          min={10}
          max={32}
        />

        <ColorControl
          label="Text Color"
          value={textColor}
          onChange={(v) => setProp((p) => { p.textColor = v; })}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Animation</h4>

        <Checkbox
          label="Animate on Mount"
          checked={animateOnMount}
          onChange={(checked) => setProp((p) => { p.animateOnMount = checked; })}
        />

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
          max={5}
          step={0.1}
        />
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
        <div className="flex items-center justify-center p-4 bg-white rounded border">
          <svg
            width={size * 0.6}
            height={size * 0.6}
            style={{ transform: `rotate(${clockwise ? 0 : 180}deg)` }}
          >
            {gradient && (
              <defs>
                <linearGradient id={`preview-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={gradientStart} />
                  <stop offset="100%" stopColor={gradientEnd} />
                </linearGradient>
              </defs>
            )}

            {showTrack && (
              <circle
                cx={size * 0.3}
                cy={size * 0.3}
                r={(size * 0.6 - strokeWidth * 0.6) / 2}
                fill="none"
                stroke={backgroundColor}
                strokeWidth={strokeWidth * 0.6}
                strokeLinecap={rounded ? 'round' : 'butt'}
              />
            )}

            <circle
              cx={size * 0.3}
              cy={size * 0.3}
              r={(size * 0.6 - strokeWidth * 0.6) / 2}
              fill="none"
              stroke={gradient ? 'url(#preview-gradient)' : progressColor}
              strokeWidth={strokeWidth * 0.6}
              strokeLinecap={rounded ? 'round' : 'butt'}
              strokeDasharray={2 * Math.PI * ((size * 0.6 - strokeWidth * 0.6) / 2)}
              strokeDashoffset={2 * Math.PI * ((size * 0.6 - strokeWidth * 0.6) / 2) * (1 - value / 100)}
              style={{
                transform: `rotate(${startAngle}deg)`,
                transformOrigin: 'center'
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Craft.js Configuration
CircularProgress.craft = {
  displayName: 'Circular Progress',
  props: {
    className: '',
    style: {
      value: 75,
      size: 120,
      strokeWidth: 8,
      backgroundColor: '#e5e7eb',
      progressColor: '#3b82f6',
      showPercentage: true,
      showText: true,
      text: 'Progress',
      fontSize: 16,
      textColor: '#374151',
      animationDuration: 1.5,
      animationType: 'ease-out',
      clockwise: true,
      startAngle: -90,
      endAngle: 270,
      rounded: false,
      gradient: false,
      gradientStart: '#3b82f6',
      gradientEnd: '#10b981',
      animateOnMount: true,
      showTrack: true,
      innerRadius: null
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: CircularProgressSettings,
  },
};

export default CircularProgress;
