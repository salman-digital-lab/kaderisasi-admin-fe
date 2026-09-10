import { useState, type ReactElement, type ReactNode } from "react";
import { Button, Drawer, Space } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { useAdminViewport } from "../../../hooks/useAdminViewport";

interface ResponsiveFiltersProps {
  children: ReactNode | ((controls: { apply: () => void }) => ReactNode);
  onApply: () => void;
  onReset: () => void;
  values?: readonly unknown[];
  activeCount?: number;
}

export function ResponsiveFilters({
  children,
  onApply,
  onReset,
  values = [],
  activeCount,
}: ResponsiveFiltersProps): ReactElement {
  const { compact } = useAdminViewport();
  const [open, setOpen] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const count = activeCount ?? appliedCount;
  const apply = (): void => {
    onApply();
    setAppliedCount(
      values.filter(
        (value) => value !== undefined && value !== null && value !== "",
      ).length,
    );
    setOpen(false);
  };
  // Fields are controlled by the owning page, including Ant Form instances.
  const fields =
    typeof children === "function" ? children({ apply }) : children;
  if (!compact) return <div className="responsive-filter-inline">{fields}</div>;
  return (
    <>
      <Button
        icon={<FilterOutlined />}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Filter{count ? ` (${count})` : ""}
      </Button>
      <Drawer
        title="Filter & Pencarian"
        open={open}
        onClose={() => setOpen(false)}
        width="min(420px, 100vw)"
        rootClassName="responsive-filter-panel"
        footer={
          <Space wrap>
            <Button
              onClick={() => {
                onReset();
                setAppliedCount(0);
              }}
            >
              Reset
            </Button>
            <Button type="primary" onClick={apply}>
              Terapkan
            </Button>
          </Space>
        }
      >
        {fields}
      </Drawer>
    </>
  );
}
