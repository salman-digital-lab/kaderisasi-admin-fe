import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Button,
  Drawer,
  Input,
  message,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  Alert,
  Splitter,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { isAxiosError } from "axios";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import {
  CertificateCanvas,
  LayerPanel,
  PropertyPanel,
  VariableTextModal,
  CanvasSettingsModal,
} from "../components";
import { useCertificateDesigner } from "../hooks";
import type { CertificateElement, ElementType } from "../types";
import {
  getCertificateTemplate,
  updateCertificateTemplate,
  uploadCertificateAsset,
  updateCertificateTemplateLifecycle,
} from "../../../api/services/certificateTemplate";
import { usePdfPreview } from "./hooks/usePdfPreview";
import styles from "./CertificateDesigner.module.css";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import type { CertificateTemplateStatus } from "../../../types/services/certificateTemplate";
import {
  getCertificateReadiness,
  getCertificateTemplateStatus,
  isCertificateTemplateReady,
  mapBackendReadinessErrors,
} from "../utils/certificate-readiness";
import type { CertificateReadinessIssue } from "../utils/certificate-readiness";
import { ToolRail } from "./ToolRail";
import { ReadinessChecklist } from "./ReadinessChecklist";
import {
  clearRecoverySnapshot,
  DEFAULT_EDITOR_PREFERENCES,
  getServerVersion,
  hasRecoveryConflict,
  readEditorPreferences,
  readRecoverySnapshot,
  writeEditorPreferences,
  writeRecoverySnapshot,
  type EditorPreferences,
  type EditorTool,
  type ViewportPoint,
} from "./editor-state";
import { getCentredElementPosition } from "./viewport-math";

const { Text } = Typography;

