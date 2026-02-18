# Part 1: Oxygen Builder – UI Layout & Data Model

## 1. UI Layout (what we emulate)

### Top bar (`#oxygen-topbar`, `oxygen-toolbar`)
- **Left:** "+ Add" button – opens **Add** (component browser) panel.
- **Center:** **Media query** pills – Desktop, Tablet, Phone, etc. Click to switch breakpoint; styles can be set per breakpoint.
- **Right:** Toolbar panels (Settings, etc.).

### Left side panel (`#ct-sidepanel`, `ct-panel-elements-managers`)
Slide-out panel with **tabs** (only one visible at a time):

1. **Structure (DOM Tree)** – `ct-dom-tree-tab`
   - Header: "Structure" + close (X).
   - Actions: **Import**, **Expand All**, **Collapse All**.
   - **Tree:** Root = "Body" (or "Inner Content"). Children = draggable nodes. Each node:
     - Expand/collapse chevron (if has children).
     - Drag handle.
     - Label (nicename or default title).
     - Icons: visibility, more (⋯), delete.
     - More menu: Export, Make Re-Usable, Copy to Block, Duplicate, Wrap with &lt;div&gt;, Rename, Categorize.

2. **History**
   - Undo/redo list; "Clear All".

3. **Stylesheets**
   - Add Stylesheet / Add Folder; tree of stylesheets (Enabled/Disabled, folders).

4. **Selectors**
   - Add Selector / Add Folder; search; list of classes/selectors (Enabled/Disabled, folders).

### Center
- **Canvas** – iframe with the page (frontend). Users click/drag elements here; selection syncs with Structure tree.

### Right side (when element selected)
- **Settings / options panel** – tabs per component (e.g. Layout, Typography, Advanced). Each tab has **sections** (headings + icon) and **controls** (slider, color, text, etc.).

### Add (component browser)
- Opens from "+ Add" – list of components (Fundamentals, etc.), search; click to insert.

---

## 2. Data Model

### Stored in DB (WordPress)
- **`ct_builder_json`** – main builder state (JSON string).
- **`ct_builder_shortcodes`** – derived shortcode string (for WP); we don’t need shortcodes.

### Tree JSON shape (from `controller.tree.js` and `tree-shortcodes.php`)

```json
{
  "name": "root",
  "children": [
    {
      "id": 1,
      "name": "ct_section",
      "options": {
        "ct_parent": 0,
        "ct_id": 1,
        "original": {
          "background": "#515151",
          "padding-top": "20px"
        },
        "hover": { "background": "#cccccc" },
        "media": [
          { "size": "748px", "original": { "background": "#929292" } }
        ]
      },
      "children": [
        {
          "id": 2,
          "name": "ct_headline",
          "options": {
            "ct_parent": 1,
            "ct_id": 2,
            "original": { "tag": "h3", "text": "I am a headline!" }
          },
          "children": []
        }
      ]
    }
  ]
}
```

- **Root:** `name: "root"`, single root; `children` = top-level elements.
- **Node:** `id`, `name` (shortcode/element tag, e.g. `ct_section`, `ct_div_block`, `ct_headline`), `options`, `children`.
- **options:** 
  - `ct_parent` – parent node id.
  - `ct_id` – same as node `id`.
  - `original` – default state (all control values: layout, typography, colors, etc.).
  - `hover` – hover state overrides.
  - `media` – array of `{ size: "748px", original: { ... } }` for breakpoint overrides.
  - `nicename` – optional display name in tree.

### Mapping to our stack (Craft.js + React)
- Our **Craft.js** serialized state is a flat map of node id → `{ type, props, nodes, ... }` (different shape).
- We already store this in **PageTemplate.components** (JSON).
- **Part 2** will map Oxygen **elements** and **controls** to our elements and Settings panel; we do **not** need to change our storage format – we keep Craft.js format and emulate Oxygen **UI** and **behavior** (tree, panels, add panel).

---

## 3. Decisions for our React builder

| Aspect            | Oxygen                    | Our target                          |
|------------------|---------------------------|-------------------------------------|
| Left panel       | Structure / History / Stylesheets / Selectors | Structure + History (Stylesheets/Selectors later) |
| Top bar          | Add + Media queries       | Add + (optional) breakpoints        |
| Right panel      | Tabs → sections → controls | Same: Tabs → sections → controls   |
| Tree actions     | Import, Expand/Collapse, Duplicate, Wrap, Delete, Rename | Same set where possible |
| Data format      | Tree JSON (root + children) | Keep Craft.js format; no migration |
| Canvas           | Iframe                    | Craft.js Frame (no iframe)          |

Part 1 complete. No app code changed; Part 2 will add/align elements and control types.
