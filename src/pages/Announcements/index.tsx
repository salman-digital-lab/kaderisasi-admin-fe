import { useEffect, useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  Checkbox,
  ConfigProvider,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import axios from "../../api/axios";
import AudienceSelect from "./AudienceSelect";
import { notificationTheme } from "../../features/notifications/theme";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../constants/options";
import {
  emptyAudience,
  type Announcement,
  type AnnouncementInput,
  type Preview,
} from "./types";
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
  const [form] = Form.useForm<AnnouncementInput>();
  const [modal, modalContext] = Modal.useModal();
  const [dirty, setDirty] = useState(false);
  const [listError, setListError] = useState(false);
  const [rows, setRows] = useState<Announcement[]>();
  const [cursor, setCursor] = useState("");
  const [next, setNext] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [preview, setPreview] = useState<{
    record: Announcement;
    counts: Preview;
  }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void axios
      .get<{ data: { code: string; name: string }[] }>("/rbac/roles", {
        signal: controller.signal,
      })
      .then(({ data }) =>
        setRoles(
          data.data.map((role) => ({ value: role.code, label: role.name })),
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Daftar peran gagal dimuat. Muat ulang halaman untuk mencoba lagi.",
          );
      });
    return () => controller.abort();
  }, []);
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
    setRevision((v) => v + 1);
  };
  const edit = (record: Announcement | "new"): void => {
    setDirty(false);
    setError("");
    setPreview(undefined);
    setEditing(record);
    form.resetFields();
    form.setFieldsValue(
      record === "new"
        ? {
            title: "",
            body: "",
            link_label: null,
            link_url: null,
            audience: emptyAudience,
            version: 1,
          }
        : {
            ...record,
            audience: Object.fromEntries(
              Object.entries(record.audience).map(([key, value]) => [
                key,
                value ?? [],
              ]),
            ),
          },
    );
  };
  const closeEditor = (): void => {
    if (busy) return;
    if (!dirty) {
      setEditing(null);
      return;
    }
    modal.confirm({
      title: "Tutup tanpa menyimpan perubahan?",
      content:
        "Perubahan terakhir belum tersimpan. Kembali ke editor untuk menyimpan draf.",
      okText: "Tutup tanpa menyimpan",
      cancelText: "Kembali ke editor",
      okButtonProps: { danger: true },
      onOk: () => {
        setDirty(false);
        setEditing(null);
      },
    });
  };
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const save = async (withPreview: boolean): Promise<void> => {
    let values: AnnouncementInput;
    try {
      values = await form.validateFields();
    } catch {
      const invalid = form
        .getFieldsError()
        .find((field) => field.errors.length > 0);
      if (invalid) form.scrollToField(invalid.name, { focus: true });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...values,
        version: editing && editing !== "new" ? editing.version : 1,
        link_label: values.link_label?.trim() || null,
        link_url: values.link_url?.trim() || null,
      };
      const result =
        editing === "new"
          ? await axios.post<{ data: Announcement }>("/announcements", payload)
          : await axios.patch<{ data: Announcement }>(
              `/announcements/${editing && editing.id}`,
              payload,
            );
      setEditing(result.data.data);
      setDirty(false);
      reload();
      if (withPreview) {
        const count = await axios.post<{ data: Preview }>(
          `/announcements/${result.data.data.id}/preview`,
        );
        setPreview({ record: result.data.data, counts: count.data.data });
      } else {
        setEditing(null);
      }
    } catch {
      setError(
        "Penyimpanan gagal. Draf mungkin telah berubah; tutup editor dan muat ulang sebelum mencoba lagi.",
      );
    } finally {
      setBusy(false);
    }
  };
  const mutate = async (
    record: Announcement,
    action: "publish" | "withdraw" | "delete",
  ): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      if (action === "delete")
        await axios.delete(`/announcements/${record.id}`, {
          data: { version: record.version },
        });
      else {
        const result = await axios.post<{ data: Announcement }>(
          `/announcements/${record.id}/${action}`,
          { version: record.version },
        );
        if (action === "publish") {
          setEditing(result.data.data);
          setPreview(undefined);
        }
      }
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
      action={
        <Button
          onClick={() => {
            setError("");
            reload();
          }}
        >
          Muat ulang daftar
        </Button>
      }
    />
  ) : null;
  return (
    <div className="guided-page">
      {modalContext}
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Typography.Title level={2}>Pengumuman</Typography.Title>
        <Button type="primary" onClick={() => edit("new")}>
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
                <Button onClick={() => edit(record)}>
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
      <Modal
        open={editing !== null}
        title={readonly ? "Pengumuman" : "Tulis pengumuman"}
        width={720}
        onCancel={closeEditor}
        footer={
          readonly ? (
            <Button onClick={() => setEditing(null)}>Tutup</Button>
          ) : (
            <Flex justify="end" gap={8} wrap>
              <Button disabled={busy} onClick={closeEditor}>
                Batal
              </Button>
              <Button loading={busy} onClick={() => void save(false)}>
                Simpan draf
              </Button>
              <Button
                type="primary"
                loading={busy}
                onClick={() => void save(true)}
              >
                Pratinjau penerima
              </Button>
            </Flex>
          )
        }
      >
        {errorAlert}
        {readonly && editing ? (
          <>
            <Tag>{stateLabels[editing.state]}</Tag>
            <Typography.Paragraph>
              {editing.recipient_count} penerima
            </Typography.Paragraph>
            <Typography.Title level={3} style={{ overflowWrap: "anywhere" }}>
              {editing.title}
            </Typography.Title>
            <Typography.Paragraph
              style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {editing.body}
            </Typography.Paragraph>
            {editing.link_url && (
              <Button
                href={editing.link_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                {editing.link_label}
              </Button>
            )}
          </>
        ) : (
          <Form
            form={form}
            layout="vertical"
            disabled={busy}
            onValuesChange={() => setDirty(true)}
          >
            <Form.Item
              name="title"
              label="Judul"
              rules={[{ required: true, whitespace: true, max: 160 }]}
            >
              <Input maxLength={160} />
            </Form.Item>
            <Form.Item
              name="body"
              label="Pesan"
              rules={[{ required: true, whitespace: true, max: 10000 }]}
            >
              <Input.TextArea rows={6} maxLength={10000} showCount />
            </Form.Item>
            <Form.Item
              name="link_label"
              label="Teks tombol (opsional)"
              dependencies={["link_url"]}
              rules={[
                { max: 100 },
                ({ getFieldValue }) => ({
                  validator: async (_, value: string | null): Promise<void> => {
                    if (getFieldValue("link_url") && !value?.trim())
                      throw new Error("Isi teks tombol.");
                  },
                }),
              ]}
            >
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item
              name="link_url"
              label="Tautan HTTPS (opsional)"
              dependencies={["link_label"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator: async (_, value: string | null): Promise<void> => {
                    if (!value && !getFieldValue("link_label")) return;
                    try {
                      const url = new URL(value || "");
                      if (
                        url.protocol !== "https:" ||
                        url.username ||
                        url.password
                      )
                        throw new Error();
                    } catch {
                      throw new Error("Gunakan URL HTTPS yang lengkap.");
                    }
                  },
                }),
              ]}
            >
              <Input placeholder="https://" maxLength={2048} />
            </Form.Item>
            <Typography.Title level={4}>Penerima</Typography.Title>
            <Typography.Paragraph type="secondary">
              Pilihan digabungkan. Setiap akun menerima satu pesan.
            </Typography.Paragraph>
            <Form.Item
              name={["audience", "all_members"]}
              valuePropName="checked"
            >
              <Checkbox>Semua anggota dengan akun aktif</Checkbox>
            </Form.Item>
            <Form.Item
              name={["audience", "member_ids"]}
              label="Anggota tertentu"
            >
              <AudienceSelect kind="member" />
            </Form.Item>
            <Form.Item
              name={["audience", "activity_ids"]}
              label="Pendaftar kegiatan"
            >
              <AudienceSelect kind="activity" />
            </Form.Item>
            <Form.Item
              name={["audience", "activity_statuses"]}
              label="Status pendaftaran kegiatan"
              extra="Kosong berarti semua status. Ketik status khusus sesuai kegiatan."
            >
              <Select
                mode="tags"
                options={ACTIVITY_REGISTRANT_STATUS_OPTIONS}
              />
            </Form.Item>
            <Form.Item
              name={["audience", "club_ids"]}
              label="Anggota komunitas"
            >
              <AudienceSelect kind="club" />
            </Form.Item>
            <Form.Item
              name={["audience", "club_statuses"]}
              label="Status pendaftaran komunitas"
              extra="Jika dikosongkan, hanya pendaftaran yang disetujui yang dipilih."
            >
              <Select
                mode="multiple"
                options={[
                  { value: "APPROVED", label: "Disetujui" },
                  { value: "PENDING", label: "Menunggu" },
                  { value: "REJECTED", label: "Ditolak" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name={["audience", "all_admins"]}
              valuePropName="checked"
            >
              <Checkbox>Semua admin aktif</Checkbox>
            </Form.Item>
            <Form.Item name={["audience", "admin_ids"]} label="Admin tertentu">
              <AudienceSelect kind="admin" />
            </Form.Item>
            <Form.Item name={["audience", "role_codes"]} label="Peran admin">
              <Select mode="multiple" options={roles} />
            </Form.Item>
          </Form>
        )}
      </Modal>
      <Modal
        open={!!preview}
        title="Pratinjau pengumuman"
        onCancel={() => {
          if (!busy) setPreview(undefined);
        }}
        onOk={() => {
          if (preview) void mutate(preview.record, "publish");
        }}
        okText="Kirim sekarang"
        cancelText="Kembali ke draf"
        confirmLoading={busy}
        cancelButtonProps={{ disabled: busy }}
        okButtonProps={{ disabled: !preview?.counts.eligible }}
      >
        {errorAlert}
        {preview && (
          <>
            <Typography.Title level={3} style={{ overflowWrap: "anywhere" }}>
              {preview.record.title}
            </Typography.Title>
            <Typography.Paragraph
              style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {preview.record.body}
            </Typography.Paragraph>
            {preview.record.link_url && (
              <Button
                href={preview.record.link_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                {preview.record.link_label}
              </Button>
            )}
            <Typography.Paragraph>
              {preview.counts.eligible} penerima: {preview.counts.members}{" "}
              anggota dan {preview.counts.admins} admin.{" "}
              {preview.counts.excluded} akun tidak aktif/tanpa akses masuk
              dikecualikan.
            </Typography.Paragraph>
            <Alert
              type={preview.counts.eligible ? "info" : "warning"}
              title={
                preview.counts.eligible
                  ? "Jumlah penerima dihitung ulang saat dikirim. Pesan yang sudah dikirim tidak dapat diedit."
                  : "Belum ada penerima yang memenuhi syarat. Kembali ke draf untuk mengubah pilihan penerima."
              }
            />
          </>
        )}
      </Modal>
    </div>
  );
}
