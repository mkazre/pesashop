# Page Builder: What We Need for 100% Oxygen Builder Parity

This document lists everything required to make the React page builder work **exactly** like Oxygen Builder: layout, UI, elements, controls, and behavior. Use it as a checklist and implementation roadmap.

---

## 1. UI Layout (Oxygen vs Current)

| Area | Oxygen | We have | To do |
|------|--------|---------|--------|
| **Top bar** | Left: "+ Add". Center: breakpoint pills (Desktop / Tablet / Phone). Right: Save, etc. | Add button, Undo/Redo, Save, Back | Add **breakpoint switcher** (Desktop / Tablet / Phone) in center; optional toolbar icons. |
| **Left panel** | Single panel with **tabs**: Structure, History, Stylesheets, Selectors. One tab visible at a time. | Single panel with tabs: **Elements**, **Structure**, **Settings**. | Rename/restructure: **Structure** (tree) + **History** (undo list) + optionally **Stylesheets** / **Selectors**. Move **Elements** to open from "+ Add" (component browser). Move **Settings** to **right panel**. |
| **Center** | Canvas (iframe or live DOM). Click/drag to select; selection syncs with tree. | Canvas (Craft.js Frame). Selection syncs. | Ensure canvas is always ready (serialized default data ✓). Optional: **iframe mode** to preview real frontend. |
| **Right panel** | **Settings** – only when element selected. Tabs (Layout, Typography, Advanced) → sections → controls. | Settings in **left** tab; single column, no tabs per element. | **Move Settings to right side.** Per-element **tabs** (Layout, Typography, Advanced, etc.) with **sections** (heading + icon) and **controls** under each. |
| **Add panel** | Opens from "+ Add" – **component browser**: categories (Fundamentals, etc.), search, click to insert. | Component palette in left tab "Elements"; categories; click to add. | Keep as component browser; ensure it opens from "+ Add" (not as a tab). **Search** in Add panel. |

**Layout summary:**  
- **Left:** Structure (DOM tree) + History (+ optional Stylesheets/Selectors).  
- **Center:** Canvas.  
- **Right:** Settings (tabs → sections → controls) when something is selected.  
- **Add:** Opens from top bar "+ Add" (slide-out or panel), not a left tab.

---

## 2. Left Panel – Structure (DOM Tree)

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| Panel title | "Structure" | "Structure" (in tab) | ✓ |
| Tree root label | "Body" or "Inner Content" | (root node) | Show explicit "Body" or "Inner Content" as root label. |
| Expand / Collapse all | Buttons in header | Expand All / Collapse All | ✓ |
| Import | Import tree from JSON/file | — | **Add Import** (parse JSON, deserialize into editor). |
| Tree row | Chevron (expand/collapse), drag handle, label, visibility, more (⋯), delete | Similar in DOMTree | Ensure **visibility** toggle, **more menu**, **delete** on each row. |
| More menu | Export, Make Re-Usable, Copy to Block, Duplicate, Wrap with &lt;div&gt;, Rename, Categorize | Context menu (Duplicate, etc.) | **Full menu:** Export, Make Re-Usable, Copy to Block, Duplicate, Wrap with div, Rename, Categorize. |
| Drag and drop | Reorder / reparent in tree | Craft.js tree drag | Ensure drag in tree updates canvas and vice versa. |

---

## 3. Left Panel – History (Optional Tab)

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| Undo / Redo list | List of actions; "Clear All" | Undo/Redo in top bar only | **History tab:** list of undo/redo steps; "Clear All" button. |

---

## 4. Top Bar

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| + Add | Opens component browser | Can open Elements tab | Ensure **+ Add** opens **Add (component browser)** only, not left Structure tab. |
| Breakpoints | Desktop / Tablet / Phone pills; switch to set styles per breakpoint | — | **Breakpoint switcher:** Desktop (default), Tablet, Phone. Store/apply styles **per breakpoint** (e.g. in node props: `media: [{ size: '768px', original: { ... } }]`). |
| Save / Back | Save page, back to list | ✓ | ✓ |

---

## 5. Right Panel – Settings (When Element Selected)

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| Position | Right side, fixed when element selected | Left tab "Settings" | **Move Settings to right panel** (not left tab). |
| Tabs per element | Layout, Typography, Advanced, etc. | Single column per element type | **Tabs** at top of Settings: Layout, Typography, Advanced (and element-specific). |
| Sections | Each tab has sections (heading + icon), e.g. "Layout Child Elements", "Width", "Background color" | Flat list of controls | **Sections** inside each tab: heading + icon, then controls. |
| Controls | Same types as Oxygen (see below) | Color, Select, Number, Text, Spacing, Custom CSS | Add missing control types; use **Oxygen-style labels** (e.g. "Background color", "Font Size", "Tag"). |

