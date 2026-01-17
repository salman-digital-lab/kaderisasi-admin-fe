import React, { useState } from "react";
import { Card, Typography, message, Button, Tooltip, Tag } from "antd";
import {
  SafetyCertificateOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import {
  CertificateCanvas,
  ElementToolbar,
  PropertyPanel,
  VariableTextModal,
  CanvasSettingsModal,
} from "./components";
import { useCertificateDesigner } from "./hooks";
import { ElementType } from "./types";

const { Text } = Typography;

const DigitalCertificate: React.FC = () => {
  const {
    template,
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

  const [variableModalVisible, setVariableModalVisible] = useState(false);
  const [canvasSettingsVisible, setCanvasSettingsVisible] = useState(false);

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

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
      message.success("Elemen berhasil dihapus");
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedElementId) {
      duplicateElement(selectedElementId);
      message.success("Elemen berhasil diduplikat");
    }
  };

  const handleBackgroundUpload = (url: string) => {
    setBackgroundUrl(url);
    message.success("Background berhasil diupload");
  };

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
            <SafetyCertificateOutlined
              style={{ fontSize: 24, color: "#1890ff" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text strong style={{ fontSize: 16 }}>
                  Desainer Sertifikat Digital
                </Text>
                <Tag icon={<ExperimentOutlined />} color="orange">
                  Experimental
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Buat dan desain template sertifikat digital
              </Text>
            </div>
          </div>
          <Tooltip title="Fitur ini masih dalam tahap eksperimen">
            <Button type="primary" disabled>
              Simpan Template
            </Button>
          </Tooltip>
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
    case "qr-code":
      return "QR Code";
    case "signature":
      return "Tanda tangan";
    default:
      return "Elemen";
  }
}

export default DigitalCertificate;
