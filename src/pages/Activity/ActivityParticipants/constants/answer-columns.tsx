import { Typography } from "antd";
import FormAnswerFiles from "../../../../components/common/FormAnswerFiles";
import type { FormSchema } from "../../../../types/model/customForm";
import type { ColumnConfig } from "./columns";

export const EMPTY_ANSWER = "Tidak diisi";

export function formatAnswer(
  value: unknown,
  options?: { label: string; value: string | number }[],
): string {
  if (value === null || value === undefined || value === "")
    return EMPTY_ANSWER;
  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatAnswer(item, options))
      .filter((item) => item !== EMPTY_ANSWER);
    return items.length ? items.join(", ") : EMPTY_ANSWER;
  }
  const choice = options?.find(
    (option) => String(option.value) === String(value),
  );
  if (choice) return choice.label;
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "string") return value.trim() || EMPTY_ANSWER;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function answerColumns<T extends object>(
  formId: number | undefined,
  schema: FormSchema | undefined,
  answers: (record: T) => Record<string, unknown> | null | undefined,
): ColumnConfig<T>[] {
  if (!formId || !schema) return [];
  const seen = new Set<string>();
  return schema.fields.flatMap((section) => {
    if (section.section_name === "profile_data") return [];
    return section.fields.flatMap((field) => {
      if (!field.key || seen.has(field.key)) return [];
      seen.add(field.key);
      return [
        {
          key: `answer:${formId}:${field.key}`,
          title: field.label || field.key,
          dataIndex: field.key,
          visible: true,
          width: 240,
          wrap: true,
          render: (_value: unknown, record: T) => {
            const value = answers(record)?.[field.key];
            if (field.type === "file") {
              return Array.isArray(value) && value.length > 0 ? (
                <FormAnswerFiles formId={formId} value={value} />
              ) : (
                EMPTY_ANSWER
              );
            }
            return (
              <Typography.Text
                style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {formatAnswer(value, field.options)}
              </Typography.Text>
            );
          },
        },
      ];
    });
  });
}
