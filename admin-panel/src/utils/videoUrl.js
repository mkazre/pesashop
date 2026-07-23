// Resolves a stored product video ({ type: 'upload'|'embed', url }) into
// render info: 'file' (native <video>) or 'iframe' (external embed), plus
// a thumbnail image when one can be derived without an API call.
export function getVideoRenderInfo(video) {
  if (!video || !video.url) return { kind: 'file', src: '', thumbnail: null };

  if (video.type === 'upload') {
    return { kind: 'file', src: video.url, thumbnail: null };
  }

  const url = video.url;

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      thumbnail: null,
    };
  }

  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url)) {
    return { kind: 'file', src: url, thumbnail: null };
  }

  return { kind: 'iframe', src: url, thumbnail: null };
}
