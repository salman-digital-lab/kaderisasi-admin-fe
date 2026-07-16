import React, { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HolderOutlined,
  LockOutlined,
  MoreOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Empty, Input, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import type { CertificateElement } from "../types";
import styles from "../CertificateDesigner/CertificateDesigner.module.css";

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
  onReorder?: (activeId: string, overId: string) => void;
}

const getName = (element: CertificateElement, index: number): string =>
  element.name || `${element.type} ${index + 1}`;

const SortableLayer: React.FC<
  Omit<LayerPanelProps, "elements" | "selectedElementId" | "onReorder"> & {
    element: CertificateElement;
    index: number;
    selected: boolean;
  }
> = ({
  element,
  index,
  selected,
  onSelect,
  onRename,
  onToggleVisibility,
  onToggleLock,
  onMoveForward,
  onMoveBackward,
  onDuplicate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });
  const name = getName(element, index);
  const menuItems: MenuProps["items"] = [
    {
      key: "forward",
      label: "Naikkan",
      onClick: () => onMoveForward(element.id),
    },
    {
      key: "backward",
      label: "Turunkan",
      onClick: () => onMoveBackward(element.id),
    },
    {
      key: "duplicate",
      icon: <CopyOutlined />,
      label: "Duplikat",
      onClick: () => onDuplicate(element.id),
    },
    { type: "divider" },
    {
      key: "delete",
      danger: true,
      icon: <DeleteOutlined />,
      label: "Hapus",
      onClick: () => onDelete(element.id),
    },
  ];

  return (
    <li
      ref={setNodeRef}
      className={`${styles.layerRow} ${selected ? styles.layerRowSelected : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
    >
      <Tooltip title="Geser untuk mengubah urutan. Gunakan Space lalu tombol panah dengan keyboard.">
        <Button
          type="text"
          className={styles.layerDragHandle}
          icon={<HolderOutlined />}
          aria-label={`Ubah urutan ${name}`}
          {...attributes}
          {...listeners}
        />
      </Tooltip>
      <div className={styles.layerMain}>
        <button
          type="button"
          className={styles.layerSelectButton}
          aria-pressed={selected}
          onClick={() => onSelect(element.id)}
        >
          <Text ellipsis>{name}</Text>
          <Text type="secondary">{element.type}</Text>
        </button>
        {selected ? (
          <Input
            size="small"
            defaultValue={name}
            aria-label={`Nama ${name}`}
            onClick={(event) => event.stopPropagation()}
            onBlur={(event) => onRename(element.id, event.target.value)}
            onPressEnter={(event) => event.currentTarget.blur()}
          />
        ) : null}
      </div>
      <Button
        type="text"
        icon={
          element.visible === false ? <EyeInvisibleOutlined /> : <EyeOutlined />
        }
        aria-label={
          element.visible === false
            ? `Tampilkan ${name}`
            : `Sembunyikan ${name}`
        }
        onClick={() => onToggleVisibility(element.id)}
      />
      <Button
        type="text"
        icon={element.locked ? <LockOutlined /> : <UnlockOutlined />}
        aria-label={element.locked ? `Buka kunci ${name}` : `Kunci ${name}`}
        onClick={() => onToggleLock(element.id)}
      />
      <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
        <Button
          type="text"
          icon={<MoreOutlined />}
          aria-label={`Tindakan lain untuk ${name}`}
        />
      </Dropdown>
    </li>
  );
};

export const LayerPanel: React.FC<LayerPanelProps> = React.memo((props) => {
  const { elements, selectedElementId, onReorder } = props;
  const ordered = useMemo(() => [...elements].reverse(), [elements]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = ordered.findIndex((item) => item.id === active.id);
    const newIndex = ordered.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(ordered, oldIndex, newIndex);
    onReorder(String(active.id), reordered[newIndex].id);
  };

  return (
    <section className={styles.panel} aria-labelledby="layers-title">
      <header className={styles.panelHeader}>
        <Text strong id="layers-title">
          Layers
        </Text>
        <Text type="secondary">{elements.length}</Text>
      </header>
      {ordered.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Belum ada elemen"
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ordered.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol
              className={styles.layerList}
              aria-label="Daftar layer sertifikat"
            >
              {ordered.map((element) => {
                const index = elements.findIndex(
                  (item) => item.id === element.id,
                );
                return (
                  <SortableLayer
                    key={element.id}
                    {...props}
                    element={element}
                    index={index}
                    selected={element.id === selectedElementId}
                  />
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
});

LayerPanel.displayName = "LayerPanel";
