import type { FormField } from "../../../../types/model/customForm";
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

// Basic user profile fields for "Pertanyaan Dasar"
export const BASIC_PROFILE_FIELDS: FormField[] = [
  { key: "name", label: "Nama Lengkap", required: true, type: "text_input" },
  {
    key: "personal_id",
    label: "Nomor Identitas",
    required: false,
    type: "text_input",
  },
  { key: "gender", label: "Jenis Kelamin", required: false, type: "select" },
  { key: "level", label: "Level", required: false, type: "select" },
  { key: "whatsapp", label: "WhatsApp", required: false, type: "text_input" },
  { key: "line", label: "Line", required: false, type: "text_input" },
  { key: "instagram", label: "Instagram", required: false, type: "text_input" },
  { key: "tiktok", label: "TikTok", required: false, type: "text_input" },
  { key: "linkedin", label: "LinkedIn", required: false, type: "text_input" },
  { key: "province_id", label: "Provinsi", required: false, type: "select" },
  { key: "city_id", label: "Kota", required: false, type: "select" },
  {
    key: "university_id",
    label: "Universitas",
    required: false,
    type: "select",
  },
  { key: "major", label: "Jurusan", required: false, type: "text_input" },
  {
    key: "intake_year",
    label: "Angkatan",
    required: false,
    type: "number_input",
  },
];

// Profile data categories
export const PROFILE_DATA_CATEGORIES = [
  {
    key: "personal",
    label: "Pribadi",
    icon: UserOutlined,
    color: "#1890ff",
  },
  {
    key: "contact",
    label: "Kontak",
    icon: PhoneOutlined,
    color: "#52c41a",
  },
  {
    key: "location",
    label: "Lokasi",
    icon: EnvironmentOutlined,
    color: "#fa8c16",
  },
  {
    key: "education",
    label: "Pendidikan",
    icon: DatabaseOutlined,
    color: "#722ed1",
  },
] as const;
