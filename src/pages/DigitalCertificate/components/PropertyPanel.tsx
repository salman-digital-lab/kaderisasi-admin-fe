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
import type { UploadFile } from "antd";
import { CertificateElement } from "../types";
import { VARIABLE_OPTIONS, DEFAULT_FONT_FAMILIES } from "../constants";

const { Text } = Typography;

interface PropertyPanelProps {
  element: CertificateElement | null;
  onUpdate: (updates: Partial<CertificateElement>) => void;
}

// Debounced input component for better performance
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
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        onChange(localValue);
      }
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

export const PropertyPanel: React.FC<PropertyPanelProps> = React.memo(
  ({ element, onUpdate }) => {
    const handleImageUpload = useCallback(
      (info: { file: UploadFile }) => {
        const file = info.file.originFileObj || (info.file as unknown as File);
        if (file && file instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              onUpdate({ imageUrl: e.target.result as string });
            }
          };
          reader.readAsDataURL(file);
        }
      },
      [onUpdate],
    );

    const handleXChange = useCallback(
      (value: number) => onUpdate({ x: value }),
      [onUpdate],
    );

    const handleYChange = useCallback(
      (value: number) => onUpdate({ y: value }),
      [onUpdate],
    );

    const handleWidthChange = useCallback(
      (value: number) => onUpdate({ width: value }),
      [onUpdate],
    );

    const handleHeightChange = useCallback(
      (value: number) => onUpdate({ height: value }),
      [onUpdate],
    );

    const handleVariableChange = useCallback(
      (value: string) => onUpdate({ variable: value }),
      [onUpdate],
    );

    const handleFontSizeChange = useCallback(
      (value: number) => onUpdate({ fontSize: value }),
      [onUpdate],
    );

    const handleFontFamilyChange = useCallback(
      (value: string) => onUpdate({ fontFamily: value }),
      [onUpdate],
    );

    const handleColorChange = useCallback(
      (color: { toHexString: () => string }) =>
        onUpdate({ color: color.toHexString() }),
      [onUpdate],
    );

    const handleTextAlignChange = useCallback(
      (value: "left" | "center" | "right") => onUpdate({ textAlign: value }),
      [onUpdate],
    );

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
      element.type === "qr-code" || element.type === "signature";

    return (
      <Card
        size="small"
        title="Properti"
        style={{ width: 280, height: "100%" }}
        styles={{ body: { padding: 12 } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          {/* Position */}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Posisi
            </Text>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <DebouncedInput
                label="X"
                value={Math.round(element.x)}
                onChange={handleXChange}
              />
              <DebouncedInput
                label="Y"
                value={Math.round(element.y)}
                onChange={handleYChange}
              />
            </div>
          </div>

          {/* Size */}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Ukuran
            </Text>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <DebouncedInput
                label="Lebar"
                value={Math.round(element.width)}
                onChange={handleWidthChange}
              />
              <DebouncedInput
                label="Tinggi"
                value={Math.round(element.height)}
                onChange={handleHeightChange}
              />
            </div>
          </div>

          {/* Variable Selection */}
          {element.type === "variable-text" && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Variabel
                </Text>
                <Select
                  size="small"
                  style={{ width: "100%", marginTop: 4 }}
                  value={element.variable}
                  onChange={handleVariableChange}
                  options={VARIABLE_OPTIONS.map((opt) => ({
                    label: opt.label,
                    value: opt.value,
                  }))}
                />
              </div>
            </>
          )}

          {/* Text Properties */}
          {isTextElement && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ukuran Font
                </Text>
                <Slider
                  min={8}
                  max={72}
                  value={element.fontSize || 16}
                  onChange={handleFontSizeChange}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Font
                </Text>
                <Select
                  size="small"
                  style={{ width: "100%", marginTop: 4 }}
                  value={element.fontFamily || "sans-serif"}
                  onChange={handleFontFamilyChange}
                  options={DEFAULT_FONT_FAMILIES.map((font) => ({
                    label: font.label,
                    value: font.value,
                  }))}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Warna
                </Text>
                <div style={{ marginTop: 4 }}>
                  <ColorPicker
                    value={element.color || "#000000"}
                    onChange={handleColorChange}
                    showText
                  />
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Alignment
                </Text>
                <Select
                  size="small"
                  style={{ width: "100%", marginTop: 4 }}
                  value={element.textAlign || "center"}
                  onChange={handleTextAlignChange}
                  options={[
                    { label: "Kiri", value: "left" },
                    { label: "Tengah", value: "center" },
                    { label: "Kanan", value: "right" },
                  ]}
                />
              </div>
            </>
          )}

          {/* Image Upload */}
          {isImageElement && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Upload Gambar
                </Text>
                <div style={{ marginTop: 8 }}>
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
              </div>
            </>
          )}
        </Space>
      </Card>
    );
  },
);

PropertyPanel.displayName = "PropertyPanel";
