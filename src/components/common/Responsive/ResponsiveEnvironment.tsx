import { useEffect } from "react";

/** Shared visible viewport geometry for dialogs when the mobile keyboard opens. */
export function ResponsiveEnvironment(): null {
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = (): void => {
      document.documentElement.style.setProperty(
        "--admin-viewport-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      document.documentElement.style.setProperty(
        "--admin-viewport-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--admin-viewport-height");
      document.documentElement.style.removeProperty("--admin-viewport-top");
    };
  }, []);
  return null;
}
