import type { FormField as CustomFormField } from "../../../../types/model/customForm";

function validEducation(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, item]) => {
    if (item === undefined || item === null || item === "") return true;
    if (key === "degree")
      return [
        "high_school",
        "diploma",
        "bachelor",
        "master",
        "doctoral",
      ].includes(String(item));
    if (key === "intake_year")
      return (
        Number.isInteger(item) &&
        Number(item) >= 1900 &&
        Number(item) <= new Date().getFullYear() + 10
      );
    return (
      ["institution", "faculty", "major"].includes(key) &&
      typeof item === "string" &&
      item.length <= 10000
    );
  });
}

export function validateCustomFormFields(
  fields: CustomFormField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.hidden || field.disabled) return;
    const value = values[field.key];
    const empty =
      (field.type === "current_education" &&
        (!value ||
          typeof value !== "object" ||
          !("institution" in value) ||
          !String(value.institution ?? "").trim())) ||
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);
    if (
      field.required &&
      (empty || (field.type === "checkbox" && value === false))
    ) {
      errors[field.key] = "Jawaban wajib diisi.";
    }

    if (!empty) {
      const validType =
        field.type === "education_history"
          ? Array.isArray(value) &&
            value.length <= 50 &&
            value.every(validEducation)
          : field.type === "current_education"
            ? validEducation(value)
            : field.type === "number"
              ? typeof value === "number" && Number.isFinite(value)
              : field.type === "file" ||
                  field.type === "multiselect" ||
                  (field.type === "checkbox" && !!field.options?.length)
                ? Array.isArray(value) &&
                  value.every((item) => typeof item === "string")
                : field.type === "checkbox"
                  ? typeof value === "boolean"
                  : typeof value === "string";
      if (!validType)
        errors[field.key] = "Periksa jenis jawaban dan isi kembali kolom ini.";
      if (
        field.type === "file" &&
        Array.isArray(value) &&
        value.length > (field.file?.maxFiles ?? 1)
      )
        errors[field.key] = `Maksimal ${field.file?.maxFiles ?? 1} berkas.`;
      if (field.options?.length) {
        const allowed = field.options
          .filter((option) => !option.disabled)
          .map((option) =>
            option.value == null
              ? option.label
              : String(option.value) || option.label,
          );
        if (
          !(Array.isArray(value) ? value : [value]).every(
            (item) => typeof item === "string" && allowed.includes(item),
          )
        )
          errors[field.key] = "Pilih jawaban dari pilihan yang tersedia.";
      }
      if (typeof value === "string" && value.length > 10_000)
        errors[field.key] = "Batasi jawaban hingga 10.000 karakter.";
    }

    if (field.validation) {
      const val = values[field.key];

      if (!empty) {
        if (
          field.validation.min !== undefined &&
          typeof val === "number" &&
          Number(val) < field.validation.min
        ) {
          errors[field.key] =
            field.validation.customMessage || `Minimal ${field.validation.min}`;
        }

        if (
          field.validation.max !== undefined &&
          typeof val === "number" &&
          Number(val) > field.validation.max
        ) {
          errors[field.key] =
            field.validation.customMessage ||
            `Maksimal ${field.validation.max}`;
        }

        if (
          field.validation.minLength !== undefined &&
          typeof val === "string" &&
          val.length < field.validation.minLength
        ) {
          errors[field.key] =
            field.validation.customMessage ||
            `Minimal ${field.validation.minLength} karakter`;
        }

        if (
          field.validation.maxLength !== undefined &&
          typeof val === "string" &&
          val.length > field.validation.maxLength
        ) {
          errors[field.key] =
            field.validation.customMessage ||
            `Maksimal ${field.validation.maxLength} karakter`;
        }

        if (field.validation.pattern) {
          try {
            const regex = new RegExp(field.validation.pattern);
            if (typeof val === "string" && !regex.test(val)) {
              errors[field.key] =
                field.validation.customMessage ||
                "Sesuaikan jawaban dengan format pada petunjuk pertanyaan.";
            }
          } catch {
            errors[field.key] =
              "Pola validasi tidak dapat dibaca. Perbaiki pola pada editor pertanyaan.";
          }
        }
      }
    }
  });

  return errors;
}
