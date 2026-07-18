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
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  ControlOutlined,
  UndoOutlined,
  RedoOutlined,
  CloudSyncOutlined,
} from "@ant-design/icons";
import { isAxiosError } from "axios";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import {
  CertificateCanvas,
  LayerPanel,
  PropertyPanel,
  CanvasSettingsModal,
} from "../components";
import { useCertificateDesigner } from "../hooks";
import type {
  CertificateElement,
  CertificateTemplate,
  ElementType,
} from "../types";
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
  getCertificateReadinessAction,
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
import {
  AUTOSAVE_STATUS_LABELS,
  CertificateAutosaveController,
  type AutosaveState,
} from "./autosave-controller";

const { Text } = Typography;

interface EditorSaveSnapshot {
  revision: number;
  metadataSnapshot: string;
  name: string;
  description: string;
  backgroundImagePath: string | null;
  template: CertificateTemplate;
}

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
    canUndo,
    canRedo,
    alignElement,
    revision,
  } = useCertificateDesigner();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [templateStatus, setTemplateStatus] =
    useState<CertificateTemplateStatus>("draft");
  const [backgroundImagePath, setBackgroundImagePath] = useState<string | null>(
    null,
  );
  const [variableChooserOpen, setVariableChooserOpen] = useState(false);
  const [canvasSettingsVisible, setCanvasSettingsVisible] = useState(false);
  const [preferences, setPreferences] = useState<EditorPreferences>(() =>
    typeof localStorage === "undefined"
      ? DEFAULT_EDITOR_PREFERENCES
      : readEditorPreferences(),
  );
  const [savedRevision, setSavedRevision] = useState(0);
  const [savedMetadata, setSavedMetadata] = useState("");
  const [serverVersion, setServerVersion] = useState(1);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>({
    status: "saved",
    conflict: null,
  });
  const [serverIssues, setServerIssues] = useState<CertificateReadinessIssue[]>(
    [],
  );
  const [activeDrawer, setActiveDrawer] = useState<
    "layers" | "inspector" | null
  >(null);
  const [tool, setTool] = useState<EditorTool>("select");
  const [editElementId, setEditElementId] = useState<string | null>(null);
  const viewportCentreRef = useRef<ViewportPoint>({ x: 400, y: 283 });
  const autosaveRef =
    useRef<CertificateAutosaveController<EditorSaveSnapshot> | null>(null);
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
  const saveSnapshot = useMemo<EditorSaveSnapshot>(
    () => ({
      revision,
      metadataSnapshot,
      name: templateName,
      description: templateDescription,
      backgroundImagePath,
      template,
    }),
    [
      backgroundImagePath,
      metadataSnapshot,
      revision,
      template,
      templateDescription,
      templateName,
    ],
  );
  const latestDocumentRef = useRef(saveSnapshot);
  latestDocumentRef.current = saveSnapshot;

  if (!autosaveRef.current) {
    autosaveRef.current = new CertificateAutosaveController({
      initialVersion: 1,
      save: async (snapshot, expectedVersion) => {
        try {
          const updated = await updateCertificateTemplate(
            templateId,
            {
              expectedVersion,
              name: snapshot.name,
              description: snapshot.description || null,
              templateData: snapshot.template,
              backgroundImage: snapshot.backgroundImagePath,
            },
            { silent: true },
          );
          return Number(updated.version);
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 422) {
            setServerIssues(mapBackendReadinessErrors(error.response.data));
          }
          throw error;
        }
      },
      classifyError: (error) => {
        if (isAxiosError(error) && error.response?.status === 409) {
          const data = error.response.data as {
            currentVersion?: number;
            updatedAt?: string;
          };
          return {
            type: "conflict" as const,
            conflict: {
              currentVersion: Number(data.currentVersion),
              updatedAt: data.updatedAt || new Date().toISOString(),
            },
          };
        }
        if (
          isAxiosError(error) &&
          (!error.response || error.response.status >= 500)
        ) {
          return { type: "retryable" as const };
        }
        return { type: "fatal" as const };
      },
      onStateChange: setAutosaveState,
      onSaved: (snapshot, version) => {
        setSavedRevision(snapshot.revision);
        setSavedMetadata(snapshot.metadataSnapshot);
        setServerVersion(version);
        setServerIssues([]);
        if (
          latestDocumentRef.current.revision === snapshot.revision &&
          latestDocumentRef.current.metadataSnapshot ===
            snapshot.metadataSnapshot
        ) {
          clearRecoverySnapshot(templateId);
        }
      },
    });
  }

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
        const nextServerVersion = Number(data.version);
        setServerVersion(nextServerVersion);
        autosaveRef.current?.setServerVersion(nextServerVersion);
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
          const conflict = hasRecoveryConflict(
            recovery,
            String(nextServerVersion),
          );
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
              if (conflict) {
                autosaveRef.current?.pauseForConflict({
                  currentVersion: nextServerVersion,
                  updatedAt: data.updated_at,
                });
              }
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

    if (!templateName.trim()) {
      setAutosaveState({ status: "needs-fix", conflict: null });
      return false;
    }

    if (
      templateStatus === "published" &&
      !isCertificateTemplateReady(
        getCertificateReadiness(template, backgroundImagePath),
      )
    ) {
      setAutosaveState({ status: "needs-fix", conflict: null });
      return false;
    }
    autosaveRef.current?.schedule(saveSnapshot, true);
    return (await autosaveRef.current?.flush()) ?? false;
  }, [
    backgroundImagePath,
    isDirty,
    saveSnapshot,
    templateName,
    template,
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
  const autosaveAllowed =
    Boolean(templateName.trim()) &&
    (templateStatus !== "published" || templateReady);

  useEffect(() => {
    if (loading || !savedMetadata) return;
    const controller = autosaveRef.current;
    if (!controller) return;
    if (isDirty) {
      controller.schedule(saveSnapshot, autosaveAllowed);
    } else if (controller.isSaving()) {
      controller.schedule(saveSnapshot, autosaveAllowed);
    } else {
      controller.cancelPending();
    }
  }, [autosaveAllowed, isDirty, loading, saveSnapshot, savedMetadata]);

  useEffect(() => {
    const controller = autosaveRef.current;
    if (!controller) return;
    const updateConnectivity = (): void =>
      controller.setOnline(navigator.onLine);
    updateConnectivity();
    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);
    return () => {
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
    };
  }, []);

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
                autosaveRef.current?.getVersion() ?? serverVersion,
              );
              setTemplateStatus(getCertificateTemplateStatus(updated));
              const nextVersion = Number(updated.version);
              setServerVersion(nextVersion);
              autosaveRef.current?.setServerVersion(nextVersion);
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
      } else if (isAxiosError(error) && error.response?.status === 409) {
        const data = error.response.data as {
          currentVersion?: number;
          updatedAt?: string;
        };
        autosaveRef.current?.schedule(saveSnapshot, true);
        autosaveRef.current?.pauseForConflict({
          currentVersion: Number(data.currentVersion),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
        setSavedRevision(-1);
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
    serverVersion,
    saveSnapshot,
  ]);

  const handleBack = useCallback(() => {
    navigate("/digital-certificate");
  }, [navigate]);

  const navigationBlocker = useBlocker(isDirty && !publishing);

  const handleAddElement = useCallback(
    (type: ElementType) => {
      if (type === "variable-text") {
        setVariableChooserOpen(true);
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
      setVariableChooserOpen(false);
    },
    [addElement, template.canvasHeight, template.canvasWidth],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
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
        serverVersion: String(serverVersion),
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
        setActiveDrawer("inspector");
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
      backgroundUrl={backgroundImagePath || template.backgroundUrl}
      onBackgroundRemove={() => {
        setBackgroundImagePath(null);
        setBackgroundUrl(null);
      }}
      onAlign={(alignment) => {
        if (selectedElementId) alignElement(selectedElementId, alignment);
      }}
      onDuplicate={() => {
        if (selectedElementId) duplicateElement(selectedElementId);
      }}
      onToggleVisibility={() => {
        if (selectedElementId) toggleElementVisibility(selectedElementId);
      }}
      onToggleLock={() => {
        if (selectedElementId) toggleElementLock(selectedElementId);
      }}
      onDelete={handleDeleteSelected}
    />
  );

  const handleReadinessAction = (issue: CertificateReadinessIssue): void => {
    const action = getCertificateReadinessAction(issue.code);
    if (action === "open-variable-chooser") {
      setVariableChooserOpen(true);
      return;
    }
    if (action === "open-canvas-settings") {
      setCanvasSettingsVisible(true);
      return;
    }
    if (action === "open-canvas-inspector") {
      selectElement(null);
      if (isCompactLayout) setActiveDrawer("inspector");
      return;
    }
    if (action === "select-layer") {
      const affected = template.elements.find((element) =>
        issue.code === "MISSING_ASSET"
          ? (element.type === "image" || element.type === "signature") &&
            !element.imageUrl
          : issue.code === "PRIVATE_VARIABLE" ||
              issue.code === "UNSUPPORTED_VARIABLE"
            ? element.type === "variable-text" &&
              element.variable !== "{{name}}"
            : element.x < 0 ||
              element.y < 0 ||
              element.x + element.width > template.canvasWidth ||
              element.y + element.height > template.canvasHeight,
      );
      if (affected) selectElement(affected.id);
    }
    if (isCompactLayout) setActiveDrawer("inspector");
  };

  const isReadinessActionable = (issue: CertificateReadinessIssue): boolean =>
    getCertificateReadinessAction(issue.code) !== "explain";

  const handleLoadServerVersion = async (): Promise<void> => {
    try {
      const data = await getCertificateTemplate(templateId);
      const nextTemplate = {
        backgroundUrl:
          data.background_image || data.template_data?.backgroundUrl || null,
        elements: data.template_data?.elements || [],
        canvasWidth: data.template_data?.canvasWidth || 800,
        canvasHeight: data.template_data?.canvasHeight || 566,
      };
      const nextMetadata = JSON.stringify({
        name: data.name.trim(),
        description: data.description || "",
        backgroundImagePath: data.background_image,
      });
      const nextVersion = Number(data.version);
      setTemplateName(data.name);
      setTemplateDescription(data.description || "");
      setBackgroundImagePath(data.background_image);
      setTemplateStatus(getCertificateTemplateStatus(data));
      setTemplate(nextTemplate);
      setSavedRevision(0);
      setSavedMetadata(nextMetadata);
      setServerVersion(nextVersion);
      autosaveRef.current?.setServerVersion(nextVersion);
      autosaveRef.current?.cancelPending();
      setAutosaveState({ status: "saved", conflict: null });
      clearRecoverySnapshot(templateId);
    } catch {
      message.error("Versi server gagal dimuat.");
    }
  };

  const handleOverwriteConflict = (): void => {
    const currentVersion = autosaveState.conflict?.currentVersion;
    if (!currentVersion) return;
    Modal.confirm({
      title: "Timpa versi server?",
      content:
        "Perubahan pada versi server akan diganti dengan versi lokal Anda. Tindakan ini tidak dapat dibatalkan.",
      okText: "Timpa dengan versi saya",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: () => autosaveRef.current?.overwriteWithVersion(currentVersion),
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spin size="large" />
      </div>
    );
  }

  const saveStatus = AUTOSAVE_STATUS_LABELS[autosaveState.status];
  const saveStatusColor =
    autosaveState.status === "saved"
      ? "green"
      : autosaveState.status === "saving"
        ? "blue"
        : autosaveState.status === "offline" ||
            autosaveState.status === "needs-fix"
          ? "gold"
          : "red";

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
          <Tag color={saveStatusColor} icon={<CloudSyncOutlined />}>
            {saveStatus}
          </Tag>
          {autosaveState.status === "error" ? (
            <Button
              type="link"
              size="small"
              onClick={() => autosaveRef.current?.retry()}
            >
              Coba lagi
            </Button>
          ) : null}
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
          <Tooltip title="Urungkan (Ctrl/Cmd+Z)">
            <Button
              icon={<UndoOutlined />}
              disabled={!canUndo}
              onClick={undo}
              aria-label="Urungkan"
              aria-keyshortcuts="Control+Z Meta+Z"
            />
          </Tooltip>
          <Tooltip title="Ulangi (Ctrl/Cmd+Shift+Z)">
            <Button
              icon={<RedoOutlined />}
              disabled={!canRedo}
              onClick={redo}
              aria-label="Ulangi"
              aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
            />
          </Tooltip>
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
            isIssueActionable={isReadinessActionable}
          />
          <Tooltip title="Dibuka di tab baru dari perubahan lokal saat ini dan data contoh.">
            <Button
              className={styles.previewAction}
              icon={<FilePdfOutlined />}
              onClick={handlePreviewPdf}
              loading={generating}
              aria-label="Preview PDF dari perubahan lokal dan data contoh"
            >
              Preview PDF
            </Button>
          </Tooltip>
          {templateStatus !== "published" ? (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => void handlePublish()}
              loading={publishing}
              disabled={
                !templateReady ||
                autosaveState.status === "saving" ||
                uploadingAsset ||
                uploadingBackground
              }
            >
              Publikasikan
            </Button>
          ) : null}
        </div>
      </header>

      {autosaveState.status === "conflict" ? (
        <Alert
          className={styles.conflictBanner}
          type="error"
          showIcon
          title="Versi server berubah"
          description={`Perubahan lokal tetap aman. Versi server ${autosaveState.conflict?.currentVersion ?? ""} diperbarui ${autosaveState.conflict?.updatedAt ? new Date(autosaveState.conflict.updatedAt).toLocaleString("id-ID") : ""}.`}
          action={
            <Space wrap>
              <Button
                size="small"
                onClick={() => void handleLoadServerVersion()}
              >
                Muat versi server
              </Button>
              <Button size="small" danger onClick={handleOverwriteConflict}>
                Timpa dengan versi saya
              </Button>
            </Space>
          }
        />
      ) : null}

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
            variableChooserOpen={variableChooserOpen}
            onVariableChooserOpenChange={setVariableChooserOpen}
            onVariableSelect={handleVariableSelect}
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
              autosaveRef.current?.dispose();
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

export default CertificateDesigner;
