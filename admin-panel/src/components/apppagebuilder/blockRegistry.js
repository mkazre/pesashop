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

export const BLOCK_CATEGORIES = ['Basic', 'Layout', 'Enhanced', 'Extras'];

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

  'rich-text': {
    label: 'Rich Text',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      html: 'Add <b>formatted</b> text here.',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'html', label: 'Content (supports <b>, <i>, <u>, <br>)', type: 'richtext' },
    ],
  },

  'text-block': {
    label: 'Text Block',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      html: 'A paragraph of text.',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'html', label: 'Content (supports <b>, <i>, <u>, <br>)', type: 'richtext' },
    ],
  },

  span: {
    label: 'Span',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      text: 'Inline text',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
    ],
  },

  'code-block': {
    label: 'Code Block',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      code: 'console.log("hello");',
      style: {},
    },
    contentFields: [
      { key: 'code', label: 'Code', type: 'richtext' },
    ],
  },

  'svg-icon': {
    label: 'SVG Icon',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      svg: '',
      size: 32,
      style: {},
    },
    contentFields: [
      { key: 'svg', label: 'SVG Markup', type: 'richtext' },
      { key: 'size', label: 'Size (px)', type: 'number' },
    ],
  },

  'icon-box': {
    label: 'Icon Box',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      icon: { type: 'icon', value: 'checkmark-circle' },
      title: 'Feature title',
      description: 'A short description of this feature.',
      layout: 'top',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'richtext' },
      { key: 'layout', label: 'Layout', type: 'select', options: [{ value: 'top', label: 'Icon on top' }, { value: 'left', label: 'Icon on left' }] },
    ],
  },

  'progress-bar': {
    label: 'Progress Bar',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      label: 'Progress',
      value: 60,
      max: 100,
      showPercentage: true,
      barColor: '#0F604B',
      trackColor: '#e5e7eb',
      style: {},
    },
    contentFields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'max', label: 'Max', type: 'number' },
      { key: 'showPercentage', label: 'Show Percentage', type: 'toggle' },
      { key: 'barColor', label: 'Bar Color', type: 'color' },
      { key: 'trackColor', label: 'Track Color', type: 'color' },
    ],
  },

  testimonial: {
    label: 'Testimonial',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      quote: 'This product changed how I shop online.',
      author: 'Jane Doe',
      role: 'Verified Customer',
      avatar: '',
      rating: 5,
      style: { backgroundColor: '#f9fafb', borderRadius: 0, paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20 },
    },
    contentFields: [
      { key: 'quote', label: 'Quote', type: 'richtext' },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'role', label: 'Role / Title', type: 'text' },
      { key: 'avatar', label: 'Avatar Image', type: 'image' },
      { key: 'rating', label: 'Rating (1-5, 0 to hide)', type: 'number' },
    ],
  },

  'pricing-box': {
    label: 'Pricing Box',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      title: 'Standard',
      price: '$29',
      period: '/month',
      description: '',
      features: [{ text: 'Feature one' }, { text: 'Feature two' }],
      buttonText: 'Choose plan',
      linkType: 'manual',
      buttonUrl: '/',
      highlighted: false,
      style: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 0, paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 },
    },
    contentFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'period', label: 'Period (e.g. /month)', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'features', label: 'Features', type: 'items-array', itemFields: [{ key: 'text', label: 'Text', type: 'text' }] },
      { key: 'buttonText', label: 'Button Text', type: 'text' },
      { key: 'buttonUrl', label: 'Button Link', type: 'text' },
      { key: 'highlighted', label: 'Highlighted Plan', type: 'toggle' },
    ],
  },

  'social-icons': {
    label: 'Social Icons',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      icons: [{ icon: { type: 'icon', value: 'logo-facebook' }, url: '' }, { icon: { type: 'icon', value: 'logo-instagram' }, url: '' }],
      style: { color: '#374151' },
    },
    contentFields: [
      {
        key: 'icons', label: 'Icons', type: 'items-array',
        itemFields: [{ key: 'icon', label: 'Icon', type: 'icon' }, { key: 'url', label: 'URL', type: 'text' }],
      },
    ],
  },
  map: {
    label: 'Map',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      address: 'Johannesburg, South Africa',
      latitude: '',
      longitude: '',
      buttonText: 'Open in Maps',
      style: { backgroundColor: '#f3f4f6', borderRadius: 0, paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 },
    },
    contentFields: [
      { key: 'address', label: 'Address / Place Name', type: 'text' },
      { key: 'latitude', label: 'Latitude (optional, for precise pin)', type: 'text' },
      { key: 'longitude', label: 'Longitude (optional, for precise pin)', type: 'text' },
      { key: 'buttonText', label: 'Button Text', type: 'text' },
    ],
  },

  'search-form': {
    label: 'Search Form',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      placeholder: 'Search products…',
      style: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, color: '#374151' },
    },
    contentFields: [
      { key: 'placeholder', label: 'Placeholder Text', type: 'text' },
    ],
  },

  'login-form': {
    label: 'Login Form',
    category: 'Basic',
    isContainer: false,
    defaultProps: {
      title: 'Sign in to your account',
      description: 'Access your orders, wishlist and more.',
      buttonText: 'Sign In',
      style: { backgroundColor: '#f9fafb', borderRadius: 0, paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 },
    },
    contentFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'buttonText', label: 'Button Text', type: 'text' },
    ],
  },
  section: {
    label: 'Section',
    category: 'Layout',
    isContainer: true,
    defaultProps: {
      direction: 'column',
      gap: 8,
      style: { backgroundColor: 'transparent', paddingTop: 32, paddingBottom: 32, paddingLeft: 0, paddingRight: 0 },
    },
    contentFields: [
      {
        key: 'direction', label: 'Layout Direction', type: 'select',
        options: [{ value: 'column', label: 'Vertical (stacked)' }, { value: 'row', label: 'Horizontal (side by side)' }],
      },
      { key: 'gap', label: 'Gap Between Children (px)', type: 'number' },
    ],
  },

  'css-grid': {
    label: 'CSS Grid',
    category: 'Layout',
    isContainer: true,
    defaultProps: {
      columns: 2,
      gap: 12,
      style: { paddingTop: 8, paddingBottom: 8 },
    },
    contentFields: [
      { key: 'columns', label: 'Columns', type: 'select', options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }] },
      { key: 'gap', label: 'Gap (px)', type: 'number' },
    ],
  },

  'div-block': {
    label: 'Div Block',
    category: 'Layout',
    isContainer: true,
    defaultProps: {
      direction: 'column',
      gap: 8,
      style: { backgroundColor: 'transparent' },
    },
    contentFields: [
      {
        key: 'direction', label: 'Layout Direction', type: 'select',
        options: [{ value: 'column', label: 'Vertical (stacked)' }, { value: 'row', label: 'Horizontal (side by side)' }],
      },
      { key: 'gap', label: 'Gap Between Children (px)', type: 'number' },
    ],
  },

  columns: {
    label: 'Columns',
    category: 'Layout',
    isContainer: true,
    defaultProps: {
      columns: 2,
      gap: 12,
      style: { paddingTop: 8, paddingBottom: 8 },
    },
    contentFields: [
      { key: 'columns', label: 'Number of Columns', type: 'select', options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }] },
      { key: 'gap', label: 'Gap (px)', type: 'number' },
    ],
  },

  accordion: {
    label: 'Accordion',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      items: [
        { title: 'Accordion item 1', content: 'Content for the first item.' },
        { title: 'Accordion item 2', content: 'Content for the second item.' },
      ],
      allowMultiple: false,
      style: { borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8 },
    },
    contentFields: [
      { key: 'items', label: 'Items', type: 'items-array', itemFields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'content', label: 'Content', type: 'text' }] },
      { key: 'allowMultiple', label: 'Allow Multiple Open', type: 'toggle' },
    ],
  },

  slider: {
    label: 'Slider',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      slides: [
        { src: '', title: 'Slide 1', caption: '' },
        { src: '', title: 'Slide 2', caption: '' },
      ],
      showDots: true,
      height: 220,
      style: { borderRadius: 0 },
    },
    contentFields: [
      { key: 'slides', label: 'Slides', type: 'items-array', itemFields: [{ key: 'src', label: 'Image', type: 'image' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' }] },
      { key: 'showDots', label: 'Show Dots', type: 'toggle' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  tabs: {
    label: 'Tabs',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      tabs: [
        { title: 'Tab 1', content: 'Content for tab 1' },
        { title: 'Tab 2', content: 'Content for tab 2' },
      ],
      activeColor: '#0F604B',
      style: {},
    },
    contentFields: [
      { key: 'tabs', label: 'Tabs', type: 'items-array', itemFields: [{ key: 'title', label: 'Label', type: 'text' }, { key: 'content', label: 'Content', type: 'text' }] },
      { key: 'activeColor', label: 'Active Color', type: 'color' },
    ],
  },

  toggle: {
    label: 'Toggle',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      title: 'Toggle title',
      content: 'Toggle content goes here. Tap the title to expand or collapse.',
      defaultOpen: false,
      style: { borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8 },
    },
    contentFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'content', label: 'Content', type: 'richtext' },
      { key: 'defaultOpen', label: 'Open by Default', type: 'toggle' },
    ],
  },

  superbox: {
    label: 'Superbox',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      image: '',
      title: 'Superbox title',
      description: 'Tap to reveal this overlay text.',
      height: 220,
      style: { borderRadius: 8 },
    },
    contentFields: [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  'shape-divider': {
    label: 'Shape Divider',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      shape: 'wave',
      color: '#0F604B',
      height: 60,
      flip: false,
      position: 'bottom',
      style: {},
    },
    contentFields: [
      { key: 'shape', label: 'Shape', type: 'select', options: [{ value: 'wave', label: 'Wave' }, { value: 'triangle', label: 'Triangle' }, { value: 'tilt', label: 'Tilt' }, { value: 'curve', label: 'Curve' }, { value: 'zigzag', label: 'Zigzag' }] },
      { key: 'color', label: 'Color', type: 'color' },
      { key: 'height', label: 'Height (px)', type: 'number' },
      { key: 'flip', label: 'Flip Horizontal', type: 'toggle' },
      { key: 'position', label: 'Position', type: 'select', options: [{ value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' }] },
    ],
  },

  menu: {
    label: 'Menu',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      items: [{ label: 'Home', link: '/' }, { label: 'Shop', link: '/categories' }],
      layout: 'horizontal',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'items', label: 'Items', type: 'items-array', itemFields: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'link', label: 'Link', type: 'text' }] },
      { key: 'layout', label: 'Layout', type: 'select', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
    ],
  },

  header: {
    label: 'Header',
    category: 'Layout',
    isContainer: true,
    defaultProps: {
      direction: 'column',
      gap: 0,
      style: { backgroundColor: '#ffffff' },
    },
    contentFields: [],
  },

  'header-row': {
    label: 'Header Row',
    category: 'Layout',
    isContainer: true,
    defaultProps: {
      layout: 'space-between',
      alignItems: 'center',
      gap: 12,
      style: { paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16 },
    },
    contentFields: [
      { key: 'layout', label: 'Justify Content', type: 'select', options: [{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Space Between' }] },
      { key: 'alignItems', label: 'Align Items', type: 'select', options: [{ value: 'flex-start', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'Bottom' }] },
      { key: 'gap', label: 'Gap (px)', type: 'number' },
    ],
  },

  'easy-posts': {
    label: 'Easy Posts',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      posts: [
        { title: 'Post title one', excerpt: 'A short excerpt of the post.', image: '', date: '' },
        { title: 'Post title two', excerpt: 'A short excerpt of the post.', image: '', date: '' },
      ],
      columns: 1,
      style: {},
    },
    contentFields: [
      { key: 'posts', label: 'Posts', type: 'items-array', itemFields: [{ key: 'image', label: 'Image', type: 'image' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'excerpt', label: 'Excerpt', type: 'text' }, { key: 'date', label: 'Date', type: 'text' }] },
      { key: 'columns', label: 'Columns', type: 'select', options: [{ value: 1, label: '1' }, { value: 2, label: '2' }] },
    ],
  },

  'dynamic-list': {
    label: 'Dynamic List',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      items: [
        { icon: { type: 'emoji', value: '📌' }, title: 'Item one', description: 'Description for item one' },
        { icon: { type: 'emoji', value: '📌' }, title: 'Item two', description: 'Description for item two' },
      ],
      style: {},
    },
    contentFields: [
      { key: 'items', label: 'Items', type: 'items-array', itemFields: [{ key: 'icon', label: 'Icon', type: 'icon' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'description', label: 'Description', type: 'text' }] },
    ],
  },

  'form-embed': {
    label: 'Form',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      formId: '',
      showTitle: true,
      style: {},
    },
    contentFields: [
      { key: 'formId', label: 'Form', type: 'form' },
      { key: 'showTitle', label: 'Show Form Title', type: 'toggle' },
    ],
  },

  repeater: {
    label: 'Product Feed',
    category: 'Layout',
    isContainer: false,
    defaultProps: {
      source: 'featured',
      limit: 6,
      columns: 2,
      style: {},
    },
    contentFields: [
      { key: 'source', label: 'Product Source', type: 'select', options: [{ value: 'all', label: 'All Products' }, { value: 'featured', label: 'Featured' }, { value: 'sale', label: 'On Sale' }, { value: 'newest', label: 'Newest' }, { value: 'top-rated', label: 'Top Rated' }] },
      { key: 'limit', label: 'Number of Products', type: 'number' },
      { key: 'columns', label: 'Columns', type: 'select', options: [{ value: 2, label: '2' }, { value: 3, label: '3' }] },
    ],
  },
  // ── Enhanced ─────────────────────────────────────────────────────

  'alert-box': {
    label: 'Alert Box',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      type: 'info',
      title: 'Alert Title',
      message: 'Alert message',
      style: {},
    },
    contentFields: [
      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'info', label: 'Info' }, { value: 'success', label: 'Success' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' }] },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'message', label: 'Message', type: 'richtext' },
    ],
  },

  'animated-heading': {
    label: 'Animated Heading',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      text: 'Animated Heading',
      animationType: 'fadeIn',
      style: { fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'left' },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'animationType', label: 'Animation', type: 'select', options: [{ value: 'fadeIn', label: 'Fade In' }, { value: 'slideUp', label: 'Slide Up' }, { value: 'zoomIn', label: 'Zoom In' }] },
    ],
  },

  'back-to-top': {
    label: 'Back to Top',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      scrollThreshold: 300,
      style: { backgroundColor: '#0F604B', color: '#ffffff' },
    },
    contentFields: [
      { key: 'scrollThreshold', label: 'Show After Scrolling (px)', type: 'number' },
    ],
  },

  'before-after': {
    label: 'Before / After',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      beforeImage: '',
      afterImage: '',
      beforeLabel: 'Before',
      afterLabel: 'After',
      height: 260,
      style: {},
    },
    contentFields: [
      { key: 'beforeImage', label: 'Before Image', type: 'image' },
      { key: 'afterImage', label: 'After Image', type: 'image' },
      { key: 'beforeLabel', label: 'Before Label', type: 'text' },
      { key: 'afterLabel', label: 'After Label', type: 'text' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  'carousel-builder': {
    label: 'Carousel Builder',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      slides: [{ src: '', title: 'Slide 1', caption: '' }, { src: '', title: 'Slide 2', caption: '' }],
      showDots: true,
      height: 240,
      style: { borderRadius: 8 },
    },
    contentFields: [
      { key: 'slides', label: 'Slides', type: 'items-array', itemFields: [{ key: 'src', label: 'Image', type: 'image' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' }] },
      { key: 'showDots', label: 'Show Dots', type: 'toggle' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  'circular-progress': {
    label: 'Circular Progress',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      value: 75,
      size: 120,
      strokeWidth: 10,
      progressColor: '#0F604B',
      trackColor: '#e5e7eb',
      showPercentage: true,
      text: 'Progress',
      style: {},
    },
    contentFields: [
      { key: 'value', label: 'Value (%)', type: 'number' },
      { key: 'size', label: 'Size (px)', type: 'number' },
      { key: 'strokeWidth', label: 'Stroke Width (px)', type: 'number' },
      { key: 'progressColor', label: 'Progress Color', type: 'color' },
      { key: 'trackColor', label: 'Track Color', type: 'color' },
      { key: 'showPercentage', label: 'Show Percentage', type: 'toggle' },
      { key: 'text', label: 'Label Text', type: 'text' },
    ],
  },

  'content-slider': {
    label: 'Content Slider',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      slides: [{ src: '', title: 'Slide 1', caption: '' }, { src: '', title: 'Slide 2', caption: '' }],
      showDots: true,
      height: 240,
      style: {},
    },
    contentFields: [
      { key: 'slides', label: 'Slides', type: 'items-array', itemFields: [{ key: 'src', label: 'Image', type: 'image' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' }] },
      { key: 'showDots', label: 'Show Dots', type: 'toggle' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  countdown: {
    label: 'Countdown',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiredText: 'Event has ended!',
      style: { color: '#111827' },
    },
    contentFields: [
      { key: 'targetDate', label: 'Target Date (ISO, e.g. 2026-12-25T00:00)', type: 'text' },
      { key: 'expiredText', label: 'Expired Text', type: 'text' },
    ],
  },

  'dual-button': {
    label: 'Dual Button',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      primaryText: 'Primary Action',
      primaryLink: '/',
      secondaryText: 'Secondary Action',
      secondaryLink: '/',
      style: { backgroundColor: '#0F604B', color: '#ffffff' },
    },
    contentFields: [
      { key: 'primaryText', label: 'Primary Text', type: 'text' },
      { key: 'primaryLink', label: 'Primary Link', type: 'text' },
      { key: 'secondaryText', label: 'Secondary Text', type: 'text' },
      { key: 'secondaryLink', label: 'Secondary Link', type: 'text' },
    ],
  },

  'dual-color-text': {
    label: 'Dual Color Text',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      text: 'Dual Color Text',
      splitPosition: 50,
      firstColor: '#0F604B',
      secondColor: '#111827',
      style: { fontSize: 24, fontWeight: '700', textAlign: 'left' },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'splitPosition', label: 'Split Position (%)', type: 'number' },
      { key: 'firstColor', label: 'First Color', type: 'color' },
      { key: 'secondColor', label: 'Second Color', type: 'color' },
    ],
  },

  'fancy-heading': {
    label: 'Fancy Heading',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      text: 'Fancy Heading',
      style: { fontSize: 32, fontWeight: '800', color: '#0F604B', textAlign: 'center', letterSpacing: 0 },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
    ],
  },

  'gallery-slider': {
    label: 'Gallery Slider',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      slides: [{ src: '', title: '', caption: '' }, { src: '', title: '', caption: '' }],
      showDots: true,
      height: 240,
      style: { borderRadius: 8 },
    },
    contentFields: [
      { key: 'slides', label: 'Images', type: 'items-array', itemFields: [{ key: 'src', label: 'Image', type: 'image' }, { key: 'caption', label: 'Caption', type: 'text' }] },
      { key: 'showDots', label: 'Show Dots', type: 'toggle' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  'highlighted-heading': {
    label: 'Highlighted Heading',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      beforeText: 'We provide ',
      highlightText: 'amazing',
      afterText: ' solutions',
      highlightColor: '#fbbf24',
      highlightStyle: 'background',
      style: { fontSize: 26, fontWeight: '700', color: '#111827', textAlign: 'center' },
    },
    contentFields: [
      { key: 'beforeText', label: 'Before Text', type: 'text' },
      { key: 'highlightText', label: 'Highlighted Text', type: 'text' },
      { key: 'afterText', label: 'After Text', type: 'text' },
      { key: 'highlightColor', label: 'Highlight Color', type: 'color' },
      { key: 'highlightStyle', label: 'Highlight Style', type: 'select', options: [{ value: 'background', label: 'Background' }, { value: 'underline', label: 'Underline' }, { value: 'color', label: 'Color Only' }] },
    ],
  },

  hotspot: {
    label: 'Hotspot',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      image: '',
      markers: [{ x: 50, y: 50, text: 'Hotspot label' }],
      style: {},
    },
    contentFields: [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'markers', label: 'Markers', type: 'items-array', itemFields: [{ key: 'x', label: 'X (%)', type: 'text' }, { key: 'y', label: 'Y (%)', type: 'text' }, { key: 'text', label: 'Label', type: 'text' }] },
    ],
  },

  'hover-animated-button': {
    label: 'Animated Button',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      text: 'Tap Me',
      linkType: 'manual',
      link: '/',
      style: { backgroundColor: '#0F604B', color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center', borderRadius: 8, paddingTop: 14, paddingBottom: 14, paddingLeft: 24, paddingRight: 24 },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },

  'icon-list': {
    label: 'Icon List',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      items: [{ icon: { type: 'icon', value: 'checkmark-circle' }, text: 'Feature one', color: '#22c55e' }, { icon: { type: 'icon', value: 'checkmark-circle' }, text: 'Feature two', color: '#22c55e' }],
      layout: 'vertical',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'items', label: 'Items', type: 'items-array', itemFields: [{ key: 'icon', label: 'Icon', type: 'icon' }, { key: 'text', label: 'Text', type: 'text' }] },
      { key: 'layout', label: 'Layout', type: 'select', options: [{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }] },
    ],
  },

  'image-mask': {
    label: 'Image Mask',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      src: '',
      maskShape: 'circle',
      size: 220,
      style: {},
    },
    contentFields: [
      { key: 'src', label: 'Image', type: 'image' },
      { key: 'maskShape', label: 'Shape', type: 'select', options: [{ value: 'circle', label: 'Circle' }, { value: 'rounded', label: 'Rounded' }, { value: 'diamond', label: 'Diamond' }, { value: 'hexagon', label: 'Hexagon' }, { value: 'star', label: 'Star' }] },
      { key: 'size', label: 'Size (px)', type: 'number' },
    ],
  },

  'image-panels': {
    label: 'Image Panels',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      panels: [{ src: '', title: 'Panel 1' }, { src: '', title: 'Panel 2' }, { src: '', title: 'Panel 3' }],
      height: 260,
      style: {},
    },
    contentFields: [
      { key: 'panels', label: 'Panels', type: 'items-array', itemFields: [{ key: 'src', label: 'Image', type: 'image' }, { key: 'title', label: 'Title', type: 'text' }] },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  lightbox: {
    label: 'Lightbox',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      images: [{ src: '', alt: '' }, { src: '', alt: '' }, { src: '', alt: '' }],
      columns: 3,
      style: {},
    },
    contentFields: [
      { key: 'images', label: 'Images', type: 'items-array', itemFields: [{ key: 'src', label: 'Image', type: 'image' }] },
      { key: 'columns', label: 'Columns', type: 'select', options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }] },
    ],
  },

  rating: {
    label: 'Rating',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      value: 4,
      max: 5,
      label: '',
      activeColor: '#fbbf24',
      style: {},
    },
    contentFields: [
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'max', label: 'Max', type: 'number' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'activeColor', label: 'Star Color', type: 'color' },
    ],
  },

  'show-more-less': {
    label: 'Show More/Less',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      content: 'Add a longer piece of text here that will be truncated until the reader chooses to expand it.',
      collapsedLines: 3,
      moreText: 'Show More',
      lessText: 'Show Less',
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'content', label: 'Content', type: 'richtext' },
      { key: 'collapsedLines', label: 'Collapsed Lines', type: 'number' },
      { key: 'moreText', label: 'More Text', type: 'text' },
      { key: 'lessText', label: 'Less Text', type: 'text' },
    ],
  },

  tooltip: {
    label: 'Tooltip',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      triggerText: 'Tap for info',
      tooltipText: 'This is a tooltip',
      style: { color: '#374151' },
    },
    contentFields: [
      { key: 'triggerText', label: 'Trigger Text', type: 'text' },
      { key: 'tooltipText', label: 'Tooltip Text', type: 'text' },
    ],
  },

  'ultimate-image': {
    label: 'Ultimate Image',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      src: '',
      alt: '',
      caption: '',
      linkType: 'manual',
      link: '',
      lightbox: false,
      style: { borderRadius: 8 },
    },
    contentFields: [
      { key: 'src', label: 'Image', type: 'image' },
      { key: 'alt', label: 'Alt Text', type: 'text' },
      { key: 'caption', label: 'Caption', type: 'text' },
      { key: 'link', label: 'Link (optional)', type: 'text' },
      { key: 'lightbox', label: 'Tap to Enlarge', type: 'toggle' },
    ],
  },

  'ultimate-video': {
    label: 'Ultimate Video',
    category: 'Enhanced',
    isContainer: false,
    defaultProps: {
      type: 'self',
      src: '',
      youtubeId: '',
      vimeoId: '',
      poster: '',
      autoplay: false,
      loop: false,
      muted: false,
      controls: true,
      style: { borderRadius: 8 },
    },
    contentFields: [
      { key: 'type', label: 'Video Type', type: 'select', options: [{ value: 'self', label: 'Self Hosted' }, { value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }] },
      { key: 'src', label: 'Video File (self hosted)', type: 'image' },
      { key: 'youtubeId', label: 'YouTube Video ID', type: 'text' },
      { key: 'vimeoId', label: 'Vimeo Video ID', type: 'text' },
      { key: 'poster', label: 'Poster Image', type: 'image' },
      { key: 'autoplay', label: 'Autoplay (self hosted only)', type: 'toggle' },
      { key: 'loop', label: 'Loop (self hosted only)', type: 'toggle' },
      { key: 'muted', label: 'Muted (self hosted only)', type: 'toggle' },
    ],
  },

  // ── Extras ───────────────────────────────────────────────────────

  'adjacent-posts': {
    label: 'Adjacent Posts',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      prevLabel: '← Previous',
      prevTitle: 'Previous item title',
      prevLink: '',
      nextLabel: 'Next →',
      nextTitle: 'Next item title',
      nextLink: '',
      style: {},
    },
    contentFields: [
      { key: 'prevLabel', label: 'Previous Label', type: 'text' },
      { key: 'prevTitle', label: 'Previous Title', type: 'text' },
      { key: 'prevLink', label: 'Previous Link', type: 'text' },
      { key: 'nextLabel', label: 'Next Label', type: 'text' },
      { key: 'nextTitle', label: 'Next Title', type: 'text' },
      { key: 'nextLink', label: 'Next Link', type: 'text' },
    ],
  },

  'author-box': {
    label: 'Author Box',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      name: 'Author Name',
      bio: 'A short author bio goes here.',
      avatar: '',
      style: { backgroundColor: '#f9fafb', borderRadius: 12, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 },
    },
    contentFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'bio', label: 'Bio', type: 'richtext' },
      { key: 'avatar', label: 'Avatar', type: 'image' },
    ],
  },

  'content-switcher': {
    label: 'Content Switcher',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      labelA: 'Monthly',
      labelB: 'Yearly',
      contentA: 'Monthly content goes here.',
      contentB: 'Yearly content goes here.',
      activeColor: '#0F604B',
      style: {},
    },
    contentFields: [
      { key: 'labelA', label: 'Label A', type: 'text' },
      { key: 'labelB', label: 'Label B', type: 'text' },
      { key: 'contentA', label: 'Content A', type: 'richtext' },
      { key: 'contentB', label: 'Content B', type: 'richtext' },
      { key: 'activeColor', label: 'Active Color', type: 'color' },
    ],
  },

  'content-timeline': {
    label: 'Content Timeline',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      items: [{ date: '2025', title: 'Milestone one', description: 'Description here.' }, { date: '2026', title: 'Milestone two', description: 'Description here.' }],
      dotColor: '#0F604B',
      style: {},
    },
    contentFields: [
      { key: 'items', label: 'Items', type: 'items-array', itemFields: [{ key: 'date', label: 'Date', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'description', label: 'Description', type: 'text' }] },
      { key: 'dotColor', label: 'Dot Color', type: 'color' },
    ],
  },

  'copyright-year': {
    label: 'Copyright Year',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      text: '© {year} Your Company. All rights reserved.',
      style: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
    },
    contentFields: [
      { key: 'text', label: 'Text (use {year} for current year)', type: 'text' },
    ],
  },

  counter: {
    label: 'Counter',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      startValue: 0,
      endValue: 1000,
      duration: 2000,
      prefix: '',
      suffix: '+',
      title: 'Happy Customers',
      style: { color: '#111827', textAlign: 'center' },
    },
    contentFields: [
      { key: 'startValue', label: 'Start Value', type: 'number' },
      { key: 'endValue', label: 'End Value', type: 'number' },
      { key: 'duration', label: 'Duration (ms)', type: 'number' },
      { key: 'prefix', label: 'Prefix', type: 'text' },
      { key: 'suffix', label: 'Suffix', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
    ],
  },

  'infinite-scroller': {
    label: 'Infinite Scroller',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      items: ['Item one', 'Item two', 'Item three'],
      speed: 8000,
      style: { fontSize: 15, color: '#374151' },
    },
    contentFields: [
      { key: 'items', label: 'Items', type: 'items-array', itemFields: [{ key: 'text', label: 'Text', type: 'text' }] },
      { key: 'speed', label: 'Speed (ms per loop)', type: 'number' },
    ],
  },

  'media-player': {
    label: 'Media Player',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      type: 'video',
      src: '',
      poster: '',
      controls: true,
      loop: false,
      muted: false,
      style: { borderRadius: 8 },
    },
    contentFields: [
      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }] },
      { key: 'src', label: 'Media File', type: 'image' },
      { key: 'poster', label: 'Poster (video only)', type: 'image' },
      { key: 'loop', label: 'Loop', type: 'toggle' },
      { key: 'muted', label: 'Muted', type: 'toggle' },
    ],
  },

  'post-terms': {
    label: 'Post Terms',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      taxonomy: 'Categories',
      terms: [{ text: 'Technology' }, { text: 'Design' }],
      style: { fontSize: 14, color: '#374151' },
    },
    contentFields: [
      { key: 'taxonomy', label: 'Label', type: 'text' },
      { key: 'terms', label: 'Terms', type: 'items-array', itemFields: [{ key: 'text', label: 'Text', type: 'text' }] },
    ],
  },

  preloader: {
    label: 'Preloader',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      type: 'spinner',
      text: 'Loading...',
      showText: true,
      color: '#0F604B',
      style: {},
    },
    contentFields: [
      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'spinner', label: 'Spinner' }, { value: 'pulse', label: 'Pulse' }, { value: 'dots', label: 'Dots' }] },
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'showText', label: 'Show Text', type: 'toggle' },
      { key: 'color', label: 'Color', type: 'color' },
    ],
  },

  'reading-progress-bar': {
    label: 'Reading Progress Bar',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      color: '#0F604B',
      height: 4,
      style: {},
    },
    contentFields: [
      { key: 'color', label: 'Bar Color', type: 'color' },
      { key: 'height', label: 'Height (px)', type: 'number' },
    ],
  },

  'reading-time': {
    label: 'Reading Time',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      text: '5 min read',
      icon: { type: 'icon', value: 'book-outline' },
      style: { fontSize: 13, color: '#6b7280' },
    },
    contentFields: [
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'icon' },
    ],
  },

  'social-share-buttons': {
    label: 'Social Share Buttons',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      shareUrl: '',
      shareText: 'Check this out!',
      platforms: ['facebook', 'twitter', 'whatsapp', 'email'],
      style: {},
    },
    contentFields: [
      { key: 'shareUrl', label: 'Share URL', type: 'text' },
      { key: 'shareText', label: 'Share Text', type: 'text' },
    ],
  },

  'table-of-contents': {
    label: 'Table of Contents',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      title: 'Table of Contents',
      items: [{ text: 'Introduction', level: 1 }, { text: 'Getting Started', level: 1 }, { text: 'Details', level: 2 }],
      style: { backgroundColor: '#f9fafb', borderRadius: 8, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 },
    },
    contentFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Items', type: 'items-array', itemFields: [{ key: 'text', label: 'Text', type: 'text' }] },
    ],
  },

  'toggle-switch': {
    label: 'Toggle Switch',
    category: 'Extras',
    isContainer: false,
    defaultProps: {
      label: 'Enable feature',
      defaultChecked: false,
      activeColor: '#0F604B',
      style: {},
    },
    contentFields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'defaultChecked', label: 'Default On', type: 'toggle' },
      { key: 'activeColor', label: 'Active Color', type: 'color' },
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
