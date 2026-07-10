import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Input, Space, Tooltip, Typography } from "antd";
import { CertificateElement } from "../types";

const { Text } = Typography;

interface LayerPanelProps {
  elements: CertificateElement[];
  selectedElementId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveForward: (id: string) => void;
  onMoveBackward: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const getFallbackName = (element: CertificateElement, index: number): string =>
  element.name || `${element.type} ${index + 1}`;

const LayerNameInput: React.FC<{
  element: CertificateElement;
  index: number;
  onRename: (name: string) => void;
}> = ({ element, index, onRename }) => {
  const [value, setValue] = useState(getFallbackName(element, index));

  useEffect(() => {
    setValue(getFallbackName(element, index));
  }, [element.name, element.type, index]);

  return (
    <Input
      size="small"
      value={value}
      variant="borderless"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onRename(value)}
      onPressEnter={(event) => event.currentTarget.blur()}
      aria-label={`Nama layer ${index + 1}`}
      style={{ paddingInline: 4, fontWeight: 500 }}
    />
  );
};

interface LayerItemProps {
  element: CertificateElement;
  index: number;
  isSelected: boolean;
  canMoveForward: boolean;
  canMoveBackward: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveForward: (id: string) => void;
  onMoveBackward: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const LayerItem: React.FC<LayerItemProps> = React.memo(
  ({
    element,
    index,
    isSelected,
    canMoveForward,
    canMoveBackward,
    onSelect,
    onRename,
    onToggleVisibility,
    onToggleLock,
    onMoveForward,
    onMoveBackward,
    onDuplicate,
    onDelete,
  }) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(element.id);
      }
    };

    return (
      <div
        role="option"
        tabIndex={0}
        aria-selected={isSelected}
        aria-label={`${getFallbackName(element, index)}, ${element.type}`}
        onClick={() => onSelect(element.id)}
        onKeyDown={handleKeyDown}
        style={{
          border: `1px solid ${isSelected ? "#1677ff" : "#f0f0f0"}`,
          background: isSelected ? "#e6f4ff" : "#fff",
          borderRadius: 6,
          padding: 6,
          cursor: "pointer",
        }}
      >
        <LayerNameInput
          element={element}
          index={index}
          onRename={(name) => onRename(element.id, name)}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
            marginTop: 4,
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            {element.type}
          </Text>
          <Space size={2}>
            <Tooltip
              title={element.visible === false ? "Tampilkan" : "Sembunyikan"}
            >
              <Button
                size="small"
                type="text"
                aria-label={
                  element.visible === false
                    ? `Tampilkan ${getFallbackName(element, index)}`
                    : `Sembunyikan ${getFallbackName(element, index)}`
                }
                icon={
                  element.visible === false ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleVisibility(element.id);
                }}
              />
            </Tooltip>
            <Tooltip title={element.locked ? "Buka kunci" : "Kunci"}>
              <Button
                size="small"
                type="text"
                aria-label={
                  element.locked
                    ? `Buka kunci ${getFallbackName(element, index)}`
                    : `Kunci ${getFallbackName(element, index)}`
                }
                icon={element.locked ? <LockOutlined /> : <UnlockOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleLock(element.id);
                }}
              />
            </Tooltip>
            <Tooltip title="Naikkan layer">
              <Button
                size="small"
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={!canMoveForward}
                aria-label={`Naikkan ${getFallbackName(element, index)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveForward(element.id);
                }}
              />
            </Tooltip>
            <Tooltip title="Turunkan layer">
              <Button
                size="small"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={!canMoveBackward}
                aria-label={`Turunkan ${getFallbackName(element, index)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveBackward(element.id);
                }}
              />
            </Tooltip>
            <Tooltip title="Duplikat">
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                aria-label={`Duplikat ${getFallbackName(element, index)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate(element.id);
                }}
              />
            </Tooltip>
            <Tooltip title="Hapus">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Hapus ${getFallbackName(element, index)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(element.id);
                }}
              />
            </Tooltip>
          </Space>
        </div>
      </div>
    );
  },
);

LayerItem.displayName = "LayerItem";

export const LayerPanel: React.FC<LayerPanelProps> = React.memo(
  ({
    elements,
    selectedElementId,
    onSelect,
    onRename,
    onToggleVisibility,
    onToggleLock,
    onMoveForward,
    onMoveBackward,
    onDuplicate,
    onDelete,
  }) => {
    const orderedElements = useMemo(() => [...elements].reverse(), [elements]);

    return (
      <Card
        size="small"
        title="Layer"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
        }}
        styles={{
          body: { padding: 8, overflow: "auto", flex: 1, minHeight: 0 },
        }}
      >
        {orderedElements.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada elemen"
          />
        ) : (
          <Space
            role="listbox"
            aria-label="Daftar layer sertifikat"
            direction="vertical"
            size={6}
            style={{ width: "100%" }}
          >
            {orderedElements.map((element, reverseIndex) => {
              const originalIndex = elements.length - reverseIndex - 1;

              return (
                <LayerItem
                  key={element.id}
                  element={element}
                  index={originalIndex}
                  isSelected={element.id === selectedElementId}
                  canMoveForward={originalIndex < elements.length - 1}
                  canMoveBackward={originalIndex > 0}
                  onSelect={onSelect}
                  onRename={onRename}
                  onToggleVisibility={onToggleVisibility}
                  onToggleLock={onToggleLock}
                  onMoveForward={onMoveForward}
                  onMoveBackward={onMoveBackward}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              );
            })}
          </Space>
        )}
      </Card>
    );
  },
);

LayerPanel.displayName = "LayerPanel";
