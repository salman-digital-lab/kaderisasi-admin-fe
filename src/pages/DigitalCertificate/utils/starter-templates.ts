import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";
export const CANVAS_PRESETS = [
  { label: "A4 Landscape", value: "a4-landscape", width: 800, height: 566 },
  { label: "A4 Portrait", value: "a4-portrait", width: 566, height: 800 },
  {
    label: "Letter Landscape",
    value: "letter-landscape",
    width: 792,
    height: 612,
  },
  {
    label: "Letter Portrait",
    value: "letter-portrait",
    width: 612,
    height: 792,
  },
];

export const STARTER_LAYOUTS = [
  { label: "Kosong", value: "blank" },
  { label: "Sertifikat Basic", value: "basic" },
  { label: "Penghargaan", value: "award" },
  { label: "Partisipasi", value: "participation" },
];

const createTextElement = (
  id: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  options?: Partial<CertificateTemplateData["elements"][number]>,
): CertificateTemplateData["elements"][number] => ({
  id,
  type: "static-text",
  name: content,
  content,
  x,
  y,
  width,
  height,
  fontSize,
  fontFamily: "serif",
  color: "#1f2937",
  textAlign: "center",
  verticalAlign: "middle",
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  lineHeight: 1.2,
  letterSpacing: 0,
  opacity: 100,
  rotation: 0,
  borderRadius: 0,
  objectFit: "contain",
  visible: true,
  locked: false,
  ...options,
});

const createVariableElement = (
  id: string,
  variable: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  options?: Partial<CertificateTemplateData["elements"][number]>,
): CertificateTemplateData["elements"][number] => ({
  ...createTextElement(id, variable, x, y, width, height, fontSize, options),
  type: "variable-text",
  name,
  variable,
  content: undefined,
});

export const buildStarterTemplate = (
  presetValue: string,
  layout: string,
): CertificateTemplateData => {
  const preset =
    CANVAS_PRESETS.find((item) => item.value === presetValue) ||
    CANVAS_PRESETS[0];
  const width = preset.width;
  const height = preset.height;
  const centerX = Math.round(width * 0.15);
  const contentWidth = Math.round(width * 0.7);

  if (layout === "blank") {
    return {
      backgroundUrl: null,
      elements: [],
      canvasWidth: width,
      canvasHeight: height,
    };
  }

  const elements: CertificateTemplateData["elements"] = [
    createTextElement(
      "starter-title",
      layout === "award" ? "PENGHARGAAN" : "SERTIFIKAT",
      centerX,
      Math.round(height * 0.16),
      contentWidth,
      48,
      36,
      { fontWeight: "bold", letterSpacing: 2 },
    ),
    createTextElement(
      "starter-subtitle",
      layout === "participation"
        ? "Diberikan sebagai apresiasi atas partisipasi"
        : "Diberikan kepada",
      centerX,
      Math.round(height * 0.31),
      contentWidth,
      34,
      18,
    ),
    createVariableElement(
      "starter-name",
      "{{name}}",
      "Nama Peserta",
      centerX,
      Math.round(height * 0.39),
      contentWidth,
      62,
      32,
      { fontWeight: "bold", color: "#0f766e" },
    ),
    createTextElement(
      "starter-body",
      layout === "award"
        ? "Atas pencapaian dan kontribusi terbaik dalam kegiatan"
        : "Telah mengikuti kegiatan",
      centerX,
      Math.round(height * 0.53),
      contentWidth,
      40,
      16,
    ),
    createVariableElement(
      "starter-activity",
      "{{activity_name}}",
      "Nama Kegiatan",
      centerX,
      Math.round(height * 0.61),
      contentWidth,
      42,
      20,
      { fontWeight: "bold" },
    ),
    createVariableElement(
      "starter-date",
      "{{activity_date}}",
      "Tanggal Kegiatan",
      Math.round(width * 0.12),
      Math.round(height * 0.78),
      Math.round(width * 0.28),
      32,
      14,
    ),
    createVariableElement(
      "starter-code",
      "{{certificate_code}}",
      "Kode Sertifikat",
      Math.round(width * 0.6),
      Math.round(height * 0.78),
      Math.round(width * 0.3),
      32,
      12,
    ),
  ];

  return {
    backgroundUrl: null,
    elements,
    canvasWidth: width,
    canvasHeight: height,
  };
};
