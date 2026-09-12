import type { FormField as CustomFormField } from "../../../../types/model/customForm";

export function validateCustomFormFields(
  fields: CustomFormField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.hidden || field.disabled) return;
    const value = values[field.key];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);
    if (
      field.required &&
      (empty || (field.type === "checkbox" && value === false))
    ) {
      errors[field.key] = `${field.label} wajib diisi`;
    }

    if (!empty) {
      const validType =
        field.type === "number"
          ? typeof value === "number" && Number.isFinite(value)
          : field.type === "multiselect" ||
              (field.type === "checkbox" && !!field.options?.length)
            ? Array.isArray(value) &&
              value.every((item) => typeof item === "string")
            : field.type === "checkbox"
              ? typeof value === "boolean"
              : typeof value === "string";
      if (!validType) errors[field.key] = `Format ${field.label} tidak valid.`;
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
          errors[field.key] = `Pilihan ${field.label} tidak valid.`;
      }
      if (typeof value === "string" && value.length > 10_000)
        errors[field.key] = `${field.label} terlalu panjang.`;
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
                `Format ${field.label} tidak valid`;
            }
          } catch {
            errors[field.key] =
              "Konfigurasi formulir tidak valid. Hubungi pengelola.";
          }
        }
      }
    }
  });

  return errors;
}
