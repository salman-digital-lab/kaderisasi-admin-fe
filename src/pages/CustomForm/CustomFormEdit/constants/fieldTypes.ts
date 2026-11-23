import {
  FontSizeOutlined,
  AlignLeftOutlined,
  NumberOutlined,
  DownOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
  UploadOutlined,
} from "@ant-design/icons";

export const FIELD_TYPES = [
  {
    value: "file",
    label: "Unggah berkas",
    icon: UploadOutlined,
    category: "file",
    description: "PDF, gambar, atau keduanya",
  },
  {
    value: "text",
    label: "Input Teks",
    icon: FontSizeOutlined,
    category: "text",
    description: "Input teks satu baris",
  },
  {
    value: "textarea",
    label: "Textarea",
    icon: AlignLeftOutlined,
    category: "text",
    description: "Input teks multi-baris",
  },

  {
    value: "number",
    label: "Angka",
    icon: NumberOutlined,
    category: "number",
    description: "Input numerik",
  },

  {
    value: "select",
    label: "Pilih",
    icon: DownOutlined,
    category: "selection",
    description: "Pemilihan dropdown",
  },
  {
    value: "radio",
    label: "Radio",
    icon: CheckSquareOutlined,
    category: "selection",
    description: "Pemilihan satu pilihan",
  },
  {
    value: "checkbox",
    label: "Checkbox",
    icon: CheckSquareOutlined,
    category: "selection",
    description: "Pemilihan multi-pilihan",
  },
] as const;

export const FIELD_CATEGORIES = [
  {
    key: "all",
    label: "Semua Field",
    icon: DatabaseOutlined,
    color: "var(--app-color-text-secondary)",
  },
  {
    key: "text",
    label: "Field Teks",
    icon: FontSizeOutlined,
    color: "var(--app-color-primary)",
  },
  {
    key: "number",
    label: "Field Angka",
    icon: NumberOutlined,
    color: "var(--app-color-success)",
  },
  {
    key: "selection",
    label: "Field Pilihan",
    icon: DownOutlined,
    color: "#fa8c16",
  },
] as const;
