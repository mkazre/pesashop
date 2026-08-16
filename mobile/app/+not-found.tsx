import { Redirect, usePathname } from "expo-router";
import { resolveMenuLink } from "@/utils/resolveLink";

// Catches any URL that doesn't match a registered route — e.g. a menu/page-builder
// link pasted in the website's /shop/:slug scheme. Reuses the same resolver as
// AppDrawer/PageBuilder so a dead-end here can't diverge from link resolution
// elsewhere. Falls back to home rather than re-redirecting to the same unmatched
// path, which would otherwise loop.
export default function NotFoundScreen() {
  const pathname = usePathname() || "/";
  const resolved = resolveMenuLink({ link: pathname });
  const target = resolved && resolved !== pathname ? resolved : "/";
  return <Redirect href={target as any} />;
}
