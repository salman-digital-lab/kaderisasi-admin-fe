import React from "react";
import { Button, Upload, Space, Tooltip, Divider } from "antd";
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
} from "@ant-design/icons";
import { ElementType } from "../types";
import { readUploadFileAsDataUrl } from "../utils/readUploadFile";

type Alignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ElementToolbarProps {
  onAddElement: (type: ElementType) => void;
  onBackgroundUpload: (url: string, file?: File) => void;
  onImageUpload: (url: string) => void;
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
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  backgroundColor: "#fafafa",
  borderBottom: "1px solid #f0f0f0",
  flexWrap: "wrap",
};

// ─── Component ──────────────────────────────────────────────────────────────

export const ElementToolbar: React.FC<ElementToolbarProps> = React.memo(
  ({
    onAddElement,
    onBackgroundUpload,
    onImageUpload,
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
  }) => {
    const handleBackgroundChange = React.useCallback(
      (info: { file: import("antd").UploadFile }) => {
        readUploadFileAsDataUrl(info, (dataUrl, file) =>
          onBackgroundUpload(dataUrl, file),
        );
      },
      [onBackgroundUpload],
    );

    const handleImageChange = React.useCallback(
      (info: { file: import("antd").UploadFile }) => {
        readUploadFileAsDataUrl(info, (dataUrl) => onImageUpload(dataUrl));
      },
      [onImageUpload],
    );

    return (
      <div style={toolbarStyle}>
        <Space.Compact>
          <Tooltip title="Undo">
            <Button
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo}
            />
          </Tooltip>
          <Tooltip title="Redo">
            <Button
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo}
            />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" style={{ height: 24 }} />

        {/* Canvas settings */}
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleBackgroundChange}
        >
          <Tooltip title="Upload Background">
            <Button icon={<PictureOutlined />}>Background</Button>
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
          <Tooltip title="Tambah QR Code">
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => onAddElement("qr-code")}
            >
              QR Code
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
          accept="image/*"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleImageChange}
        >
          <Tooltip title="Tambah Gambar (Logo, dll)">
            <Button icon={<FileImageOutlined />}>Gambar</Button>
          </Tooltip>
        </Upload>

        {/* Selection actions */}
        {hasSelection && (
          <>
            <Divider type="vertical" style={{ height: 24 }} />
            <Space.Compact>
              <Tooltip title="Copy">
                <Button icon={<CopyOutlined />} onClick={onCopySelected} />
              </Tooltip>
              <Tooltip title="Paste">
                <Button
                  icon={<SnippetsOutlined />}
                  onClick={onPaste}
                  disabled={!hasClipboard}
                />
              </Tooltip>
              <Tooltip title="Duplikat">
                <Button icon={<CopyOutlined />} onClick={onDuplicateSelected} />
              </Tooltip>
              <Tooltip title="Hapus">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={onDeleteSelected}
                />
              </Tooltip>
            </Space.Compact>

            <Space.Compact>
              <Tooltip title="Naikkan Layer">
                <Button
                  icon={<ArrowUpOutlined />}
                  onClick={onMoveSelectedForward}
                />
              </Tooltip>
              <Tooltip title="Turunkan Layer">
                <Button
                  icon={<ArrowDownOutlined />}
                  onClick={onMoveSelectedBackward}
                />
              </Tooltip>
            </Space.Compact>

            <Space.Compact>
              <Tooltip title="Rata Kiri">
                <Button
                  icon={<AlignLeftOutlined />}
                  onClick={() => onAlignSelected("left")}
                />
              </Tooltip>
              <Tooltip title="Rata Tengah">
                <Button
                  icon={<AlignCenterOutlined />}
                  onClick={() => onAlignSelected("center")}
                />
              </Tooltip>
              <Tooltip title="Rata Kanan">
                <Button
                  icon={<AlignRightOutlined />}
                  onClick={() => onAlignSelected("right")}
                />
              </Tooltip>
              <Tooltip title="Rata Atas">
                <Button
                  icon={<VerticalAlignTopOutlined />}
                  onClick={() => onAlignSelected("top")}
                />
              </Tooltip>
              <Tooltip title="Rata Tengah Vertikal">
                <Button
                  icon={<VerticalAlignMiddleOutlined />}
                  onClick={() => onAlignSelected("middle")}
                />
              </Tooltip>
              <Tooltip title="Rata Bawah">
                <Button
                  icon={<VerticalAlignBottomOutlined />}
                  onClick={() => onAlignSelected("bottom")}
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
            />
          </Tooltip>
        )}
      </div>
    );
  },
);

ElementToolbar.displayName = "ElementToolbar";
