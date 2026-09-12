import type { ReactElement, ReactNode } from "react";
import { Button } from "antd";
import { HolderOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";

interface Props {
  id: string;
  kind: "section" | "question" | "option";
  label: string;
  children: (handle: ReactNode) => ReactNode;
}
export function SortableItem({
  id,
  kind,
  label,
  children,
}: Props): ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { kind } });
  return (
    <div
      ref={setNodeRef}
      className="builder-sortable"
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
        minWidth: 0,
      }}
    >
      {children(
        <Button
          ref={setActivatorNodeRef}
          className="builder-drag"
          type="text"
          aria-label={`Geser ${label}`}
          icon={<HolderOutlined />}
          {...attributes}
          {...listeners}
        />,
      )}
    </div>
  );
}
