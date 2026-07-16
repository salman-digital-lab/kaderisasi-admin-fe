import React from "react";
import { Button, Upload, Space, Tooltip, Divider, message } from "antd";
import {
  FontSizeOutlined,
  FieldStringOutlined,
  QrcodeOutlined,
  EditOutlined,
  PictureOutlined,
  FileImageOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExpandOutlined,
  UndoOutlined,
  RedoOutlined,
  SnippetsOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  OrderedListOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { ElementType } from "../types";
import { getValidatedUploadFile } from "../utils/readUploadFile";

type Alignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ElementToolbarProps {
  onAddElement: (type: ElementType) => void;
  onBackgroundUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  uploadingBackground: boolean;
  uploadingAsset: boolean;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onCopySelected: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onMoveSelectedForward: () => void;
  onMoveSelectedBackward: () => void;
  onAlignSelected: (alignment: Alignment) => void;
  onOpenCanvasSettings: () => void;
  hasSelection: boolean;
  hasClipboard: boolean;
  canUndo: boolean;
  canRedo: boolean;
  showPanelControls: boolean;
  onOpenLayers: () => void;
  onOpenProperties: () => void;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  backgroundColor: "#fafafa",
  borderBottom: "1px solid #f0f0f0",
  flexWrap: "nowrap",
  flex: "none",
  overflowX: "auto",
  scrollbarGutter: "stable",
};

// ─── Component ──────────────────────────────────────────────────────────────

export const ElementToolbar: React.FC<ElementToolbarProps> = React.memo(
  ({
    onAddElement,
    onBackgroundUpload,
    onImageUpload,
    uploadingBackground,
    uploadingAsset,
    onDeleteSelected,
    onDuplicateSelected,
    onCopySelected,
    onPaste,
    onUndo,
    onRedo,
    onMoveSelectedForward,
    onMoveSelectedBackward,
    onAlignSelected,
    onOpenCanvasSettings,
    hasSelection,
    hasClipboard,
    canUndo,
    canRedo,
    showPanelControls,
    onOpenLayers,
    onOpenProperties,
  }) => {
    const handleBackgroundChange = React.useCallback(
      (info: { file: import("antd").UploadFile }) => {
        const file = getValidatedUploadFile(info, message.error);
        if (file) onBackgroundUpload(file);
      },
      [onBackgroundUpload],
    );

    const handleImageChange = React.useCallback(
      (info: { file: import("antd").UploadFile }) => {
        const file = getValidatedUploadFile(info, message.error);
        if (file) onImageUpload(file);
      },
      [onImageUpload],
    );

    return (
      <div
        role="toolbar"
        aria-label="Alat desain sertifikat"
        style={toolbarStyle}
      >
        {showPanelControls && (
          <Space.Compact>
            <Button icon={<OrderedListOutlined />} onClick={onOpenLayers}>
              Layer
            </Button>
            <Button
              icon={<ControlOutlined />}
              onClick={onOpenProperties}
              disabled={!hasSelection}
            >
              Properti
            </Button>
          </Space.Compact>
        )}

        <Space.Compact>
          <Tooltip title="Undo">
            <Button
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Urungkan perubahan"
            />
          </Tooltip>
          <Tooltip title="Redo">
            <Button
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Ulangi perubahan"
            />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" style={{ height: 24 }} />

        {/* Canvas settings */}
        <Upload
          accept=".jpg,.jpeg,.png,.webp"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleBackgroundChange}
          disabled={uploadingBackground}
        >
          <Tooltip title="Upload Background">
            <Button icon={<PictureOutlined />} loading={uploadingBackground}>
              Background
            </Button>
          </Tooltip>
        </Upload>

        <Tooltip title="Ukuran Kanvas">
          <Button icon={<ExpandOutlined />} onClick={onOpenCanvasSettings}>
            Ukuran
          </Button>
        </Tooltip>

        <Divider type="vertical" style={{ height: 24 }} />

        {/* Text elements */}
        <Space.Compact>
          <Tooltip title="Tambah Teks Statis">
            <Button
              icon={<FontSizeOutlined />}
              onClick={() => onAddElement("static-text")}
            >
              Teks Statis
            </Button>
          </Tooltip>
          <Tooltip title="Tambah Teks Variabel">
            <Button
              icon={<FieldStringOutlined />}
              onClick={() => onAddElement("variable-text")}
            >
              Teks Variabel
            </Button>
          </Tooltip>
        </Space.Compact>

        {/* Media elements */}
        <Space.Compact>
          <Tooltip title="Tambah QR verifikasi unik">
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => onAddElement("qr-code")}
            >
              QR Verifikasi
            </Button>
          </Tooltip>
          <Tooltip title="Tambah Tanda Tangan">
            <Button
              icon={<EditOutlined />}
              onClick={() => onAddElement("signature")}
            >
              Tanda Tangan
            </Button>
          </Tooltip>
        </Space.Compact>

        <Upload
          accept=".jpg,.jpeg,.png,.webp"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleImageChange}
          disabled={uploadingAsset}
        >
          <Tooltip title="Tambah Gambar (Logo, dll)">
            <Button icon={<FileImageOutlined />} loading={uploadingAsset}>
              Gambar
            </Button>
          </Tooltip>
        </Upload>

        {/* Selection actions */}
        {hasSelection && (
          <>
            <Divider type="vertical" style={{ height: 24 }} />
            <Space.Compact>
              <Tooltip title="Copy">
                <Button
                  icon={<CopyOutlined />}
                  onClick={onCopySelected}
                  aria-label="Salin elemen terpilih"
                />
              </Tooltip>
              <Tooltip title="Paste">
                <Button
                  icon={<SnippetsOutlined />}
                  onClick={onPaste}
                  disabled={!hasClipboard}
                  aria-label="Tempel elemen"
                />
              </Tooltip>
              <Tooltip title="Duplikat">
                <Button
                  icon={<CopyOutlined />}
                  onClick={onDuplicateSelected}
                  aria-label="Duplikat elemen terpilih"
                />
              </Tooltip>
              <Tooltip title="Hapus">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={onDeleteSelected}
                  aria-label="Hapus elemen terpilih"
                />
              </Tooltip>
            </Space.Compact>

            <Space.Compact>
              <Tooltip title="Naikkan Layer">
                <Button
                  icon={<ArrowUpOutlined />}
                  onClick={onMoveSelectedForward}
                  aria-label="Naikkan elemen satu layer"
                />
              </Tooltip>
              <Tooltip title="Turunkan Layer">
                <Button
                  icon={<ArrowDownOutlined />}
                  onClick={onMoveSelectedBackward}
                  aria-label="Turunkan elemen satu layer"
                />
              </Tooltip>
            </Space.Compact>

            <Space.Compact>
              <Tooltip title="Rata Kiri">
                <Button
                  icon={<AlignLeftOutlined />}
                  onClick={() => onAlignSelected("left")}
                  aria-label="Ratakan elemen ke kiri kanvas"
                />
              </Tooltip>
              <Tooltip title="Rata Tengah">
                <Button
                  icon={<AlignCenterOutlined />}
                  onClick={() => onAlignSelected("center")}
                  aria-label="Ratakan elemen ke tengah horizontal"
                />
              </Tooltip>
              <Tooltip title="Rata Kanan">
                <Button
                  icon={<AlignRightOutlined />}
                  onClick={() => onAlignSelected("right")}
                  aria-label="Ratakan elemen ke kanan kanvas"
                />
              </Tooltip>
              <Tooltip title="Rata Atas">
                <Button
                  icon={<VerticalAlignTopOutlined />}
                  onClick={() => onAlignSelected("top")}
                  aria-label="Ratakan elemen ke atas kanvas"
                />
              </Tooltip>
              <Tooltip title="Rata Tengah Vertikal">
                <Button
                  icon={<VerticalAlignMiddleOutlined />}
                  onClick={() => onAlignSelected("middle")}
                  aria-label="Ratakan elemen ke tengah vertikal"
                />
              </Tooltip>
              <Tooltip title="Rata Bawah">
                <Button
                  icon={<VerticalAlignBottomOutlined />}
                  onClick={() => onAlignSelected("bottom")}
                  aria-label="Ratakan elemen ke bawah kanvas"
                />
              </Tooltip>
            </Space.Compact>
          </>
        )}

        {!hasSelection && (
          <Tooltip title="Paste">
            <Button
              icon={<SnippetsOutlined />}
              onClick={onPaste}
              disabled={!hasClipboard}
              aria-label="Tempel elemen"
            />
          </Tooltip>
        )}
      </div>
    );
  },
);

ElementToolbar.displayName = "ElementToolbar";
