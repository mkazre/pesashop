# Part 4: Oxy Extras & UI Parity Checklist

## 1. Oxy Extras elements (oxyextras plugin)

From the zip listing, Oxy Extras adds:

### Layout & UI
- **Pro Accordion** – accordion with rich options.
- **Tabs** – tabbed content.
- **Off Canvas Wrapper** – off-canvas panel/sidebar.
- **Slide Menu** – slide-in menu.
- **Mega Menu** – mega menu.
- **Burger Trigger** – hamburger menu trigger.
- **Content Switcher** – switch between content blocks.
- **Read More** – expand/collapse (read more).
- **Copy to Clipboard** – copy button.

### Media & animation
- **Lottie** – Lottie animations.
- **Media Player** – audio/video player.
- **Preloader** – loading animation.

### Content / blog
- **Counter** – number counter.
- **Countdown** – countdown timer.
- **Reading Time** – estimated reading time.
- **Reading Progress Bar** – scroll progress.
- **TOC** – table of contents.
- **Post Terms** – categories/tags.
- **Post Modified Date** – last updated date.
- **Author Box** – author bio/avatar.

### Forms & auth
- **Pro Login** – login form.
- **Fluent Form** – Fluent Forms integration (WP).

### Other
- **Header Search** – search in header.
- **Interactive Cursor** – custom cursor.
- **Infinite Scroll** – infinite scroll.

We do **not** implement these in the React builder in Part 4; this doc is for reference. Future work can add equivalents (e.g. Accordion, Tabs, Countdown) as Craft.js elements.

---

## 2. UI parity checklist (Oxygen vs our builder)

Use this when implementing or polishing the admin Page Builder UI.

### Top bar
- [ ] **+ Add** button (opens component palette).
- [ ] Media query / breakpoint switcher (Desktop, Tablet, Phone) – optional.
- [ ] Save / Back actions (we have these).

### Left panel (Structure)
- [ ] Panel title: **"Structure"** (Oxygen label).
- [ ] Actions: **Import**, **Expand All**, **Collapse All** (optional).
- [ ] **DOM tree**: root (e.g. "Body"), children with expand/collapse, drag handle, label, visibility, more (⋯), delete.
- [ ] Tree node more menu: Duplicate, Wrap with div, Rename, etc. (optional).
- [ ] Optional tabs: **History** (undo/redo list), **Stylesheets**, **Selectors** (can be Phase 2).

### Center
- [ ] **Canvas** (Craft.js Frame) – we have this.
- [ ] Click/drag to select; selection syncs with Structure tree – Craft.js does this.

### Right panel (when element selected)
- [ ] **Tabs** per element (e.g. Layout, Typography, Advanced).
- [ ] **Sections** per tab (heading + icon).
- [ ] **Controls** (slider, color, dropdown, text) with Oxygen-style labels, e.g. "Background color", "Font Size", "Tag".
- [ ] Same control types as Oxygen where applicable (see Part 2 doc).

### Add panel (component browser)
- [ ] Opens from "+ Add".
- [ ] Categories (e.g. Fundamentals → Containers, Text; WooCommerce; etc.).
- [ ] Search.
- [ ] Click to insert – we have element palette; align labels (Div → Container, Headline → Heading, etc.) per Part 2.

### Visual style (optional polish)
- [ ] Panel background: dark or light to match Oxygen (e.g. #1e1e1e left, white right).
- [ ] Font: system or Inter; similar spacing.
- [ ] Icons: Oxygen uses SVG; we can use Lucide or similar.
- [ ] Resizable panels (left/right width).

---

## 3. Part 4 summary

- **Oxy Extras:** Documented elements (accordion, tabs, countdown, mega menu, etc.). No new elements added in this phase.
- **UI checklist:** Captures Oxygen layout and labels for future implementation. No app code changed in Part 4 to avoid regressions.
- **All four parts** are documentation-led; implementation can follow the docs in small, safe steps (e.g. add "Structure" label, then tree actions, then right-panel tabs).

---

## 4. Files created (all parts)

| Part | File | Purpose |
|------|------|--------|
| 1 | `OXYGEN_UI_AND_DATA_MODEL.md` | UI layout, panels, tree, data model (JSON shape). |
| 2 | `OXYGEN_ELEMENTS_AND_CONTROLS.md` | Base elements, control types, our ↔ Oxygen mapping. |
| 3 | `OXYGEN_ADDONS_ELEMENTS.md` | WooCommerce + Oxy Ultimate addon elements. |
| 4 | `OXYGEN_EXTRAS_AND_UI_CHECKLIST.md` | Oxy Extras elements + UI parity checklist. |
| – | `OXYGEN_EMULATION_PLAN.md` | 4-part plan (already existed). |

No application code was changed in any part to avoid breaking the app.
