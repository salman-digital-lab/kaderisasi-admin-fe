import React, { useState, useEffect, useCallback } from "react";
import { Card, message, Button, Input, Space, Spin } from "antd";
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
    selectElement,
    duplicateElement,
  } = useCertificateDesigner();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [canvasSettingsVisible, setCanvasSettingsVisible] = useState(false);

  const { generatePdf, generating } = usePdfPreview();

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
            setTemplate({
              backgroundUrl: data.template_data.backgroundUrl || null,
              elements: data.template_data.elements || [],
              canvasWidth: data.template_data.canvasWidth || 800,
              canvasHeight: data.template_data.canvasHeight || 566,
            });
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
  }, [templateId, navigate, setTemplate]);

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
      message.success("Template berhasil disimpan");
    } catch {
      // Error handled by handleError
    } finally {
      setSaving(false);
    }
  }, [templateId, templateName, templateDescription, template]);

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

  // ── Keyboard shortcut: Delete / Backspace to remove selected element ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelected]);

  const handleDuplicateSelected = () => {
    if (selectedElementId) {
      duplicateElement(selectedElementId);
      message.success("Elemen berhasil diduplikat");
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
          setBackgroundUrl(url);
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
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/digital-certificate")}
            />
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
          onOpenCanvasSettings={() => setCanvasSettingsVisible(true)}
          hasSelection={!!selectedElementId}
        />

        {/* Canvas and Property Panel */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <CertificateCanvas
            template={template}
            selectedElementId={selectedElementId}
            onSelectElement={selectElement}
            onMoveElement={moveElement}
            onUpdateElement={updateElement}
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
