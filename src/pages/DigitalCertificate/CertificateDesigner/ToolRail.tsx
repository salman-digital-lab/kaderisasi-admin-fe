import React from "react";
import {
  DragOutlined,
  EditOutlined,
  FieldStringOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  QrcodeOutlined,
  SelectOutlined,
} from "@ant-design/icons";
import { Button, message, Tooltip, Upload } from "antd";
import type { EditorTool } from "./editor-state";
import { getValidatedUploadFile } from "../utils/readUploadFile";
import styles from "./CertificateDesigner.module.css";

interface ToolRailProps {
  tool: EditorTool;
  uploading: boolean;
  onToolChange: (tool: EditorTool) => void;
  onAddElement: (tool: EditorTool) => void;
  onImageUpload: (file: File) => Promise<void>;
  onSignatureUpload: (file: File) => Promise<void>;
}

const tools: Array<{
  tool: EditorTool;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  command?: boolean;
}> = [
  { tool: "select", label: "Pilih", shortcut: "V", icon: <SelectOutlined /> },
  {
    tool: "hand",
    label: "Geser kanvas",
    shortcut: "H",
    icon: <DragOutlined />,
  },
  {
    tool: "static-text",
    label: "Teks statis",
    icon: <FontSizeOutlined />,
    command: true,
  },
  {
    tool: "variable-text",
    label: "Teks variabel",
    icon: <FieldStringOutlined />,
    command: true,
  },
  {
    tool: "qr-code",
    label: "QR verifikasi",
    icon: <QrcodeOutlined />,
    command: true,
  },
];

export const ToolRail: React.FC<ToolRailProps> = React.memo(
  ({
    tool,
    uploading,
    onToolChange,
    onAddElement,
    onImageUpload,
    onSignatureUpload,
  }) => (
    <nav className={styles.toolRail} aria-label="Alat editor">
      {tools.map((item, index) => (
        <React.Fragment key={item.tool}>
          {index === 2 ? <div className={styles.toolDivider} /> : null}
          <Tooltip
            title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}`}
            placement="right"
          >
            <Button
              type={!item.command && tool === item.tool ? "primary" : "text"}
              icon={item.icon}
              aria-label={item.label}
              aria-pressed={!item.command ? tool === item.tool : undefined}
              onClick={() =>
                item.command ? onAddElement(item.tool) : onToolChange(item.tool)
              }
            />
          </Tooltip>
        </React.Fragment>
      ))}
      <Upload
        accept=".jpg,.jpeg,.png,.webp"
        showUploadList={false}
        beforeUpload={() => false}
        disabled={uploading}
        onChange={(info) => {
          const file = getValidatedUploadFile(info, message.error);
          if (file) void onImageUpload(file);
        }}
      >
        <Tooltip title="Gambar" placement="right">
          <Button
            type="text"
            icon={<FileImageOutlined />}
            loading={uploading}
            aria-label="Unggah dan tambahkan gambar"
          />
        </Tooltip>
      </Upload>
      <Upload
        accept=".jpg,.jpeg,.png,.webp"
        showUploadList={false}
        beforeUpload={() => false}
        disabled={uploading}
        onChange={(info) => {
          const file = getValidatedUploadFile(info, message.error);
          if (file) void onSignatureUpload(file);
        }}
      >
        <Tooltip title="Tanda tangan" placement="right">
          <Button
            type="text"
            icon={<EditOutlined />}
            loading={uploading}
            aria-label="Unggah dan tambahkan tanda tangan"
          />
        </Tooltip>
      </Upload>
    </nav>
  ),
);

ToolRail.displayName = "ToolRail";