---

## 6. Control Types (Oxygen vs Ours)

| Oxygen type | Purpose | We have | To do |
|-------------|--------|---------|--------|
| `content` | Editable text / rich text | TextControl (plain) | **Rich text** (WYSIWYG) option for content. |
| `colorpicker` | Color | ColorControl | ✓ |
| `slider-measurebox` | Numeric + unit (px, %, em) | NumberControl + unit | **Slider** + **unit dropdown** (px, %, em, rem). |
| `dropdown` | Select one | SelectControl | ✓ |
| `tag` | HTML tag (div, h1–h6, etc.) | — | **Tag control** (dropdown: div, section, h1–h6, etc.). |
| `font-family` | Font family | — | **Font family** selector. |
| `flex-layout` | Flex direction/justify/align | — | **Flex layout** controls (direction, justify, align). |
| `checkbox` | Boolean | — | **Checkbox** control (export from PropertyControls if missing). |
| `positioning` | Position (relative, absolute, etc.) | — | **Position** control. |
| `columnwidth` | Width (e.g. column %) | NumberControl | Optional **slider + unit** for width. |
| `buttons-list` | Radio (button group) | — | **Button group** (radio) control. |
| `typography` | Preset group (font, size, weight) | — | **Typography** section (font, size, weight, line-height). |
| `measurebox` | Number + unit | NumberControl | Add **unit dropdown** to number where needed. |
| `link` | URL + text | TextControl | **Link** control (URL + optional text). |
| `image` | Media picker (URL) | — | **Image/Media** picker (URL upload or select). |
| `code-editor` | Custom CSS/JS | CustomCSSControl | Optional **syntax highlight**; JS block if needed. |
| `textarea` | Multi-line text | TextControl (multiline) | ✓ |

---

## 7. Elements – Base (Oxygen Fundamentals)

| Oxygen element | We have | To do |
|----------------|---------|--------|
| Section (full-width) | Section.jsx | Ensure Section has Oxygen-like options (background, padding, etc.) and full-width behavior. |
| Div (block) | Container.jsx | Align props/labels with Oxygen "Div" (tag, layout, width). |
| Columns | — | **Columns** element (e.g. 2/3, 1/3 or configurable columns). |
| Inner Content | — | **Inner Content** (placeholder for main content slot) if needed. |
| Heading | Heading.jsx | ✓; ensure tag (h1–h6), typography in Settings. |
| Text | Text.jsx | ✓; optional Rich Text. |
| Rich Text | — | **Rich Text** element (WYSIWYG). |
| Image | Image.jsx | ✓; add media picker in Settings. |
| Link / Link Button | Button.jsx, link variant | **Link** element (text + URL); Button = Link Button. |
| Button | Button.jsx | ✓ |
| Code Block | — | **Code Block** (raw HTML/code). |
| Shortcode | — | Skip (WP) or **Shortcode** placeholder for custom blocks. |
| SVG Icon | — | **Icon** element (SVG or icon set). |
| Video | — | **Video** element (embed URL). |

---

## 8. Elements – WooCommerce / Shop (Our Equivalents)

| Oxygen WooCommerce | We have | To do |
|--------------------|---------|--------|
| Archive Products | ProductGrid | ✓; align options (columns, pagination). |
| Product Title, Price, Image, etc. | ProductCard, PriceDisplay, AddToCartButton, etc. | ✓; ensure Settings panels match Oxygen-style (tabs, sections). |
| Mini Cart / Cart / Checkout | — | **Mini Cart** (dropdown); **Cart** / **Checkout** placeholder blocks that render storefront cart/checkout. |
| Breadcrumb | — | **Breadcrumb** element. |

---

## 9. Elements – Oxy Ultimate / Oxy Extras (Optional for “100%”)

| Category | Examples | We have | To do |
|-----------|----------|---------|--------|
| Sliders | Content Slider, Gallery Slider | Repeater (generic) | **Content Slider** (slides with text/image). |
| Accordion | Classic / Pro Accordion | — | **Accordion** element. |
| Tabs | Tabs | — | **Tabs** element. |
| Gallery | Gallery, Gallery Slider | — | **Gallery** (grid + lightbox). |
| Countdown | Countdown | — | **Countdown** element. |
| Menu | Mega Menu, Slide Menu | — | **Menu** element (or link to Menu Builder). |
| Others | Tooltip, Read More, Counter, Lottie, etc. | — | Add as needed for parity. |

