// Resolve a menu/link entry ({ linkType, link, linkId, fileUrl }) into a
// route this app actually has. The website's own links use its URL scheme
// (e.g. /shop/:slug for categories), which doesn't match any mobile route
// directly — map the known web patterns onto their mobile equivalents
// instead of navigating to the raw path verbatim (which previously
// produced "Unmatched Route"). Shared by AppDrawer and the Page Builder's
// button block so link-resolution logic doesn't drift across the two.
// The app's own deep-link scheme (app.json "scheme": "pesashop"). Admins
// naturally paste/type the full deep link (pesashop://path or, with an
// empty host, pesashop:///path) rather than a bare relative path — strip it
// down to a path so the rest of this resolver (which only recognizes
// leading "/") still works.
function stripAppScheme(link: string): string {
  return link.replace(/^pesashop:\/+/i, "/");
}

export function resolveMenuLink(entry: any): string | null {
  const link = stripAppScheme(entry.link || entry.url || "#");
  if (entry.linkType === "page") {
    const slug = link.replace(/^\//, "") || entry.linkId;
    return `/page/${slug}`;
  }
  if (entry.linkType === "category" && entry.linkId) {
    return `/(tabs)/shop?category=${entry.linkId}`;
  }
  if (!link || link === "#" || link === "none") return null;
  if (link.startsWith("/category/")) {
    return `/(tabs)/shop?category=${link.replace("/category/", "")}`;
  }
  if (link.startsWith("/shop/")) {
    // Website category pages live at /shop/:slug; mobile's equivalent is
    // the dedicated category/[slug] screen, not the generic Shop tab.
    return `/category/${link.replace("/shop/", "")}`;
  }
  if (link.startsWith("/product/")) {
    return `/product/${link.replace("/product/", "")}`;
  }
  if (link.startsWith("/")) {
    return link;
  }
  return null;
}
