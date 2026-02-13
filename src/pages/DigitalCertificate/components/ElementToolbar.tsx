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
import type { UploadFile } from "antd";
import { ElementType } from "../types";

interface ElementToolbarProps {
  onAddElement: (type: ElementType) => void;
  onBackgroundUpload: (url: string, file?: File) => void;
  onImageUpload: (url: string) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onOpenCanvasSettings: () => void;
  hasSelection: boolean;
}

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
      (info: { file: UploadFile }) => {
        const file = info.file.originFileObj || (info.file as unknown as File);
        if (file && file instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              onBackgroundUpload(e.target.result as string, file);
            }
          };
          reader.readAsDataURL(file);
        }
      },
      [onBackgroundUpload],
    );

    const handleImageChange = React.useCallback(
      (info: { file: UploadFile }) => {
        const file = info.file.originFileObj || (info.file as unknown as File);
        if (file && file instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              onImageUpload(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      },
      [onImageUpload],
    );

    const handleAddStaticText = React.useCallback(
      () => onAddElement("static-text"),
      [onAddElement],
    );
    const handleAddVariableText = React.useCallback(
      () => onAddElement("variable-text"),
      [onAddElement],
    );
    const handleAddQrCode = React.useCallback(
      () => onAddElement("qr-code"),
      [onAddElement],
    );
    const handleAddSignature = React.useCallback(
      () => onAddElement("signature"),
      [onAddElement],
    );

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          backgroundColor: "#fafafa",
          borderBottom: "1px solid #f0f0f0",
          flexWrap: "wrap",
        }}
      >
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

        <Space.Compact>
          <Tooltip title="Tambah Teks Statis">
            <Button icon={<FontSizeOutlined />} onClick={handleAddStaticText}>
              Teks Statis
            </Button>
          </Tooltip>
          <Tooltip title="Tambah Teks Variabel">
            <Button
              icon={<FieldStringOutlined />}
              onClick={handleAddVariableText}
            >
              Teks Variabel
            </Button>
          </Tooltip>
        </Space.Compact>

        <Space.Compact>
          <Tooltip title="Tambah QR Code">
            <Button icon={<QrcodeOutlined />} onClick={handleAddQrCode}>
              QR Code
            </Button>
          </Tooltip>
          <Tooltip title="Tambah Tanda Tangan">
            <Button icon={<EditOutlined />} onClick={handleAddSignature}>
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
