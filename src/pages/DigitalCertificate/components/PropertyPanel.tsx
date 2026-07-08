import React, { useCallback, useState, useEffect } from "react";
import {
  Card,
  Input,
  Select,
  Slider,
  ColorPicker,
  Upload,
  Button,
  InputNumber,
  Typography,
  Space,
  Divider,
  Segmented,
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
          style={{ width: 300, height: "100%", borderRadius: 0 }}
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
        style={{ width: 300, height: "100%", borderRadius: 0 }}
        styles={{ body: { padding: 12, overflow: "auto", height: "100%" } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <PropertySection label="Nama Layer">
            <Input
              size="small"
              value={element.name}
              placeholder="Nama layer"
              onChange={(e) => updateField("name", e.target.value)}
            />
          </PropertySection>

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

              {element.type === "static-text" && (
                <PropertySection label="Konten">
                  <Input.TextArea
                    size="small"
                    rows={3}
                    value={element.content}
                    onChange={(e) => updateField("content", e.target.value)}
                  />
                </PropertySection>
              )}

              <PropertySection label="Ukuran Font">
                <Slider
                  min={8}
                  max={120}
                  value={element.fontSize || 16}
                  onChange={(v) => updateField("fontSize", v)}
                />
              </PropertySection>

              <PropertySection label="Format">
                <Space.Compact>
                  <Button
                    size="small"
                    type={element.fontWeight === "bold" ? "primary" : "default"}
                    onClick={() =>
                      updateField(
                        "fontWeight",
                        element.fontWeight === "bold" ? "normal" : "bold",
                      )
                    }
                  >
                    B
                  </Button>
                  <Button
                    size="small"
                    type={
                      element.fontStyle === "italic" ? "primary" : "default"
                    }
                    onClick={() =>
                      updateField(
                        "fontStyle",
                        element.fontStyle === "italic" ? "normal" : "italic",
                      )
                    }
                  >
                    I
                  </Button>
                  <Button
                    size="small"
                    type={
                      element.textDecoration === "underline"
                        ? "primary"
                        : "default"
                    }
                    onClick={() =>
                      updateField(
                        "textDecoration",
                        element.textDecoration === "underline"
                          ? "none"
                          : "underline",
                      )
                    }
                  >
                    U
                  </Button>
                </Space.Compact>
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
                <Segmented
                  block
                  value={element.textAlign || "center"}
                  onChange={(v) =>
                    updateField("textAlign", v as "left" | "center" | "right")
                  }
                  options={[
                    { label: "Kiri", value: "left" },
                    { label: "Tengah", value: "center" },
                    { label: "Kanan", value: "right" },
                  ]}
                />
              </PropertySection>

              <PropertySection label="Vertical Alignment">
                <Segmented
                  block
                  value={element.verticalAlign || "middle"}
                  onChange={(v) =>
                    updateField(
                      "verticalAlign",
                      v as "top" | "middle" | "bottom",
                    )
                  }
                  options={[
                    { label: "Atas", value: "top" },
                    { label: "Tengah", value: "middle" },
                    { label: "Bawah", value: "bottom" },
                  ]}
                />
              </PropertySection>

              <div style={{ display: "flex", gap: 8 }}>
                <PropertySection label="Line Height">
                  <InputNumber
                    size="small"
                    min={0.8}
                    max={3}
                    step={0.1}
                    value={element.lineHeight || 1.2}
                    onChange={(v) => updateField("lineHeight", v || 1.2)}
                    style={{ width: "100%" }}
                  />
                </PropertySection>
                <PropertySection label="Letter Spacing">
                  <InputNumber
                    size="small"
                    min={-5}
                    max={20}
                    value={element.letterSpacing || 0}
                    onChange={(v) => updateField("letterSpacing", v || 0)}
                    style={{ width: "100%" }}
                  />
                </PropertySection>
              </div>
            </>
          )}

          {/* Image Upload */}
          {isImageElement && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <PropertySection label="Object Fit">
                <Segmented
                  block
                  value={element.objectFit || "contain"}
                  onChange={(v) =>
                    updateField("objectFit", v as "contain" | "cover" | "fill")
                  }
                  options={[
                    { label: "Contain", value: "contain" },
                    { label: "Cover", value: "cover" },
                    { label: "Fill", value: "fill" },
                  ]}
                />
              </PropertySection>

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

          <Divider style={{ margin: "8px 0" }} />

          <PropertySection label="Opacity">
            <Slider
              min={0}
              max={100}
              value={element.opacity ?? 100}
              onChange={(v) => updateField("opacity", v)}
            />
          </PropertySection>

          <PropertySection label="Rotasi">
            <Slider
              min={-180}
              max={180}
              value={element.rotation || 0}
              onChange={(v) => updateField("rotation", v)}
            />
          </PropertySection>

          <PropertySection label="Border Radius">
            <Slider
              min={0}
              max={80}
              value={element.borderRadius || 0}
              onChange={(v) => updateField("borderRadius", v)}
            />
          </PropertySection>
        </Space>
      </Card>
    );
  },
);

PropertyPanel.displayName = "PropertyPanel";
