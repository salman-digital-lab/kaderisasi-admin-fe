import { useEffect, useState, type ReactElement } from "react";
import { flushSync } from "react-dom";
import {
  Affix,
  Alert,
  Button,
  ConfigProvider,
  Form,
  Space,
  Spin,
  Tabs,
  Typography,
  Select,
} from "antd";
import { FlowWorkspace } from "./components/FlowWorkspace";
import { ResponsesTab } from "./components/ResponsesTab";
import { ResponsiveDialog } from "../../../components/common/Responsive/ResponsiveDialog";
import DetailShortLink from "../../../components/common/ShortLinks/DetailShortLink";
import { getCertificatePublicBaseUrl } from "../../DigitalCertificate/utils/certificate-content";
import { toggleCustomFormActive } from "../../../api/services/customForm";
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
import { BuilderHelp } from "./components/BuilderHelp";
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
const BUILDER_THEME = {
  token: { motion: false, colorPrimary: "#087da7", colorLink: "#096c92" },
};

export default function CustomFormEdit(): ReactElement {
  const [form] = Form.useForm<Values>();
  const watched = Form.useWatch([], { form, preserve: true }) as
    | Values
    | undefined;
  const [basicDirty, setBasicDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>();
  const [failure, setFailure] = useState("");
  const [recovery, setRecovery] = useState<BuilderRecovery | null>(null);
  const [recoveryLoaded, setRecoveryLoaded] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [toolbarElement, setToolbarElement] = useState<HTMLElement | null>(
    null,
  );
  const [toolbarHeight, setToolbarHeight] = useState(100);
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
    initialData?.feature_type === "independent_form",
  );
  const recoveryKey =
    user && initialData ? `form-builder:v1:${user.id}:${initialData.id}` : "";
  const schema = data.buildSchema();
  const schemaText = JSON.stringify(schema);
  const valuesText = JSON.stringify(watched);
  const dirty = basicDirty || schemaDirty;

  useEffect(() => {
    if (!toolbarElement) return;
    const observer = new ResizeObserver(([entry]) => {
      setToolbarHeight(entry.target.getBoundingClientRect().height);
    });
    observer.observe(toolbarElement);
    return () => observer.disconnect();
  }, [toolbarElement]);

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
    setDraftStatus("Menyimpan draf di perangkat ini...");
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
    setFailure(
      issues[0].sectionId
        ? "Periksa daftar perbaikan pada bagian yang ditandai. Perubahan belum disimpan."
        : issues[0].message,
    );
    setActiveSectionId(issues[0].sectionId);
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
      independent={initialData.feature_type === "independent_form"}
      selectedBasicFields={selectedBasicFields}
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
    <ConfigProvider
      theme={BUILDER_THEME}
      dropdown={{ className: "builder-popup" }}
      select={{ classNames: { popup: { root: "builder-popup" } } }}
    >
      <div className="form-builder-page guided-page">
        <UnsavedChangesGuard dirty={dirty} />
        <Affix offsetTop={48}>
          <header ref={setToolbarElement} className="builder-toolbar">
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
                  onClick={() =>
                    navigate(`/club/${clubId}?section=registration`)
                  }
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
              {initialData.feature_type === "independent_form" && (
                <Button onClick={() => setShareOpen(true)}>Bagikan</Button>
              )}
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
          tabBarExtraContent={
            <BuilderHelp title="Panduan formulir" label="Panduan">
              <p>
                <strong>Data diri</strong> menyediakan isian bawaan untuk
                identitas, kontak, domisili, dan pendidikan peserta.
              </p>
              <p>
                <strong>Pertanyaan kustom</strong> digunakan untuk kebutuhan
                khusus kegiatan atau klub, seperti motivasi dan pilihan sesi.
              </p>
              <p>
                <strong>Bagian</strong> mengelompokkan pertanyaan. Gunakan{" "}
                <strong>Alur setelah bagian</strong> jika peserta perlu melihat
                bagian berbeda sesuai jawabannya.
              </p>
              <p>
                <strong>Pratinjau</strong> mencoba formulir tanpa mengirim
                pendaftaran. Draf di perangkat belum tersimpan ke server; pilih{" "}
                <strong>Simpan Perubahan</strong> untuk menerapkan perubahan.
              </p>
            </BuilderHelp>
          }
          items={[
            {
              key: "basic",
              label: "Pengaturan",
              forceRender: true,
              children: (
                <>
                  <BasicInfoTab
                    form={form}
                    initialData={initialData}
                    onSave={() => void handleSave()}
                    onChange={() => setBasicDirty(true)}
                  />
                  {initialData.feature_type === "independent_form" && (
                    <div className="builder-settings">
                      <label className="builder-control">
                        Siapa yang dapat mengisi?
                        <Select
                          aria-label="Akses formulir"
                          value={data.accessMode}
                          options={[
                            {
                              value: "public",
                              label: "Siapa saja yang memiliki tautan",
                            },
                            {
                              value: "members",
                              label: "Anggota yang sudah masuk",
                            },
                          ]}
                          onChange={(mode) => {
                            data.setAccessMode(mode);
                            setBasicDirty(true);
                          }}
                        />
                      </label>
                      <p>
                        Data diri opsional. Jawaban tidak mengubah profil
                        anggota.
                      </p>
                      <p role="status">
                        {initialData.is_active
                          ? "Sedang menerima respons"
                          : "Penerimaan respons ditutup"}
                      </p>
                      <Button
                        loading={toggling}
                        disabled={dirty}
                        onClick={() => {
                          setToggling(true);
                          void toggleCustomFormActive(initialData.id)
                            .then(data.setInitialData)
                            .catch((error: unknown) =>
                              setFailure(actionError(error)),
                            )
                            .finally(() => setToggling(false));
                        }}
                      >
                        {initialData.is_active
                          ? "Tutup penerimaan respons"
                          : "Buka penerimaan respons"}
                      </Button>
                      {dirty && (
                        <p className="builder-hint">
                          Simpan perubahan sebelum membuka atau menutup
                          penerimaan respons.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ),
            },
            {
              key: "schema",
              label: "Pertanyaan",
              children: (
                <BuilderCanvas
                  toolbarBottom={48 + toolbarHeight}
                  sections={customFieldSections}
                  onChange={setCustomFieldSections}
                  profile={profile}
                  profileCount={selectedBasicFields.length}
                  activeSectionId={activeSectionId}
                  onSelectSection={setActiveSectionId}
                  onOpenFlow={() => handleTabChange("flow")}
                />
              ),
            },
            {
              key: "flow",
              label: "Alur",
              children: (
                <FlowWorkspace
                  key={activeSectionId ?? "flow"}
                  selectedSectionId={activeSectionId}
                  sections={customFieldSections}
                  onChange={setCustomFieldSections}
                  onEdit={(id) => {
                    setActiveSectionId(id);
                    handleTabChange("schema");
                  }}
                />
              ),
            },
            ...(initialData.feature_type === "independent_form"
              ? [
                  {
                    key: "responses",
                    label: "Respons",
                    children: <ResponsesTab formId={initialData.id} />,
                  },
                ]
              : []),
          ].sort(
            (a, b) =>
              ["schema", "flow", "responses", "basic"].indexOf(a.key) -
              ["schema", "flow", "responses", "basic"].indexOf(b.key),
          )}
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
            independent={initialData.feature_type === "independent_form"}
            schema={schema}
            title={watched?.formName || initialData.form_name}
            description={watched?.formDescription}
            completionMessage={watched?.postSubmissionInfo}
            onClose={() => setPreviewOpen(false)}
          />
        )}
        <ResponsiveDialog
          open={shareOpen}
          onCancel={() => setShareOpen(false)}
          title="Bagikan formulir"
          footer={null}
        >
          <p>
            {initialData.is_active
              ? "Formulir menerima respons."
              : "Formulir ditutup. Buka penerimaan respons di Pengaturan sebelum membagikannya."}
          </p>
          {dirty && (
            <Alert
              type="info"
              title="Tautan menampilkan versi yang terakhir disimpan."
            />
          )}
          {getCertificatePublicBaseUrl() ? (
            <>
              <Typography.Paragraph
                copyable
              >{`${getCertificatePublicBaseUrl()}/form/${initialData.id}`}</Typography.Paragraph>
              <Button
                href={`${getCertificatePublicBaseUrl()}/form/${initialData.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka formulir
              </Button>
              <DetailShortLink
                allowCustomCode
                path={`/form/${initialData.id}`}
                published={initialData.is_active}
              />
            </>
          ) : (
            <Alert
              type="warning"
              title="Alamat situs publik belum dikonfigurasi."
            />
          )}
        </ResponsiveDialog>
      </div>
    </ConfigProvider>
  );
}
