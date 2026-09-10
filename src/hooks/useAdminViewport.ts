import { useMediaQuery } from "./useMediaQuery";

// Keep the matching media queries in styles/responsive.css in sync.
export const COMPACT_QUERY =
  "(width < 768px), (pointer: coarse) and (height <= 500px)";
export const DRAWER_NAVIGATION_QUERY = "(width < 992px)";
export const WIDE_EDITOR_QUERY = "(width >= 1280px)";

export function useAdminViewport(): {
  compact: boolean;
  drawerNavigation: boolean;
  wideEditor: boolean;
  landscape: boolean;
} {
  const compact = useMediaQuery(COMPACT_QUERY);
  const drawerNavigation = useMediaQuery(DRAWER_NAVIGATION_QUERY);
  const wideEditor = useMediaQuery(WIDE_EDITOR_QUERY);
  const landscape = useMediaQuery("(orientation: landscape)");
  return { compact, drawerNavigation, wideEditor, landscape };
}
