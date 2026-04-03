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
    required: true,
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
    label: "Provinsi Domisili",
    required: false,
    type: "select",
    placeholder: "Pilih provinsi domisili",
  },
  {
    key: "city_id",
    label: "Kota Domisili",
    required: false,
    type: "select",
    placeholder: "Pilih kota domisili",
    helpText: "Pilih provinsi domisili terlebih dahulu.",
  },
  {
    key: "origin_province_id",
    label: "Provinsi Asal",
    required: false,
    type: "select",
    placeholder: "Pilih provinsi asal",
  },
  {
    key: "origin_city_id",
    label: "Kota Asal",
    required: false,
    type: "select",
    placeholder: "Pilih kota asal",
    helpText: "Pilih provinsi asal terlebih dahulu.",
  },
  {
    key: "education_history",
    label: "Riwayat Pendidikan",
    required: false,
    type: "education_history",
    placeholder: "",
    helpText: "Daftar riwayat pendidikan (jenjang, institusi, jurusan, tahun masuk).",
  },
  {
    key: "current_education",
    label: "Pendidikan Sekarang",
    required: false,
    type: "current_education",
    placeholder: "",
    helpText: "Pilih dari riwayat pendidikan atau tambahkan entri baru.",
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
