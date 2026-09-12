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
export function builderIssues(
  schema: FormSchema,
): { sectionId?: string; message: string }[] {
  const issues = validateFormRouting(schema);
  for (const section of schema.fields) {
    const add = (message: string): void => {
      issues.push({ sectionId: section.id, message });
    };
    if (!section.section_name.trim()) add("Isi nama bagian.");
    if (section.section_name === "profile_data") continue;
    for (const field of section.fields) {
      const label = field.label || "Pertanyaan tanpa judul";
      if (field.label.trim().length < 2)
        add(`${label}: isi judul minimal 2 karakter.`);
      if (
        ["select", "radio", "multiselect", "checkbox"].includes(field.type) &&
        field.options
      ) {
        if (
          !field.options.length ||
          field.options.some((option) => !option.label.trim())
        )
          add(`${label}: isi pilihan jawaban.`);
        const values = field.options.map(optionValue);
        if (new Set(values).size !== values.length)
          add(`${label}: nilai pilihan harus unik.`);
      }
      if (["radio", "select"].includes(field.type) && !field.options?.length)
        add(`${label}: tambahkan pilihan jawaban.`);
      const rules = field.validation;
      if (!rules) continue;
      for (const key of ["min", "max", "minLength", "maxLength"] as const) {
        const value = rules[key];
        if (
          value !== undefined &&
          (!Number.isFinite(value) ||
            (key.endsWith("Length") && (!Number.isInteger(value) || value < 0)))
        )
          add(`${label}: batas validasi tidak valid.`);
      }
      if (
        (rules.min !== undefined &&
          rules.max !== undefined &&
          rules.min > rules.max) ||
        (rules.minLength !== undefined &&
          rules.maxLength !== undefined &&
          rules.minLength > rules.maxLength)
      )
        add(`${label}: batas minimum melebihi maksimum.`);
      if (rules.pattern) {
        try {
          new RegExp(rules.pattern);
        } catch {
          add(`${label}: pola validasi tidak valid.`);
        }
      }
    }
  }
  return issues;
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
