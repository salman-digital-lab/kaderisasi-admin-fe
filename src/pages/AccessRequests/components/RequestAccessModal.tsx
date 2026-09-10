import { ResponsiveDialog as Modal } from "../../../components/common/Responsive/ResponsiveDialog";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  message,
} from "antd";
import type { ReactElement } from "react";
import {
  createAccessRequest,
  getRequestableTargets,
} from "../../../api/services/access";
import { permissionLabels } from "./permission-labels";

type RequestForm = { role_code: string; reason: string };
type Props = { open: boolean; onClose: () => void; onCreated: () => void };

export default function RequestAccessModal({
  open,
  onClose,
  onCreated,
}: Props): ReactElement {
  const [form] = Form.useForm<RequestForm>();
  const roleCode = Form.useWatch("role_code", form);
  const { data, loading, error, refresh } = useRequest(getRequestableTargets, {
    ready: open,
  });
  const { runAsync: create, loading: creating } = useRequest(
    createAccessRequest,
    { manual: true },
  );
  const roles = data?.roles ?? [];
  const selectedRole = roles.find((role) => role.code === roleCode);

  const submit = async (values: RequestForm): Promise<void> => {
    try {
      await create({ ...values, reason: values.reason.trim() });
      message.success("Permintaan akses berhasil dikirim untuk ditinjau");
      form.resetFields();
      onClose();
      onCreated();
    } catch {
      message.error(
        "Permintaan belum terkirim. Periksa apakah peran ini sudah Anda ajukan, lalu coba lagi.",
      );
    }
  };

  return (
    <Modal
      title="Ajukan Akses"
      width={720}
      centered
      styles={{
        body: {
          maxHeight: "calc(100dvh - 200px)",
          overflowY: "auto",
          paddingRight: 4,
        },
      }}
      open={open}
      onCancel={() => {
        if (!creating) onClose();
      }}
      onOk={() => form.submit()}
      confirmLoading={creating}
      okText="Kirim Permintaan"
      cancelText="Batal"
      okButtonProps={{ disabled: loading || !!error || !selectedRole }}
      cancelButtonProps={{ disabled: creating }}
    >
      <Typography.Paragraph type="secondary">
        Pilih peran sesuai tugas Anda, pelajari cakupan aksesnya, lalu jelaskan
        kebutuhan Anda kepada peninjau.
      </Typography.Paragraph>
      <Alert
        type="info"
        showIcon
        title="Akses aktif setelah disetujui"
        description="Peran yang disetujui akan menggantikan peran Anda saat ini, bukan menambahkannya. Status pengajuan dapat dipantau di Permintaan Saya."
        style={{ marginBottom: 20 }}
      />
      {error ? (
        <Alert
          type="error"
          showIcon
          title="Daftar peran gagal dimuat"
          action={<Button onClick={refresh}>Coba Lagi</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {!loading && !error && roles.length === 0 ? (
        <Alert
          type="info"
          title="Belum ada peran yang dapat diajukan"
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form
        scrollToFirstError={{ focus: true }}
        form={form}
        layout="vertical"
        onFinish={submit}
        disabled={creating}
      >
        <Form.Item
          name="role_code"
          label="1. Pilih Peran"
          extra="Cari berdasarkan nama peran atau tugas yang ingin dilakukan."
          rules={[
            { required: true, message: "Pilih peran yang ingin diajukan" },
          ]}
        >
          <Select
            showSearch
            virtual={false}
            loading={loading}
            disabled={loading || !!error || creating}
            placeholder="Cari dan pilih peran"
            optionFilterProp="searchText"
            options={roles.map((role) => ({
              value: role.code,
              label: role.name,
              searchText: `${role.name} ${role.description ?? ""}`,
              description: role.description,
            }))}
            optionRender={(option) => (
              <div style={{ whiteSpace: "normal", paddingBlock: 4 }}>
                <Typography.Text strong>{option.label}</Typography.Text>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {option.data.description}
                </div>
              </div>
            )}
          />
        </Form.Item>
        {selectedRole ? (
          <Card
            size="small"
            title={`Cakupan Akses: ${selectedRole.name}`}
            style={{ marginBottom: 20 }}
          >
            <Typography.Paragraph>
              {selectedRole.description}
            </Typography.Paragraph>
            <Typography.Text strong>
              Kemampuan yang diberikan ({selectedRole.permissions.length})
            </Typography.Text>
            <ul className="access-capabilities">
              {selectedRole.permissions.map((permission) => (
                <li key={permission}>
                  {permissionLabels[permission] ??
                    "Kemampuan tambahan; hubungi peninjau untuk rinciannya"}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Typography.Paragraph type="secondary">
            Deskripsi dan daftar kemampuan akan tampil setelah Anda memilih
            peran.
          </Typography.Paragraph>
        )}
        <Form.Item
          name="reason"
          label="2. Jelaskan Kebutuhan Akses"
          extra="Sebutkan tugas, kegiatan atau tim yang Anda tangani. Minimal 10 karakter."
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Jelaskan kebutuhan akses Anda",
            },
            {
              min: 10,
              transform: (value) => value?.trim(),
              message: "Alasan minimal 10 karakter",
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            maxLength={4000}
            showCount
            placeholder="Contoh: Saya bertugas mengelola pendaftaran kegiatan pembinaan bulan Oktober dan perlu memeriksa serta mengekspor data peserta."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
