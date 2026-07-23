// Resolves a stored product video ({ type: 'upload'|'embed', url }) into
// render info: 'file' (native <video>) or 'iframe' (external embed), plus
// a thumbnail image when one can be derived without an API call.
//
// YouTube/Vimeo embeds get their chrome stripped (title, related videos,
// platform logo/link, controls bar) and are set to silently autoplay/loop,
// matching the mobile app's product video treatment — `platform` tells the
// gallery which small corner badge to render in place of that chrome.
export function getVideoRenderInfo(video) {
  if (!video || !video.url) return { kind: 'file', src: '', thumbnail: null, platform: null };

  if (video.type === 'upload') {
    return { kind: 'file', src: video.url, thumbnail: null, platform: null };
  }

  const url = video.url;

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      kind: 'iframe',
      platform: 'youtube',
      videoId: id,
      // Served from our own domain (public/youtube-embed.html) rather than
      // via iframe `srcDoc` — a `srcDoc` document gets an opaque "null"
      // origin, which breaks the postMessage handshake the IFrame Player API
      // uses to honor `controls: 0`, so it silently falls back to full
      // YouTube chrome. A same-origin static page has a real origin and the
      // handshake works as documented.
      src: `/youtube-embed.html?id=${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      kind: 'iframe',
      platform: 'vimeo',
      videoId: id,
      src: `https://player.vimeo.com/video/${id}?background=1&autoplay=1&muted=1&loop=1&byline=0&title=0&portrait=0`,
      thumbnail: null,
    };
  }

  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url)) {
    return { kind: 'file', src: url, thumbnail: null, platform: null };
  }

  return { kind: 'iframe', platform: null, src: url, thumbnail: null };
}
