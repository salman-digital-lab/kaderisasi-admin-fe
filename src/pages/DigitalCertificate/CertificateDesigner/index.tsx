import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, message, Button, Input, Space, Spin, Modal, Tag } from "antd";
import {
  SafetyCertificateOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import {
  CertificateCanvas,
  ElementToolbar,
  LayerPanel,
  PropertyPanel,
  VariableTextModal,
  CanvasSettingsModal,
} from "../components";
import { useCertificateDesigner } from "../hooks";
import { ElementType } from "../types";
import {
  getCertificateTemplate,
  updateCertificateTemplate,
  uploadCertificateBackground,
} from "../../../api/services/certificateTemplate";
import { usePdfPreview } from "./hooks/usePdfPreview";

const CertificateDesigner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const templateId = Number(id);

  const {
    template,
    setTemplate,
    selectedElement,
    selectedElementId,
    setBackgroundUrl,
    setCanvasSize,
    addElement,
    updateElement,
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
  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [canvasSettingsVisible, setCanvasSettingsVisible] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const { generatePdf, generating } = usePdfPreview();

  const getDesignerStateSnapshot = useCallback(
    (currentTemplate = template) =>
      JSON.stringify({
        name: templateName.trim(),
        description: templateDescription || null,
        template: currentTemplate,
      }),
    [template, templateDescription, templateName],
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return getDesignerStateSnapshot() !== savedSnapshot;
  }, [getDesignerStateSnapshot, savedSnapshot]);

  const getImageUrl = useCallback((path: string | null) => {
    if (!path) return null;
    if (path.startsWith("data:") || path.startsWith("http")) return path;

    const imageBaseUrl = import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL || "";
    return `${imageBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  }, []);

  // Load template data on mount
  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      try {
        const data = await getCertificateTemplate(templateId);
        if (data) {
          setTemplateName(data.name);
          setTemplateDescription(data.description || "");
          if (data.template_data) {
            const nextTemplate = {
              backgroundUrl:
                getImageUrl(data.background_image) ||
                data.template_data.backgroundUrl ||
                null,
              elements: data.template_data.elements || [],
              canvasWidth: data.template_data.canvasWidth || 800,
              canvasHeight: data.template_data.canvasHeight || 566,
            };
            setTemplate(nextTemplate);
            setSavedSnapshot(
              JSON.stringify({
                name: data.name.trim(),
                description: data.description || null,
                template: nextTemplate,
              }),
            );
          }
        }
      } catch {
        message.error("Gagal memuat template");
        navigate("/digital-certificate");
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [getImageUrl, templateId, navigate, setTemplate]);

  const handleSave = useCallback(async () => {
    if (!templateName.trim()) {
      message.warning("Nama template tidak boleh kosong");
      return;
    }

    setSaving(true);
    try {
      await updateCertificateTemplate(templateId, {
        name: templateName,
        description: templateDescription || null,
        templateData: template,
      });
      setSavedSnapshot(getDesignerStateSnapshot());
      message.success("Template berhasil disimpan");
    } catch {
      // Error handled by handleError
    } finally {
      setSaving(false);
    }
  }, [
    getDesignerStateSnapshot,
    templateId,
    templateName,
    templateDescription,
    template,
  ]);

  const handleBack = useCallback(() => {
    if (!isDirty) {
      navigate("/digital-certificate");
      return;
    }

    Modal.confirm({
      title: "Keluar tanpa menyimpan?",
      content: "Perubahan template belum disimpan.",
      okText: "Keluar",
      cancelText: "Tetap di sini",
      okButtonProps: { danger: true },
      onOk: () => navigate("/digital-certificate"),
    });
  }, [isDirty, navigate]);

  const handleAddElement = (type: ElementType) => {
    if (type === "variable-text") {
      setVariableModalVisible(true);
    } else {
      addElement(type);
      message.success(`${getElementTypeName(type)} berhasil ditambahkan`);
    }
  };

  const handleVariableSelect = (variable: string) => {
    addElement("variable-text", { variable });
    setVariableModalVisible(false);
    message.success("Teks variabel berhasil ditambahkan");
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
      message.success("Elemen berhasil dihapus");
    }
  }, [selectedElementId, deleteElement]);

  // ── Keyboard shortcuts ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const modifierKey = e.metaKey || e.ctrlKey;

      if (modifierKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
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

  const handleDuplicateSelected = () => {
    if (selectedElementId) {
      duplicateElement(selectedElementId);
      message.success("Elemen berhasil diduplikat");
    }
  };

  const handleCopySelected = () => {
    if (selectedElementId && copyElement(selectedElementId)) {
      message.success("Elemen disalin");
    }
  };

  const handlePaste = () => {
    if (pasteElement()) {
      message.success("Elemen ditempel");
    }
  };

  const handleImageUpload = (url: string) => {
    addElement("image", { imageUrl: url });
    message.success("Gambar berhasil ditambahkan");
  };

  const handleBackgroundUpload = async (url: string, file?: File) => {
    if (file && templateId) {
      try {
        const result = await uploadCertificateBackground(templateId, file);
        if (result) {
          setBackgroundUrl(getImageUrl(result.backgroundImage) || url);
          message.success("Background berhasil diupload");
          return;
        }
      } catch {
        // Fall back to base64 if upload fails
      }
    }
    setBackgroundUrl(url);
    message.success("Background berhasil diupload");
  };

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!template.backgroundUrl) warnings.push("Background belum diatur");
    if (template.elements.length === 0) warnings.push("Belum ada elemen");
    if (
      !template.elements.some(
        (element) =>
          element.type === "variable-text" && element.variable === "{{name}}",
      )
    ) {
      warnings.push("Variabel nama peserta belum ada");
    }
    if (
      template.elements.some(
        (element) =>
          element.x < 0 ||
          element.y < 0 ||
          element.x + element.width > template.canvasWidth ||
          element.y + element.height > template.canvasHeight,
      )
    ) {
      warnings.push("Ada elemen di luar kanvas");
    }
    if (
      template.elements.some(
        (element) =>
          ["image", "qr-code", "signature"].includes(element.type) &&
          !element.imageUrl,
      )
    ) {
      warnings.push("Ada elemen gambar tanpa file");
    }
    return warnings;
  }, [template]);

  const handlePreviewPdf = () => {
    generatePdf(template);
  };

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
    <div
      style={{
        padding: 12,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Card
        variant="outlined"
        style={{ borderRadius: 0, marginBottom: 12 }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} />
            <SafetyCertificateOutlined
              style={{ fontSize: 24, color: "#1890ff" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nama template"
                variant="borderless"
                style={{ fontSize: 16, fontWeight: 600, padding: 0 }}
              />
              <Input
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Deskripsi template (opsional)"
                variant="borderless"
                style={{ fontSize: 12, color: "#8c8c8c", padding: 0 }}
              />
            </div>
            {isDirty && <Tag color="gold">Belum disimpan</Tag>}
            {validationWarnings.length > 0 && (
              <Tag color="orange">{validationWarnings.length} warning</Tag>
            )}
          </div>
          <Space>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handlePreviewPdf}
              loading={generating}
            >
              Preview PDF
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty}
            >
              Simpan Template
            </Button>
          </Space>
        </div>
      </Card>

      {/* Main Content */}
      <Card
        variant="outlined"
        style={{
          flex: 1,
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
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
          onMoveSelectedForward={() => {
            if (selectedElementId)
              updateElementOrder(selectedElementId, "forward");
          }}
          onMoveSelectedBackward={() => {
            if (selectedElementId)
              updateElementOrder(selectedElementId, "backward");
          }}
          onAlignSelected={(alignment) => {
            if (selectedElementId) alignElement(selectedElementId, alignment);
          }}
          onOpenCanvasSettings={() => setCanvasSettingsVisible(true)}
          hasSelection={!!selectedElementId}
          hasClipboard={hasClipboard}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {/* Canvas and Property Panel */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <LayerPanel
            elements={template.elements}
            selectedElementId={selectedElementId}
            onSelect={selectElement}
            onRename={renameElement}
            onToggleVisibility={toggleElementVisibility}
            onToggleLock={toggleElementLock}
            onMoveForward={(elementId) =>
              updateElementOrder(elementId, "forward")
            }
            onMoveBackward={(elementId) =>
              updateElementOrder(elementId, "backward")
            }
            onDuplicate={duplicateElement}
            onDelete={deleteElement}
          />
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
          <PropertyPanel
            element={selectedElement}
            onUpdate={(updates) => {
              if (selectedElementId) {
                updateElement(selectedElementId, updates);
              }
            }}
          />
        </div>
      </Card>

      {/* Variable Text Modal */}
      <VariableTextModal
        visible={variableModalVisible}
        onCancel={() => setVariableModalVisible(false)}
        onSelect={handleVariableSelect}
      />

      {/* Canvas Settings Modal */}
      <CanvasSettingsModal
        visible={canvasSettingsVisible}
        width={template.canvasWidth}
        height={template.canvasHeight}
        onCancel={() => setCanvasSettingsVisible(false)}
        onSave={(width, height) => {
          setCanvasSize(width, height);
          setCanvasSettingsVisible(false);
          message.success("Ukuran kanvas berhasil diubah");
        }}
      />
    </div>
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
