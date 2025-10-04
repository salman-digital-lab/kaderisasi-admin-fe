import React from "react";
import { Card, Form, Button, Space, Typography, Spin, Tabs } from "antd";
import { SaveOutlined, FormOutlined } from "@ant-design/icons";

import { BasicInfoTab, SchemaTab, FieldModal, BasicFieldModal } from "./components";
import { useFormData, useFieldManagement } from "./hooks";
import {
  FIELD_TYPES,
  FIELD_CATEGORIES,
  PROFILE_DATA_CATEGORIES,
  PROFILE_DATA_TEMPLATES,
} from "./constants";
import { fieldTypeNeedsOptions } from "./utils";

const { Text } = Typography;

const CustomFormEdit: React.FC = () => {
  const [form] = Form.useForm();

  // Fetch and manage form data
  const {
    initialData,
    selectedBasicFields,
    setSelectedBasicFields,
    customFieldSections,
    setCustomFieldSections,
    profileFieldRequiredOverrides,
    activeTab,
    handleTabChange,
    handleRequiredFieldChange,
    fetchLoading,
    updateLoading,
    updateForm,
  } = useFormData();

  // Manage field operations (add, edit, delete, move, etc.)
  const fieldManagement = useFieldManagement(
    customFieldSections,
    setCustomFieldSections,
    selectedBasicFields,
    setSelectedBasicFields,
    PROFILE_DATA_TEMPLATES,
    handleRequiredFieldChange,
  );

  // Handle field type change
  const handleFieldTypeChange = (value: string) => {
    fieldManagement.setEditingField((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, type: value };
      if (!fieldTypeNeedsOptions(value)) {
        updated.options = [];
      }
      return updated;
    });
  };

  // Handle closing field modal
  const handleCloseFieldModal = () => {
    fieldManagement.setFieldModalVisible(false);
    fieldManagement.setEditingField(null);
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await updateForm(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Loading state
  if (fetchLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Empty state
  if (!initialData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Text type="secondary">Form tidak ditemukan</Text>
      </div>
    );
  }

  const tabItems = [
    {
      key: "basic",
      label: "Informasi Dasar",
      children: (
        <BasicInfoTab 
          form={form} 
          initialData={initialData} 
          onSave={updateForm} 
        />
      ),
    },
    {
      key: "schema",
      label: "Ubah Formulir",
      children: (
        <SchemaTab
          selectedBasicFields={selectedBasicFields}
          customFieldSections={customFieldSections}
          profileDataCategories={PROFILE_DATA_CATEGORIES}
          profileDataTemplates={PROFILE_DATA_TEMPLATES}
          fieldTypes={FIELD_TYPES}
          fieldCategories={FIELD_CATEGORIES}
          profileFieldRequiredOverrides={profileFieldRequiredOverrides}
          onRemoveProfileField={fieldManagement.handleRemoveProfileField}
          onMoveProfileField={fieldManagement.handleMoveProfileField}
          onToggleRequiredField={fieldManagement.handleToggleRequiredField}
          onOpenBasicFieldModal={fieldManagement.handleOpenBasicFieldModal}
          onAddSection={fieldManagement.handleAddSection}
          onDeleteSection={fieldManagement.handleDeleteSection}
          onMoveSection={fieldManagement.handleMoveSection}
          onUpdateSectionName={fieldManagement.handleUpdateSectionName}
          onAddCustomField={fieldManagement.handleAddCustomField}
          onEditCustomField={fieldManagement.handleEditCustomField}
          onDeleteCustomField={fieldManagement.handleDeleteCustomField}
          onDuplicateField={fieldManagement.handleDuplicateField}
          onMoveCustomField={fieldManagement.handleMoveField}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      {/* Form Card */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FormOutlined style={{ color: "#1890ff" }} />
            <span>Ubah Form Kustom - {initialData.form_name}</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={updateLoading}
            onClick={handleSave}
          >
            Simpan Perubahan
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          items={tabItems}
        />
      </Card>

      {/* Basic Field Modal */}
      <BasicFieldModal
        visible={fieldManagement.basicFieldModalVisible}
        selectedBasicFields={selectedBasicFields}
        profileDataCategories={PROFILE_DATA_CATEGORIES}
        profileDataTemplates={PROFILE_DATA_TEMPLATES}
        onCancel={() => fieldManagement.setBasicFieldModalVisible(false)}
        onAddProfileField={fieldManagement.handleAddProfileDataFromTemplate}
      />

      {/* Field Modal */}
      <FieldModal
        visible={fieldManagement.fieldModalVisible}
        editingField={fieldManagement.editingField}
        fieldTypes={FIELD_TYPES}
        onCancel={handleCloseFieldModal}
        onSave={fieldManagement.handleSaveCustomField}
        onFieldTypeChange={handleFieldTypeChange}
      />
    </Space>
  );
};

export default CustomFormEdit;
