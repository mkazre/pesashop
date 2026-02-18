# Page Builder Libraries Research (Oxygen Builder–style)

Research on JavaScript/React libraries and alternatives to achieve an Oxygen Builder–like implementation: drag-and-drop, deep customization, nesting, and visual editing.

---

## 1. Current Stack: Craft.js

- **What it is:** React framework for building extensible drag-and-drop page editors.
- **Pros:** Open source, React-native, component-based, serializable state, undo/redo, DOM tree.
- **Cons:** Smaller community, some APIs deprecated (`createNode` → `parseReactElement().toNodeTree()`), Frame state from `children` can be async so “canvas not ready” can occur if you don’t pass initial `data`.
- **Recommendation:** Keep using it, but **always pass serialized `data` to `<Frame />`** (including a pre-built default empty canvas) so the editor state exists from first render and add/drop works immediately.

---

## 2. Full-Featured / Commercial Options

### Builder.io

- **URL:** https://builder.io  
- **What it is:** Drag-and-drop page builder and headless CMS; register custom React components for non-technical users to place on pages.
- **Pros:** Used in production (Everlane, Zapier, J.Crew, Experian), supports Next.js, Remix, Gatsby, visual editing, A/B testing, targeting.
- **Cons:** Commercial/SaaS; public repo archived (Jan 2024). Not self-hosted in the same way as Craft.js.
- **Use case:** When you want a managed, hosted builder and are okay with their pricing and ecosystem.

### Plasmic

- **URL:** https://plasmic.app  
- **What it is:** Drag-and-drop page builder and headless CMS for React; register custom components and design in a visual editor.
- **Pros:** API-first CMS, A/B testing, segmentation, strong for design–dev collaboration (e.g. Intuit, Guidewire).
- **Cons:** Commercial; not a drop-in open-source library like Craft.js.
- **Use case:** When you need a full visual CMS and design workflow, not just an embedded editor.

---

## 3. Open-Source / Library Options

### GrapesJS

- **URL:** https://grapesjs.com  
- **GitHub:** https://github.com/GrapesJS/grapesjs (and `grapesjs/react` for React).
- **What it is:** Free, open-source web builder framework; multi-purpose (pages, newsletters, etc.) with blocks, components, traits, styles, storage.
- **Pros:** Mature, framework-agnostic (with React bindings), self-hosted, no per-seat cost.
- **Cons:** Not React-first; integration and “React component as blocks” is more custom work than Craft.js.
- **Use case:** When you want a self-hosted, framework-agnostic builder and are willing to wire React components yourself.

### @dnd-kit

- **URL:** https://dndkit.com  
- **What it is:** Lightweight, modular React drag-and-drop toolkit (~10kb); hooks like `useDraggable`, `useDroppable`; pointer/mouse/touch/keyboard; lists, grids, nested contexts.
- **Pros:** Zero deps, small bundle, flexible, good for custom UIs.
- **Cons:** Only provides DnD primitives; you build the page builder (canvas, tree, serialization, undo) yourself.
- **Use case:** When you want full control and are okay building the “builder” layer on top of DnD.

### Craft.js (current)

- **URL:** https://craft.js.org  
- **GitHub:** https://github.com/prevwong/craft.js  
- **What it is:** React framework for page editors; `<Editor>`, `<Frame>`, `<Element>`, serialization, undo/redo, add/drop by node tree.
- **Pros:** React-native, component-based, serializable state, good fit for Oxygen-like UX (palette, structure tree, settings).
- **Cons:** Smaller community; need to follow current API (e.g. `parseReactElement().toNodeTree()` + `addNodeTree`; pass `data` to Frame for reliable “canvas ready”).
- **Use case:** Best fit for a **self-hosted, React-first, Oxygen-style builder** without building DnD and state from scratch.

---

## 4. Fast / Other Languages (for reference)

- **Rust/WebAssembly:** No dominant “page builder” crate; you’d typically build UI in Rust (e.g. Yew, Leptos) and use JS only for DnD/editing or keep the builder in React.
- **Elm / PureScript:** Same idea: no ready-made Oxygen-like builder; you’d implement one on top of their ecosystems.
- **Svelte:** No widely adopted page-builder library comparable to Craft.js or GrapesJS; you’d use DnD libraries and build the rest.

For “fast language” the main win is usually in **rendering or backend**, not in replacing the builder UI; keeping the builder in React (Craft.js or GrapesJS) and optimizing the runtime (e.g. React, SSR, or a fast backend) is the usual approach.

---

## 5. Recommendation Summary

| Goal                         | Suggested choice        |
|-----------------------------|-------------------------|
| Self-hosted, React, Oxygen-like | **Craft.js** (with Frame `data` fix) |
| Self-hosted, framework-agnostic | **GrapesJS** + React bindings       |
| Full managed builder + CMS  | **Builder.io** or **Plasmic**       |
| Full control, custom builder | **@dnd-kit** + custom canvas/tree   |

**For this project:** Stay on **Craft.js** and ensure the canvas is ready by:

1. **Always passing `data` to `<Frame />`** — use a pre-built default serialized state when there’s no saved content (e.g. `ROOT` + one canvas `Container`), so the editor state exists from the first render.
2. Using **`query.parseReactElement(...).toNodeTree()`** and **`actions.addNodeTree(tree, parentId)`** when adding elements.
3. Resolving the drop target from **current editor state** and checking that the parent node exists before calling `addNodeTree`.

This addresses “Canvas not ready” and keeps the implementation aligned with current Craft.js APIs while preserving an Oxygen Builder–style workflow.
