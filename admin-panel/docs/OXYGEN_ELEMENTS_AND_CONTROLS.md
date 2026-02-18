# Part 2: Oxygen Builder – Base Elements & Control Types

## 1. Oxygen control types (from oxygen.element-control.class.php and component classes)

| Oxygen type           | Purpose                    | Our equivalent (Craft.js / Settings) |
|-----------------------|----------------------------|--------------------------------------|
| `content`             | Editable text content      | Text input / rich text               |
| `colorpicker`         | Color                      | Color picker                         |
| `slider-measurebox`   | Numeric + unit (px, %, em) | Slider + unit dropdown               |
| `dropdown`            | Select one option          | Select / dropdown                    |
| `tag`                 | HTML tag (div, h1–h6, etc.) | Select (tag)                         |
| `font-family`         | Font family                | Font selector                        |
| `flex-layout`         | Flex direction/align       | Button group or select               |
| `checkbox`            | Boolean                    | Checkbox                             |
| `positioning`         | Position (relative, etc.)  | Select or button group               |
| `columnwidth`         | Width                      | Slider + unit                        |
| `buttons-list`       | Radio (maps to `radio`)     | Button group                         |

Additional Oxygen types seen in code: `typography` (preset group), `measurebox`, `link`, `image` (media picker), `code-editor`, `textarea`, `dropdown-unit`.

## 2. Oxygen base elements (component-framework/components)

### Containers / structure
- **Section** (`ct_section`) – full-width section with inner wrap.
- **Div** (`ct_div_block`) – generic block; tag selectable (div, article, section, nav, etc.); layout (flex), width, background, tag.
- **Columns** (`new_columns`) – column layout.
- **Inner Content** (`ct_inner_content`) – placeholder for post/content.

### Text / media
- **Heading** (`ct_headline`) – content, font-family, color, font-size, font-weight, tag (h1–h6).
- **Text** (`ct_text_block`) – paragraph text.
- **Rich Text** – WYSIWYG.
- **Image** (`ct_image`) – image URL, alt, link.
- **Link** (`ct_link_text`, `ct_link_button`) – URL, text, style.
- **Button** (`ct_link_button`) – text, link, style.

### Advanced / special
- **Code Block**, **Shortcode**, **SVG Icon**, **Video**, **Slider**, **Tabs**, **Gallery**, **Menu**, **Dynamic List**, **Easy Posts**, etc.

## 3. Our elements ↔ Oxygen mapping

| Our element (admin) | Oxygen equivalent    | Notes                                      |
|--------------------|----------------------|--------------------------------------------|
| Container          | Div (ct_div_block)   | Same idea; we use “Container” label.       |
| Text               | Text block / content | Same.                                      |
| Heading            | Headline (ct_headline)| Same; we have level, content.              |
| Image              | Image (ct_image)      | Same; URL, alt.                            |
| Button             | Link Button          | Same; we have label, link.                 |
| ProductCard        | (WooCommerce addon)  | Part 3.                                    |
| ProductGrid        | (WooCommerce addon)  | Part 3.                                    |
| Repeater           | Dynamic list / repeater | Conceptual match.                       |
| AddToCartButton    | (WooCommerce addon)  | Part 3.                                    |
| PriceDisplay      | (WooCommerce addon)  | Part 3.                                    |
| CategoryList      | (custom / addon)     | Part 3.                                    |

We do **not** yet have: Section (full-width), Columns, Inner Content, Rich Text, Code Block, Slider, Tabs, Gallery, Menu. These can be added in Part 3/4 or later.

## 4. Settings panel structure (Oxygen-style)

- **Tabs** at top (e.g. Layout, Typography, Advanced).
- Each tab has **sections** (heading + icon), e.g. “Layout Child Elements”, “Width”, “Background color”.
- Each section has **controls** (one per row): label + control (slider, color, dropdown, etc.).

Our current Page Builder uses a minimal settings panel. Part 4 will align layout and labels with Oxygen (tabs → sections → controls, same labels where applicable).

## 5. Part 2 summary

- Documented Oxygen control types and base elements.
- Mapped our existing Craft.js elements to Oxygen equivalents.
- No app code changed in Part 2; Part 3 (addons) and Part 4 (UI polish) will add elements and Settings UI.
