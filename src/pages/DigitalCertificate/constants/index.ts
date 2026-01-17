export const VARIABLE_OPTIONS = [
  { label: "Nama Peserta", value: "{{name}}" },
  { label: "Email", value: "{{email}}" },
  { label: "Nama Kegiatan", value: "{{activity_name}}" },
  { label: "Tanggal", value: "{{date}}" },
  { label: "ID Sertifikat", value: "{{certificate_id}}" },
  { label: "Nama Universitas", value: "{{university}}" },
  { label: "Jenis Kelamin", value: "{{gender}}" },
] as const;

export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 566; // A4 landscape aspect ratio

export const DEFAULT_FONT_FAMILIES = [
  { label: "Sans Serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia", value: "Georgia" },
] as const;

export const DEFAULT_ELEMENT_STYLES = {
  fontSize: 16,
  fontFamily: "sans-serif",
  color: "#000000",
  textAlign: "center" as const,
};

export const ELEMENT_MIN_WIDTH = 50;
export const ELEMENT_MIN_HEIGHT = 30;
