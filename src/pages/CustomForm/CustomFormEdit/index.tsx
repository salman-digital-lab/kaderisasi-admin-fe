import React, { useState } from "react";
import { Card, Form, Button, Space, Typography, Spin, Tabs } from "antd";
import { SaveOutlined, FormOutlined } from "@ant-design/icons";

import { BasicInfoTab, SchemaTab, FieldModal } from "./components";
import { useFormData, useFieldManagement } from "./hooks";
import {
  FIELD_TYPES,
  FIELD_CATEGORIES,
  PROFILE_DATA_CATEGORIES,
  PROFILE_DATA_TEMPLATES,
} from "./constants";
import { fieldTypeNeedsOptions } from "./utils";

const { Text } = Typography;
const { TabPane } = Tabs;

const CustomFormEdit: React.FC = () => {
  const [form] = Form.useForm();
  const [editingField, setEditingField] = useState<any>(null);

  // Use custom hooks
  const {
    initialData,
    selectedBasicFields,
    setSelectedBasicFields,
    customFields,
    setCustomFields,
    profileFieldRequiredOverrides,
    activeTab,
    handleTabChange,
    handleRequiredFieldChange,
    fetchLoading,
    updateLoading,
  } = useFormData();

  const {
    editingField: fieldEditingField,
    fieldModalVisible,
    setFieldModalVisible,
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
  } = useFieldManagement(
    customFields,
    setCustomFields,
    selectedBasicFields,
    setSelectedBasicFields,
    [...PROFILE_DATA_TEMPLATES],
    handleRequiredFieldChange,
  );

  // Update local editingField state when it changes from the hook
  React.useEffect(() => {
    setEditingField(fieldEditingField);
  }, [fieldEditingField, setEditingField]);

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
            onClick={() => form.submit()}
          >
            Simpan Perubahan
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} type="card">
          <TabPane tab="Informasi Dasar" key="basic">
            <BasicInfoTab form={form} initialData={initialData} />
          </TabPane>
          <TabPane tab="Ubah Formulir" key="schema">
            <SchemaTab
              selectedBasicFields={selectedBasicFields}
              customFields={customFields}
              profileDataCategories={[...PROFILE_DATA_CATEGORIES]}
              profileDataTemplates={[...PROFILE_DATA_TEMPLATES]}
              fieldTypes={[...FIELD_TYPES]}
              fieldCategories={[...FIELD_CATEGORIES]}
              profileFieldRequiredOverrides={profileFieldRequiredOverrides}
              onAddProfileField={handleAddProfileDataFromTemplate}
              onRemoveProfileField={handleRemoveProfileField}
              onMoveProfileField={handleMoveProfileField}
              onToggleRequiredField={handleToggleRequiredField}
              onAddCustomField={handleAddCustomField}
              onEditCustomField={handleEditCustomField}
              onDeleteCustomField={handleDeleteCustomField}
              onDuplicateField={handleDuplicateField}
              onMoveCustomField={handleMoveField}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Field Modal */}
      <FieldModal
        visible={fieldModalVisible}
        editingField={editingField}
        fieldTypes={[...FIELD_TYPES]}
        onCancel={() => {
          setFieldModalVisible(false);
          setEditingField(null);
        }}
        onSave={handleSaveCustomField}
        onFieldTypeChange={(value) => {
          setEditingField((prev: any) => {
            if (!prev) return prev;
            const updated = { ...prev, type: value };
            if (!fieldTypeNeedsOptions(value)) {
              updated.options = [];
            }
            return updated;
          });
        }}
      />
    </Space>
  );
};

export default CustomFormEdit;
