import { Questionnaire } from "../../../../types/model/activity";
export const QUESTION_DEFAULT = {
  text: {
    name: `question${Math.floor(Math.random() * 10000)}`,
    type: "text",
    label: "",
    required: false,
  },
  number: {
    name: `question${Math.floor(Math.random() * 10000)}`,
    type: "number",
    label: "",
    required: false,
  },
  dropdown: {
    name: `question${Math.floor(Math.random() * 10000)}`,
    type: "dropdown",
    label: "",
    required: false,
    data: [],
  },
} as Record<string, Questionnaire>;

export const generateDefaultQuestion = (
  type: "text" | "number" | "dropdown" | "textarea",
): Questionnaire => {
  switch (type) {
    case "text":
      return {
        name: `question${Math.floor(Math.random() * 10000)}`,
        type: "text",
        label: "",
        required: false,
      };
    case "number":
      return {
        name: `question${Math.floor(Math.random() * 10000)}`,
        type: "number",
        label: "",
        required: false,
      };
    case "dropdown":
      return {
        name: `question${Math.floor(Math.random() * 10000)}`,
        type: "dropdown",
        label: "",
        required: false,
        data: [],
      };
    default:
      return {
        name: `question${Math.floor(Math.random() * 10000)}`,
        type: "text",
        label: "",
        required: false,
      };
  }
};

export const PROFILE_DATA = [
  {
    key: 0,
    fieldname: "personal_id",
    label: "Nomor Identitas",
  },
  {
    key: 1,
    fieldname: "whatsapp",
    label: "Nomor Whatsapp",
  },
  {
    key: 2,
    fieldname: "instagram",
    label: "Akun Instagram",
  },
  {
    key: 3,
    fieldname: "linkedin",
    label: "Akun Linkedin",
  },
  {
    key: 4,
    fieldname: "tiktok",
    label: "Akun Tiktok",
  },
  {
    key: 5,
    fieldname: "line",
    label: "Akun Line",
  },
  {
    key: 6,
    fieldname: "university_id",
    label: "Kampus/Universitas",
  },
  {
    key: 7,
    fieldname: "major",
    label: "Jurusan",
  },
  {
    key: 8,
    fieldname: "province_id",
    label: "Provinsi Domisili",
  },
];
