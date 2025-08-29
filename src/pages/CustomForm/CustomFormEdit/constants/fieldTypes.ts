import {
  FontSizeOutlined,
  AlignLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  NumberOutlined,
  DownOutlined,
  CheckSquareOutlined,
  UploadOutlined,
  FileTextOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

// Enhanced form field types for custom form section
export const FIELD_TYPES = [
  // Text Input Fields
  {
    value: "text_input",
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
    value: "email",
    label: "Email",
    icon: MailOutlined,
    category: "text",
    description: "Input alamat email",
  },
  {
    value: "phone",
    label: "Telepon",
    icon: PhoneOutlined,
    category: "text",
    description: "Input nomor telepon",
  },
  {
    value: "url",
    label: "URL",
    icon: GlobalOutlined,
    category: "text",
    description: "Input URL website",
  },

  // Number Fields
  {
    value: "number_input",
    label: "Angka",
    icon: NumberOutlined,
    category: "number",
    description: "Input numerik",
  },
  {
    value: "currency",
    label: "Mata Uang",
    icon: NumberOutlined,
    category: "number",
    description: "Input mata uang",
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

  // File & Media Fields
  {
    value: "file",
    label: "Upload File",
    icon: UploadOutlined,
    category: "file",
    description: "Upload file",
  },
  {
    value: "image",
    label: "Upload Gambar",
    icon: FileTextOutlined,
    category: "file",
    description: "Upload gambar",
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
  {
    key: "file",
    label: "Upload File",
    icon: UploadOutlined,
    color: "#eb2f96",
  },
] as const;
