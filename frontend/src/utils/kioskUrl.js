// Shared image-URL resolver for kiosk components.
// Handles strings, Media-library objects ({ url, src }), null/undefined.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function resolveUrl(value) {
  if (!value) return '';
  let url = value;
  if (typeof url === 'object') {
    url = url.url || url.src || url.path || '';
  }
  if (typeof url !== 'string' || !url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default resolveUrl;
