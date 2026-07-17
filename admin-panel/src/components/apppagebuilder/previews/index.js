// blockType -> lightweight live-HTML preview component for the canvas card.
// Populated incrementally alongside blockRegistry.js as element types are
// added; a generic "no preview available" placeholder is used until then.
const PREVIEW_REGISTRY = {};

export function getPreviewRenderer(blockType) {
  return PREVIEW_REGISTRY[blockType] || null;
}

export function registerPreview(blockType, component) {
  PREVIEW_REGISTRY[blockType] = component;
}
