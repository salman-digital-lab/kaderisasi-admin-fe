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
} from "@ant-design/icons";
import { ElementType } from "../types";
import { readUploadFileAsDataUrl } from "../utils/readUploadFile";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ElementToolbarProps {
  onAddElement: (type: ElementType) => void;
  onBackgroundUpload: (url: string, file?: File) => void;
  onImageUpload: (url: string) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onOpenCanvasSettings: () => void;
  hasSelection: boolean;
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
    onOpenCanvasSettings,
    hasSelection,
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
          </>
        )}
      </div>
    );
  },
);

ElementToolbar.displayName = "ElementToolbar";
