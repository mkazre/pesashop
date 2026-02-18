# Oxygen Builder Emulation – 4-Part Plan

Goal: Inspect Oxygen Builder (+ WooCommerce, Oxy Ultimate, Oxy Extras) and make our React Page Builder behave the same with an identical UI.

---

## Part 1: Oxygen core – UI layout, toolbar, tree, panels & data model

**Scope**
- Map Oxygen’s builder UI: toolbar (top), DOM/tree (left?), canvas (center), settings/options (right).
- Identify main panels and what each shows (Structure, Styles, Advanced, etc.).
- Understand how the builder state is stored (JSON structure, shortcodes, or both).
- Document for React: which layout we’re copying and how state maps to our `PageTemplate.components`.

**Deliverable**
- Short doc: `OXYGEN_UI_AND_DATA_MODEL.md` (or section in this file) describing layout + data model.
- Decision: exact panel layout and names we’ll implement in the admin Page Builder.

**Source**
- Oxygen plugin: `oxygen/component-framework/` (admin JS/CSS, Angular controllers for tree/ui, pages).

---

## Part 2: Oxygen core – base elements & control types

**Scope**
- List Oxygen’s base elements (e.g. Div, Text, Heading, Image, Button, Section, Columns, etc.).
- Map control types: slider, color picker, dropdown, text, link, image, etc.
- For each base element: name, icon, default props, and which controls it has.
- Define our Craft.js elements and control panels so they mirror Oxygen (same labels, same behavior where possible).

**Deliverable**
- Doc: `OXYGEN_ELEMENTS_AND_CONTROLS.md` (or section).
- Admin builder: ensure we have matching elements and a control panel that uses the same control types and labels.

**Source**
- Oxygen: `component-framework/api/` (element classes, controls), `component-framework/components/classes/`.

---

## Part 3: Oxygen WooCommerce + Oxy Ultimate addon elements

**Scope**
- **Oxygen WooCommerce**: list WooCommerce-specific elements (product, cart, checkout, etc.) and their main options.
- **Oxy Ultimate**: list extra elements (sliders, accordions, galleries, etc.) and their options.
- For each: name, purpose, key settings. Decide which we implement as React elements (or simplified versions).

**Deliverable**
- Doc: `OXYGEN_ADDONS_ELEMENTS.md` (or section).
- New or updated Craft.js elements in admin (and frontend renderer) for the ones we choose (e.g. product grid, slider, accordion).

**Source**
- `oxygen-woocommerce` plugin (from zip), `oxy-ultimate/` (elements folders, class-oxyultimate-el.php).

---

## Part 4: Oxy Extras + UI polish to match Oxygen

**Scope**
- **Oxy Extras**: list elements and features; add any missing elements/controls to our builder.
- **UI polish**: align our admin Page Builder UI with Oxygen (panel positions, widths, icons, typography, spacing).
- Final pass: feature parity checklist and UI comparison notes.

**Deliverable**
- Doc: `OXYGEN_EXTRAS_AND_UI_CHECKLIST.md` (or section).
- Admin builder: styling and layout updates so the UI looks like Oxygen (and any remaining Oxy Extras elements).

**Source**
- `oxyextras` plugin (extract from zip), plus Oxygen admin CSS/JS for visual reference.

---

## Order of work

1. **Part 1** – Foundation: we know the layout and data model before building UI.
2. **Part 2** – Core builder: base elements and controls in React.
3. **Part 3** – Addons: WooCommerce + Oxy Ultimate elements.
4. **Part 4** – Second addon + visual parity and checklist.

Each part can be done in one or more sessions; we’ll treat each part as “lighter” and focused.

---

## Status: All 4 parts complete (documentation-only)

- **Part 1:** Done. See `OXYGEN_UI_AND_DATA_MODEL.md`.
- **Part 2:** Done. See `OXYGEN_ELEMENTS_AND_CONTROLS.md`.
- **Part 3:** Done. See `OXYGEN_ADDONS_ELEMENTS.md`.
- **Part 4:** Done. See `OXYGEN_EXTRAS_AND_UI_CHECKLIST.md`.

No application code was changed in any part (to avoid breaking the app). The docs are the blueprint for implementing Oxygen-style UI and elements in the React Page Builder when you’re ready.
