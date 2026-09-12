import type { SetupReadiness } from "../../../../api/services/activity-setup";

type ChecklistDefinition = {
  key: string;
  label: string;
  description: string;
  tab: string;
  codes: string[];
  required: boolean;
};

const PUBLICATION_ITEMS: ChecklistDefinition[] = [
  {
    key: "information",
    label: "Informasi Dasar",
    description: "Nama, tipe, kategori, dan jenjang minimum peserta.",
    tab: "1",
    codes: ["name", "type", "category", "level"],
    required: true,
  },
  {
    key: "description",
    label: "Deskripsi Kegiatan",
    description: "Tujuan kegiatan dan informasi yang perlu diketahui peserta.",
    tab: "1",
    codes: ["description"],
    required: true,
  },
  {
    key: "poster",
    label: "Poster Kegiatan",
    description: "Minimal satu poster untuk halaman publik kegiatan.",
    tab: "3",
    codes: ["poster"],
    required: true,
  },
  {
    key: "dates",
    label: "Ketepatan Tanggal",
    description:
      "Tanggal yang diisi harus lengkap dan berurutan. Tanggal kegiatan boleh belum ditentukan.",
    tab: "1",
    codes: ["activity_dates", "registration_dates"],
    required: false,
  },
];
const REGISTRATION_ITEMS: ChecklistDefinition[] = [
  {
    key: "period",
    label: "Periode Pendaftaran",
    description:
      "Tanggal pendaftaran sudah ditentukan dan berada dalam periode aktif.",
    tab: "1",
    codes: [
      "registration_period",
      "registration_future",
      "registration_expired",
      "registration_dates",
    ],
    required: true,
  },
  {
    key: "form",
    label: "Form Pendaftaran",
    description: "Formulir valid dan aktif untuk menerima jawaban peserta.",
    tab: "7",
    codes: ["registration_form"],
    required: true,
  },
];

export function activityChecklist(
  readiness: SetupReadiness,
  publication: boolean,
): (ChecklistDefinition & { complete: boolean })[] {
  return (publication ? PUBLICATION_ITEMS : REGISTRATION_ITEMS).map((item) => {
    const issues = readiness.issues.filter((issue) =>
      item.codes.includes(issue.code),
    );
    return {
      ...item,
      complete: issues.length === 0,
      description: issues.length
        ? issues.map((issue) => issue.message).join(" ")
        : item.description,
    };
  });
}
