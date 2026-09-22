import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  Alert,
  Button,
  ConfigProvider,
  Empty,
  Flex,
  Modal,
  Segmented,
  Skeleton,
  Typography,
} from "antd";
import { useSearchParams } from "react-router-dom";
import {
  notificationChanged,
  notificationRequest,
  type InboxPage,
  type NotificationItem,
} from "./api";
import "../../styles/guided-workflows.css";
import { notificationTheme } from "./theme";

export default function Inbox(): ReactElement {
  return (
    <ConfigProvider theme={notificationTheme}>
      <InboxContent />
    </ConfigProvider>
  );
}

function InboxContent(): ReactElement {
  const [params, setParams] = useSearchParams();
  const selected = params.get("id");
  const [unread, setUnread] = useState(false);
  const [cursor, setCursor] = useState("");
  const [page, setPage] = useState<InboxPage>();
  const [item, setItem] = useState<NotificationItem>();
  const detailHeading = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (item) detailHeading.current?.focus();
  }, [item]);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [detailRetry, setDetailRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback((): void => {
    setRevision((v) => v + 1);
    notificationChanged();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void notificationRequest<InboxPage>(
      `?unread=${unread}&cursor=${encodeURIComponent(cursor)}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setPage(result);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Notifikasi belum dapat dimuat.");
      });
    return () => controller.abort();
  }, [unread, cursor, revision]);
  useEffect(() => {
    const listener = (): void => {
      if (!document.hidden) setRevision((v) => v + 1);
    };
    const timer = window.setInterval(listener, 30000);
    window.addEventListener("focus", listener);
    document.addEventListener("visibilitychange", listener);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", listener);
      document.removeEventListener("visibilitychange", listener);
    };
  }, []);
  useEffect(() => {
    if (!selected) return;
    if (!/^[1-9]\d*$/.test(selected) || Number(selected) > 2147483647) {
      setItem(undefined);
      setDetailError("Pengumuman tidak tersedia.");
      return;
    }
    const controller = new AbortController();
    setItem(undefined);
    setDetailError("");
    void notificationRequest<NotificationItem>(
      `/${encodeURIComponent(selected)}/read`,
      "PUT",
      {},
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setItem(result);
          refresh();
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setDetailError("Pengumuman tidak tersedia atau gagal dimuat.");
      });
    return () => controller.abort();
  }, [selected, refresh, detailRetry]);
  const mark = async (id?: number): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      await notificationRequest(
        id ? `/${id}/read` : "/read-all",
        "PUT",
        id ? {} : { cutoff: page?.cutoff },
      );
      refresh();
    } catch {
      setError("Gagal menandai notifikasi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="guided-page">
      <Typography.Title level={2}>Notifikasi</Typography.Title>
      <Flex wrap gap={12} justify="space-between" style={{ marginBottom: 20 }}>
        <Segmented
          aria-label="Filter notifikasi"
          options={[
            { label: "Semua", value: "all" },
            { label: "Belum dibaca", value: "unread" },
          ]}
          value={unread ? "unread" : "all"}
          onChange={(value) => {
            setPage(undefined);
            setUnread(value === "unread");
            setCursor("");
          }}
        />
        <Button disabled={!page} loading={busy} onClick={() => void mark()}>
          Tandai semua dibaca
        </Button>
      </Flex>
      {error && (
        <Alert
          type="error"
          title={error}
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      )}
      {!page && !error ? (
        <Skeleton active />
      ) : page?.items.length === 0 ? (
        <Empty description="Tidak ada notifikasi" />
      ) : (
        page?.items.map((entry) => (
          <section className="guided-section" key={entry.id}>
            <Flex vertical gap={8}>
              <Button
                type="link"
                style={{
                  padding: 0,
                  height: "auto",
                  whiteSpace: "normal",
                  textAlign: "left",
                  justifyContent: "flex-start",
                  overflowWrap: "anywhere",
                }}
                onClick={() => setParams({ id: String(entry.id) })}
              >
                <Typography.Text strong={!entry.read_at}>
                  {entry.title}
                </Typography.Text>
              </Button>
              <Typography.Text type="secondary">
                {new Date(entry.published_at).toLocaleString("id-ID")}
                {!entry.read_at ? " · Belum dibaca" : ""}
              </Typography.Text>
              {!entry.read_at && (
                <Button
                  style={{ alignSelf: "flex-start" }}
                  disabled={busy}
                  onClick={() => void mark(entry.id)}
                >
                  Tandai dibaca
                </Button>
              )}
            </Flex>
          </section>
        ))
      )}
      <Flex gap={12} style={{ marginTop: 16 }}>
        {cursor && (
          <Button
            onClick={() => {
              setPage(undefined);
              setCursor("");
            }}
          >
            Kembali ke terbaru
          </Button>
        )}
        {page?.next_cursor && (
          <Button
            onClick={() => {
              setPage(undefined);
              setCursor(page.next_cursor);
            }}
          >
            Berikutnya
          </Button>
        )}
      </Flex>
      <Modal
        open={!!selected}
        title={
          <span ref={detailHeading} tabIndex={-1}>
            {item?.title || "Pengumuman"}
          </span>
        }
        styles={{ header: { overflowWrap: "anywhere" } }}
        onCancel={() => setParams({})}
        footer={<Button onClick={() => setParams({})}>Tutup</Button>}
      >
        {detailError ? (
          <Alert
            type="error"
            title={detailError}
            action={
              <Button onClick={() => setDetailRetry((value) => value + 1)}>
                Coba lagi
              </Button>
            }
          />
        ) : !item ? (
          <Skeleton active />
        ) : (
          <>
            <Typography.Paragraph
              style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {item.body}
            </Typography.Paragraph>
            {item.link_url && (
              <Button
                href={item.link_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                {item.link_label}
              </Button>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
