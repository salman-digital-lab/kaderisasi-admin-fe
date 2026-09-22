import { describe, expect, it } from "vitest";
import type { ClubRegistration } from "../../../../types/model/clubRegistration";
import type { FormSchema } from "../../../../types/model/customForm";
import { buildApplicationProfileItems } from "./application-profile";

const registration: ClubRegistration = {
  id: 1,
  club_id: 1,
  member_id: 1,
  status: "PENDING",
  additional_data: {},
  created_at: "2026-09-22T06:14:00Z",
  updated_at: "2026-09-22T06:14:00Z",
  member: {
    id: 1,
    email: "pendaftar@example.test",
    created_at: "",
    updated_at: "",
    profile: {
      id: 1,
      name: "Pendaftar Uji",
      gender: "F",
      whatsapp: "081234567890",
      created_at: "",
      updated_at: "",
      major: "Jurusan lama",
      education_history: JSON.stringify([
        null,
        { degree: "high_school", institution: "Sekolah Uji" },
        {
          degree: "bachelor",
          institution: "Kampus Uji",
          faculty: "Teknik",
          major: "Informatika",
          intake_year: "2024",
        },
      ]),
    },
  },
};
const schema: FormSchema = {
  fields: [
    {
      section_name: "profile_data",
      fields: [
        { key: "name", label: "Nama Lengkap", type: "text", required: true },
        {
          key: "gender",
          label: "Jenis Kelamin",
          type: "select",
          required: true,
        },
        {
          key: "birth_date",
          label: "Tanggal Lahir",
          type: "date",
          required: false,
        },
        {
          key: "current_education",
          label: "Pendidikan Sekarang",
          type: "current_education",
          required: true,
        },
      ],
    },
    {
      section_name: "Registrasi",
      fields: [
        { key: "reason", label: "Motivasi", type: "text", required: true },
      ],
    },
  ],
};

describe("club application profile", () => {
  it("shows configured profile fields in form order with all current education details", () => {
    const items = buildApplicationProfileItems(registration, schema);
    expect(items.map((item) => item.label)).toEqual([
      "Nama Lengkap",
      "Jenis Kelamin",
      "Tanggal Lahir",
      "Pendidikan Sekarang",
      "Email",
    ]);
    expect(items.map((item) => item.children)).toEqual([
      "Pendaftar Uji",
      "Perempuan",
      "-",
      "S1 - Kampus Uji, Teknik, Informatika (2024)",
      "pendaftar@example.test",
    ]);
  });

  it("keeps missing profile fields visible and retains basic info without a form", () => {
    const missing = { ...registration, member: undefined };
    expect(
      buildApplicationProfileItems(missing, schema).find(
        (item) => item.key === "current_education",
      )?.children,
    ).toBe("-");
    expect(
      buildApplicationProfileItems(registration).map((item) => item.children),
    ).toEqual(["Pendaftar Uji", "pendaftar@example.test", "081234567890"]);
  });

  it("avoids duplicate fields and email", () => {
    const fields = schema.fields[0].fields;
    const repeated: FormSchema = {
      fields: [
        {
          section_name: "profile_data",
          fields: [
            ...fields,
            fields[0],
            {
              key: "email",
              label: "Email akun",
              type: "text",
              required: false,
            },
          ],
        },
      ],
    };
    expect(
      buildApplicationProfileItems(registration, repeated).map(
        (item) => item.label,
      ),
    ).toEqual([
      "Nama Lengkap",
      "Jenis Kelamin",
      "Tanggal Lahir",
      "Pendidikan Sekarang",
      "Email akun",
    ]);
  });
});
