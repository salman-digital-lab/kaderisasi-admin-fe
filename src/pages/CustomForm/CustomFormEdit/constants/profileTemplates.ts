import {
  UserOutlined,
  FileTextOutlined,
  PhoneOutlined,
  MessageOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

// Profile data templates organized by categories
export const PROFILE_DATA_TEMPLATES = [
  // Personal Information
  {
    name: "Nama Lengkap",
    field: {
      key: "name",
      label: "Nama Lengkap",
      required: true,
      type: "text_input",
      placeholder: "Masukkan nama lengkap",
    },
    category: "personal",
    icon: UserOutlined,
    description: "Nama lengkap pengguna",
  },
  {
    name: "Nomor Identitas",
    field: {
      key: "personal_id",
      label: "Nomor Identitas",
      required: false,
      type: "text_input",
      placeholder: "Masukkan nomor identitas",
    },
    category: "personal",
    icon: FileTextOutlined,
    description: "Nomor identifikasi pribadi",
  },
  {
    name: "Jenis Kelamin",
    field: {
      key: "gender",
      label: "Jenis Kelamin",
      required: false,
      type: "select",
      placeholder: "Pilih jenis kelamin",
      options: [
        { label: "Laki-laki", value: "M" },
        { label: "Perempuan", value: "F" },
      ],
    },
    category: "personal",
    icon: UserOutlined,
    description: "Pemilihan jenis kelamin",
  },

  // Contact Information
  {
    name: "WhatsApp",
    field: {
      key: "whatsapp",
      label: "WhatsApp",
      required: false,
      type: "text_input",
      placeholder: "Masukkan nomor WhatsApp",
    },
    category: "contact",
    icon: PhoneOutlined,
    description: "Nomor kontak WhatsApp",
  },
  {
    name: "Line",
    field: {
      key: "line",
      label: "Line",
      required: false,
      type: "text_input",
      placeholder: "Masukkan ID Line",
    },
    category: "contact",
    icon: MessageOutlined,
    description: "ID Line",
  },
  {
    name: "Instagram",
    field: {
      key: "instagram",
      label: "Instagram",
      required: false,
      type: "text_input",
      placeholder: "Masukkan username Instagram",
    },
    category: "contact",
    icon: GlobalOutlined,
    description: "Username Instagram",
  },
  {
    name: "TikTok",
    field: {
      key: "tiktok",
      label: "TikTok",
      required: false,
      type: "text_input",
      placeholder: "Masukkan username TikTok",
    },
    category: "contact",
    icon: GlobalOutlined,
    description: "Username TikTok",
  },
  {
    name: "LinkedIn",
    field: {
      key: "linkedin",
      label: "LinkedIn",
      required: false,
      type: "text_input",
      placeholder: "Masukkan profil LinkedIn",
    },
    category: "contact",
    icon: GlobalOutlined,
    description: "URL profil LinkedIn",
  },

  // Location Information
  {
    name: "Provinsi",
    field: {
      key: "province_id",
      label: "Provinsi",
      required: false,
      type: "select",
      placeholder: "Pilih provinsi",
    },
    category: "location",
    icon: EnvironmentOutlined,
    description: "Pemilihan provinsi",
  },

  // Education Information
  {
    name: "Universitas",
    field: {
      key: "university_id",
      label: "Universitas",
      required: false,
      type: "select",
      placeholder: "Pilih universitas",
    },
    category: "education",
    icon: DatabaseOutlined,
    description: "Pemilihan universitas",
  },
  {
    name: "Jurusan",
    field: {
      key: "major",
      label: "Jurusan",
      required: false,
      type: "text_input",
      placeholder: "Masukkan jurusan",
    },
    category: "education",
    icon: DatabaseOutlined,
    description: "Jurusan akademik/bidang studi",
  },
  {
    name: "Angkatan",
    field: {
      key: "intake_year",
      label: "Angkatan",
      required: false,
      type: "number_input",
      placeholder: "Masukkan tahun angkatan",
    },
    category: "education",
    icon: CalendarOutlined,
    description: "Tahun akademik/tahun masuk",
  },
] as const;
