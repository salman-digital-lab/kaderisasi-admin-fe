import React, { useState, useEffect } from "react";
import { Modal, InputNumber, Select, Space, Typography } from "antd";

const { Text } = Typography;

interface CanvasSettingsModalProps {
  visible: boolean;
  width: number;
  height: number;
  onCancel: () => void;
  onSave: (width: number, height: number) => void;
}

const PRESETS = [
  { label: "A4 Landscape (297×210mm)", width: 800, height: 566 },
  { label: "A4 Portrait (210×297mm)", width: 566, height: 800 },
  { label: "Letter Landscape (11×8.5in)", width: 792, height: 612 },
  { label: "Letter Portrait (8.5×11in)", width: 612, height: 792 },
  { label: "Square (1:1)", width: 600, height: 600 },
  { label: "Social Media (16:9)", width: 800, height: 450 },
  { label: "Custom", width: 0, height: 0 },
] as const;

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> =
  React.memo(({ visible, width, height, onCancel, onSave }) => {
    const [localWidth, setLocalWidth] = useState(width);
    const [localHeight, setLocalHeight] = useState(height);
    const [selectedPreset, setSelectedPreset] = useState<string>("custom");

    useEffect(() => {
      if (visible) {
        setLocalWidth(width);
        setLocalHeight(height);
        // Find matching preset
        const preset = PRESETS.find(
          (p) => p.width === width && p.height === height,
        );
        setSelectedPreset(preset?.label || "Custom");
      }
    }, [visible, width, height]);

    const handlePresetChange = (value: string) => {
      setSelectedPreset(value);
      const preset = PRESETS.find((p) => p.label === value);
      if (preset && preset.width > 0) {
        setLocalWidth(preset.width);
        setLocalHeight(preset.height);
      }
    };

    const handleSave = () => {
      onSave(localWidth, localHeight);
    };

    return (
      <Modal
        title="Pengaturan Ukuran Kanvas"
        open={visible}
        onOk={handleSave}
        onCancel={onCancel}
        okText="Simpan"
        cancelText="Batal"
        width={400}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text
              type="secondary"
              style={{ fontSize: 12, marginBottom: 4, display: "block" }}
            >
              Preset
            </Text>
            <Select
              style={{ width: "100%" }}
              value={selectedPreset}
              onChange={handlePresetChange}
              options={PRESETS.map((p) => ({ label: p.label, value: p.label }))}
            />
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Text
                type="secondary"
                style={{ fontSize: 12, marginBottom: 4, display: "block" }}
              >
                Lebar (px)
              </Text>
              <InputNumber
                style={{ width: "100%" }}
                min={200}
                max={2000}
                value={localWidth}
                onChange={(value) => {
                  setLocalWidth(value || 800);
                  setSelectedPreset("Custom");
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text
                type="secondary"
                style={{ fontSize: 12, marginBottom: 4, display: "block" }}
              >
                Tinggi (px)
              </Text>
              <InputNumber
                style={{ width: "100%" }}
                min={200}
                max={2000}
                value={localHeight}
                onChange={(value) => {
                  setLocalHeight(value || 566);
                  setSelectedPreset("Custom");
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: 12,
              backgroundColor: "#fafafa",
              borderRadius: 4,
              textAlign: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Preview: {localWidth} × {localHeight} px
            </Text>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 120,
              }}
            >
              <div
                style={{
                  width: (() => {
                    const maxWidth = 180;
                    const maxHeight = 100;
                    const aspectRatio = localWidth / localHeight;
                    if (aspectRatio > maxWidth / maxHeight) {
                      return maxWidth;
                    }
                    return maxHeight * aspectRatio;
                  })(),
                  height: (() => {
                    const maxWidth = 180;
                    const maxHeight = 100;
                    const aspectRatio = localWidth / localHeight;
                    if (aspectRatio > maxWidth / maxHeight) {
                      return maxWidth / aspectRatio;
                    }
                    return maxHeight;
                  })(),
                  backgroundColor: "#fff",
                  border: "1px solid #d9d9d9",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
              />
            </div>
          </div>
        </Space>
      </Modal>
    );
  });

CanvasSettingsModal.displayName = "CanvasSettingsModal";
