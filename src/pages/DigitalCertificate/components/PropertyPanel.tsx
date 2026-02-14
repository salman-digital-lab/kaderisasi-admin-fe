import React, { useCallback, useState, useEffect } from "react";
import {
  Card,
  Input,
  Select,
  Slider,
  ColorPicker,
  Upload,
  Button,
  Typography,
  Space,
  Divider,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { CertificateElement } from "../types";
import { VARIABLE_OPTIONS, DEFAULT_FONT_FAMILIES } from "../constants";
import { readUploadFileAsDataUrl } from "../utils/readUploadFile";

const { Text } = Typography;

// ─── Types ──────────────────────────────────────────────────────────────────

interface PropertyPanelProps {
  element: CertificateElement | null;
  onUpdate: (updates: Partial<CertificateElement>) => void;
}

// ─── Reusable sub-components ────────────────────────────────────────────────

/** A number input that only commits on blur or Enter for performance. */
const DebouncedInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
}> = React.memo(({ value, onChange, label }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    if (localValue !== value) onChange(localValue);
  }, [localValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") onChange(localValue);
    },
    [localValue, onChange],
  );

  return (
    <div style={{ flex: 1 }}>
      <Text style={{ fontSize: 11 }}>{label}</Text>
      <Input
        size="small"
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
});

DebouncedInput.displayName = "DebouncedInput";

/** Label + content wrapper for each property section. */
const PropertySection: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <Text type="secondary" style={{ fontSize: 12 }}>
      {label}
    </Text>
    <div style={{ marginTop: 4 }}>{children}</div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export const PropertyPanel: React.FC<PropertyPanelProps> = React.memo(
  ({ element, onUpdate }) => {
    // ── Callbacks ───────────────────────────────────────────────────────

    const handleImageUpload = useCallback(
      (info: { file: import("antd").UploadFile }) => {
        readUploadFileAsDataUrl(info, (dataUrl) =>
          onUpdate({ imageUrl: dataUrl }),
        );
      },
      [onUpdate],
    );

    const updateField = useCallback(
      <K extends keyof CertificateElement>(
        key: K,
        value: CertificateElement[K],
      ) => onUpdate({ [key]: value }),
      [onUpdate],
    );

    // ── Empty state ─────────────────────────────────────────────────────

    if (!element) {
      return (
        <Card
          size="small"
          title="Properti"
          style={{ width: 280, height: "100%" }}
          styles={{ body: { padding: 12 } }}
        >
          <Text type="secondary">Pilih elemen untuk mengedit properti</Text>
        </Card>
      );
    }

    const isTextElement =
      element.type === "static-text" || element.type === "variable-text";
    const isImageElement =
      element.type === "image" ||
      element.type === "qr-code" ||
      element.type === "signature";

    // ── Render ───────────────────────────────────────────────────────────

    return (
      <Card
        size="small"
        title="Properti"
        style={{ width: 280, height: "100%" }}
        styles={{ body: { padding: 12 } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          {/* Position */}
          <PropertySection label="Posisi">
            <div style={{ display: "flex", gap: 8 }}>
              <DebouncedInput
                label="X"
                value={Math.round(element.x)}
                onChange={(v) => updateField("x", v)}
              />
              <DebouncedInput
                label="Y"
                value={Math.round(element.y)}
                onChange={(v) => updateField("y", v)}
              />
            </div>
          </PropertySection>

          {/* Size */}
          <PropertySection label="Ukuran">
            <div style={{ display: "flex", gap: 8 }}>
              <DebouncedInput
                label="Lebar"
                value={Math.round(element.width)}
                onChange={(v) => updateField("width", v)}
              />
              <DebouncedInput
                label="Tinggi"
                value={Math.round(element.height)}
                onChange={(v) => updateField("height", v)}
              />
            </div>
          </PropertySection>

          {/* Variable Selection */}
          {element.type === "variable-text" && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <PropertySection label="Variabel">
                <Select
                  size="small"
                  style={{ width: "100%" }}
                  value={element.variable}
                  onChange={(v) => updateField("variable", v)}
                  options={VARIABLE_OPTIONS.map((opt) => ({
                    label: opt.label,
                    value: opt.value,
                  }))}
                />
              </PropertySection>
            </>
          )}

          {/* Text Properties */}
          {isTextElement && (
            <>
              <Divider style={{ margin: "8px 0" }} />

              <PropertySection label="Ukuran Font">
                <Slider
                  min={8}
                  max={72}
                  value={element.fontSize || 16}
                  onChange={(v) => updateField("fontSize", v)}
                />
              </PropertySection>

              <PropertySection label="Font">
                <Select
                  size="small"
                  style={{ width: "100%" }}
                  value={element.fontFamily || "sans-serif"}
                  onChange={(v) => updateField("fontFamily", v)}
                  options={DEFAULT_FONT_FAMILIES.map((font) => ({
                    label: font.label,
                    value: font.value,
                  }))}
                />
              </PropertySection>

              <PropertySection label="Warna">
                <ColorPicker
                  value={element.color || "#000000"}
                  onChange={(c) => updateField("color", c.toHexString())}
                  showText
                />
              </PropertySection>

              <PropertySection label="Alignment">
                <Select
                  size="small"
                  style={{ width: "100%" }}
                  value={element.textAlign || "center"}
                  onChange={(v: "left" | "center" | "right") =>
                    updateField("textAlign", v)
                  }
                  options={[
                    { label: "Kiri", value: "left" },
                    { label: "Tengah", value: "center" },
                    { label: "Kanan", value: "right" },
                  ]}
                />
              </PropertySection>
            </>
          )}

          {/* Image Upload */}
          {isImageElement && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <PropertySection label="Upload Gambar">
                <div style={{ marginTop: 4 }}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleImageUpload}
                  >
                    <Button size="small" icon={<UploadOutlined />}>
                      Pilih Gambar
                    </Button>
                  </Upload>
                </div>
                {element.imageUrl && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={element.imageUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: 100,
                        objectFit: "contain",
                        border: "1px solid #d9d9d9",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                )}
              </PropertySection>
            </>
          )}
        </Space>
      </Card>
    );
  },
);

PropertyPanel.displayName = "PropertyPanel";
