import type { FormField } from "../../../../types/model/customForm";

export const generateFieldKey = (prefix: string = "custom"): string => {
  return `${prefix}_${Date.now()}`;
};

export const createNewField = (key?: string): FormField => {
  return {
    key: key || generateFieldKey(),
    label: "",
    required: false,
    type: "text",
  };
};

export const fieldExists = (fields: FormField[], key: string): boolean => {
  return fields.some((field) => field.key === key);
};

export const moveArrayItem = <T>(
  array: T[],
  fromIndex: number,
  toIndex: number,
): T[] => {
  if (
    fromIndex < 0 ||
    fromIndex >= array.length ||
    toIndex < 0 ||
    toIndex >= array.length
  ) {
    return array;
  }

  const newArray = [...array];
  newArray.splice(toIndex, 0, ...newArray.splice(fromIndex, 1));

  return newArray;
};
