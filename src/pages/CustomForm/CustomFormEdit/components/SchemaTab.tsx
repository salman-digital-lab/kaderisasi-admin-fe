import React from "react";
import { Space, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProfileFieldsSection } from "./ProfileFieldsSection";
import { CustomFieldsSection } from "./CustomFieldsSection";
import type { FormField, FormSection } from "../../../../types/model/customForm";

export interface SchemaTabProps {
  selectedBasicFields: string[];
  customFieldSections: FormSection[];
  profileDataCategories: readonly any[];
  profileDataTemplates: readonly any[];
  fieldTypes: readonly any[];
  fieldCategories: readonly any[];
  profileFieldRequiredOverrides?: Record<string, boolean>;
  onRemoveProfileField: (fieldKey: string) => void;
  onMoveProfileField: (fieldKey: string, direction: "up" | "down") => void;
  onToggleRequiredField?: (fieldKey: string, required: boolean) => void;
  onOpenBasicFieldModal: () => void;
  onAddSection: () => void;
  onDeleteSection: (sectionKey: string) => void;
  onMoveSection: (sectionKey: string, direction: "up" | "down") => void;
  onUpdateSectionName: (sectionKey: string, newName: string) => void;
  onAddCustomField: (sectionKey: string) => void;
  onEditCustomField: (sectionKey: string, field: FormField) => void;
  onDeleteCustomField: (sectionKey: string, fieldKey: string) => void;
  onDuplicateField: (sectionKey: string, field: FormField) => void;
  onMoveCustomField: (sectionKey: string, fieldKey: string, direction: "up" | "down") => void;
}

export const SchemaTab: React.FC<SchemaTabProps> = ({
  selectedBasicFields,
  customFieldSections,
  profileDataCategories,
  profileDataTemplates,
  fieldTypes,
  fieldCategories,
  profileFieldRequiredOverrides,
  onRemoveProfileField,
  onMoveProfileField,
  onToggleRequiredField,
  onOpenBasicFieldModal,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onUpdateSectionName,
  onAddCustomField,
  onEditCustomField,
  onDeleteCustomField,
  onDuplicateField,
  onMoveCustomField,
}) => {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <ProfileFieldsSection
        selectedBasicFields={selectedBasicFields}
        profileDataCategories={profileDataCategories}
        profileDataTemplates={profileDataTemplates}
        fieldTypes={fieldTypes}
        profileFieldRequiredOverrides={profileFieldRequiredOverrides}
        onRemoveProfileField={onRemoveProfileField}
        onMoveProfileField={onMoveProfileField}
        onToggleRequiredField={onToggleRequiredField}
        onOpenAddModal={onOpenBasicFieldModal}
      />

      {customFieldSections.map((section, index) => (
        <CustomFieldsSection
          key={section.section_name}
          sectionKey={section.section_name}
          sectionNumber={index + 1}
          customFields={section.fields}
          fieldTypes={fieldTypes}
          fieldCategories={fieldCategories}
          isFirst={index === 0}
          isLast={index === customFieldSections.length - 1}
          onAddField={() => onAddCustomField(section.section_name)}
          onEditField={(field) => onEditCustomField(section.section_name, field)}
          onDeleteField={(fieldKey) => onDeleteCustomField(section.section_name, fieldKey)}
          onDuplicateField={(field) => onDuplicateField(section.section_name, field)}
          onMoveField={(fieldKey, direction) => onMoveCustomField(section.section_name, fieldKey, direction)}
          onDeleteSection={() => onDeleteSection(section.section_name)}
          onMoveSection={(direction) => onMoveSection(section.section_name, direction)}
          onUpdateSectionName={(newName) => onUpdateSectionName(section.section_name, newName)}
        />
      ))}

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={onAddSection}
        size="large"
        style={{ marginTop: customFieldSections.length > 0 ? "8px" : "0" }}
      >
        Tambah Grup Pertanyaan
      </Button>
    </Space>
  );
};
