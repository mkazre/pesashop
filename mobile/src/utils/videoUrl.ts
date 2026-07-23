export interface ProductVideo {
  type: "upload" | "embed";
  url: string;
  title?: string;
}

export type VideoKind = "file" | "youtube" | "vimeo" | "iframe";

export interface VideoRenderInfo {
  kind: VideoKind;
  src: string;
  videoId?: string;
  thumbnail: string | null;
}

// Resolves a stored product video ({ type: 'upload'|'embed', url }) into
// render info the product carousel can act on directly.
export function getVideoRenderInfo(video: ProductVideo): VideoRenderInfo {
  if (!video || !video.url) return { kind: "file", src: "", thumbnail: null };

  if (video.type === "upload") {
    return { kind: "file", src: video.url, thumbnail: null };
  }

  const url = video.url;

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return { kind: "youtube", src: url, videoId: id, thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { kind: "vimeo", src: url, videoId: vimeoMatch[1], thumbnail: null };
  }

  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url)) {
    return { kind: "file", src: url, thumbnail: null };
  }

  return { kind: "iframe", src: url, thumbnail: null };
}

// Loading `youtube.com/embed/ID` directly as a WebView's top-level `source.uri`
// makes YouTube's "unsupported browser" / origin checks reject the generic
// WebView UA, surfacing as player error 153. Driving the official IFrame
// Player API from a same-origin local HTML page (loaded via `source.html` +
// `baseUrl`) is the standard fix — it also gives us `playerVars` to strip all
// chrome (title, related videos, YouTube logo link) instead of just hiding
// the iframe's own controls bar.
export function buildYoutubeEmbedHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
      html, body { margin: 0; padding: 0; background: #000; overflow: hidden; width: 100%; height: 100%; }
      #player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      iframe { width: 100% !important; height: 100% !important; }
    </style>
  </head>
  <body>
    <div id="player"></div>
    <script src="https://www.youtube.com/iframe_api"></script>
    <script>
      var player;
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          videoId: '${videoId}',
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            fs: 0,
            disablekb: 1,
            playsinline: 1,
            loop: 1,
            playlist: '${videoId}'
          },
          events: {
            onReady: function (e) {
              e.target.mute();
              e.target.playVideo();
            },
            onStateChange: function (e) {
              if (e.data === YT.PlayerState.ENDED) {
                player.playVideo();
              }
            }
          }
        });
      }
    </script>
  </body>
</html>`;
}

export function buildVimeoBackgroundUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&muted=1&loop=1&byline=0&title=0&portrait=0`;
}
