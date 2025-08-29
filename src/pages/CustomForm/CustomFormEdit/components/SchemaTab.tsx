import React from "react";
import { Space } from "antd";
import { ProfileFieldsSection } from "./ProfileFieldsSection";
import { CustomFieldsSection } from "./CustomFieldsSection";
import type { FormField } from "../../../../types/model/customForm";

interface SchemaTabProps {
  selectedBasicFields: string[];
  customFields: FormField[];
  profileDataCategories: any[];
  profileDataTemplates: any[];
  fieldTypes: any[];
  fieldCategories: any[];
  profileFieldRequiredOverrides?: Record<string, boolean>;
  onAddProfileField: (template: any) => void;
  onRemoveProfileField: (fieldKey: string) => void;
  onMoveProfileField: (fieldKey: string, direction: "up" | "down") => void;
  onToggleRequiredField?: (fieldKey: string, required: boolean) => void;
  onAddCustomField: () => void;
  onEditCustomField: (field: FormField) => void;
  onDeleteCustomField: (fieldKey: string) => void;
  onDuplicateField: (field: FormField) => void;
  onMoveCustomField: (fieldKey: string, direction: "up" | "down") => void;
}

export const SchemaTab: React.FC<SchemaTabProps> = ({
  selectedBasicFields,
  customFields,
  profileDataCategories,
  profileDataTemplates,
  fieldTypes,
  fieldCategories,
  profileFieldRequiredOverrides,
  onAddProfileField,
  onRemoveProfileField,
  onMoveProfileField,
  onToggleRequiredField,
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
        onAddProfileField={onAddProfileField}
        onRemoveProfileField={onRemoveProfileField}
        onMoveProfileField={onMoveProfileField}
        onToggleRequiredField={onToggleRequiredField}
      />

      <CustomFieldsSection
        customFields={customFields}
        fieldTypes={fieldTypes}
        fieldCategories={fieldCategories}
        onAddField={onAddCustomField}
        onEditField={onEditCustomField}
        onDeleteField={onDeleteCustomField}
        onDuplicateField={onDuplicateField}
        onMoveField={onMoveCustomField}
      />
    </Space>
  );
};
