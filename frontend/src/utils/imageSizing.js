// Computes an <img> style object honoring optional explicit width/height
// (any valid CSS length: px, %, em, rem, vw...).
//
// - Both blank: natural (intrinsic) size, capped to the container width so
//   it never overflows the layout.
// - Only one set: the other dimension auto-scales to preserve the image's
//   own aspect ratio (standard <img> replaced-element behavior).
// - Both set: the box is explicit, so the image is object-fit: cover to
//   fill it without distortion (cropping only happens when the admin has
//   deliberately pinned both dimensions).
export function getImageSizeStyle(width, height) {
  const style = { display: 'block' };

  if (width) {
    style.width = width;
  } else {
    style.width = 'auto';
    style.maxWidth = '100%';
  }

  if (height) {
    style.height = height;
    style.objectFit = 'cover';
  } else {
    style.height = 'auto';
  }

  return style;
}
