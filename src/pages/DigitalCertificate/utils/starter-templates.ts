import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";
export const CANVAS_PRESETS = [
  {
    label: "A4 Portrait Salman",
    value: "a4-portrait-salman",
    width: 794,
    height: 1123,
  },
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
  { label: "Standar Salman", value: "salman" },
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

  if (layout === "salman") {
    const text = (
      id: string,
      content: string,
      y: number,
      height: number,
      size: number,
      options: Partial<CertificateTemplateData["elements"][number]> = {},
    ) =>
      createTextElement(id, content, 62, y, 670, height, size, {
        fontFamily: "Arial",
        ...options,
      });
    const variable = (
      id: string,
      value: string,
      name: string,
      y: number,
      height: number,
      size: number,
      options: Partial<CertificateTemplateData["elements"][number]> = {},
    ) =>
      createVariableElement(id, value, name, 62, y, 670, height, size, {
        fontFamily: "Arial",
        ...options,
      });
    return {
      backgroundUrl: null,
      scoreSheetLayout: "salman-v1",
      canvasWidth: 794,
      canvasHeight: 1123,
      elements: [
        {
          id: "salman-logo",
          type: "image",
          name: "Logo Salman ITB",
          x: 319,
          y: 95,
          width: 156,
          height: 66,
          objectFit: "contain",
          visible: true,
        },
        text("salman-title", "SERTIFIKAT", 202, 56, 38, {
          fontFamily: "Georgia",
          textDecoration: "underline",
        }),
        variable(
          "salman-code",
          "{{certificate_code}}",
          "Nomor sertifikat",
          258,
          46,
          15,
        ),
        {
          id: "salman-basmalah",
          type: "image",
          name: "Basmalah",
          x: 314,
          y: 304,
          width: 166,
          height: 34,
          objectFit: "contain",
          visible: true,
        },
        variable(
          "salman-institution",
          "{{institution}}",
          "Institusi",
          352,
          30,
          18,
        ),
        text(
          "salman-award",
          "Dengan penuh kebanggaan memberikan penghargaan kepada:",
          388,
          56,
          18,
        ),
        variable("salman-name", "{{name}}", "Nama peserta", 444, 60, 34, {
          fontFamily: "Georgia",
          fontStyle: "italic",
          fontWeight: "bold",
        }),
        text("salman-as", "Sebagai:", 512, 30, 18),
        variable("salman-role", "{{role}}", "Peran peserta", 547, 34, 20, {
          fontWeight: "bold",
        }),
        variable(
          "salman-activity",
          "{{activity_name}}",
          "Nama kegiatan",
          594,
          45,
          20,
        ),
        variable(
          "salman-event",
          "{{event_details}}",
          "Pelaksanaan kegiatan",
          642,
          112,
          16,
        ),
        text("salman-organized", "Diselenggarakan oleh:", 765, 26, 16),
        variable(
          "salman-organizer",
          "{{organizer}}",
          "Penyelenggara",
          790,
          45,
          17,
        ),
        variable(
          "salman-document-date",
          "{{document_place_date}}",
          "Tempat dan tanggal sertifikat",
          843,
          34,
          16,
        ),
        variable(
          "salman-approval",
          "{{approval}}",
          "Persetujuan elektronik",
          892,
          147,
          16,
        ),
        {
          id: "salman-verification",
          type: "qr-code",
          name: "QR verifikasi",
          x: 77,
          y: 928,
          width: 90,
          height: 90,
          visible: true,
          opacity: 100,
        },
      ],
    };
  }

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
      Math.round(height * 0.73),
      Math.round(width * 0.28),
      32,
      14,
    ),
    createVariableElement(
      "starter-code",
      "{{certificate_code}}",
      "Kode Sertifikat",
      Math.round(width * 0.43),
      Math.round(height * 0.92),
      Math.round(width * 0.54),
      32,
      12,
    ),
    createVariableElement(
      "starter-approval",
      "{{approval}}",
      "Persetujuan elektronik",
      Math.round(width * 0.43),
      Math.round(height * 0.72),
      Math.round(width * 0.54),
      Math.round(height * 0.2),
      13,
    ),
    {
      id: "starter-verification",
      type: "qr-code",
      name: "QR verifikasi",
      x: Math.round(width * 0.18),
      y: Math.round(height * 0.8),
      width: 88,
      height: 88,
      visible: true,
      opacity: 100,
    },
  ];

  return {
    backgroundUrl: null,
    elements,
    canvasWidth: width,
    canvasHeight: height,
  };
};
