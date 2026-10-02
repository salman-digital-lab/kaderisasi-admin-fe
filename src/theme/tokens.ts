import { theme } from "antd";
import type { ThemeConfig } from "antd";

/**
 * Single source of truth for admin colors. `styles/global.css` mirrors these
 * values as `--app-*` custom properties for CSS files and inline styles; keep
 * both in sync.
 */
export const APP_COLORS = {
  /** BMKA blue darkened to meet WCAG AA (4.66:1) for text and button labels. */
  primary: "#087da7",
  /** Darker primary for text on tinted backgrounds and focus rings. */
  primaryStrong: "#075d80",
  /** Light primary tint for selected and highlighted surfaces. */
  primaryBg: "#f0f8fc",
  /** Original logo color; use only for decorative brand accents. */
  brand: "#1f99cb",
  success: "#389e0d",
  warning: "#d48806",
  error: "#cf1322",
  text: "rgba(0, 0, 0, 0.88)",
  textSecondary: "rgba(0, 0, 0, 0.65)",
  border: "#d9d9d9",
  borderSecondary: "#f0f0f0",
  fillHeader: "#fafafa",
  bgContainer: "#ffffff",
} as const;

export const FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif";

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: APP_COLORS.primary,
    colorInfo: APP_COLORS.primary,
    colorLink: APP_COLORS.primary,
    colorSuccess: APP_COLORS.success,
    colorWarning: APP_COLORS.warning,
    colorError: APP_COLORS.error,
    colorTextSecondary: APP_COLORS.textSecondary,
    // Tertiary text is used for helper copy; keep it readable (>= 4.5:1).
    colorTextTertiary: APP_COLORS.textSecondary,
    colorTextDescription: APP_COLORS.textSecondary,
    // Default placeholder grey is ~1.6:1; this keeps hints legible (4.7:1).
    colorTextPlaceholder: "#737373",
    borderRadius: 0,
    borderRadiusLG: 0,
    borderRadiusSM: 0,
    borderRadiusXS: 0,
    fontFamily: FONT_FAMILY,
    // Compact heading scale for a dense admin UI: h1 is the page title.
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
  },
  components: {
    Button: {
      fontWeight: 500,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
    },
    Table: {
      headerBg: APP_COLORS.fillHeader,
      headerColor: APP_COLORS.text,
      rowHoverBg: APP_COLORS.primaryBg,
    },
    Card: {
      headerBg: APP_COLORS.fillHeader,
    },
    Layout: {
      headerBg: APP_COLORS.bgContainer,
      bodyBg: APP_COLORS.bgContainer,
      siderBg: APP_COLORS.bgContainer,
      headerHeight: 48,
      headerPadding: "0 16px",
    },
  },
};

/** Standard dialog widths. Pick the smallest one that fits the content. */
export const DIALOG_WIDTH = {
  small: 520,
  medium: 720,
  large: 960,
} as const;

/** Shown wherever a value is missing. */
export const EMPTY_VALUE = "-";
