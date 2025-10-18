import { useState } from "react";
import { message } from "antd";
import type { FormField, FormSection } from "../../../../types/model/customForm";
import {
  createNewField,
  moveArrayItem,
  fieldExists,
  generateFieldKey
} from "../utils";

// Constants for default fields that cannot be modified
const IMMUTABLE_FIELDS = ["name", "gender"] as const;

// Helper function to check if a field is immutable
const isImmutableField = (fieldKey: string): boolean => {
  return IMMUTABLE_FIELDS.includes(fieldKey as any);
};

export const useFieldManagement = (
  customFieldSections: FormSection[],
  setCustomFieldSections: (sections: FormSection[]) => void,
  selectedBasicFields: string[],
  setSelectedBasicFields: (fields: string[]) => void,
  _profileTemplates: readonly any[],
  onRequiredFieldChange?: (fieldKey: string, required: boolean) => void
) => {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [basicFieldModalVisible, setBasicFieldModalVisible] = useState(false);

  // ===== Modal Management =====
  
  const handleOpenBasicFieldModal = () => {
    setBasicFieldModalVisible(true);
  };

  // ===== Section Operations =====

  const handleAddSection = () => {
    // Count existing custom sections (excluding profile_data)
    const customSectionCount = customFieldSections.filter(
      section => section.section_name !== 'profile_data'
    ).length;

    // Generate sequential section name
    const nextSectionNumber = customSectionCount + 1;
    const sectionKey = `Bagian ${nextSectionNumber}`;

    const newSection: FormSection = {
      section_name: sectionKey,
      fields: [],
    };
    setCustomFieldSections([...customFieldSections, newSection]);
    message.success("Grup pertanyaan kustom berhasil ditambahkan!");
  };

  const handleDeleteSection = (sectionKey: string) => {
    setCustomFieldSections(
      customFieldSections.filter((section) => section.section_name !== sectionKey)
    );
    message.success("Grup pertanyaan berhasil dihapus!");
  };

  const handleUpdateSectionName = (sectionKey: string, newName: string) => {
    setCustomFieldSections(
      customFieldSections.map((section) =>
        section.section_name === sectionKey
          ? { ...section, section_name: newName }
          : section
      )
    );
  };

  const handleMoveSection = (sectionKey: string, direction: "up" | "down") => {
    const currentIndex = customFieldSections.findIndex(
      (section) => section.section_name === sectionKey
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= customFieldSections.length) return;

    const newSections = moveArrayItem(customFieldSections, currentIndex, newIndex);
    setCustomFieldSections(newSections);
  };

  // ===== Custom Field Operations =====
  
  const handleAddCustomField = (sectionKey: string) => {
    const newField = createNewField();
    setEditingField(newField);
    setEditingSectionKey(sectionKey);
    setFieldModalVisible(true);
  };

  const handleEditCustomField = (sectionKey: string, field: FormField) => {
    setEditingField(field);
    setEditingSectionKey(sectionKey);
    setFieldModalVisible(true);
  };

  const handleSaveCustomField = (values: any) => {
    if (!editingSectionKey) return;

    const fieldData: FormField = {
      key: editingField?.key || generateFieldKey(),
      label: values.label,
      required: values.required || false,
      type: values.type,
      placeholder: values.placeholder,
      helpText: values.helpText,
      options: values.options || [],
      validation: values.validation,
      disabled: values.disabled || false,
    };

    const section = customFieldSections.find(
      (s) => s.section_name === editingSectionKey
    );
    if (!section) return;

    const isEditingExistingField =
      editingField?.key && fieldExists(section.fields, editingField.key);

    if (isEditingExistingField) {
      setCustomFieldSections(
        customFieldSections.map((s) =>
          s.section_name === editingSectionKey
            ? {
                ...s,
                fields: s.fields.map((field) =>
                  field.key === editingField.key ? fieldData : field
                ),
              }
            : s
        )
      );
      message.success(`Pertanyaan "${fieldData.label}" berhasil diperbarui!`);
    } else {
      setCustomFieldSections(
        customFieldSections.map((s) =>
          s.section_name === editingSectionKey
            ? { ...s, fields: [...s.fields, fieldData] }
            : s
        )
      );
      message.success(`Pertanyaan "${fieldData.label}" berhasil ditambahkan!`);
    }
    
    setFieldModalVisible(false);
    setEditingField(null);
    setEditingSectionKey(null);
  };

  const handleDeleteCustomField = (sectionKey: string, fieldKey: string) => {
    const section = customFieldSections.find((s) => s.section_name === sectionKey);
    if (!section) {
      message.error("Section tidak ditemukan!");
      return;
    }

    const fieldToDelete = section.fields.find((field) => field.key === fieldKey);
    if (!fieldToDelete) {
      message.error("Field tidak ditemukan!");
      return;
    }

    setCustomFieldSections(
      customFieldSections.map((s) =>
        s.section_name === sectionKey
          ? { ...s, fields: s.fields.filter((field) => field.key !== fieldKey) }
          : s
      )
    );
    message.success("Pertanyaan berhasil dihapus!");
  };

  const handleDuplicateField = (sectionKey: string, field: FormField) => {
    const duplicatedField: FormField = {
      ...field,
      key: `${field.key}_copy_${Date.now()}`,
      label: `${field.label} (Copy)`,
    };
    setCustomFieldSections(
      customFieldSections.map((s) =>
        s.section_name === sectionKey
          ? { ...s, fields: [...s.fields, duplicatedField] }
          : s
      )
    );
    message.success("Pertanyaan berhasil diduplikat!");
  };

  const handleMoveField = (sectionKey: string, fieldKey: string, direction: "up" | "down") => {
    const section = customFieldSections.find((s) => s.section_name === sectionKey);
    if (!section) return;

    const currentIndex = section.fields.findIndex((field) => field.key === fieldKey);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= section.fields.length) return;

    const newFields = moveArrayItem(section.fields, currentIndex, newIndex);
    setCustomFieldSections(
      customFieldSections.map((s) =>
        s.section_name === sectionKey ? { ...s, fields: newFields } : s
      )
    );
  };

  // ===== Profile Field Operations =====

  const handleAddProfileDataFromTemplate = (template: any) => {
    if (selectedBasicFields.includes(template.field.key)) {
      message.info("Pertanyaan ini sudah ditambahkan!");
      return;
    }

    setSelectedBasicFields([...selectedBasicFields, template.field.key]);
    message.success(`Pertanyaan "${template.name}" berhasil ditambahkan!`);
  };

  const handleRemoveProfileField = (fieldKey: string) => {
    if (isImmutableField(fieldKey)) {
      message.warning("Pertanyaan ini tidak dapat dihapus!");
      return;
    }

    setSelectedBasicFields(selectedBasicFields.filter((key) => key !== fieldKey));
    message.success("Pertanyaan berhasil dihapus!");
  };

  const handleMoveProfileField = (fieldKey: string, direction: "up" | "down") => {
    const currentIndex = selectedBasicFields.findIndex((key) => key === fieldKey);
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

  const handleToggleRequiredField = (fieldKey: string, required: boolean) => {
    if (isImmutableField(fieldKey)) {
      message.warning("Status wajib untuk pertanyaan ini tidak dapat diubah!");
      return;
    }

    onRequiredFieldChange?.(fieldKey, required);
  };

  return {
    editingField,
    setEditingField,
    editingSectionKey,
    setEditingSectionKey,
    fieldModalVisible,
    setFieldModalVisible,
    basicFieldModalVisible,
    setBasicFieldModalVisible,
    handleOpenBasicFieldModal,
    handleAddSection,
    handleDeleteSection,
    handleUpdateSectionName,
    handleMoveSection,
    handleAddCustomField,
    handleEditCustomField,
    handleSaveCustomField,
    handleDeleteCustomField,
    handleAddProfileDataFromTemplate,
    handleRemoveProfileField,
    handleMoveProfileField,
    handleToggleRequiredField,
    handleDuplicateField,
    handleMoveField,
  };
};
