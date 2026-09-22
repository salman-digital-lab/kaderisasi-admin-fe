import { useEffect, useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  ConfigProvider,
  Empty,
  Flex,
  Modal,
  Popconfirm,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import axios from "../../api/axios";
import { notificationTheme } from "../../features/notifications/theme";
import AnnouncementComposer from "./AnnouncementComposer";
import AnnouncementMessage from "./AnnouncementMessage";
import type { Announcement } from "./types";
import styles from "./Composer.module.css";
import "../../styles/guided-workflows.css";

const stateLabels = {
  draft: "Draf",
  published: "Terkirim",
  withdrawn: "Ditarik",
};
export default function AnnouncementsPage(): ReactElement {
  return (
    <ConfigProvider theme={notificationTheme}>
      <AnnouncementsContent />
    </ConfigProvider>
  );
}
function AnnouncementsContent(): ReactElement {
  const [listError, setListError] = useState(false);
  const [rows, setRows] = useState<Announcement[]>();
  const [cursor, setCursor] = useState("");
  const [next, setNext] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setRows(undefined);
    setNext("");
    setListError(false);
    void axios
      .get<{ data: { items: Announcement[]; next_cursor: string } }>(
        "/announcements",
        { params: { cursor }, signal: controller.signal },
      )
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setRows(data.data.items);
          setNext(data.data.next_cursor);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setListError(true);
      });
    return () => controller.abort();
  }, [cursor, revision]);
  const reload = (): void => {
    setError("");
    setRevision((v) => v + 1);
  };
  const mutate = async (
    record: Announcement,
    action: "withdraw" | "delete",
  ): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      if (action === "delete")
        await axios.delete(`/announcements/${record.id}`, {
          data: { version: record.version },
        });
      else
        await axios.post(`/announcements/${record.id}/withdraw`, {
          version: record.version,
        });
      reload();
    } catch {
      setError(
        "Tindakan gagal. Muat ulang untuk memeriksa status terbaru sebelum mencoba lagi.",
      );
    } finally {
      setBusy(false);
    }
  };
  const readonly =
    editing !== null && editing !== "new" && editing.state !== "draft";
  const errorAlert = error ? (
    <Alert
      type="error"
      title={error}
      action={<Button onClick={reload}>Muat ulang daftar</Button>}
    />
  ) : null;
  return (
    <div className="guided-page">
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Typography.Title level={2}>Pengumuman</Typography.Title>
        <Button type="primary" onClick={() => setEditing("new")}>
          Buat pengumuman
        </Button>
      </Flex>
      <Typography.Paragraph>
        Kirim pesan kepada anggota dan admin yang Anda pilih.
      </Typography.Paragraph>
      {errorAlert}
      {listError ? (
        <Alert
          type="error"
          title="Daftar pengumuman gagal dimuat."
          action={<Button onClick={reload}>Coba lagi</Button>}
        />
      ) : !rows ? (
        <Skeleton active />
      ) : rows.length === 0 ? (
        <Empty description="Belum ada pengumuman" />
      ) : (
        rows.map((record) => (
          <section key={record.id} className="guided-section">
            <Flex justify="space-between" align="start" wrap gap={12}>
              <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Typography.Title level={4}>{record.title}</Typography.Title>
                <Tag>{stateLabels[record.state]}</Tag>
                {record.state !== "draft" && (
                  <Typography.Text>
                    {record.recipient_count} penerima
                  </Typography.Text>
                )}
              </div>
              <Flex gap={8} wrap>
                <Button onClick={() => setEditing(record)}>
                  {record.state === "draft" ? "Edit draf" : "Lihat pengumuman"}
                </Button>
                {record.state === "draft" && (
                  <Popconfirm
                    title="Hapus draf ini?"
                    onConfirm={() => mutate(record, "delete")}
                    okText="Hapus"
                    cancelText="Batal"
                  >
                    <Button danger disabled={busy}>
                      Hapus
                    </Button>
                  </Popconfirm>
                )}
                {record.state === "published" && (
                  <Popconfirm
                    title="Tarik pengumuman dari semua kotak masuk?"
                    onConfirm={() => mutate(record, "withdraw")}
                    okText="Tarik"
                    cancelText="Batal"
                  >
                    <Button danger disabled={busy}>
                      Tarik pengumuman
                    </Button>
                  </Popconfirm>
                )}
              </Flex>
            </Flex>
          </section>
        ))
      )}
      <Flex gap={12}>
        {cursor && (
          <Button onClick={() => setCursor("")}>Kembali ke terbaru</Button>
        )}
        {next && <Button onClick={() => setCursor(next)}>Berikutnya</Button>}
      </Flex>
      {editing && !readonly && (
        <AnnouncementComposer
          key={editing === "new" ? "new" : editing.id}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
          onPublished={(record) => {
            setEditing(record);
            reload();
          }}
        />
      )}
      {readonly && editing && (
        <Modal
          open
          centered
          width={680}
          rootClassName={styles.dialog}
          title="Pengumuman"
          onCancel={() => setEditing(null)}
          footer={<Button onClick={() => setEditing(null)}>Tutup</Button>}
        >
          <Tag>{stateLabels[editing.state]}</Tag>
          <Typography.Paragraph>
            {editing.recipient_count} penerima
          </Typography.Paragraph>
          <AnnouncementMessage record={editing} />
        </Modal>
      )}
    </div>
  );
}
