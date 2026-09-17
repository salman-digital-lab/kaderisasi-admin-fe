import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Empty, Space, Spin, Table, Typography } from "antd";
import { ResponsiveDialog } from "../../../../components/common/Responsive/ResponsiveDialog";
import {
  downloadFormFile,
  exportFormResponses,
  getFormResponse,
  getFormResponses,
  type SavedFormResponse,
} from "../../../../api/services/form-responses";
import { actionError } from "../../../../utils/action-error";

export function ResponsesTab({ formId }: { formId: number }): ReactElement {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>();
  const [failure, setFailure] = useState("");
  const [exporting, setExporting] = useState(false);
  const list = useRequest(() => getFormResponses(formId, page), {
    refreshDeps: [formId, page],
  });
  const detail = useRequest(
    async () => (selected ? getFormResponse(formId, selected) : undefined),
    { refreshDeps: [formId, selected] },
  );
  const perform = async (action: () => Promise<void>): Promise<void> => {
    setFailure("");
    try {
      await action();
    } catch (error) {
      setFailure(
        actionError(
          error,
          "Berkas belum dapat diunduh. Periksa koneksi dan akses Anda, lalu coba lagi.",
        ),
      );
    }
  };
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={list.refresh}>Muat ulang</Button>
        <Button
          disabled={!list.data?.total}
          loading={exporting}
          onClick={() => {
            setExporting(true);
            void perform(() => exportFormResponses(formId)).finally(() =>
              setExporting(false),
            );
          }}
        >
          Ekspor Excel
        </Button>
      </Space>
      {(failure || list.error) && (
        <Alert
          type="error"
          showIcon
          title="Respons belum dapat diproses"
          description={
            failure ||
            actionError(
              list.error,
              "Daftar respons belum dapat dimuat. Periksa koneksi dan akses Anda, lalu pilih Muat ulang.",
            )
          }
        />
      )}
      <Table<SavedFormResponse>
        rowKey="id"
        loading={list.loading}
        dataSource={list.data?.data ?? []}
        locale={{
          emptyText: (
            <Empty description="Belum ada respons. Buka penerimaan respons dan bagikan formulir." />
          ),
        }}
        pagination={{
          current: page,
          pageSize: 20,
          total: list.data?.total ?? 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
        columns={[
          {
            title: "Dikirim",
            dataIndex: "created_at",
            render: (value: string) => new Date(value).toLocaleString("id-ID"),
          },
          {
            title: "Responden",
            dataIndex: "user_id",
            render: (value: number | null) =>
              value ? `Anggota #${value}` : "Tanpa akun",
          },
          {
            title: "Respons",
            key: "open",
            render: (_, row) => (
              <Button onClick={() => setSelected(row.id)}>Lihat jawaban</Button>
            ),
          },
        ]}
      />
      <ResponsiveDialog
        open={!!selected}
        title="Jawaban formulir"
        width={800}
        footer={null}
        onCancel={() => setSelected(undefined)}
      >
        {failure && <Alert type="error" showIcon title={failure} />}
        {detail.loading ? (
          <Spin />
        ) : detail.error ? (
          <Alert
            type="error"
            title="Jawaban belum dapat dimuat"
            action={<Button onClick={detail.refresh}>Coba lagi</Button>}
          />
        ) : (
          detail.data && (
            <>
              <Typography.Title level={3}>
                {detail.data.form_snapshot.title}
              </Typography.Title>
              {!Object.keys(detail.data.answers).length && (
                <Typography.Paragraph>
                  Respons tersimpan tanpa jawaban pada isian opsional.
                </Typography.Paragraph>
              )}
              {detail.data.form_snapshot.schema.fields.map((section) => (
                <section key={section.id ?? section.section_name}>
                  <Typography.Title level={4}>
                    {section.section_name === "profile_data"
                      ? "Data diri"
                      : section.section_name}
                  </Typography.Title>
                  <dl>
                    {section.fields
                      .filter((field) => field.key in detail.data!.answers)
                      .map((field) => (
                        <div key={field.key} style={{ marginBottom: 16 }}>
                          <dt>
                            <strong>{field.label}</strong>
                          </dt>
                          <dd
                            style={{
                              margin: 0,
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {field.type === "file"
                              ? detail
                                  .data!.attachments.filter(
                                    (file) =>
                                      Array.isArray(
                                        detail.data!.answers[field.key],
                                      ) &&
                                      (
                                        detail.data!.answers[
                                          field.key
                                        ] as string[]
                                      ).includes(file.id),
                                  )
                                  .map((file) => (
                                    <Button
                                      key={file.id}
                                      type="link"
                                      onClick={() =>
                                        void perform(() =>
                                          downloadFormFile(formId, file),
                                        )
                                      }
                                    >
                                      {file.name}
                                    </Button>
                                  ))
                              : typeof detail.data!.answers[field.key] ===
                                  "string"
                                ? String(detail.data!.answers[field.key])
                                : JSON.stringify(
                                    detail.data!.answers[field.key],
                                  )}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </section>
              ))}
            </>
          )
        )}
      </ResponsiveDialog>
    </div>
  );
}
