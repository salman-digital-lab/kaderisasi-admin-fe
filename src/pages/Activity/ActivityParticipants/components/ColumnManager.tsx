import { useState } from "react";
import {
  Modal,
  Checkbox,
  Button,
  Space,
  Typography,
  Divider,
  message,
} from "antd";
import {
  DragOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnConfig,
  getDefaultColumns,
  saveColumnPreferences,
} from "../constants/columns";

const { Text } = Typography;

interface SortableItemProps {
  column: ColumnConfig;
  onToggleVisible: (key: string) => void;
}

const SortableItem = ({ column, onToggleVisible }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "8px 12px",
    marginBottom: "4px",
    backgroundColor: "#fafafa",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid #e8e8e8",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Space>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: "grab", color: "#999" }}
        >
          <DragOutlined />
        </span>
        <Checkbox
          checked={column.visible}
          onChange={() => onToggleVisible(column.key)}
          disabled={column.fixed === "left"}
        >
          {column.title}
        </Checkbox>
      </Space>
      {column.fixed === "left" && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Wajib
        </Text>
      )}
    </div>
  );
};

interface ColumnManagerProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  activityId: string;
}

const ColumnManager = ({
  columns,
  onColumnsChange,
  activityId,
}: ColumnManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleOpen = () => {
    setLocalColumns([...columns]);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    saveColumnPreferences(activityId, localColumns);
    message.success("Pengaturan kolom berhasil disimpan");
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalColumns(getDefaultColumns());
  };

  const handleToggleVisible = (key: string) => {
    setLocalColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col,
      ),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((i) => i.key === active.id);
        const newIndex = items.findIndex((i) => i.key === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const visibleCount = localColumns.filter((col) => col.visible).length;

  return (
    <>
      <Button icon={<SettingOutlined />} onClick={handleOpen}>
        Atur Kolom
      </Button>

      <Modal
        title="Pengaturan Kolom"
        open={isOpen}
        onCancel={handleClose}
        width={500}
        footer={
          <Space>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              Reset Default
            </Button>
            <Button onClick={handleClose}>Batal</Button>
            <Button type="primary" onClick={handleSave}>
              Simpan
            </Button>
          </Space>
        }
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Pilih kolom yang ingin ditampilkan dan seret untuk mengubah urutan.
          Kolom yang ditandai &quot;Wajib&quot; tidak dapat disembunyikan.
        </Text>

        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {visibleCount} dari {localColumns.length} kolom ditampilkan
        </Text>

        <Divider style={{ margin: "12px 0" }} />

        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map((c) => c.key)}
              strategy={verticalListSortingStrategy}
            >
              {localColumns.map((column) => (
                <SortableItem
                  key={column.key}
                  column={column}
                  onToggleVisible={handleToggleVisible}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </Modal>
    </>
  );
};

export default ColumnManager;
