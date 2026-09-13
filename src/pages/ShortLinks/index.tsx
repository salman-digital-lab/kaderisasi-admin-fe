import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  ConfigProvider,
  Empty,
  Input,
  Modal,
  Space,
  Typography,
  message as messageAPI,
} from "antd";
import dayjs from "dayjs";
import { ResponsiveTable } from "../../components/common/Responsive/ResponsiveTable";
import { usePermissions } from "../../stores/authStore";
import { handleError } from "../../api/errorHandling";
import { deleteShortLink, getShortLinks } from "../../api/services/short-link";
import type { ShortLink } from "../../types/model/short-link";
import ShortLinkForm from "./ShortLinkForm";

export default function ShortLinks(): ReactElement {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#087aa6",
          colorTextSecondary: "#595959",
          colorError: "#c83238",
        },
      }}
    >
      <ShortLinksContent />
    </ConfigProvider>
  );
}

function ShortLinksContent(): ReactElement {
  const [params, setParams] = useState({ search: "", page: 1, per_page: 12 });
  const [editor, setEditor] = useState<ShortLink | "new" | null>(null);
  const [created, setCreated] = useState<ShortLink | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [message, messageContext] = messageAPI.useMessage();
  const [modal, modalContext] = Modal.useModal();
  const canManage = usePermissions().includes("short_links.manage");
  const { data, loading, error, refresh } = useRequest(
    () => getShortLinks(params),
    { refreshDeps: [params] },
  );
  const copy = async (link: ShortLink): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link.short_url);
      setCopyError(null);
      void message.success("Tautan disalin");
    } catch {
      setCopyError(link.short_url);
    }
  };
  const remove = (link: ShortLink): void => {
    modal.confirm({
      title: "Hapus tautan pendek?",
      content: (
        <Typography.Paragraph style={{ overflowWrap: "anywhere" }}>
          {link.short_url} akan berhenti berfungsi. Tautan dihapus permanen dan
          kodenya dapat digunakan kembali.
        </Typography.Paragraph>
      ),
      okText: "Hapus tautan",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async (): Promise<void> => {
        try {
          await deleteShortLink(link.code);
          if (created?.code === link.code) setCreated(null);
          if (data?.data.length === 1 && params.page > 1)
            setParams((old) => ({ ...old, page: old.page - 1 }));
          else refresh();
          void message.success("Tautan dihapus");
        } catch (failure) {
          handleError(failure);
          throw failure;
        }
      },
    });
  };
  return (
    <main style={{ padding: 12, minWidth: 0 }}>
      {messageContext}
      {modalContext}
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        Tautan Pendek
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Buat dan kelola tautan yang dibagikan oleh tim Salman.
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 16, maxWidth: "100%" }}>
        <Input.Search
          aria-label="Cari tautan"
          placeholder="Cari kode atau alamat tujuan"
          allowClear
          maxLength={200}
          onSearch={(search) =>
            setParams((old) => ({ ...old, search, page: 1 }))
          }
          style={{ width: 260, maxWidth: "100%" }}
        />
        <Button onClick={refresh} loading={loading}>
          Muat ulang
        </Button>
        {canManage && (
          <Button
            type="primary"
            disabled={!data || Boolean(error)}
            onClick={() => setEditor("new")}
          >
            Buat tautan
          </Button>
        )}
      </Space>
      {created && (
        <Alert
          type="success"
          showIcon
          title="Tautan berhasil dibuat"
          description={
            <Space wrap>
              <Typography.Text style={{ overflowWrap: "anywhere" }}>
                {created.short_url}
              </Typography.Text>
              <Button onClick={() => void copy(created)}>
                Salin tautan baru
              </Button>
            </Space>
          }
          closable
          onClose={() => setCreated(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      {copyError && (
        <Alert
          type="warning"
          showIcon
          title="Tidak dapat menyalin otomatis"
          description={
            <>
              <Typography.Paragraph>
                Pilih dan salin alamat berikut:
              </Typography.Paragraph>
              <Input
                readOnly
                aria-label="Alamat untuk disalin"
                value={copyError}
                onFocus={(event) => event.target.select()}
              />
            </>
          }
          closable
          onClose={() => setCopyError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      {error ? (
        <Alert
          type="error"
          showIcon
          title="Tautan tidak dapat dimuat"
          action={
            <Button onClick={refresh} loading={loading}>
              Coba lagi
            </Button>
          }
        />
      ) : (
        <ResponsiveTable<ShortLink>
          listId="short-links"
          rowKey="code"
          loading={loading}
          dataSource={data?.data ?? []}
          locale={{
            emptyText: (
              <Empty
                description={
                  params.search
                    ? "Tidak ada tautan yang sesuai."
                    : "Belum ada tautan pendek."
                }
              />
            ),
          }}
          pagination={{
            current: params.page,
            pageSize: params.per_page,
            total: data?.meta.total ?? 0,
            showSizeChanger: true,
            onChange: (page, per_page) =>
              setParams((old) => ({ ...old, page, per_page })),
          }}
          columns={[
            {
              title: "Tautan pendek",
              dataIndex: "short_url",
              render: (value: string) => (
                <Typography.Text style={{ overflowWrap: "anywhere" }}>
                  {value}
                </Typography.Text>
              ),
            },
            {
              title: "Alamat tujuan",
              dataIndex: "original_url",
              render: (value: string) => (
                <span style={{ overflowWrap: "anywhere" }}>{value}</span>
              ),
            },
            { title: "Kunjungan", dataIndex: "visit_count", width: 110 },
            {
              title: "Dibuat",
              dataIndex: "created_at",
              width: 150,
              render: (value: string) =>
                dayjs(value).format("DD MMM YYYY HH:mm"),
            },
            {
              title: "Aksi",
              key: "actions",
              width: 220,
              render: (_, link) => (
                <Space wrap>
                  <Button onClick={() => void copy(link)}>Salin</Button>
                  {canManage && (
                    <>
                      <Button onClick={() => setEditor(link)}>Ubah</Button>
                      <Button danger onClick={() => remove(link)}>
                        Hapus
                      </Button>
                    </>
                  )}
                </Space>
              ),
            },
          ]}
        />
      )}
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
        Kunjungan menghitung pengalihan tautan, termasuk kunjungan berulang dan
        bot.
      </Typography.Paragraph>
      <Modal
        open={editor !== null}
        title={editor === "new" ? "Buat tautan pendek" : "Ubah alamat tujuan"}
        footer={null}
        onCancel={() => setEditor(null)}
        destroyOnHidden
        maskClosable={false}
      >
        {editor !== null && data && (
          <ShortLinkForm
            key={editor === "new" ? "new" : editor.code}
            baseURL={data.base_url}
            link={editor === "new" ? undefined : editor}
            onCancel={() => setEditor(null)}
            onSaved={(saved) => {
              if (editor === "new") setCreated(saved);
              else if (created?.code === saved.code) setCreated(saved);
              setEditor(null);
              refresh();
            }}
          />
        )}
      </Modal>
    </main>
  );
}
