# Part 3: Oxygen WooCommerce & Oxy Ultimate – Addon Elements

## 1. Oxygen WooCommerce elements (oxygen-woocommerce plugin)

### Archive / shop
- **Archive Products** – product grid for shop/archive (columns, pagination, order).
- **Archive Title** – archive page title.
- **Archive Description** – archive description text.
- **Archive Categories** – category list/filter for shop.

### Cart & checkout
- **Cart Total** – cart total amount (mini-cart or cart page).
- **Mini Cart** – dropdown/sidebar cart.
- **Page Shopping Cart** – full cart page content.
- **Page Checkout** – checkout page content.
- **Page Order Tracking** – order tracking form.
- **Page Account** – account dashboard.

### Product single
- **Product Builder** – wrapper for product template.
- **Product Title** – product name.
- **Product Price** – price (regular/sale).
- **Product Images** – gallery.
- **Product Description** – long description.
- **Product Excerpt** – short description.
- **Product Meta** – SKU, categories, tags.
- **Product Cart Button** – add to cart button.
- **Product Stock** – in stock / out of stock.
- **Product Rating** – star rating.
- **Product Tabs** – description/reviews/tabs.
- **Product Related** – related products.
- **Product Upsells** – upsells.
- **Product Crosssells** – cross-sells.

### Other
- **General Breadcrumb** – breadcrumb trail.

### Our equivalents (already in our builder)
- **ProductCard** ↔ Product card (title, image, price, button) – we have this.
- **ProductGrid** ↔ Archive Products / product list – we have this.
- **PriceDisplay** ↔ Product Price – we have this.
- **AddToCartButton** ↔ Product Cart Button – we have this.
- **CategoryList** ↔ Archive Categories / category list – we have this.

We do **not** yet have: Mini Cart, full Cart/Checkout page elements, Product single layout (gallery, tabs, related). Those can be added as needed; our storefront already has Cart/Checkout pages – the builder would only need “placeholder” or “dynamic” blocks that render cart/checkout content on the frontend.

---

## 2. Oxy Ultimate elements

### Sliders & media
- **Content Slider** – slider with slides (text/image).
- **Gallery** – image gallery.
- **Gallery Slider** – gallery with slider.
- **Ultimate Image** – image with caption, overlay.
- **Ultimate Video** – video with custom play button.
- **Before/After Image** – before–after comparison.
- **Image Mask** – image with SVG mask shape.
- **Image Panels** – reveal panels on hover.
- **Lightbox** – open image/video in lightbox.

### Text & headings
- **Animated Heading** – heading with animation.
- **Fancy Heading** – styled heading.
- **Highlighted Heading** – highlighted part of heading.
- **Dual Color Text** – two-color text.

### Buttons & UI
- **Dual Button** – two buttons (e.g. primary + secondary).
- **Hover Animated Button** – button with hover animation.
- **Countdown** – countdown timer.
- **Rating** – star rating display.
- **Tooltip** – tooltip on hover.
- **Show More/Less** – expand/collapse text.

### Layout & structure
- **CSS Grid** – CSS grid layout (grid-area, grid-item).
- **Classic Accordion** – accordion.
- **Dynamic Accordion** – accordion from data.
- **Off Canvas** – off-canvas panel (sidebar).
- **Sliding Menu** – slide-in menu.
- **Icon List** – list with icons.
- **Hotspot** – image with clickable hotspots.

### Forms (WP-specific; we can skip or generalize)
- **CF7 Styler**, **FF Styler**, **GF Styler**, **WPForms Styler** – style Contact Form 7, Fluent Forms, Gravity Forms, WPForms.
- **Comment Form** – WordPress comment form.
- **ACF Image Card**, **ACRD Menu** – ACF/custom fields.

### Our equivalents
- **Repeater** ↔ generic repeater (could back a simple slider or list).
- We do **not** have: Content Slider, Accordion, Countdown, Gallery (with lightbox), Off Canvas, Tooltip, etc. These can be added in a later phase; Part 4 will focus on UI polish, not adding all addon elements.

---

## 3. Part 3 summary

- **Oxygen WooCommerce:** Documented archive, cart, checkout, and product single elements. Our builder already has ProductCard, ProductGrid, PriceDisplay, AddToCartButton, CategoryList – good parity for product listing and product blocks.
- **Oxy Ultimate:** Documented sliders, galleries, headings, buttons, accordion, countdown, tooltip, etc. We have Repeater; optional future elements: Content Slider, Accordion, Countdown, Gallery.
- **No app code changed in Part 3** to avoid regressions. Part 4 will align UI (layout, labels, styling) with Oxygen.