---

## 10. Add Panel (Component Browser)

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| Opens from | "+ Add" in top bar | Left tab "Elements" | **+ Add** opens Add panel only (slide-out or overlay). |
| Categories | Fundamentals (Containers, Text, …), WooCommerce, etc. | Categories (Layout, Basic, Shop) | Align category names: **Fundamentals** (Section, Div, Columns, Heading, Text, Image, Link, Button), **Shop** (Product Grid, Product Card, etc.). |
| Search | Search components by name | — | **Search** input to filter components. |
| Click to insert | Click component → insert at canvas/target | ✓ | Keep; ensure target is always canvas (or selected container). |

---

## 11. Canvas Behavior

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| Selection | Click element → select; sync with Structure | ✓ | ✓ |
| Drag to add | Drag from Add panel to canvas | — | **Drag from Add panel** onto canvas (drop zone) to add. |
| Drag to reorder | Drag in canvas or tree | Tree + canvas (Craft.js) | Ensure reorder in canvas and tree stay in sync. |
| Inline edit | Double-click text/heading to edit | ✓ | ✓ |
| Resize handles | Optional resize on elements | — | Optional **resize handles** for layout elements. |

---

## 12. Data Model (Optional for “100%”)

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| Breakpoints | `media: [{ size: "748px", original: { ... } }]` per node | — | Store **per-breakpoint** overrides in node props; apply in render when breakpoint active. |
| Hover state | `hover: { background: "..." }` per node | — | Store **hover** overrides; apply on hover in preview/frontend. |
| Nicename | Display name in tree | displayName | ✓ (or map to `nicename` in UI). |

---

## 13. Template Builder & Menu Builder

| Feature | Oxygen | We have | To do |
|---------|--------|---------|--------|
| Template builder | Header, Footer, Archive, Single, etc. templates | — | **Template builder:** create/edit templates (e.g. Header, Footer) and assign to pages/routes. |
| Menu builder | Visual menu editor | MegaMenuDesigner (?) | **Menu builder** in admin: drag items, mega menu, etc.; assign to menu locations. |

---

## 14. Visual Polish (Look Like Oxygen)

| Item | To do |
|------|--------|
| Panel background | Left panel dark (e.g. #1e1e1e); right panel light; or match Oxygen exactly. |
| Typography | System font or Inter; same spacing/sizes as Oxygen. |
| Icons | SVG (Lucide or custom) to match Oxygen icons where it helps. |
| Resizable panels | **Resizable** left and right panel widths (drag divider). |
| Canvas padding | Match Oxygen canvas padding/background. |

---

## 15. Summary Checklist (High Level)

1. **Layout** – Left: Structure (+ History). Center: Canvas. Right: Settings. Add: from "+ Add" only.
2. **Structure** – Tree with Body root; Expand/Collapse; Import; per-row visibility, more menu (Duplicate, Wrap, Rename, etc.), delete.
3. **Top bar** – + Add, breakpoint switcher (Desktop/Tablet/Phone), Save/Back.
4. **Settings (right)** – Tabs (Layout, Typography, Advanced) → sections → controls; all Oxygen control types and labels.
5. **Add panel** – Opens from + Add; categories (Fundamentals, Shop); search; click (and optional drag) to insert.
6. **Elements** – All base (Section, Div, Columns, Heading, Text, Rich Text, Image, Link, Button, Code, Icon, Video); Shop (ProductGrid, ProductCard, Cart, etc.); optional Slider, Accordion, Tabs, Gallery, Menu.
7. **Controls** – Color, Slider+unit, Select, Tag, Font, Flex, Checkbox, Position, Link, Image picker, Rich text, etc.
8. **Data** – Optional: breakpoint styles, hover state; nicename in tree.
9. **Template & Menu builder** – Template builder (header/footer/archive); Menu builder.
10. **Polish** – Resizable panels, Oxygen-like theme (dark left, etc.).

Implementing the items above will bring the page builder to **100% Oxygen Builder parity** in behavior and UI. Prioritize: layout (move Settings right, Add from + Add), Structure tree actions, Settings tabs/sections/controls, then breakpoints, then extra elements and template/menu builders.