const CertificateDesigner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const templateId = Number(id);
  const pageRef = useRef<HTMLElement>(null);

  const {
    template,
    setTemplate,
    selectedElement,
    selectedElementId,
    setBackgroundUrl,
    setCanvasSize,
    addElement,
    updateElement,
    finishHistoryGroup,
    deleteElement,
    moveElement,
    moveElementBy,
    selectElement,
    duplicateElement,
    copyElement,
    pasteElement,
    updateElementOrder,
    reorderElement,
    renameElement,
    toggleElementVisibility,
    toggleElementLock,
    undo,
    redo,
    revision,
  } = useCertificateDesigner();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [templateStatus, setTemplateStatus] =
    useState<CertificateTemplateStatus>("draft");
  const [backgroundImagePath, setBackgroundImagePath] = useState<string | null>(
    null,
  );
  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [canvasSettingsVisible, setCanvasSettingsVisible] = useState(false);
  const [preferences, setPreferences] = useState<EditorPreferences>(() =>
    typeof localStorage === "undefined"
      ? DEFAULT_EDITOR_PREFERENCES
      : readEditorPreferences(),
  );
  const [savedRevision, setSavedRevision] = useState(0);
  const [savedMetadata, setSavedMetadata] = useState("");
  const [serverVersion, setServerVersion] = useState("");
  const [serverIssues, setServerIssues] = useState<CertificateReadinessIssue[]>(
    [],
  );
  const [activeDrawer, setActiveDrawer] = useState<
    "layers" | "inspector" | null
  >(null);
  const [tool, setTool] = useState<EditorTool>("select");
  const [editElementId, setEditElementId] = useState<string | null>(null);
  const viewportCentreRef = useRef<ViewportPoint>({ x: 400, y: 283 });
  const handleViewportCentreChange = useCallback((point: ViewportPoint) => {
    viewportCentreRef.current = point;
  }, []);
  const handleEditComplete = useCallback(() => setEditElementId(null), []);

  const isCompactLayout = useMediaQuery("(max-width: 1279px)");
  const isMobileLayout = useMediaQuery("(max-width: 767px)");

  const { generatePdf, generating } = usePdfPreview();

  const metadataSnapshot = useMemo(
    () =>
      JSON.stringify({
        name: templateName.trim(),
        description: templateDescription,
        backgroundImagePath,
      }),
    [backgroundImagePath, templateDescription, templateName],
  );
  const latestDocumentRef = useRef({ revision, metadataSnapshot });
  latestDocumentRef.current = { revision, metadataSnapshot };

  const isDirty =
    Boolean(savedMetadata) &&
    (revision !== savedRevision || metadataSnapshot !== savedMetadata);
  const snapToGrid = preferences.canvas.snapToGrid;
  const showGrid = preferences.canvas.showGrid;
  const showGuides = preferences.canvas.showGuides;
  const snapToGuides = preferences.canvas.snapToGuides;

  // Load template data on mount
  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      try {
        const data = await getCertificateTemplate(templateId);
        if (!data) throw new Error("Template tidak ditemukan");

        setTemplateName(data.name);
        setTemplateDescription(data.description || "");
        setTemplateStatus(getCertificateTemplateStatus(data));
        const nextServerVersion = getServerVersion(data);
        setServerVersion(nextServerVersion);
        setBackgroundImagePath(data.background_image);
        const nextTemplate = {
          backgroundUrl:
            data.background_image || data.template_data?.backgroundUrl || null,
          elements: data.template_data?.elements || [],
          canvasWidth: data.template_data?.canvasWidth || 800,
          canvasHeight: data.template_data?.canvasHeight || 566,
        };
        setTemplate(nextTemplate);
        setSavedRevision(0);
        setSavedMetadata(
          JSON.stringify({
            name: data.name.trim(),
            description: data.description || "",
            backgroundImagePath: data.background_image,
          }),
        );

        const recovery = readRecoverySnapshot(templateId);
        if (recovery) {
          const conflict = hasRecoveryConflict(recovery, nextServerVersion);
          Modal.confirm({
            title: "Pulihkan perubahan yang belum disimpan?",
            content: conflict
              ? "Template di server berubah sejak snapshot lokal dibuat. Tinjau hasil pemulihan dengan hati-hati; perubahan tidak akan disimpan otomatis."
              : `Snapshot lokal dari ${new Date(recovery.timestamp).toLocaleString("id-ID")} tersedia.`,
            okText: "Pulihkan",
            cancelText: "Buang snapshot",
            onOk: () => {
              setTemplateName(recovery.name);
              setTemplateDescription(recovery.description);
              setBackgroundImagePath(recovery.backgroundImage);
              setTemplate(recovery.template);
              setSavedRevision(-1);
            },
            onCancel: () => clearRecoverySnapshot(templateId),
          });
        }
      } catch {
        message.error("Gagal memuat template");
        navigate("/digital-certificate");
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isInteger(templateId) || templateId <= 0) {
      message.error("Template tidak valid");
      navigate("/digital-certificate");
      return;
    }

    loadTemplate();
  }, [templateId, navigate, setTemplate]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!isDirty) return true;
    if (saving) return false;

    if (!templateName.trim()) {
      message.warning("Nama template tidak boleh kosong");
      return false;
    }

    if (
      templateStatus === "published" &&
      !isCertificateTemplateReady(
        getCertificateReadiness(template, backgroundImagePath),
      )
    ) {
      message.warning(
        "Template terpublikasi hanya dapat disimpan setelah semua masalah wajib diperbaiki.",
      );
      return false;
    }

    setSaving(true);
    setSaveFailed(false);
    try {
      const updated = await updateCertificateTemplate(templateId, {
        name: templateName,
        description: templateDescription || null,
        templateData: template,
        backgroundImage: backgroundImagePath,
      });
      setSavedRevision(revision);
      setSavedMetadata(metadataSnapshot);
      setServerVersion(getServerVersion(updated));
      setServerIssues([]);
      if (
        latestDocumentRef.current.revision === revision &&
        latestDocumentRef.current.metadataSnapshot === metadataSnapshot
      ) {
        clearRecoverySnapshot(templateId);
      }
      message.success("Template berhasil disimpan");
      return true;
    } catch (error) {
      setSaveFailed(true);
      if (isAxiosError(error) && error.response?.status === 422) {
        setServerIssues(mapBackendReadinessErrors(error.response.data));
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    isDirty,
    saving,
    templateId,
    templateName,
    templateDescription,
    template,
    backgroundImagePath,
    metadataSnapshot,
    revision,
    templateStatus,
  ]);

  const frontendReadinessIssues = useMemo(
    () => getCertificateReadiness(template, backgroundImagePath),
    [backgroundImagePath, template],
  );
  const readinessIssues = useMemo(() => {
    const knownCodes = new Set(
      frontendReadinessIssues.map((issue) => issue.code),
    );
    return [
      ...frontendReadinessIssues,
      ...serverIssues.filter((issue) => !knownCodes.has(issue.code)),
    ];
  }, [frontendReadinessIssues, serverIssues]);
  const templateReady = isCertificateTemplateReady(readinessIssues);

  const handlePublish = useCallback(async (): Promise<void> => {
    if (!templateReady || publishing || uploadingAsset || uploadingBackground) {
      message.warning("Perbaiki masalah kesiapan sebelum mempublikasikan.");
      return;
    }

    setPublishing(true);
    try {
      const saved = await handleSave();
      if (!saved) return;
      await new Promise<void>((resolve, reject) => {
        Modal.confirm({
          title: "Publikasikan template?",
          content:
            "Template ini akan tersedia untuk penerbitan berikutnya. Sertifikat yang sudah terbit tetap memakai snapshot sebelumnya.",
          okText: "Publikasikan",
          cancelText: "Batal",
          onOk: async () => {
            try {
              const updated = await updateCertificateTemplateLifecycle(
                templateId,
                "published",
              );
              setTemplateStatus(getCertificateTemplateStatus(updated));
              message.success("Template berhasil dipublikasikan");
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          onCancel: () => resolve(),
        });
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        setServerIssues(mapBackendReadinessErrors(error.response.data));
      }
    } finally {
      setPublishing(false);
    }
  }, [
    handleSave,
    publishing,
    templateId,
    templateReady,
    uploadingAsset,
    uploadingBackground,
  ]);

  const handleBack = useCallback(() => {
    navigate("/digital-certificate");
  }, [navigate]);

  const navigationBlocker = useBlocker(isDirty && !saving && !publishing);

  const handleAddElement = useCallback(
    (type: ElementType) => {
      if (type === "variable-text") {
        setVariableModalVisible(true);
      } else {
        const sizes: Record<ElementType, { width: number; height: number }> = {
          "static-text": { width: 200, height: 40 },
          "variable-text": { width: 200, height: 40 },
          image: { width: 200, height: 150 },
          "qr-code": { width: 100, height: 100 },
          signature: { width: 200, height: 100 },
        };
        const size = sizes[type];
        const elementId = addElement(type, {
          ...size,
          ...getCentredElementPosition(
            size,
            viewportCentreRef.current,
            template.canvasWidth,
            template.canvasHeight,
          ),
        });
        if (type === "static-text") setEditElementId(elementId);
        message.success(`${getElementTypeName(type)} berhasil ditambahkan`);
      }
    },
    [addElement, template.canvasHeight, template.canvasWidth],
  );

  const handleVariableSelect = useCallback(
    (variable: string) => {
      const size = { width: 200, height: 40 };
      addElement("variable-text", {
        variable,
        ...size,
        ...getCentredElementPosition(
          size,
          viewportCentreRef.current,
          template.canvasWidth,
          template.canvasHeight,
        ),
      });
      setVariableModalVisible(false);
      message.success("Teks variabel berhasil ditambahkan");
    },
    [addElement, template.canvasHeight, template.canvasWidth],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
      message.success("Elemen berhasil dihapus");
    }
  }, [selectedElementId, deleteElement]);

  // ── Keyboard shortcuts ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target || !pageRef.current) return;
      const modifierKey = e.metaKey || e.ctrlKey;

      if (modifierKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      if (!pageRef.current.contains(target)) return;

      const certificateElement = target.closest("[data-element-id]");
      const isInteractive = target.closest(
        "input, textarea, select, button, a, [contenteditable='true'], [role='option'], [role='menuitem'], [role='dialog']",
      );
      if (target.isContentEditable || (isInteractive && !certificateElement)) {
        return;
      }

      if (modifierKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (modifierKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (modifierKey && e.key.toLowerCase() === "c" && selectedElementId) {
        e.preventDefault();
        copyElement(selectedElementId);
        return;
      }

      if (modifierKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteElement();
        return;
      }

      if (modifierKey && e.key.toLowerCase() === "d" && selectedElementId) {
        e.preventDefault();
        duplicateElement(selectedElementId);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      if (selectedElementId && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const distance = e.shiftKey ? 10 : 1;
        const deltaX =
          e.key === "ArrowLeft"
            ? -distance
            : e.key === "ArrowRight"
              ? distance
              : 0;
        const deltaY =
          e.key === "ArrowUp"
            ? -distance
            : e.key === "ArrowDown"
              ? distance
              : 0;
        moveElementBy(selectedElementId, deltaX, deltaY);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    copyElement,
    duplicateElement,
    handleDeleteSelected,
    handleSave,
    moveElementBy,
    pasteElement,
    redo,
    selectedElementId,
    undo,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || !serverVersion || loading) return;
    const timeout = window.setTimeout(() => {
      writeRecoverySnapshot({
        version: 1,
        templateId,
        serverVersion,
        timestamp: Date.now(),
        name: templateName,
        description: templateDescription,
        backgroundImage: backgroundImagePath,
        template,
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [
    backgroundImagePath,
    isDirty,
    loading,
    revision,
    serverVersion,
    template,
    templateDescription,
    templateId,
    templateName,
  ]);

  useEffect(() => {
    writeEditorPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    setServerIssues([]);
  }, [metadataSnapshot, revision]);

  const handleAssetUpload = useCallback(
    async (file: File): Promise<{ url: string } | null> => {
      if (uploadingAsset) return null;

      setUploadingAsset(true);
      setAssetError(null);
      try {
        const uploaded = await uploadCertificateAsset(templateId, file);
        if (!uploaded.assetKey) {
          throw new Error("Kunci aset terkelola tidak tersedia");
        }
        return { url: uploaded.assetKey };
      } catch {
        setAssetError(
          "Aset gagal diunggah. File tidak ditambahkan agar template tidak menyimpan URL sementara.",
        );
        return null;
      } finally {
        setUploadingAsset(false);
      }
    },
    [templateId, uploadingAsset],
  );

  const handleImageUpload = useCallback(
    async (file: File): Promise<void> => {
      const uploaded = await handleAssetUpload(file);
      if (!uploaded) return;
      const size = { width: 200, height: 150 };
      addElement("image", {
        imageUrl: uploaded.url,
        ...size,
        ...getCentredElementPosition(
          size,
          viewportCentreRef.current,
          template.canvasWidth,
          template.canvasHeight,
        ),
      });
      message.success("Gambar berhasil ditambahkan");
    },
    [
      addElement,
      handleAssetUpload,
      template.canvasHeight,
      template.canvasWidth,
    ],
  );

  const handleSignatureUpload = useCallback(
    async (file: File): Promise<void> => {
      const uploaded = await handleAssetUpload(file);
      if (!uploaded) return;
      const size = { width: 200, height: 100 };
      addElement("signature", {
        imageUrl: uploaded.url,
        ...size,
        ...getCentredElementPosition(
          size,
          viewportCentreRef.current,
          template.canvasWidth,
          template.canvasHeight,
        ),
      });
      message.success("Tanda tangan berhasil ditambahkan");
    },
    [
      addElement,
      handleAssetUpload,
      template.canvasHeight,
      template.canvasWidth,
    ],
  );

  const handleBackgroundUpload = useCallback(
    async (file: File): Promise<void> => {
      if (uploadingBackground) return;

      setUploadingBackground(true);
      setAssetError(null);
      try {
        const uploaded = await uploadCertificateAsset(templateId, file);
        if (!uploaded.assetKey) {
          throw new Error("Aset background terkelola tidak tersedia");
        }
        setBackgroundImagePath(uploaded.assetKey);
        setBackgroundUrl(uploaded.assetKey);
        message.success(
          "Background berhasil diunggah. Klik Simpan Template untuk menerapkannya.",
        );
      } catch {
        setAssetError(
          "Background gagal diunggah. File tidak disimpan dan background sebelumnya tetap digunakan.",
        );
      } finally {
        setUploadingBackground(false);
      }
    },
    [setBackgroundUrl, templateId, uploadingBackground],
  );

  const handlePreviewPdf = useCallback(() => {
    if (
      readinessIssues.some(
        (issue) => issue.code === "MISSING_PUBLIC_CERTIFICATE_URL",
      )
    ) {
      message.error(
        "Konfigurasi URL web publik diperlukan untuk membuat QR preview.",
      );
      return;
    }
    generatePdf(template);
  }, [generatePdf, readinessIssues, template]);

  const handleMoveLayerForward = useCallback(
    (elementId: string) => updateElementOrder(elementId, "forward"),
    [updateElementOrder],
  );

  const handleMoveLayerBackward = useCallback(
    (elementId: string) => updateElementOrder(elementId, "backward"),
    [updateElementOrder],
  );

  const handleLayerSelect = useCallback(
    (elementId: string) => {
      selectElement(elementId);
      if (isCompactLayout) {
        setActiveDrawer(null);
      }
    },
    [isCompactLayout, selectElement],
  );

  const handleUpdateSelected = useCallback(
    (updates: Partial<CertificateElement>, historyGroup?: string) => {
      if (!selectedElementId) return;
      updateElement(selectedElementId, updates, {
        historyGroup: historyGroup
          ? `${selectedElementId}:${historyGroup}`
          : undefined,
      });
    },
    [selectedElementId, updateElement],
  );

  const handleUpdateSelectedComplete = useCallback(
    (historyGroup: string) => {
      if (selectedElementId) {
        finishHistoryGroup(`${selectedElementId}:${historyGroup}`);
      }
    },
    [finishHistoryGroup, selectedElementId],
  );

  const handleCanvasSettingsSave = useCallback(
    (width: number, height: number) => {
      setCanvasSize(width, height);
      setCanvasSettingsVisible(false);
      message.success("Ukuran kanvas berhasil diubah");
    },
    [setCanvasSize],
  );

  const handleOpenCanvasSettings = useCallback(
    () => setCanvasSettingsVisible(true),
    [],
  );
  const handleCloseCanvasSettings = useCallback(
    () => setCanvasSettingsVisible(false),
    [],
  );
  const handleCloseVariableModal = useCallback(
    () => setVariableModalVisible(false),
    [],
  );

  const layerPanel = (
    <LayerPanel
      elements={template.elements}
      selectedElementId={selectedElementId}
      onSelect={handleLayerSelect}
      onRename={renameElement}
      onToggleVisibility={toggleElementVisibility}
      onToggleLock={toggleElementLock}
      onMoveForward={handleMoveLayerForward}
      onMoveBackward={handleMoveLayerBackward}
      onDuplicate={duplicateElement}
      onDelete={deleteElement}
      onReorder={reorderElement}
    />
  );

  const propertyPanel = (
    <PropertyPanel
      element={selectedElement}
      onUpdate={handleUpdateSelected}
      onUpdateComplete={handleUpdateSelectedComplete}
      onAssetUpload={handleAssetUpload}
      assetUploading={uploadingAsset}
      templateDescription={templateDescription}
      canvasWidth={template.canvasWidth}
      canvasHeight={template.canvasHeight}
      snapToGrid={snapToGrid}
      showGrid={showGrid}
      showGuides={showGuides}
      snapToGuides={snapToGuides}
      onTemplateDescriptionChange={setTemplateDescription}
      onSnapToGridChange={(value) =>
        setPreferences((current) => ({
          ...current,
          canvas: { ...current.canvas, snapToGrid: value },
        }))
      }
      onShowGridChange={(value) =>
        setPreferences((current) => ({
          ...current,
          canvas: { ...current.canvas, showGrid: value },
        }))
      }
      onShowGuidesChange={(value) =>
        setPreferences((current) => ({
          ...current,
          canvas: { ...current.canvas, showGuides: value },
        }))
      }
      onSnapToGuidesChange={(value) =>
        setPreferences((current) => ({
          ...current,
          canvas: { ...current.canvas, snapToGuides: value },
        }))
      }
      onOpenCanvasSettings={handleOpenCanvasSettings}
      onBackgroundUpload={handleBackgroundUpload}
    />
  );

  const handleReadinessAction = (issue: CertificateReadinessIssue): void => {
    if (issue.code === "MISSING_PARTICIPANT_NAME") {
      setVariableModalVisible(true);
      return;
    }
    if (
      issue.code === "MISSING_ASSET" ||
      issue.code === "ELEMENT_OUT_OF_BOUNDS"
    ) {
      const affected = template.elements.find((element) =>
        issue.code === "MISSING_ASSET"
          ? (element.type === "image" || element.type === "signature") &&
            !element.imageUrl
          : element.x < 0 ||
            element.y < 0 ||
            element.x + element.width > template.canvasWidth ||
            element.y + element.height > template.canvasHeight,
      );
      if (affected) selectElement(affected.id);
    }
    if (isCompactLayout) setActiveDrawer("inspector");
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spin size="large" />
      </div>
    );
  }

  const saveStatus = saving
    ? "Menyimpan…"
    : saveFailed
      ? "Gagal menyimpan"
      : isDirty
        ? "Belum disimpan"
        : "Tersimpan";
  const saveDisabled =
    !isDirty ||
    !templateName.trim() ||
    (templateStatus === "published" &&
      !isCertificateTemplateReady(frontendReadinessIssues));

  return (
    <main ref={pageRef} className={styles.page}>
      <header className={styles.topBar}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          aria-label="Kembali ke daftar template"
        />
        <Input
          className={styles.templateName}
          value={templateName}
          onChange={(event) => setTemplateName(event.target.value)}
          placeholder="Nama template"
          aria-label="Nama template"
          variant="borderless"
        />
        <div className={styles.statusGroup} aria-live="polite">
          <Tag color={saveFailed ? "error" : isDirty ? "gold" : "green"}>
            {saveStatus}
          </Tag>
          <Tag
            color={
              templateStatus === "published"
                ? "green"
                : templateStatus === "archived"
                  ? "default"
                  : "gold"
            }
          >
            {templateStatus === "published"
              ? "Dipublikasikan"
              : templateStatus === "archived"
                ? "Diarsipkan"
                : "Draf"}
          </Tag>
        </div>
        {templateStatus === "published" ? (
          <Text className={styles.publishedNote} type="secondary">
            Perubahan tersimpan berlaku untuk sertifikat berikutnya; snapshot
            terbit tetap sama.
          </Text>
        ) : null}
        <div className={styles.topActions}>
          {isCompactLayout && !isMobileLayout ? (
            <>
              <Button
                icon={<AppstoreOutlined />}
                onClick={() =>
                  setActiveDrawer(activeDrawer === "layers" ? null : "layers")
                }
                aria-label="Buka Layers"
              />
              <Button
                icon={<ControlOutlined />}
                onClick={() =>
                  setActiveDrawer(
                    activeDrawer === "inspector" ? null : "inspector",
                  )
                }
                aria-label="Buka Inspector"
              />
            </>
          ) : null}
          <ReadinessChecklist
            issues={readinessIssues}
            onIssueAction={handleReadinessAction}
          />
          <Button
            className={styles.previewAction}
            icon={<FilePdfOutlined />}
            onClick={handlePreviewPdf}
            loading={generating}
          >
            Preview PDF
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => void handleSave()}
            loading={saving}
            disabled={saveDisabled}
          >
            Simpan
          </Button>
          {templateStatus !== "published" ? (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => void handlePublish()}
              loading={publishing}
              disabled={
                !templateReady ||
                saving ||
                uploadingAsset ||
                uploadingBackground
              }
            >
              Publikasikan
            </Button>
          ) : null}
        </div>
      </header>

      {assetError ? (
        <Alert
          className={styles.uploadError}
          type="error"
          showIcon
          closable
          title={assetError}
          onClose={() => setAssetError(null)}
        />
      ) : null}

      {isMobileLayout ? (
        <section className={styles.mobileGuidance}>
          <Typography.Title level={3}>
            Editor sertifikat membutuhkan layar tablet atau desktop
          </Typography.Title>
          <Text type="secondary">
            Gunakan layar dengan lebar minimal 768 px untuk mengedit. Preview
            tetap tersedia dari perangkat ini.
          </Text>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Kembali
            </Button>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={handlePreviewPdf}
              loading={generating}
            >
              Preview PDF
            </Button>
          </Space>
        </section>
      ) : (
        <div className={styles.editorBody}>
          <ToolRail
            tool={tool}
            uploading={uploadingAsset}
            onToolChange={setTool}
            onAddElement={(nextTool) =>
              handleAddElement(nextTool as ElementType)
            }
            onImageUpload={handleImageUpload}
            onSignatureUpload={handleSignatureUpload}
          />
          {isCompactLayout ? (
            <CertificateCanvas
              template={template}
              selectedElementId={selectedElementId}
              tool={tool}
              onToolChange={setTool}
              onViewportCentreChange={handleViewportCentreChange}
              editElementId={editElementId}
              onEditComplete={handleEditComplete}
              onSelectElement={selectElement}
              onMoveElement={moveElement}
              onUpdateElement={updateElement}
              snapToGrid={snapToGrid}
              showGrid={showGrid}
              showGuides={showGuides}
              snapToGuides={snapToGuides}
            />
          ) : (
            <Splitter
              className={styles.workspace}
              onCollapse={(collapsed) =>
                setPreferences((current) => ({
                  ...current,
                  layersCollapsed: collapsed[0] ?? false,
                  inspectorCollapsed: collapsed[2] ?? false,
                }))
              }
              onResize={(sizes) => {
                const layersWidth =
                  typeof sizes[0] === "number"
                    ? sizes[0]
                    : preferences.layersWidth;
                const inspectorWidth =
                  typeof sizes[2] === "number"
                    ? sizes[2]
                    : preferences.inspectorWidth;
                setPreferences((current) => ({
                  ...current,
                  layersWidth:
                    layersWidth > 0 ? layersWidth : current.layersWidth,
                  inspectorWidth:
                    inspectorWidth > 0
                      ? inspectorWidth
                      : current.inspectorWidth,
                  layersCollapsed: layersWidth === 0,
                  inspectorCollapsed: inspectorWidth === 0,
                }));
              }}
            >
              <Splitter.Panel
                size={preferences.layersCollapsed ? 0 : preferences.layersWidth}
                min={200}
                max={360}
                collapsible
              >
                {layerPanel}
              </Splitter.Panel>
              <Splitter.Panel min={400}>
                <CertificateCanvas
                  template={template}
                  selectedElementId={selectedElementId}
                  tool={tool}
                  onToolChange={setTool}
                  onViewportCentreChange={handleViewportCentreChange}
                  editElementId={editElementId}
                  onEditComplete={handleEditComplete}
                  onSelectElement={selectElement}
                  onMoveElement={moveElement}
                  onUpdateElement={updateElement}
                  snapToGrid={snapToGrid}
                  showGrid={showGrid}
                  showGuides={showGuides}
                  snapToGuides={snapToGuides}
                />
              </Splitter.Panel>
              <Splitter.Panel
                size={
                  preferences.inspectorCollapsed
                    ? 0
                    : preferences.inspectorWidth
                }
                min={280}
                max={420}
                collapsible
              >
                {propertyPanel}
              </Splitter.Panel>
            </Splitter>
          )}
        </div>
      )}

      <Drawer
        title={activeDrawer === "layers" ? "Layers" : "Inspector"}
        open={isCompactLayout && activeDrawer !== null}
        placement={activeDrawer === "layers" ? "left" : "right"}
        width={activeDrawer === "layers" ? 320 : 380}
        mask={false}
        onClose={() => setActiveDrawer(null)}
        styles={{ body: { padding: 0 } }}
      >
        {activeDrawer === "layers" ? layerPanel : propertyPanel}
      </Drawer>

      <Modal
        title="Perubahan belum disimpan"
        open={navigationBlocker.state === "blocked"}
        closable={false}
        footer={[
          <Button key="stay" onClick={() => navigationBlocker.reset?.()}>
            Tetap di sini
          </Button>,
          <Button
            key="discard"
            danger
            onClick={() => {
              clearRecoverySnapshot(templateId);
              navigationBlocker.proceed?.();
            }}
          >
            Buang dan keluar
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={async () => {
              if (await handleSave()) navigationBlocker.proceed?.();
            }}
          >
            Simpan dan keluar
          </Button>,
        ]}
      >
        Pilih apakah perubahan disimpan sebelum meninggalkan editor. Snapshot
        pemulihan tersedia untuk reload atau crash, kecuali Anda memilih
        membuang perubahan.
      </Modal>

      {/* Variable Text Modal */}
      <VariableTextModal
        visible={variableModalVisible}
        onCancel={handleCloseVariableModal}
        onSelect={handleVariableSelect}
      />

      {/* Canvas Settings Modal */}
      <CanvasSettingsModal
        visible={canvasSettingsVisible}
        width={template.canvasWidth}
        height={template.canvasHeight}
        onCancel={handleCloseCanvasSettings}
        onSave={handleCanvasSettingsSave}
      />
    </main>
  );
};

function getElementTypeName(type: ElementType): string {
  switch (type) {
    case "static-text":
      return "Teks statis";
    case "variable-text":
      return "Teks variabel";
    case "image":
      return "Gambar";
    case "qr-code":
      return "QR Code";
    case "signature":
      return "Tanda tangan";
    default:
      return "Elemen";
  }
}

export default CertificateDesigner;
