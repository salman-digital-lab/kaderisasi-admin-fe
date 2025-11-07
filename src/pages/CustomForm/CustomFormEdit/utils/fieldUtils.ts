import type { FormField } from "../../../../types/model/customForm";

/**
 * Check if a field type needs options (for select, radio, checkbox)
 */
export const fieldTypeNeedsOptions = (fieldType: string): boolean => {
  return ["select", "radio", "checkbox"].includes(fieldType);
};

/**
 * Generate a unique key for a new field
 */
export const generateFieldKey = (prefix: string = "custom"): string => {
  return `${prefix}_${Date.now()}`;
};

/**
 * Create a new custom field with default values
 */
export const createNewField = (key?: string): FormField => {
  return {
    key: key || generateFieldKey(),
    label: "",
    required: false,
    type: "text",
  };
};

/**
 * Check if a field already exists in the list
 */
export const fieldExists = (fields: FormField[], key: string): boolean => {
  return fields.some(field => field.key === key);
};

/**
 * Move an item in an array from one position to another
 */
export const moveArrayItem = <T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] => {
  if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex >= array.length) {
    return array;
  }

  const newArray = [...array];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);

  return newArray;
};

/**
 * Find field type information by type value
 */
export const findFieldType = (fieldTypes: any[], type: string) => {
  return fieldTypes.find(fieldType => fieldType.value === type);
};

/**
 * Find field category information by type
 */
export const findFieldCategory = (fieldCategories: any[], type: string, fieldTypes: any[]) => {
  const fieldType = findFieldType(fieldTypes, type);
  return fieldCategories.find(category => category.key === fieldType?.category);
};
