import React, { useEffect, useState } from "react";
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
  }, [element, index]);

  return (
    <Input
      size="small"
      value={value}
      variant="borderless"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onRename(value)}
      onPressEnter={(event) => event.currentTarget.blur()}
      style={{ paddingInline: 4, fontWeight: 500 }}
    />
  );
};

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
    const orderedElements = [...elements].reverse();

    return (
      <Card
        size="small"
        title="Layer"
        style={{ width: 260, height: "100%", borderRadius: 0 }}
        styles={{ body: { padding: 8, overflow: "auto", height: "100%" } }}
      >
        {orderedElements.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada elemen"
          />
        ) : (
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            {orderedElements.map((element, reverseIndex) => {
              const originalIndex = elements.length - reverseIndex - 1;
              const isSelected = element.id === selectedElementId;

              return (
                <div
                  key={element.id}
                  onClick={() => onSelect(element.id)}
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
                    index={originalIndex}
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
                        title={
                          element.visible === false
                            ? "Tampilkan"
                            : "Sembunyikan"
                        }
                      >
                        <Button
                          size="small"
                          type="text"
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
                          icon={
                            element.locked ? (
                              <LockOutlined />
                            ) : (
                              <UnlockOutlined />
                            )
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleLock(element.id);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Naik">
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowUpOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            onMoveForward(element.id);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Turun">
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowDownOutlined />}
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
            })}
          </Space>
        )}
      </Card>
    );
  },
);

LayerPanel.displayName = "LayerPanel";
