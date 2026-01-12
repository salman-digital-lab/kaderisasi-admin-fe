import type { FormField } from "../../../../types/model/customForm";
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

// Basic user profile fields for "Pertanyaan Dasar"
export const BASIC_PROFILE_FIELDS: FormField[] = [
  {
    key: "name",
    label: "Nama Lengkap",
    required: true,
    type: "text",
    placeholder: "Masukkan nama lengkap Anda",
  },
  {
    key: "personal_id",
    label: "Nomor Identitas",
    required: false,
    type: "text",
    placeholder: "Masukkan nomor KTP/Paspor/KTM",
    helpText:
      "Nomor identitas resmi seperti KTP, Paspor, atau Kartu Tanda Mahasiswa.",
  },
  {
    key: "gender",
    label: "Jenis Kelamin",
    required: false,
    type: "select",
    placeholder: "Pilih jenis kelamin",
  },
  {
    key: "birth_date",
    label: "Tanggal Lahir",
    required: false,
    type: "date",
    placeholder: "Pilih tanggal lahir",
  },
  {
    key: "level",
    label: "Level",
    required: false,
    type: "select",
    placeholder: "Pilih level",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    required: false,
    type: "text",
    placeholder: "6281234567890",
    helpText: "Format: 628xxxxxxxxxx. Pastikan nomor WhatsApp kamu aktif.",
  },
  {
    key: "line",
    label: "Line",
    required: false,
    type: "text",
    placeholder: "Masukkan ID Line Anda",
    helpText: "ID Line Anda (tanpa @).",
  },
  {
    key: "instagram",
    label: "Instagram",
    required: false,
    type: "text",
    placeholder: "@username",
    helpText: "Username Instagram Anda (dengan atau tanpa @).",
  },
  {
    key: "tiktok",
    label: "TikTok",
    required: false,
    type: "text",
    placeholder: "@username",
    helpText: "Username TikTok Anda (dengan atau tanpa @).",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    required: false,
    type: "text",
    placeholder: "linkedin.com/in/username atau username",
    helpText: "URL profil LinkedIn atau username Anda.",
  },
  {
    key: "province_id",
    label: "Provinsi",
    required: false,
    type: "select",
    placeholder: "Pilih provinsi",
  },
  {
    key: "city_id",
    label: "Kota",
    required: false,
    type: "select",
    placeholder: "Pilih kota",
    helpText: "Pilih provinsi terlebih dahulu.",
  },
  {
    key: "university_id",
    label: "Universitas",
    required: false,
    type: "select",
    placeholder: "Pilih universitas",
  },
  {
    key: "major",
    label: "Jurusan",
    required: false,
    type: "text",
    placeholder: "Masukkan program studi/jurusan Anda",
    helpText: "Contoh: Teknik Informatika, Manajemen, Pendidikan Dokter.",
  },
  {
    key: "intake_year",
    label: "Angkatan",
    required: false,
    type: "number",
    placeholder: "2024",
    helpText: "Tahun masuk universitas.",
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
    label: "Domisili",
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
