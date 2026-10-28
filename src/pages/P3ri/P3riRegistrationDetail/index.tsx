import { useRequest } from "ahooks";
import { useEffect, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Image,
  Input,
  Select,
  Tag,
  Typography,
} from "antd";
import {
  getP3riFile,
  getP3riForm,
  getP3riRegistration,
  putP3riRegistrationStatus,
} from "../../../api/services/p3ri";
import PageHeader from "../../../components/common/PageHeader";
import LoadErrorAlert from "../../../components/common/LoadErrorAlert";
import { ResponsiveDialog } from "../../../components/common/Responsive/ResponsiveDialog";
import { usePermissions } from "../../../stores/authStore";
import { formatDateTime } from "../../../utils/date-format";
import { P3riFile, P3riQuestion, P3riStatus } from "../../../types/model/p3ri";
import {
  P3RI_STATUS_COLORS,
  P3RI_STATUS_LABELS,
  P3RI_STATUS_OPTIONS,
  answerText,
  divisionName,
} from "../constants";

/** Loads a private upload through the authenticated admin API. */
function P3riFilePreview({ file }: { file: P3riFile }): ReactElement {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl: string | undefined;
    getP3riFile(file.key)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setFailed(true));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.key]);
  if (failed)
    return <Typography.Text type="danger">Berkas gagal dimuat</Typography.Text>;
  if (!url)
    return <Typography.Text type="secondary">Memuat berkas…</Typography.Text>;
  return <Image src={url} alt={file.name} width={160} />;
}

const answerItems = (
  questions: P3riQuestion[],
  answers: Record<string, unknown> | undefined,
  files: P3riFile[],
) =>
  questions.map((question) => {
    const file = files.find((f) => f.key === answers?.[question.id]);
    return {
      key: question.id,
      label: question.label,
      children:
        question.type === "file" ? (
          file ? (
            <P3riFilePreview file={file} />
          ) : (
            "-"
          )
        ) : (
          <span style={{ whiteSpace: "pre-wrap" }}>
            {answerText(answers?.[question.id])}
          </span>
        ),
    };
  });

export function P3riRegistrationDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const permissions = usePermissions();
  const canManage = permissions.includes("p3ri.registrations.manage");
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{
    status: P3riStatus;
    accepted_division?: string;
    admin_note?: string;
  }>();
  const status = Form.useWatch("status", form);

  const { data: definition } = useRequest(getP3riForm);
  const { data, loading, error, refresh, mutate } = useRequest(
    () => getP3riRegistration(id),
    { refreshDeps: [id] },
  );
  const { runAsync: save, loading: saving } = useRequest(
    putP3riRegistrationStatus,
    { manual: true },
  );

  const name = String(data?.answers.common.nama_lengkap ?? data?.email ?? "");

  const openStatus = () => setOpen(true);

  const submit = async () => {
    if (!data) return;
    const values = await form.validateFields();
    try {
      const updated = await save(data.id, {
        status: values.status,
        accepted_division:
          values.status === "diterima" ? values.accepted_division : undefined,
        admin_note: values.admin_note,
      });
      mutate(updated);
      setOpen(false);
    } catch {
      // Error is already shown by the API function
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title={name || "Pendaftar P3RI"}
        description={data?.email}
        back={{ to: "/p3ri", label: "Kembali ke daftar pendaftar" }}
        tags={
          data && (
            <Tag color={P3RI_STATUS_COLORS[data.status]}>
              {P3RI_STATUS_LABELS[data.status]}
            </Tag>
          )
        }
        extra={
          canManage &&
          data && (
            <Button type="primary" onClick={openStatus}>
              Ubah status
            </Button>
          )
        }
      />
      {error && !loading && (
        <LoadErrorAlert title="Data pendaftar gagal dimuat" onRetry={refresh} />
      )}
      {data && (
        <Flex vertical gap={12}>
          <Card title="Status seleksi" style={{ boxShadow: "none" }}>
            <Descriptions
              column={{ xs: 1, md: 2 }}
              size="small"
              items={[
                {
                  key: "status",
                  label: "Status",
                  children: P3RI_STATUS_LABELS[data.status],
                },
                {
                  key: "accepted",
                  label: "Diterima di",
                  children: data.accepted_division
                    ? divisionName(definition, data.accepted_division)
                    : "-",
                },
                {
                  key: "choices",
                  label: "Pilihan",
                  children: data.choices
                    .map(
                      (code, index) =>
                        `${index + 1}. ${divisionName(definition, code)}`,
                    )
                    .join("\n"),
                },
                {
                  key: "submitted",
                  label: "Waktu daftar",
                  children: `${formatDateTime(data.submitted_at)} (diubah ${formatDateTime(data.updated_at)})`,
                },
                {
                  key: "updated_by",
                  label: "Status diperbarui",
                  children: data.status_updated_at
                    ? `${formatDateTime(data.status_updated_at)} oleh ${data.status_updated_by_name ?? "-"}`
                    : "-",
                },
                {
                  key: "note",
                  label: "Catatan panitia",
                  children: (
                    <span style={{ whiteSpace: "pre-wrap" }}>
                      {data.admin_note || "-"}
                    </span>
                  ),
                },
              ]}
              styles={{ content: { whiteSpace: "pre-line" } }}
            />
          </Card>
          {definition?.sections.map((section) => (
            <Card
              key={section.id}
              title={section.title}
              style={{ boxShadow: "none" }}
            >
              <Descriptions
                column={1}
                size="small"
                bordered
                items={answerItems(
                  section.questions,
                  data.answers.common,
                  data.files,
                )}
              />
            </Card>
          ))}
          {definition &&
            data.choices.map((code, index) => {
              const division = definition.divisions.find(
                (d) => d.code === code,
              );
              return (
                <Card
                  key={code}
                  title={`Pilihan ${index + 1}: ${division?.name ?? code}`}
                  style={{ boxShadow: "none" }}
                >
                  <Descriptions
                    column={1}
                    size="small"
                    bordered
                    items={answerItems(
                      [
                        ...definition.choice_questions,
                        ...(division?.questions ?? []),
                      ],
                      data.answers.divisions[code],
                      data.files,
                    )}
                  />
                </Card>
              );
            })}
        </Flex>
      )}
      <ResponsiveDialog
        title="Ubah status pendaftar"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{
            status: data?.status,
            accepted_division: data?.accepted_division ?? undefined,
            admin_note: data?.admin_note ?? undefined,
          }}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Pilih status" }]}
          >
            <Select options={P3RI_STATUS_OPTIONS} />
          </Form.Item>
          {status === "diterima" && (
            <Form.Item
              name="accepted_division"
              label="Diterima di"
              rules={[{ required: true, message: "Pilih divisi penerimaan" }]}
            >
              <Select
                options={data?.choices.map((code, index) => ({
                  value: code,
                  label: `Pilihan ${index + 1}: ${divisionName(definition, code)}`,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item name="admin_note" label="Catatan panitia">
            <Input.TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            title="Pendaftar melihat status ini di situs P3RI. Catatan panitia hanya terlihat di admin."
          />
        </Form>
      </ResponsiveDialog>
    </div>
  );
}
