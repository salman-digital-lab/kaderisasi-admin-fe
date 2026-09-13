import {
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button, Popover } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

export function BuilderHelp({
  title,
  label,
  children,
}: {
  title: string;
  label?: string;
  children: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [open]);

  return (
    <Popover
      title={title}
      trigger="click"
      placement="bottom"
      open={open}
      onOpenChange={setOpen}
      classNames={{ root: "builder-popup builder-help-popup" }}
      content={
        <div
          id={id}
          role="note"
          aria-label={title}
          tabIndex={0}
          className="builder-help-content"
        >
          {children}
        </div>
      }
    >
      <Button
        type="text"
        className="builder-help-trigger"
        icon={<InfoCircleOutlined aria-hidden />}
        aria-label={title}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? id : undefined}
      >
        {label}
      </Button>
    </Popover>
  );
}
