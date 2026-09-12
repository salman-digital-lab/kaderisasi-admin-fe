import { useEffect, useState, type ReactElement } from "react";
import { flushSync } from "react-dom";
import {
  Affix,
  Alert,
  Button,
  Form,
  Space,
  Spin,
  Tabs,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import { validateFieldsAndFocus } from "../../../components/common/Responsive/validate-fields";
import { useUser } from "../../../stores/authStore";
import { actionError } from "../../../utils/action-error";
import {
  BasicInfoTab,
  BasicFieldModal,
  ProfileFieldsSection,
} from "./components";
import { BuilderCanvas } from "./components/BuilderCanvas";
import { FormPreview } from "./components/FormPreview";
import { useFormData, useFieldManagement } from "./hooks";
import {
  FIELD_TYPES,
  PROFILE_DATA_CATEGORIES,
  PROFILE_DATA_TEMPLATES,
} from "./constants";
import {
  builderIssues,
  readRecovery,
  type BuilderRecovery,
} from "./utils/builder-state";
import "../../../styles/guided-workflows.css";
import "./builder.css";

type Values = BuilderRecovery["values"];

export default function CustomFormEdit(): ReactElement {
  const [form] = Form.useForm<Values>();
  const watched = Form.useWatch([], { form, preserve: true }) as
    | Values
    | undefined;
  const [basicDirty, setBasicDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [failure, setFailure] = useState("");
  const [recovery, setRecovery] = useState<BuilderRecovery | null>(null);
  const [recoveryLoaded, setRecoveryLoaded] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const user = useUser();
  const navigate = useNavigate();
  const { clubId, activityId } = useParams<{
    clubId?: string;
    activityId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const returnToSetup = !!activityId && searchParams.get("setup") === "1";
  const data = useFormData();
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
  } = data;
  const fields = useFieldManagement(
    customFieldSections,
    setCustomFieldSections,
    selectedBasicFields,
    setSelectedBasicFields,
    PROFILE_DATA_TEMPLATES,
    handleRequiredFieldChange,
  );
  const recoveryKey =
    user && initialData ? `form-builder:v1:${user.id}:${initialData.id}` : "";
  const schema = data.buildSchema();
  const schemaText = JSON.stringify(schema);
  const valuesText = JSON.stringify(watched);
  const dirty = basicDirty || schemaDirty;

  useEffect(() => {
    if (!recoveryKey || recoveryLoaded === recoveryKey) return;
    setRecovery(readRecovery(recoveryKey));
    setRecoveryLoaded(recoveryKey);
  }, [recoveryKey, recoveryLoaded]);

  useEffect(() => {
    if (
      !recoveryKey ||
      recoveryLoaded !== recoveryKey ||
      recovery ||
      !dirty ||
      !initialData ||
      !valuesText ||
      updateLoading
    )
      return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          recoveryKey,
          JSON.stringify({
            version: 1,
            updatedAt: initialData.updated_at,
            savedAt: Date.now(),
            schema: JSON.parse(schemaText),
            values: JSON.parse(valuesText),
          } satisfies BuilderRecovery),
        );
        setDraftStatus("Draf tersimpan di perangkat ini");
      } catch {
        setDraftStatus(
          "Draf lokal tidak tersedia. Simpan perubahan sebelum meninggalkan halaman.",
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    recoveryKey,
    recoveryLoaded,
    recovery,
    dirty,
    initialData,
    valuesText,
    schemaText,
    updateLoading,
  ]);

  const clearRecovery = (): void => {
    try {
      if (recoveryKey) localStorage.removeItem(recoveryKey);
    } catch {
      /* Saving to the server remains available without local storage. */
    }
    setRecovery(null);
    setDraftStatus("");
  };
  const checkSchema = (): boolean => {
    const issues = builderIssues(schema);
    if (!issues.length) return true;
    setFailure(issues[0].message);
    handleTabChange("schema");
    requestAnimationFrame(() =>
      document
        .getElementById(`builder-section-${issues[0].sectionId}`)
        ?.focus(),
    );
    return false;
  };
  const handleSave = async (): Promise<void> => {
    setFailure("");
    if (!checkSchema()) return;
    let values: Values;
    try {
      values = await validateFieldsAndFocus(form);
    } catch {
      handleTabChange("basic");
      return;
    }
    try {
      await updateForm({
        ...values,
        formDescription: values.formDescription ?? "",
        postSubmissionInfo: values.postSubmissionInfo ?? "",
      });
      clearRecovery();
      flushSync(() => {
        setBasicDirty(false);
        markSchemaSaved();
      });
      if (returnToSetup) navigate(`/activity/${activityId}/setup?step=2`);
    } catch (error) {
      setFailure(actionError(error));
    }
  };

  if (fetchLoading)
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin size="large" aria-label="Memuat formulir" />
      </div>
    );
  if (!initialData)
    return (
      <Alert
        type="error"
        title="Formulir belum dapat dimuat"
        description="Periksa koneksi dan akses Anda, lalu coba kembali."
        action={
          <Button onClick={() => window.location.reload()}>Coba lagi</Button>
        }
      />
    );

  const profile = (
    <ProfileFieldsSection
      selectedBasicFields={selectedBasicFields}
      profileDataCategories={PROFILE_DATA_CATEGORIES}
      profileDataTemplates={PROFILE_DATA_TEMPLATES}
      fieldTypes={FIELD_TYPES}
      profileFieldRequiredOverrides={profileFieldRequiredOverrides}
      onRemoveProfileField={fields.handleRemoveProfileField}
      onMoveProfileField={fields.handleMoveProfileField}
      onToggleRequiredField={fields.handleToggleRequiredField}
      onOpenAddModal={fields.handleOpenBasicFieldModal}
    />
  );
  return (
    <div className="form-builder-page guided-page">
      <UnsavedChangesGuard dirty={dirty} />
      <Affix offsetTop={48}>
        <header className="builder-toolbar">
          <div className="builder-toolbar-title">
            {activityId && (
              <Button
                type="text"
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
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/club/${clubId}?section=registration`)}
              >
                Kembali ke Pendaftaran Klub
              </Button>
            )}
            <Typography.Title level={2} style={{ margin: 0, fontSize: 20 }}>
              {watched?.formName || initialData.form_name}
            </Typography.Title>
            <Typography.Text
              type="secondary"
              role="status"
              aria-label="Status penyimpanan"
            >
              {updateLoading
                ? "Menyimpan perubahan..."
                : dirty
                  ? draftStatus || "Ada perubahan belum disimpan"
                  : "Semua perubahan tersimpan"}
            </Typography.Text>
          </div>
          <div className="builder-toolbar-actions">
            <Button
              aria-label="Pratinjau"
              icon={<EyeOutlined />}
              disabled={updateLoading}
              onClick={() => {
                setFailure("");
                if (checkSchema()) setPreviewOpen(true);
              }}
            >
              Pratinjau
            </Button>
            <Button
              aria-label="Simpan Perubahan"
              type="primary"
              icon={<SaveOutlined />}
              loading={updateLoading}
              disabled={!!recovery}
              onClick={() => void handleSave()}
            >
              Simpan Perubahan
            </Button>
          </div>
        </header>
      </Affix>
      {recovery && (
        <Alert
          type="warning"
          showIcon
          title="Draf yang belum disimpan tersedia"
          description={
            recovery.updatedAt !== initialData.updated_at
              ? "Formulir di server telah berubah sejak draf dibuat. Memulihkan draf akan mengganti isi editor, belum menyimpan ke server."
              : "Pulihkan perubahan terakhir yang tersimpan di perangkat ini."
          }
          action={
            <Space wrap>
              <Button
                onClick={() => {
                  data.restoreSchema(recovery.schema);
                  form.setFieldsValue(recovery.values);
                  setBasicDirty(true);
                  setRecovery(null);
                  handleTabChange("schema");
                }}
              >
                Pulihkan draf
              </Button>
              <Button onClick={clearRecovery}>Buang draf</Button>
            </Space>
          }
        />
      )}
      {failure && (
        <Alert
          type="error"
          showIcon
          title="Perubahan belum disimpan"
          description={failure}
          closable
          onClose={() => setFailure("")}
        />
      )}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: "basic",
            label: "Informasi Dasar",
            forceRender: true,
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
              <BuilderCanvas
                sections={customFieldSections}
                onChange={setCustomFieldSections}
                profile={profile}
              />
            ),
          },
        ]}
      />
      <BasicFieldModal
        visible={fields.basicFieldModalVisible}
        selectedBasicFields={selectedBasicFields}
        profileDataCategories={PROFILE_DATA_CATEGORIES}
        profileDataTemplates={PROFILE_DATA_TEMPLATES}
        onCancel={() => fields.setBasicFieldModalVisible(false)}
        onAddProfileField={fields.handleAddProfileDataFromTemplate}
      />
      {previewOpen && (
        <FormPreview
          schema={schema}
          title={watched?.formName || initialData.form_name}
          description={watched?.formDescription}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
