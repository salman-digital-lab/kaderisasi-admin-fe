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
  message,
  Alert,
  Switch,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { CertificateElement } from "../types";
import { VARIABLE_OPTIONS, DEFAULT_FONT_FAMILIES } from "../constants";
import { getValidatedUploadFile } from "../utils/readUploadFile";
import { getCertificateAssetUrl } from "../utils/certificate-content";

const { Text } = Typography;

// ─── Types ──────────────────────────────────────────────────────────────────

interface PropertyPanelProps {
  element: CertificateElement | null;
  onUpdate: (
    updates: Partial<CertificateElement>,
    historyGroup?: string,
  ) => void;
  onUpdateComplete: (historyGroup: string) => void;
  onAssetUpload: (file: File) => Promise<{ url: string } | null>;
  assetUploading: boolean;
  templateDescription?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  snapToGrid?: boolean;
  showGrid?: boolean;
  showGuides?: boolean;
  snapToGuides?: boolean;
  onTemplateDescriptionChange?: (value: string) => void;
  onSnapToGridChange?: (value: boolean) => void;
  onShowGridChange?: (value: boolean) => void;
  onShowGuidesChange?: (value: boolean) => void;
  onSnapToGuidesChange?: (value: boolean) => void;
  onOpenCanvasSettings?: () => void;
  onBackgroundUpload?: (file: File) => Promise<void>;
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
        aria-label={label}
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

const SliderNumber: React.FC<{
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  onComplete: () => void;
}> = ({ value, min, max, label, onChange, onComplete }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <Slider
      style={{ flex: 1, marginInline: 4 }}
      min={min}
      max={max}
      value={value}
      aria-label={label}
      onChange={onChange}
      onChangeComplete={onComplete}
    />
    <InputNumber
      size="small"
      min={min}
      max={max}
      value={value}
      aria-label={`${label} numerik`}
      onChange={(next) => onChange(next ?? value)}
      onBlur={onComplete}
      onPressEnter={(event) => event.currentTarget.blur()}
      style={{ width: 72 }}
    />
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export const PropertyPanel: React.FC<PropertyPanelProps> = React.memo(
  ({
    element,
    onUpdate,
    onUpdateComplete,
    onAssetUpload,
    assetUploading,
    templateDescription = "",
    canvasWidth,
    canvasHeight,
    snapToGrid,
    showGrid,
    showGuides,
    snapToGuides,
    onTemplateDescriptionChange,
    onSnapToGridChange,
    onShowGridChange,
    onShowGuidesChange,
    onSnapToGuidesChange,
    onOpenCanvasSettings,
    onBackgroundUpload,
  }) => {
    // ── Callbacks ───────────────────────────────────────────────────────

    const handleImageUpload = useCallback(
      async (info: { file: import("antd").UploadFile }) => {
        const file = getValidatedUploadFile(info, message.error);
        if (!file) return;
        const uploaded = await onAssetUpload(file);
        if (uploaded) {
          onUpdate({ imageUrl: uploaded.url });
        }
      },
      [onAssetUpload, onUpdate],
    );

    const updateField = useCallback(
      <K extends keyof CertificateElement>(
        key: K,
        value: CertificateElement[K],
        groupHistory = false,
      ) => onUpdate({ [key]: value }, groupHistory ? String(key) : undefined),
      [onUpdate],
    );

    // ── Empty state ─────────────────────────────────────────────────────

    if (!element) {
      return (
        <section style={{ height: "100%", overflow: "auto", padding: 12 }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Kanvas
          </Typography.Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            <PropertySection label="Deskripsi template">
              <Input.TextArea
                value={templateDescription}
                autoSize={{ minRows: 2, maxRows: 5 }}
                placeholder="Deskripsi opsional"
                onChange={(event) =>
                  onTemplateDescriptionChange?.(event.target.value)
                }
              />
            </PropertySection>
            <PropertySection label="Ukuran dokumen">
              <Button block onClick={onOpenCanvasSettings}>
                {canvasWidth} × {canvasHeight} px
              </Button>
            </PropertySection>
            <PropertySection label="Bantuan tata letak">
              <Space direction="vertical">
                <Switch
                  checked={showGrid}
                  onChange={onShowGridChange}
                  checkedChildren="Tampilkan grid"
                  unCheckedChildren="Tampilkan grid"
                />
                <Switch
                  checked={snapToGrid}
                  onChange={onSnapToGridChange}
                  checkedChildren="Snap grid"
                  unCheckedChildren="Snap grid"
                />
                <Switch
                  checked={showGuides}
                  onChange={onShowGuidesChange}
                  checkedChildren="Guides"
                  unCheckedChildren="Guides"
                />
                <Switch
                  checked={snapToGuides}
                  onChange={onSnapToGuidesChange}
                  checkedChildren="Snap guides"
                  unCheckedChildren="Snap guides"
                />
              </Space>
            </PropertySection>
            {onBackgroundUpload ? (
              <Upload
                accept=".jpg,.jpeg,.png,.webp"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={(info) => {
                  const file = getValidatedUploadFile(info, message.error);
                  if (file) void onBackgroundUpload(file);
                }}
              >
                <Button block icon={<UploadOutlined />}>
                  Unggah background
                </Button>
              </Upload>
            ) : null}
            <Alert
              type="info"
              showIcon
              title="Pilih layer untuk mengedit properti elemennya."
            />
          </Space>
        </section>
      );
    }

    const isTextElement =
      element.type === "static-text" || element.type === "variable-text";
    const isImageElement =
      element.type === "image" || element.type === "signature";

    // ── Render ───────────────────────────────────────────────────────────

    return (
      <Card
        size="small"
        title="Properti"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
        }}
        styles={{
          body: { padding: 12, overflow: "auto", flex: 1, minHeight: 0 },
        }}
      >
        {element.locked ? (
          <Alert
            type="warning"
            showIcon
            title="Layer terkunci. Buka kunci dari panel Layers untuk mengubah properti."
            style={{ marginBottom: 8 }}
          />
        ) : null}
        <fieldset
          disabled={element.locked}
          style={{ minWidth: 0, margin: 0, padding: 0, border: 0 }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <PropertySection label="Nama Layer">
              <Input
                size="small"
                value={element.name}
                placeholder="Nama layer"
                aria-label="Nama layer"
                onChange={(e) => updateField("name", e.target.value, true)}
                onBlur={() => onUpdateComplete("name")}
                onPressEnter={(event) => event.currentTarget.blur()}
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
                    aria-label="Variabel teks"
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
                      aria-label="Konten teks statis"
                      onChange={(e) =>
                        updateField("content", e.target.value, true)
                      }
                      onBlur={() => onUpdateComplete("content")}
                    />
                  </PropertySection>
                )}

                <PropertySection label="Ukuran Font">
                  <SliderNumber
                    min={8}
                    max={120}
                    value={element.fontSize || 16}
                    label="Ukuran font"
                    onChange={(v) => updateField("fontSize", v, true)}
                    onComplete={() => onUpdateComplete("fontSize")}
                  />
                </PropertySection>

                <PropertySection label="Format">
                  <Space.Compact>
                    <Button
                      size="small"
                      type={
                        element.fontWeight === "bold" ? "primary" : "default"
                      }
                      aria-label="Tebal"
                      aria-pressed={element.fontWeight === "bold"}
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
                      aria-label="Miring"
                      aria-pressed={element.fontStyle === "italic"}
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
                      aria-label="Garis bawah"
                      aria-pressed={element.textDecoration === "underline"}
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
                    aria-label="Jenis font"
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
                    onChange={(c) =>
                      updateField("color", c.toHexString(), true)
                    }
                    onChangeComplete={() => onUpdateComplete("color")}
                    showText
                  />
                </PropertySection>

                <PropertySection label="Alignment">
                  <Segmented
                    block
                    value={element.textAlign || "center"}
                    aria-label="Perataan horizontal"
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
                    aria-label="Perataan vertikal"
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
                      aria-label="Jarak antarbaris"
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
                      aria-label="Jarak antarhuruf"
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
                    aria-label="Penyesuaian gambar"
                    onChange={(v) =>
                      updateField(
                        "objectFit",
                        v as "contain" | "cover" | "fill",
                      )
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
                      accept=".jpg,.jpeg,.png,.webp"
                      showUploadList={false}
                      beforeUpload={() => false}
                      onChange={handleImageUpload}
                      disabled={assetUploading}
                    >
                      <Button
                        size="small"
                        icon={<UploadOutlined />}
                        loading={assetUploading}
                      >
                        Pilih Gambar
                      </Button>
                    </Upload>
                  </div>
                  {element.imageUrl && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={
                          getCertificateAssetUrl(element.imageUrl) || undefined
                        }
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

            {element.type === "qr-code" && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <Alert
                  type="info"
                  showIcon
                  title="QR verifikasi otomatis"
                  description="QR akan menggunakan link verifikasi unik dari kode sertifikat saat diterbitkan."
                />
              </>
            )}

            <Divider style={{ margin: "8px 0" }} />

            <PropertySection label="Opacity">
              <SliderNumber
                min={0}
                max={100}
                value={element.opacity ?? 100}
                label="Opacity elemen"
                onChange={(v) => updateField("opacity", v, true)}
                onComplete={() => onUpdateComplete("opacity")}
              />
            </PropertySection>

            <PropertySection label="Rotasi">
              <SliderNumber
                min={-180}
                max={180}
                value={element.rotation || 0}
                label="Rotasi elemen"
                onChange={(v) => updateField("rotation", v, true)}
                onComplete={() => onUpdateComplete("rotation")}
              />
            </PropertySection>

            <PropertySection label="Border Radius">
              <SliderNumber
                min={0}
                max={80}
                value={element.borderRadius || 0}
                label="Radius sudut elemen"
                onChange={(v) => updateField("borderRadius", v, true)}
                onComplete={() => onUpdateComplete("borderRadius")}
              />
            </PropertySection>
          </Space>
        </fieldset>
      </Card>
    );
  },
);

PropertyPanel.displayName = "PropertyPanel";
