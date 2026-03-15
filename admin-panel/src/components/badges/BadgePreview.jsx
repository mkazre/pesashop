import React from 'react';

const BADGE_POSITION_STYLES = {
  'top-left':      { top: 0, left: 0 },
  'top-center':    { top: 0, left: '50%', transform: 'translateX(-50%)' },
  'top-right':     { top: 0, right: 0 },
  'middle-left':   { top: '50%', left: 0, transform: 'translateY(-50%)' },
  'middle-center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'middle-right':  { top: '50%', right: 0, transform: 'translateY(-50%)' },
  'bottom-left':   { bottom: 0, left: 0 },
  'bottom-center': { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right':  { bottom: 0, right: 0 },
};

const SHAPE_STYLES = {
  rectangle: {},
  rounded: { borderRadius: '4px' },
  pill: { borderRadius: '9999px' },
  circle: { borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  'ribbon-left': { borderRadius: '0 4px 4px 0' },
  'ribbon-right': { borderRadius: '4px 0 0 4px' },
  banner: { borderRadius: '0' },
  triangle: { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  diamond: { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  'star-burst': { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
};

const ANIMATION_CLASSES = {
  none: '',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  shake: 'animate-[shake_0.5s_ease-in-out_infinite]',
  'fade-in': 'animate-[fadeIn_1s_ease-in]',
  'slide-in': 'animate-[slideIn_0.5s_ease-out]',
  glow: 'animate-[glow_2s_ease-in-out_infinite]',
  wiggle: 'animate-[wiggle_1s_ease-in-out_infinite]',
  flip: 'animate-[flip_1s_ease-in-out_infinite]',
};

/**
 * Renders a badge preview. Works in two modes:
 * - size="sm" — small inline preview for table rows
 * - size="lg" — large preview inside a mock product card
 */
const BadgePreview = ({ badge, size = 'sm', className = '' }) => {
  const s = badge?.style || {};

  const buildBadgeStyle = () => {
    const base = {
      color: s.textColor || '#ffffff',
      backgroundColor: s.useGradient
        ? `linear-gradient(${s.gradientDirection || '135deg'}, ${s.gradientFrom || '#ef4444'}, ${s.gradientTo || '#f97316'})`
        : (s.backgroundColor || '#ef4444'),
      fontSize: s.fontSize || '12px',
      fontWeight: s.fontWeight || '700',
      fontFamily: s.fontFamily || 'inherit',
      fontStyle: s.fontStyle || 'normal',
      textTransform: s.textTransform || 'uppercase',
      letterSpacing: s.letterSpacing || '0.5px',
      lineHeight: s.lineHeight || '1',
      paddingTop: s.paddingTop || '4px',
      paddingRight: s.paddingRight || '10px',
      paddingBottom: s.paddingBottom || '4px',
      paddingLeft: s.paddingLeft || '10px',
      borderRadius: s.borderRadius || '4px',
      borderWidth: s.borderWidth || '0px',
      borderStyle: s.borderStyle || 'solid',
      borderColor: s.borderColor || 'transparent',
      opacity: s.opacity || '1',
      whiteSpace: 'nowrap',
    };

    // Use gradient as background-image if enabled
    if (s.useGradient) {
      base.backgroundImage = base.backgroundColor;
      base.backgroundColor = 'transparent';
    }

    // Per-corner radius
    if (s.borderTopLeftRadius) base.borderTopLeftRadius = s.borderTopLeftRadius;
    if (s.borderTopRightRadius) base.borderTopRightRadius = s.borderTopRightRadius;
    if (s.borderBottomRightRadius) base.borderBottomRightRadius = s.borderBottomRightRadius;
    if (s.borderBottomLeftRadius) base.borderBottomLeftRadius = s.borderBottomLeftRadius;

    // Shadow
    if (s.boxShadow) base.boxShadow = s.boxShadow;

    // Shape overrides
    const shapeStyles = SHAPE_STYLES[s.shape] || {};
    Object.assign(base, shapeStyles);

    // Transform
    const transforms = [];
    if (s.rotate && s.rotate !== '0deg') transforms.push(`rotate(${s.rotate})`);
    if (s.scale && s.scale !== '1') transforms.push(`scale(${s.scale})`);
    if (s.translateX && s.translateX !== '0px') transforms.push(`translateX(${s.translateX})`);
    if (s.translateY && s.translateY !== '0px') transforms.push(`translateY(${s.translateY})`);
    if (s.skewX && s.skewX !== '0deg') transforms.push(`skewX(${s.skewX})`);
    if (s.skewY && s.skewY !== '0deg') transforms.push(`skewY(${s.skewY})`);
    if (transforms.length) base.transform = transforms.join(' ');

    // Filters
    if (s.filter) base.filter = s.filter;
    if (s.backdropFilter) base.backdropFilter = s.backdropFilter;
    if (s.mixBlendMode && s.mixBlendMode !== 'normal') base.mixBlendMode = s.mixBlendMode;

    // Sizing
    if (s.width && s.width !== 'auto') base.width = s.width;
    if (s.height && s.height !== 'auto') base.height = s.height;
    if (s.minWidth) base.minWidth = s.minWidth;
    if (s.maxWidth) base.maxWidth = s.maxWidth;

    return base;
  };

  const badgeType = s.badgeType || 'text';
  const animClass = ANIMATION_CLASSES[s.animation] || '';

  // Small inline preview
  if (size === 'sm') {
    if (badgeType === 'image' && s.imageUrl) {
      return (
        <img
          src={s.imageUrl}
          alt={badge.name}
          className={`${animClass} ${className}`}
          style={{ width: '40px', height: 'auto', objectFit: s.imageObjectFit || 'contain' }}
        />
      );
    }
    return (
      <span className={`inline-block ${animClass} ${className}`} style={buildBadgeStyle()}>
        {s.text || badge.name || 'Badge'}
      </span>
    );
  }

  // Large preview inside mock product card
  const posStyles = s.position === 'custom'
    ? { top: s.customTop || 'auto', right: s.customRight || 'auto', bottom: s.customBottom || 'auto', left: s.customLeft || 'auto' }
    : (BADGE_POSITION_STYLES[s.position] || BADGE_POSITION_STYLES['top-right']);

  return (
    <div className={`relative bg-gray-100 rounded-xl overflow-hidden ${className}`} style={{ width: 260, height: 200 }}>
      {/* Mock product image */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-300 rounded-lg mx-auto mb-2" />
          <p className="text-xs text-gray-400">Product Preview</p>
        </div>
      </div>

      {/* Badge overlay */}
      {badgeType === 'image' && s.imageUrl ? (
        <img
          src={s.imageUrl}
          alt={badge.name}
          className={`absolute ${animClass}`}
          style={{
            ...posStyles,
            width: s.imageWidth || '60px',
            height: s.imageHeight || 'auto',
            objectFit: s.imageObjectFit || 'contain',
            zIndex: s.zIndex || 10,
            marginTop: s.marginTop || '8px',
            marginRight: s.marginRight || '8px',
            marginBottom: s.marginBottom || '0px',
            marginLeft: s.marginLeft || '0px',
          }}
        />
      ) : (
        <span
          className={`absolute ${animClass}`}
          style={{
            ...buildBadgeStyle(),
            ...posStyles,
            position: 'absolute',
            zIndex: s.zIndex || 10,
            marginTop: s.marginTop || '8px',
            marginRight: s.marginRight || '8px',
            marginBottom: s.marginBottom || '0px',
            marginLeft: s.marginLeft || '0px',
          }}
        >
          {s.text || badge.name || 'Badge'}
        </span>
      )}
    </div>
  );
};

export default BadgePreview;
