import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  Alert,
} from "antd";
import {
  SafetyCertificateOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  FilePdfOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import {
  CertificateCanvas,
  ElementToolbar,
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
} from "../utils/certificate-readiness";

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
    alignElement,
    renameElement,
    toggleElementVisibility,
    toggleElementLock,
    undo,
    redo,
    canUndo,
    canRedo,
    hasClipboard,
  } = useCertificateDesigner();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);

  const isCompactLayout = useMediaQuery("(max-width: 1199px)");

  const { generatePdf, generating } = usePdfPreview();

  const getDesignerStateSnapshot = useCallback(
    (currentTemplate = template) =>
      JSON.stringify({
        name: templateName.trim(),
        description: templateDescription || null,
        backgroundImage: backgroundImagePath,
        template: currentTemplate,
      }),
    [backgroundImagePath, template, templateDescription, templateName],
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return getDesignerStateSnapshot() !== savedSnapshot;
  }, [getDesignerStateSnapshot, savedSnapshot]);

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
        setBackgroundImagePath(data.background_image);
        const nextTemplate = {
          backgroundUrl:
            data.background_image || data.template_data?.backgroundUrl || null,
          elements: data.template_data?.elements || [],
          canvasWidth: data.template_data?.canvasWidth || 800,
          canvasHeight: data.template_data?.canvasHeight || 566,
        };
        setTemplate(nextTemplate);
        setSavedSnapshot(
          JSON.stringify({
            name: data.name.trim(),
            description: data.description || null,
            backgroundImage: data.background_image,
            template: nextTemplate,
          }),
        );
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

    setSaving(true);
    try {
      await updateCertificateTemplate(templateId, {
        name: templateName,
        description: templateDescription || null,
        templateData: template,
        backgroundImage: backgroundImagePath,
      });
      setSavedSnapshot(getDesignerStateSnapshot());
      message.success("Template berhasil disimpan");
      return true;
    } catch {
      // Error handled by handleError
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    getDesignerStateSnapshot,
    isDirty,
    saving,
    templateId,
    templateName,
    templateDescription,
    template,
    backgroundImagePath,
  ]);

  const readinessIssues = useMemo(
    () => getCertificateReadiness(template, backgroundImagePath),
    [backgroundImagePath, template],
  );
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
      const updated = await updateCertificateTemplateLifecycle(
        templateId,
        "published",
      );
      setTemplateStatus(getCertificateTemplateStatus(updated));
      message.success("Template berhasil dipublikasikan");
    } catch {
      // Error handled centrally.
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

  useEffect(() => {
    if (navigationBlocker.state !== "blocked") return;

    Modal.confirm({
      title: "Keluar tanpa menyimpan?",
      content: "Perubahan template belum disimpan.",
      okText: "Keluar",
      cancelText: "Tetap di sini",
      okButtonProps: { danger: true },
      onOk: () => navigationBlocker.proceed(),
      onCancel: () => navigationBlocker.reset(),
    });
  }, [navigationBlocker]);

  const handleAddElement = useCallback(
    (type: ElementType) => {
      if (type === "variable-text") {
        setVariableModalVisible(true);
      } else {
        addElement(type);
        message.success(`${getElementTypeName(type)} berhasil ditambahkan`);
      }
    },
    [addElement],
  );

  const handleVariableSelect = useCallback(
    (variable: string) => {
      addElement("variable-text", { variable });
      setVariableModalVisible(false);
      message.success("Teks variabel berhasil ditambahkan");
    },
    [addElement],
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
      if (!target || !pageRef.current?.contains(target)) return;
      const modifierKey = e.metaKey || e.ctrlKey;

      if (modifierKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

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

  const handleDuplicateSelected = useCallback(() => {
    if (selectedElementId) {
      duplicateElement(selectedElementId);
      message.success("Elemen berhasil diduplikat");
    }
  }, [duplicateElement, selectedElementId]);

  const handleCopySelected = useCallback(() => {
    if (selectedElementId && copyElement(selectedElementId)) {
      message.success("Elemen disalin");
    }
  }, [copyElement, selectedElementId]);

  const handlePaste = useCallback(() => {
    if (pasteElement()) {
      message.success("Elemen ditempel");
    }
  }, [pasteElement]);

  const handleAssetUpload = useCallback(
    async (file: File): Promise<{ url: string; assetKey?: string } | null> => {
      if (uploadingAsset) return null;

      setUploadingAsset(true);
      setAssetError(null);
      try {
        const uploaded = await uploadCertificateAsset(templateId, file);
        if (!uploaded.assetKey) {
          throw new Error("Kunci aset terkelola tidak tersedia");
        }
        return { url: uploaded.assetKey, assetKey: uploaded.assetKey };
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
      addElement("image", {
        imageUrl: uploaded.url,
        assetKey: uploaded.assetKey,
      });
      message.success("Gambar berhasil ditambahkan");
    },
    [addElement, handleAssetUpload],
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

  const handleMoveSelectedForward = useCallback(() => {
    if (selectedElementId) {
      updateElementOrder(selectedElementId, "forward");
    }
  }, [selectedElementId, updateElementOrder]);

  const handleMoveSelectedBackward = useCallback(() => {
    if (selectedElementId) {
      updateElementOrder(selectedElementId, "backward");
    }
  }, [selectedElementId, updateElementOrder]);

  const handleAlignSelected = useCallback(
    (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (selectedElementId) alignElement(selectedElementId, alignment);
    },
    [alignElement, selectedElementId],
  );

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
        setLayerPanelOpen(false);
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
  const handleOpenLayerPanel = useCallback(() => setLayerPanelOpen(true), []);
  const handleCloseLayerPanel = useCallback(() => setLayerPanelOpen(false), []);
  const handleOpenPropertyPanel = useCallback(
    () => setPropertyPanelOpen(true),
    [],
  );
  const handleClosePropertyPanel = useCallback(
    () => setPropertyPanelOpen(false),
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
    />
  );

  const propertyPanel = (
    <PropertyPanel
      element={selectedElement}
      onUpdate={handleUpdateSelected}
      onUpdateComplete={handleUpdateSelectedComplete}
      onAssetUpload={handleAssetUpload}
      assetUploading={uploadingAsset}
    />
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 64px)",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <main ref={pageRef} className={styles.page}>
      {/* Header */}
      <Card
        variant="outlined"
        className={styles.headerCard}
        style={{ borderRadius: 0 }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerIdentity}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              aria-label="Kembali ke daftar template"
            />
            <SafetyCertificateOutlined
              aria-hidden="true"
              style={{ fontSize: 24, color: "#1890ff" }}
            />
            <div className={styles.titleFields}>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nama template"
                aria-label="Nama template"
                variant="borderless"
                style={{ fontSize: 16, fontWeight: 600, padding: 0 }}
              />
              <Input
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Deskripsi template (opsional)"
                aria-label="Deskripsi template"
                variant="borderless"
                style={{ fontSize: 12, color: "#8c8c8c", padding: 0 }}
              />
            </div>
            <div className={styles.statusGroup} aria-live="polite">
              <Tag color={isDirty ? "gold" : "green"}>
                {saving
                  ? "Menyimpan…"
                  : isDirty
                    ? "Belum disimpan"
                    : "Tersimpan"}
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
              {readinessIssues.length > 0 && (
                <Tooltip
                  title={
                    <ul className={styles.validationList}>
                      {readinessIssues.map((issue) => (
                        <li key={issue.code}>{issue.message}</li>
                      ))}
                    </ul>
                  }
                  placement="bottom"
                >
                  <Button
                    size="small"
                    type="text"
                    icon={<WarningOutlined />}
                    aria-label={`${readinessIssues.length} hal perlu diperiksa`}
                  >
                    {readinessIssues.length} perhatian
                  </Button>
                </Tooltip>
              )}
              {templateReady && (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Siap diterbitkan
                </Tag>
              )}
            </div>
          </div>
          <Space className={styles.headerActions} wrap>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handlePreviewPdf}
              loading={generating}
              disabled={uploadingAsset || uploadingBackground}
            >
              Preview PDF
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty || !templateName.trim()}
            >
              Simpan Template
            </Button>
            {templateStatus !== "published" && (
              <Button
                type="primary"
                ghost
                icon={<CheckCircleOutlined />}
                onClick={handlePublish}
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
            )}
          </Space>
        </div>
      </Card>

      {assetError && (
        <Alert
          className={styles.assetAlert}
          type="error"
          showIcon
          closable
          title="Upload belum berhasil"
          description={assetError}
          onClose={() => setAssetError(null)}
        />
      )}

      {readinessIssues.length > 0 && (
        <Alert
          className={styles.assetAlert}
          type={templateReady ? "warning" : "error"}
          showIcon
          title={
            templateReady
              ? "Template siap, tetapi masih ada saran"
              : "Template belum siap dipublikasikan"
          }
          description={
            <ul className={styles.validationList}>
              {readinessIssues.map((issue) => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
          }
        />
      )}

      {/* Main Content */}
      <Card
        variant="outlined"
        className={styles.editorCard}
        style={{ borderRadius: 0 }}
        styles={{
          body: {
            padding: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Toolbar */}
        <ElementToolbar
          onAddElement={handleAddElement}
          onBackgroundUpload={handleBackgroundUpload}
          onImageUpload={handleImageUpload}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onCopySelected={handleCopySelected}
          onPaste={handlePaste}
          onUndo={undo}
          onRedo={redo}
          onMoveSelectedForward={handleMoveSelectedForward}
          onMoveSelectedBackward={handleMoveSelectedBackward}
          onAlignSelected={handleAlignSelected}
          onOpenCanvasSettings={handleOpenCanvasSettings}
          hasSelection={!!selectedElementId}
          hasClipboard={hasClipboard}
          canUndo={canUndo}
          canRedo={canRedo}
          showPanelControls={isCompactLayout}
          onOpenLayers={handleOpenLayerPanel}
          onOpenProperties={handleOpenPropertyPanel}
          uploadingBackground={uploadingBackground}
          uploadingAsset={uploadingAsset}
        />

        {/* Canvas and Property Panel */}
        <div className={styles.workspace}>
          {!isCompactLayout && (
            <aside className={styles.layerPanel}>{layerPanel}</aside>
          )}
          <CertificateCanvas
            template={template}
            selectedElementId={selectedElementId}
            onSelectElement={selectElement}
            onMoveElement={moveElement}
            onUpdateElement={updateElement}
            snapToGrid={snapToGrid}
            showGuides={showGuides}
            onSnapToGridChange={setSnapToGrid}
            onShowGuidesChange={setShowGuides}
          />
          {!isCompactLayout && (
            <aside className={styles.propertyPanel}>{propertyPanel}</aside>
          )}
        </div>
      </Card>

      <Modal
        title="Layer"
        open={isCompactLayout && layerPanelOpen}
        onCancel={handleCloseLayerPanel}
        footer={null}
        width={360}
        closable={{ "aria-label": "Tutup panel layer" }}
        styles={{ body: { padding: 0, height: "65vh" } }}
      >
        {layerPanel}
      </Modal>

      <Modal
        title="Properti elemen"
        open={isCompactLayout && propertyPanelOpen}
        onCancel={handleClosePropertyPanel}
        footer={null}
        width={400}
        closable={{ "aria-label": "Tutup panel properti" }}
        styles={{ body: { padding: 0, height: "65vh" } }}
      >
        {propertyPanel}
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
      <Text className={styles.keyboardHelp} type="secondary">
        Pintasan: Ctrl/⌘+S simpan · Ctrl/⌘+Z urungkan · panah geser elemen ·
        Shift+panah geser 10 px
      </Text>
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
