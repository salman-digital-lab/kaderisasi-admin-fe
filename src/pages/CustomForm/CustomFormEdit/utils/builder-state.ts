import type {
  FormField,
  FormSchema,
  FormSection,
} from "../../../../types/model/customForm";
import {
  optionValue,
  validateFormRouting,
} from "../../../../utils/form-routing";

export function newId(): string {
  return crypto.randomUUID();
}
export function normalizeSchema(schema: FormSchema): FormSchema {
  return {
    ...schema,
    version: 2,
    fields: schema.fields.map((section) => ({
      ...section,
      id: section.id ?? newId(),
    })),
  };
}
export function duplicateQuestion(field: FormField): FormField {
  return {
    ...structuredClone(field),
    key: `custom_${newId()}`,
    label: `${field.label} (salinan)`,
  };
}
export function duplicateSection(section: FormSection): FormSection {
  return {
    ...structuredClone(section),
    id: newId(),
    section_name: `${section.section_name} (salinan)`,
    navigation: undefined,
    fields: section.fields.map(duplicateQuestion),
  };
}
export function moveQuestion(
  sections: FormSection[],
  key: string,
  targetId: string,
  index?: number,
): FormSection[] {
  const field = sections
    .flatMap((section) => section.fields)
    .find((item) => item.key === key);
  if (!field || !sections.some((section) => section.id === targetId))
    return sections;
  return sections.map((section) => {
    const fields = section.fields.filter((item) => item.key !== key);
    if (section.id === targetId)
      fields.splice(index ?? fields.length, 0, field);
    return { ...section, fields };
  });
}
export interface BuilderIssue {
  sectionId?: string;
  fieldKey?: string;
  message: string;
}

export function builderIssues(schema: FormSchema): BuilderIssue[] {
  const issues = validateFormRouting(schema);
  for (const section of schema.fields) {
    const add = (message: string, fieldKey?: string): void => {
      issues.push({ sectionId: section.id, fieldKey, message });
    };
    if (!section.section_name.trim()) add("Isi nama bagian.");
    if (section.section_name === "profile_data") continue;
    for (const field of section.fields) {
      const problem = (message: string): void => add(message, field.key);
      if (field.type === "file") {
        if (
          !field.file ||
          !["pdf", "image", "pdf_or_image"].includes(field.file.accept)
        )
          problem(
            "Pilih jenis berkas: PDF saja, gambar saja, atau PDF dan gambar.",
          );
        if (
          !field.file ||
          !Number.isInteger(field.file.maxFiles) ||
          field.file.maxFiles < 1 ||
          field.file.maxFiles > 5
        )
          problem(
            "Isi jumlah berkas maksimal dengan bilangan bulat antara 1 dan 5.",
          );
        if (
          !field.file ||
          !Number.isInteger(field.file.maxSizeMB) ||
          field.file.maxSizeMB < 1 ||
          field.file.maxSizeMB > 10
        )
          problem(
            "Isi ukuran maksimal per berkas dengan bilangan bulat antara 1 dan 10 MB.",
          );
      }
      if (field.label.trim().length < 2)
        problem("Isi judul pertanyaan dengan minimal 2 karakter.");
      if (
        ["select", "radio", "multiselect", "checkbox"].includes(field.type) &&
        field.options
      ) {
        if (
          !field.options.length ||
          field.options.some((option) => !option.label.trim())
        )
          problem(
            !field.options.length
              ? "Tambahkan minimal satu pilihan jawaban."
              : "Isi teks pada setiap pilihan jawaban atau hapus pilihan yang kosong.",
          );
        const values = field.options.map(optionValue);
        if (new Set(values).size !== values.length)
          problem(
            "Ada pilihan dengan nilai yang sama. Hapus pilihan yang duplikat lalu tambahkan pilihan penggantinya.",
          );
      }
      if (
        ["radio", "select", "multiselect"].includes(field.type) &&
        !field.options
      )
        problem("Tambahkan minimal satu pilihan jawaban.");
      const rules = field.validation;
      if (!rules) continue;
      for (const key of ["min", "max", "minLength", "maxLength"] as const) {
        const value = rules[key];
        if (
          value !== undefined &&
          (!Number.isFinite(value) ||
            (key.endsWith("Length") && (!Number.isInteger(value) || value < 0)))
        )
          problem(
            key.endsWith("Length")
              ? "Isi batas jumlah karakter dengan bilangan bulat nol atau lebih, atau kosongkan batasnya."
              : "Isi batas nilai dengan angka yang valid, atau kosongkan batasnya.",
          );
      }
      if (
        (rules.min !== undefined &&
          rules.max !== undefined &&
          rules.min > rules.max) ||
        (rules.minLength !== undefined &&
          rules.maxLength !== undefined &&
          rules.minLength > rules.maxLength)
      )
        problem(
          "Batas minimum melebihi maksimum. Turunkan batas minimum atau naikkan batas maksimum.",
        );
      if (rules.pattern) {
        try {
          new RegExp(rules.pattern);
        } catch {
          problem(
            "Pola validasi tidak dapat dibaca. Perbaiki penulisan regex atau kosongkan pola.",
          );
        }
      }
    }
  }
  return issues.filter(
    (issue, index) =>
      !issues
        .slice(0, index)
        .some(
          (previous) =>
            previous.sectionId === issue.sectionId &&
            previous.fieldKey === issue.fieldKey &&
            previous.message === issue.message,
        ),
  );
}

export interface BuilderRecovery {
  version: 1;
  updatedAt: string;
  savedAt: number;
  schema: FormSchema;
  values: {
    formName: string;
    formDescription?: string;
    postSubmissionInfo?: string;
    featureType?:
      | "activity_registration"
      | "club_registration"
      | "independent_form";
    featureId?: number | null;
  };
}
export function readRecovery(key: string): BuilderRecovery | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) ?? "null",
    ) as BuilderRecovery | null;
    if (
      value?.version !== 1 ||
      Date.now() - value.savedAt > 7 * 24 * 60 * 60 * 1000 ||
      !Array.isArray(value.schema?.fields) ||
      !value.values ||
      typeof value.values.formName !== "string"
    )
      return null;
    if (
      value.schema.fields.some(
        (section) =>
          typeof section.section_name !== "string" ||
          !Array.isArray(section.fields) ||
          section.fields.some(
            (field) =>
              typeof field.key !== "string" || typeof field.label !== "string",
          ),
      )
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
