import {
  FontSizeOutlined,
  AlignLeftOutlined,
  NumberOutlined,
  DownOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

// Enhanced form field types for custom form section
export const FIELD_TYPES = [
  // Text Input Fields
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

  // Number Fields
  {
    value: "number",
    label: "Angka",
    icon: NumberOutlined,
    category: "number",
    description: "Input numerik",
  },

  // Selection Fields
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

// Field categories for better organization
export const FIELD_CATEGORIES = [
  {
    key: "all",
    label: "Semua Field",
    icon: DatabaseOutlined,
    color: "#666",
  },
  {
    key: "text",
    label: "Field Teks",
    icon: FontSizeOutlined,
    color: "#1890ff",
  },
  {
    key: "number",
    label: "Field Angka",
    icon: NumberOutlined,
    color: "#52c41a",
  },
  {
    key: "selection",
    label: "Field Pilihan",
    icon: DownOutlined,
    color: "#fa8c16",
  },
] as const;
