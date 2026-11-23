import type { FormField } from "../../../../types/model/customForm";

export type FieldModalValues = Pick<FormField, "label" | "type"> &
  Partial<
    Pick<
      FormField,
      | "required"
      | "placeholder"
      | "helpText"
      | "options"
      | "validation"
      | "disabled"
    >
  >;
