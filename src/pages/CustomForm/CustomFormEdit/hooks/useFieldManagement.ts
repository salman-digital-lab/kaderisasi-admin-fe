import { useState } from "react";
import { message } from "antd";
import type { FormField } from "../../../../types/model/customForm";
import {
  createNewField,
  moveArrayItem,
  fieldExists,
  generateFieldKey
} from "../utils";

export const useFieldManagement = (
  customFields: FormField[],
  setCustomFields: (fields: FormField[]) => void,
  selectedBasicFields: string[],
  setSelectedBasicFields: (fields: string[]) => void,
  profileTemplates: any[]
) => {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);

  // Handle adding new custom field
  const handleAddCustomField = () => {
    const newField = createNewField();
    setEditingField(newField);
    setFieldModalVisible(true);
  };

  // Handle editing custom field
  const handleEditCustomField = (field: FormField) => {
    setEditingField(field);
    setFieldModalVisible(true);
  };

  // Handle saving custom field
  const handleSaveCustomField = (values: any) => {
    const fieldData: FormField = {
      key: editingField?.key || generateFieldKey(),
      label: values.label,
      required: values.required || false,
      type: values.type,
      placeholder: values.placeholder,
      helpText: values.helpText,
      description: values.description,
      options: values.options || [],
      validation: values.validation,
      defaultValue: values.defaultValue,
      hidden: values.hidden || false,
      disabled: values.disabled || false,
    };

    // Check if this is an existing field being edited
    const isEditingExistingField =
      editingField &&
      editingField.key &&
      fieldExists(customFields, editingField.key);

    if (isEditingExistingField) {
      // Update existing field
      setCustomFields(
        customFields.map((field) =>
          field.key === editingField.key ? fieldData : field,
        ),
      );
      message.success(`Field "${fieldData.label}" berhasil diperbarui!`);
    } else {
      // New field
      setCustomFields([...customFields, fieldData]);
      message.success(`Field "${fieldData.label}" berhasil ditambahkan!`);
    }
    setFieldModalVisible(false);
    setEditingField(null);
  };

  // Handle deleting custom field
  const handleDeleteCustomField = (fieldKey: string) => {
    const fieldToDelete = customFields.find((field) => field.key === fieldKey);
    if (!fieldToDelete) {
      message.error("Field tidak ditemukan!");
      return;
    }

    setCustomFields(customFields.filter((field) => field.key !== fieldKey));
    message.success(`Field "${fieldToDelete.label}" berhasil dihapus!`);
  };

  // Handle adding profile data field from template
  const handleAddProfileDataFromTemplate = (template: any) => {
    // Check if field already exists in selected basic fields
    if (selectedBasicFields.includes(template.field.key)) {
      message.warning(`Field "${template.name}" sudah dipilih!`);
      return;
    }

    // Add to selected basic fields
    setSelectedBasicFields([...selectedBasicFields, template.field.key]);
    message.success(`Field profil "${template.name}" berhasil ditambahkan!`);
  };

  // Handle removing profile field
  const handleRemoveProfileField = (fieldKey: string) => {
    // Prevent removal of default fields (name and gender)
    if (fieldKey === "name" || fieldKey === "gender") {
      message.warning("Field default tidak dapat dihapus!");
      return;
    }

    setSelectedBasicFields(selectedBasicFields.filter((key) => key !== fieldKey));
    message.success("Field profil berhasil dihapus!");
  };

  // Handle moving profile field up/down
  const handleMoveProfileField = (
    fieldKey: string,
    direction: "up" | "down",
  ) => {
    const currentIndex = selectedBasicFields.findIndex(
      (key) => key === fieldKey,
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= selectedBasicFields.length) return;

    const newFields = [...selectedBasicFields];
    [newFields[currentIndex], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[currentIndex],
    ];
    setSelectedBasicFields(newFields);
  };

  // Handle duplicating a field
  const handleDuplicateField = (field: FormField) => {
    const duplicatedField = {
      ...field,
      key: `${field.key}_copy_${Date.now()}`,
      label: `${field.label} (Copy)`,
    };
    setCustomFields([...customFields, duplicatedField]);
    message.success("Field berhasil diduplikat!");
  };

  // Handle moving field up/down
  const handleMoveField = (fieldKey: string, direction: "up" | "down") => {
    const currentIndex = customFields.findIndex(
      (field) => field.key === fieldKey,
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= customFields.length) return;

    const newFields = moveArrayItem(customFields, currentIndex, newIndex);
    setCustomFields(newFields);
  };

  return {
    editingField,
    setEditingField,
    fieldModalVisible,
    setFieldModalVisible,
    handleAddCustomField,
    handleEditCustomField,
    handleSaveCustomField,
    handleDeleteCustomField,
    handleAddProfileDataFromTemplate,
    handleRemoveProfileField,
    handleMoveProfileField,
    handleDuplicateField,
    handleMoveField,
  };
};
