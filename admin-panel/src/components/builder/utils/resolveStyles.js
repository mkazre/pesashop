/**
 * resolveStyles — Converts the Craft.js style prop (which may contain nested
 * objects from AdvancedSpacingControl, AdvancedBorderControl, BoxShadowControl,
 * etc.) into a flat React-compatible inline style object.
 *
 * Usage:  const css = resolveStyles(style);
 *         <div style={css} />
 */

const formatSpacing = (spacing) => {
  if (!spacing) return undefined;
  if (typeof spacing === 'string') return spacing;
  if (typeof spacing === 'object') {
    const { top = '0px', right = '0px', bottom = '0px', left = '0px' } = spacing;
    return `${top} ${right} ${bottom} ${left}`;
  }
  return undefined;
};

const formatBorder = (border) => {
  if (!border) return {};
  if (typeof border === 'string') return { border };
  if (typeof border !== 'object') return {};

  const result = {};
  const { width, style: bStyle, color, radius } = border;

  // Border widths
  if (width) {
    if (typeof width === 'string') {
      result.borderWidth = width;
    } else if (typeof width === 'object') {
      if (width.top) result.borderTopWidth = width.top;
      if (width.right) result.borderRightWidth = width.right;
      if (width.bottom) result.borderBottomWidth = width.bottom;
      if (width.left) result.borderLeftWidth = width.left;
    }
  }

  if (bStyle) result.borderStyle = bStyle;
  if (color) result.borderColor = color;

  // Border radius
  if (radius) {
    if (typeof radius === 'string') {
      result.borderRadius = radius;
    } else if (typeof radius === 'object') {
      if (radius.topLeft) result.borderTopLeftRadius = radius.topLeft;
      if (radius.topRight) result.borderTopRightRadius = radius.topRight;
      if (radius.bottomRight) result.borderBottomRightRadius = radius.bottomRight;
      if (radius.bottomLeft) result.borderBottomLeftRadius = radius.bottomLeft;
    }
  }

  return result;
};

const formatBoxShadow = (shadow) => {
  if (!shadow) return undefined;
  if (typeof shadow === 'string') return shadow;
  if (typeof shadow !== 'object') return undefined;

  const { x = '0px', y = '0px', blur = '0px', spread = '0px', color = 'rgba(0,0,0,0.2)', inset = false } = shadow;
  // Skip if all values are zero/default
  if (x === '0px' && y === '0px' && blur === '0px' && spread === '0px') return undefined;
  return `${inset ? 'inset ' : ''}${x} ${y} ${blur} ${spread} ${color}`;
};

const formatTransform = (transform) => {
  if (!transform) return undefined;
  if (typeof transform === 'string') return transform;
  if (typeof transform !== 'object') return undefined;

  const parts = [];
  if (transform.rotate && transform.rotate !== '0deg') parts.push(`rotate(${transform.rotate})`);
  if (transform.scale && transform.scale !== '1') parts.push(`scale(${transform.scale})`);
  if (transform.translateX) parts.push(`translateX(${transform.translateX})`);
  if (transform.translateY) parts.push(`translateY(${transform.translateY})`);
  if (transform.skewX) parts.push(`skewX(${transform.skewX})`);
  if (transform.skewY) parts.push(`skewY(${transform.skewY})`);
  return parts.length > 0 ? parts.join(' ') : undefined;
};

export const resolveStyles = (style) => {
  if (!style || typeof style !== 'object') return {};

  // Destructure known nested keys and internal keys
  const {
    padding,
    margin,
    border,
    boxShadow,
    transform,
    responsive,   // internal — never pass to DOM
    customCSS,    // internal — handled separately
    badge,        // internal — handled by RenderNode
    ...rest
  } = style;

  const resolved = { ...rest };

  // Flatten padding/margin objects
  const flatPadding = formatSpacing(padding);
  if (flatPadding) resolved.padding = flatPadding;

  const flatMargin = formatSpacing(margin);
  if (flatMargin) resolved.margin = flatMargin;

  // Flatten border object
  if (border && typeof border === 'object' && !Array.isArray(border)) {
    const borderStyles = formatBorder(border);
    Object.assign(resolved, borderStyles);
  } else if (border) {
    resolved.border = border;
  }

  // Flatten boxShadow object
  const flatShadow = formatBoxShadow(boxShadow);
  if (flatShadow) resolved.boxShadow = flatShadow;

  // Flatten transform object
  const flatTransform = formatTransform(transform);
  if (flatTransform) resolved.transform = flatTransform;

  return resolved;
};

export default resolveStyles;
