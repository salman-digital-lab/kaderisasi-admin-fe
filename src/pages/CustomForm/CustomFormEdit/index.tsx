import { validateFieldsAndFocus } from "../../../components/common/Responsive/validate-fields";
import React, { useState } from "react";
import { flushSync } from "react-dom";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import { PageHeader } from "../../../components/common/Responsive/PageHeader";
import { Form, Button, Space, Typography, Spin, Tabs } from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  BasicInfoTab,
  SchemaTab,
  FieldModal,
  BasicFieldModal,
} from "./components";
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
  const [basicDirty, setBasicDirty] = useState(false);
  const navigate = useNavigate();
  const { clubId, activityId } = useParams<{
    clubId?: string;
    activityId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const returnToSetup = !!activityId && searchParams.get("setup") === "1";

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
    schemaDirty,
    markSchemaSaved,
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
      const values = await validateFieldsAndFocus(form);
      await updateForm(values);
      flushSync(() => {
        setBasicDirty(false);
        markSchemaSaved();
      });
      if (returnToSetup) navigate(`/activity/${activityId}/setup?step=2`);
    } catch (error) {
      handleTabChange("basic");
      requestAnimationFrame(() => {
        const first = form
          .getFieldsError()
          .find((field) => field.errors.length);
        if (first) form.scrollToField(first.name, { focus: true });
      });
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
      forceRender: true,
      label: "Informasi Dasar",
      children: (
        <BasicInfoTab
          form={form}
          initialData={initialData}
          onSave={() => void handleSave()}
          onChange={() => setBasicDirty(true)}
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
      <UnsavedChangesGuard dirty={basicDirty || schemaDirty} />
      {/* Form Card */}
      {/* Form Container */}
      <div style={{ background: "#fff", padding: "16px", borderRadius: "8px" }}>
        <div
          className="form-builder-toolbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {activityId && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() =>
                  navigate(
                    returnToSetup
                      ? `/activity/${activityId}/setup?step=2`
                      : `/activity/${activityId}?tab=7`,
                  )
                }
              >
                Kembali ke kegiatan
              </Button>
            )}
            {clubId && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/club/${clubId}?section=registration`)}
              >
                Kembali ke Pendaftaran Klub
              </Button>
            )}
            <PageHeader
              title={
                <>
                  <FormOutlined
                    style={{ color: "#1890ff", fontSize: "20px" }}
                  />
                  <Text strong style={{ fontSize: "16px" }}>
                    Ubah Form Kustom - {initialData.form_name}
                  </Text>
                </>
              }
            />
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={updateLoading}
            onClick={handleSave}
          >
            Simpan Perubahan
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          items={tabItems}
        />
      </div>

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
