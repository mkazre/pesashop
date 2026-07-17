// Minimal allow-listed HTML-to-RN-Text parser. Rendering is 100% native (no
// WebView), so "rich text" content authored in admin has to be interpreted
// here rather than dropped into a WebView. Deliberately limited to inline
// formatting (bold/italic/underline) plus paragraph/line breaks — not a
// general HTML engine. Anything outside this allow-list is stripped down to
// its plain text content, which is always safe (never crashes, worst case
// loses formatting).

export interface HtmlRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseInline(segment: string): HtmlRun[] {
  const runs: HtmlRun[] = [];
  // Single-level (non-nested) bold/italic/underline — covers the vast
  // majority of real content without a full recursive tag-tree parser.
  const re = /<(b|strong|i|em|u)>(.*?)<\/\1>|([^<]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(segment))) {
    if (match[3] !== undefined) {
      const text = decodeEntities(match[3]);
      if (text) runs.push({ text });
    } else {
      const tag = match[1].toLowerCase();
      const text = decodeEntities(match[2].replace(/<[^>]+>/g, ""));
      if (!text) continue;
      runs.push({
        text,
        bold: tag === "b" || tag === "strong",
        italic: tag === "i" || tag === "em",
        underline: tag === "u",
      });
    }
  }
  return runs;
}

// Returns one array of runs per paragraph/line — callers render each
// paragraph as its own <Text> (or joined with line breaks).
export function parseSimpleHtml(html: string): HtmlRun[][] {
  if (!html) return [];
  const normalized = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<\/?p>/gi, "");
  return normalized.split(/\n/).map(parseInline).filter((runs) => runs.length > 0);
}
