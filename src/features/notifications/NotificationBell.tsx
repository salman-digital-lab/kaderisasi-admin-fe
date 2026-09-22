import { useEffect, useState, type ReactElement } from "react";
import { BellOutlined } from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Empty,
  Flex,
  Popover,
  Spin,
  Typography,
} from "antd";
import { Link } from "react-router-dom";
import { notificationRequest, type InboxPage } from "./api";

export default function NotificationBell(): ReactElement {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<InboxPage>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const refresh = async (): Promise<void> => {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const count = await notificationRequest<{ unread: number }>(
          "/unread-count",
          "GET",
          undefined,
          controller.signal,
        );
        if (!controller.signal.aborted) setUnread(count.unread);
        if (open) {
          const result = await notificationRequest<InboxPage>(
            "",
            "GET",
            undefined,
            controller.signal,
          );
          if (!controller.signal.aborted) {
            setPage(result);
            setError(false);
          }
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        busy = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    const listener = (): void => {
      void refresh();
    };
    window.addEventListener("focus", listener);
    document.addEventListener("visibilitychange", listener);
    window.addEventListener("notifications-changed", listener);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", listener);
      document.removeEventListener("visibilitychange", listener);
      window.removeEventListener("notifications-changed", listener);
    };
  }, [open, retry]);
  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      title="Notifikasi"
      content={
        <Flex
          vertical
          gap={12}
          style={{ width: "min(320px, calc(100vw - 48px))" }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          {error ? (
            <Alert
              type="error"
              title="Notifikasi belum dapat dimuat"
              action={
                <Button onClick={() => setRetry((value) => value + 1)}>
                  Coba lagi
                </Button>
              }
            />
          ) : !page ? (
            <Spin />
          ) : page.items.length === 0 ? (
            <Empty
              description="Belum ada notifikasi"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            page.items.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/notifications?id=${item.id}`}
                onClick={() => setOpen(false)}
                style={{ overflowWrap: "anywhere" }}
              >
                <Typography.Text strong={!item.read_at}>
                  {item.title}
                </Typography.Text>
              </Link>
            ))
          )}
          <Link to="/notifications" onClick={() => setOpen(false)}>
            Lihat semua notifikasi
          </Link>
        </Flex>
      }
    >
      <Badge count={unread} overflowCount={99}>
        <Button
          type="text"
          icon={<BellOutlined />}
          aria-label={`Notifikasi, ${unread} belum dibaca`}
          aria-expanded={open}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        />
      </Badge>
    </Popover>
  );
}
