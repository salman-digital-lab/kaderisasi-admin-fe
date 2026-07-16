import type { FormSchema } from "../../../../types/model/customForm";

export const EMPTY_APPLICATION_ANSWER = "Tidak diisi";

export type ApplicationAnswerItem = {
  key: string;
  label: string;
  displayValue: string;
};

export type ApplicationAnswerSection = {
  key: string;
  title: string;
  answers: ApplicationAnswerItem[];
};

const isAnswerRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const humanizeApplicationKey = (key: string): string => {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_.-]+/g, " ")
    .trim();

  if (!words) return "Jawaban";

  return words.replace(/\b\w/g, (character) => character.toUpperCase());
};

export const formatApplicationAnswer = (value: unknown): string => {
  if (value === null || value === undefined) return EMPTY_APPLICATION_ANSWER;
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "string")
    return value.trim() || EMPTY_APPLICATION_ANSWER;
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const values = value
      .map(formatApplicationAnswer)
      .filter((item) => item !== EMPTY_APPLICATION_ANSWER);
    return values.length > 0 ? values.join(", ") : EMPTY_APPLICATION_ANSWER;
  }

  if (isAnswerRecord(value)) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "Jawaban tidak dapat ditampilkan";
    }
  }

  return String(value);
};

export const buildApplicationAnswerSections = (
  additionalData: unknown,
  formSchema?: FormSchema | null,
): ApplicationAnswerSection[] => {
  const answers = isAnswerRecord(additionalData) ? additionalData : {};
  const schemaSections = Array.isArray(formSchema?.fields)
    ? formSchema.fields
    : [];
  const knownKeys = new Set<string>();
  const excludedProfileKeys = new Set<string>();
  const sections: ApplicationAnswerSection[] = [];

  schemaSections.forEach((section, sectionIndex) => {
    const fields = Array.isArray(section.fields) ? section.fields : [];

    if (section.section_name === "profile_data") {
      fields.forEach((field) => {
        if (typeof field.key === "string") excludedProfileKeys.add(field.key);
      });
      return;
    }

    const sectionAnswers = fields.flatMap((field, fieldIndex) => {
      if (typeof field.key !== "string" || knownKeys.has(field.key)) return [];

      knownKeys.add(field.key);
      return [
        {
          key: `schema:${sectionIndex}:${fieldIndex}:${field.key}`,
          label:
            typeof field.label === "string" && field.label.trim()
              ? field.label.trim()
              : humanizeApplicationKey(field.key),
          displayValue: formatApplicationAnswer(answers[field.key]),
        },
      ];
    });

    if (sectionAnswers.length > 0) {
      sections.push({
        key: `schema:${sectionIndex}:${section.section_name}`,
        title:
          typeof section.section_name === "string" &&
          section.section_name.trim()
            ? humanizeApplicationKey(section.section_name)
            : `Bagian ${sectionIndex + 1}`,
        answers: sectionAnswers,
      });
    }
  });

  const legacyAnswers = Object.entries(answers).flatMap(
    ([key, value], index) => {
      if (knownKeys.has(key) || excludedProfileKeys.has(key)) return [];

      return [
        {
          key: `legacy:${index}:${key}`,
          label: humanizeApplicationKey(key),
          displayValue: formatApplicationAnswer(value),
        },
      ];
    },
  );

  if (legacyAnswers.length > 0) {
    sections.push({
      key: "legacy-answers",
      title: sections.length > 0 ? "Jawaban Lainnya" : "Jawaban Pendaftaran",
      answers: legacyAnswers,
    });
  }

  return sections;
};
