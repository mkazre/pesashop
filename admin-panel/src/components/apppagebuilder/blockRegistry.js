// ── Mobile App Page Builder — block registry ─────────────────────────
// Single source of truth per block type: palette metadata, default props
// (content + style), and the content-field schema used to generically
// render that block's settings form. Styling controls are NOT declared
// here — every block type shares the same BlockStylePanel, which reads and
// writes props.style uniformly regardless of blockType.
//
// Populated incrementally. Current batch validates the render pipeline
// (plain text, image, link resolution, one-level container nesting, and
// repeatable item lists) before the rest of Phase 1's ~40 elements are
// added. Rich-text/HTML elements are deliberately deferred to the next
// batch — that's the single riskiest item on the list (needs a small
// allow-listed HTML parser since rendering is 100% native, no WebView).

export const BLOCK_CATEGORIES = ['Basic', 'Layout'];

// blockType -> { label, category, icon (lucide-react name), isContainer,
//                defaultProps: { ...content, style: {...} },
//                contentFields: [{ key, label, type, options? }] }
export const BLOCK_REGISTRY = {
  heading: {
    label: 'Heading',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      text: 'Heading text',
      level: 'h2',
      style: { fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'left' },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
      {
        key: 'level', label: 'Heading Level', type: 'select',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((l) => ({ value: l, label: l.toUpperCase() })),
      },
    ],
  },

  text: {
    label: 'Text',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      text: 'Add your text here.',
      style: { fontSize: 14, fontWeight: 'normal', color: '#374151', textAlign: 'left', lineHeight: 20 },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'richtext' },
    ],
  },

  image: {
    label: 'Image',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      src: '',
      alt: '',
      aspectRatio: 'auto',
      style: { borderRadius: 0, width: '100%' },
    },
    contentFields: [
      { key: 'src', label: 'Image', type: 'image' },
      { key: 'alt', label: 'Alt Text', type: 'text' },
      {
        key: 'aspectRatio', label: 'Aspect Ratio', type: 'select',
        options: [
          { value: 'auto', label: 'Auto (natural size)' },
          { value: '1:1', label: 'Square (1:1)' },
          { value: '4:3', label: '4:3' },
          { value: '16:9', label: '16:9' },
        ],
      },
    ],
  },

  button: {
    label: 'Button',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      text: 'Click me',
      linkType: 'manual',
      link: '/',
      linkId: '',
      style: { backgroundColor: '#0F604B', color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center', borderRadius: 0, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20 },
    },
    contentFields: [
      { key: 'text', label: 'Button Text', type: 'text' },
      {
        key: 'linkType', label: 'Link Type', type: 'select',
        options: [
          { value: 'manual', label: 'Manual URL' },
          { value: 'page', label: 'Page' },
          { value: 'category', label: 'Category' },
          { value: 'product', label: 'Product' },
        ],
      },
      { key: 'link', label: 'Link (URL or /category/:slug, /product/:slug)', type: 'text' },
    ],
  },

  container: {
    label: 'Container',
    category: 'Layout',
    isContainer: true,
    defaultProps: {
      direction: 'column',
      gap: 8,
      style: { backgroundColor: 'transparent', paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 },
    },
    contentFields: [
      {
        key: 'direction', label: 'Layout Direction', type: 'select',
        options: [{ value: 'column', label: 'Vertical (stacked)' }, { value: 'row', label: 'Horizontal (side by side)' }],
      },
      { key: 'gap', label: 'Gap Between Children (px)', type: 'number' },
    ],
  },

  list: {
    label: 'List',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      items: [{ text: 'First item' }, { text: 'Second item' }],
      icon: 'checkmark-circle',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      {
        key: 'items', label: 'Items', type: 'items-array',
        itemFields: [{ key: 'text', label: 'Text', type: 'text' }],
      },
    ],
  },

  video: {
    label: 'Video',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      src: '', autoplay: false, loop: false, muted: false, controls: true,
      style: { borderRadius: 0 },
    },
    contentFields: [
      { key: 'src', label: 'Video File / URL', type: 'image' },
      { key: 'autoplay', label: 'Autoplay', type: 'toggle' },
      { key: 'loop', label: 'Loop', type: 'toggle' },
      { key: 'muted', label: 'Muted', type: 'toggle' },
      { key: 'controls', label: 'Show Controls', type: 'toggle' },
    ],
  },

  gallery: {
    label: 'Gallery',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      images: [],
      columns: 2,
      style: { borderRadius: 0 },
    },
    contentFields: [
      { key: 'columns', label: 'Columns', type: 'select', options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }] },
      {
        key: 'images', label: 'Images', type: 'items-array',
        itemFields: [{ key: 'src', label: 'Image', type: 'image' }, { key: 'caption', label: 'Caption', type: 'text' }],
      },
    ],
  },

  'link-button': {
    label: 'Link Button',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      text: 'Learn more',
      linkType: 'manual',
      link: '/',
      style: { backgroundColor: '#0F604B', color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center', borderRadius: 0, paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24 },
    },
    contentFields: [
      { key: 'text', label: 'Button Text', type: 'text' },
      {
        key: 'linkType', label: 'Link Type', type: 'select',
        options: [{ value: 'manual', label: 'Manual URL' }, { value: 'page', label: 'Page' }, { value: 'category', label: 'Category' }, { value: 'product', label: 'Product' }],
      },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },

  'link-text': {
    label: 'Link Text',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      text: 'Read more',
      linkType: 'manual',
      link: '/',
      style: { color: '#0F604B', fontSize: 14, fontWeight: '600' },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
      {
        key: 'linkType', label: 'Link Type', type: 'select',
        options: [{ value: 'manual', label: 'Manual URL' }, { value: 'page', label: 'Page' }, { value: 'category', label: 'Category' }, { value: 'product', label: 'Product' }],
      },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },

  'link-wrapper': {
    label: 'Link Wrapper',
    category: 'Basic',
    isContainer: true,
    defaultProps: {
      linkType: 'manual',
      link: '/',
      style: { paddingTop: 8, paddingBottom: 8 },
    },
    contentFields: [
      {
        key: 'linkType', label: 'Link Type', type: 'select',
        options: [{ value: 'manual', label: 'Manual URL' }, { value: 'page', label: 'Page' }, { value: 'category', label: 'Category' }, { value: 'product', label: 'Product' }],
      },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },

  'fancy-icon': {
    label: 'Fancy Icon',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      icon: { type: 'icon', value: 'star' },
      style: { backgroundColor: '#E8F5F0', color: '#0F604B', borderRadius: 9999, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 },
    },
    contentFields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
    ],
  },
};

export function getBlockMeta(blockType) {
  return BLOCK_REGISTRY[blockType] || null;
}

export function createBlockFromType(blockType, order = 0) {
  const meta = BLOCK_REGISTRY[blockType];
  if (!meta) return null;
  return {
    _id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    blockType,
    enabled: true,
    order,
    props: JSON.parse(JSON.stringify(meta.defaultProps || { style: {} })),
    children: meta.isContainer ? [] : undefined,
  };
}
