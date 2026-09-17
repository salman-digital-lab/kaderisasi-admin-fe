import { useState } from "react";
import { notification } from "antd";
import type {
  FormField,
  FormSection,
} from "../../../../types/model/customForm";
import {
  createNewField,
  moveArrayItem,
  fieldExists,
  generateFieldKey,
} from "../utils";

// Constants for default fields that cannot be modified
const IMMUTABLE_FIELDS = ["name", "gender"] as const;

// City fields that require their parent province field to be present first
const CITY_REQUIRES_PROVINCE: Record<string, string> = {
  city_id: "province_id",
  origin_city_id: "origin_province_id",
};

// Province fields whose removal should cascade to their city field
const PROVINCE_CASCADES_TO_CITY: Record<string, string> = {
  province_id: "city_id",
  origin_province_id: "origin_city_id",
};

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
  onRequiredFieldChange?: (fieldKey: string, required: boolean) => void,
  independent = false,
) => {
  const immutable = (key: string): boolean =>
    !independent && isImmutableField(key);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(
    null,
  );
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
      (section) => section.section_name !== "profile_data",
    ).length;

    // Generate sequential section name
    const nextSectionNumber = customSectionCount + 1;
    const sectionKey = `Bagian ${nextSectionNumber}`;

    const newSection: FormSection = {
      section_name: sectionKey,
      fields: [],
    };
    setCustomFieldSections([...customFieldSections, newSection]);
  };

  const handleDeleteSection = (sectionKey: string) => {
    setCustomFieldSections(
      customFieldSections.filter(
        (section) => section.section_name !== sectionKey,
      ),
    );
  };

  const handleUpdateSectionName = (sectionKey: string, newName: string) => {
    setCustomFieldSections(
      customFieldSections.map((section) =>
        section.section_name === sectionKey
          ? { ...section, section_name: newName }
          : section,
      ),
    );
  };

  const handleMoveSection = (sectionKey: string, direction: "up" | "down") => {
    const currentIndex = customFieldSections.findIndex(
      (section) => section.section_name === sectionKey,
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= customFieldSections.length) return;

    const newSections = moveArrayItem(
      customFieldSections,
      currentIndex,
      newIndex,
    );
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
      (s) => s.section_name === editingSectionKey,
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
                  field.key === editingField.key ? fieldData : field,
                ),
              }
            : s,
        ),
      );
    } else {
      setCustomFieldSections(
        customFieldSections.map((s) =>
          s.section_name === editingSectionKey
            ? { ...s, fields: [...s.fields, fieldData] }
            : s,
        ),
      );
    }

    setFieldModalVisible(false);
    setEditingField(null);
    setEditingSectionKey(null);
  };

  const handleDeleteCustomField = (sectionKey: string, fieldKey: string) => {
    const section = customFieldSections.find(
      (s) => s.section_name === sectionKey,
    );
    if (!section) {
      notification.error({
        message: "Bagian tidak ditemukan",
        description:
          "Pilih kembali bagian dari daftar Isi formulir sebelum menghapus pertanyaan.",
      });
      return;
    }

    const fieldToDelete = section.fields.find(
      (field) => field.key === fieldKey,
    );
    if (!fieldToDelete) {
      notification.error({
        message: "Pertanyaan tidak ditemukan",
        description: "Pilih kembali pertanyaan pada bagian yang sedang dibuka.",
      });
      return;
    }

    setCustomFieldSections(
      customFieldSections.map((s) =>
        s.section_name === sectionKey
          ? { ...s, fields: s.fields.filter((field) => field.key !== fieldKey) }
          : s,
      ),
    );
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
          : s,
      ),
    );
  };

  const handleMoveField = (
    sectionKey: string,
    fieldKey: string,
    direction: "up" | "down",
  ) => {
    const section = customFieldSections.find(
      (s) => s.section_name === sectionKey,
    );
    if (!section) return;

    const currentIndex = section.fields.findIndex(
      (field) => field.key === fieldKey,
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= section.fields.length) return;

    const newFields = moveArrayItem(section.fields, currentIndex, newIndex);
    setCustomFieldSections(
      customFieldSections.map((s) =>
        s.section_name === sectionKey ? { ...s, fields: newFields } : s,
      ),
    );
  };

  // ===== Profile Field Operations =====

  const handleAddProfileDataFromTemplate = (template: any) => {
    if (selectedBasicFields.includes(template.field.key)) {
      notification.info({
        message: "Isian sudah tersedia",
        description:
          "Buka Data diri untuk mengatur isian yang sudah ditambahkan.",
      });
      return;
    }

    const requiredProvince = CITY_REQUIRES_PROVINCE[template.field.key];
    if (requiredProvince && !selectedBasicFields.includes(requiredProvince)) {
      const provinceLabel =
        requiredProvince === "province_id"
          ? "Provinsi Domisili"
          : "Provinsi Asal";
      notification.warning({
        message: `Tambahkan "${provinceLabel}" terlebih dahulu agar pilihan kota dapat dimuat.`,
      });
      return;
    }

    setSelectedBasicFields([...selectedBasicFields, template.field.key]);
  };

  const handleRemoveProfileField = (fieldKey: string) => {
    if (immutable(fieldKey)) {
      notification.warning({
        message: "Isian identitas harus tetap tersedia",
        description:
          "Nama dan jenis kelamin diperlukan untuk pendaftaran kegiatan atau klub dan tidak dapat dihapus.",
      });
      return;
    }

    const dependentCity = PROVINCE_CASCADES_TO_CITY[fieldKey];
    const keysToRemove = new Set([
      fieldKey,
      ...(dependentCity ? [dependentCity] : []),
    ]);
    setSelectedBasicFields(
      selectedBasicFields.filter((key) => !keysToRemove.has(key)),
    );

    if (dependentCity && selectedBasicFields.includes(dependentCity)) {
      notification.info({
        message: `Field kota terkait juga dihapus secara otomatis.`,
      });
    }
  };

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

  const handleToggleRequiredField = (fieldKey: string, required: boolean) => {
    if (immutable(fieldKey)) {
      notification.warning({
        message: "Isian identitas harus tetap wajib",
        description:
          "Nama dan jenis kelamin diperlukan untuk pendaftaran kegiatan atau klub.",
      });
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
