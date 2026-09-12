import { useState, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { useRequest } from "ahooks";
import { Alert, Button, Form, Input, Radio, Skeleton, Typography } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  createAccessRequest,
  getMyRequests,
  getRequestableTargets,
} from "../../../api/services/access";
import { useRole } from "../../../stores/authStore";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import { actionError } from "../../../utils/action-error";
import RoleSummary from "../components/RoleSummary";
import "../../../styles/guided-workflows.css";

const tasks: Record<string, string> = {
  activity_manager: "Menyiapkan program atau kegiatan dan mengelola peserta",
  achievement_manager:
    "Menyiapkan kegiatan serta mengelola prestasi dan leaderboard",
  club_manager: "Mengelola komunitas, klub, dan kelas",
  konselor: "Menangani layanan konseling",
  admin: "Mengelola program, penayangan, dan sertifikat",
};
type Values = { role_code: string; reason: string };

export default function NewRequestPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = useRole();
  const [form] = Form.useForm<Values>();
  const roleCode = Form.useWatch("role_code", form);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [showNames, setShowNames] = useState(false);
  const { data, loading, error, refresh } = useRequest(async () => {
    const [targets, tickets] = await Promise.all([
      getRequestableTargets(),
      getMyRequests(),
    ]);
    const order = Object.keys(tasks);
    return {
      roles: [...targets.roles].sort(
        (a, b) => order.indexOf(a.code) - order.indexOf(b.code),
      ),
      tickets,
    };
  });
  const selected = data?.roles.find((role) => role.code === roleCode);
  const duplicate = data?.tickets.find(
    (ticket) =>
      ticket.status === "open" && ticket.requested_role_code === roleCode,
  );
  const submit = async (values: Values): Promise<void> => {
    if (duplicate || !selected) return;
    setBusy(true);
    setFailure("");
    try {
      const ticket = await createAccessRequest({
        ...values,
        reason: values.reason.trim(),
      });
      flushSync(() => setDirty(false));
      navigate(`/my-requests/${ticket.id}`, { replace: true });
    } catch (cause) {
      setFailure(
        actionError(
          cause,
          "Pengajuan belum terkirim. Isian Anda tetap tersimpan di halaman ini. Coba lagi.",
        ),
      );
      refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="guided-page">
      <Link to="/my-requests">← Akses Saya</Link>
      <div className="guided-intro">
        <Typography.Title level={2}>
          Akses apa yang Anda butuhkan?
        </Typography.Title>
        <p>
          Pilih tugas Anda, lalu jelaskan kebutuhan akses. Super Admin akan
          meninjau pengajuan Anda.
        </p>
      </div>
      <div className="guided-content">
        {error && (
          <Alert
            type="error"
            title="Pilihan akses belum berhasil dimuat"
            action={<Button onClick={refresh}>Coba lagi</Button>}
          />
        )}
        {failure && (
          <Alert
            role="alert"
            type="error"
            showIcon
            title={failure}
            style={{ marginBottom: 16 }}
          />
        )}
        <Skeleton loading={loading}>
          <Form
            form={form}
            layout="vertical"
            initialValues={location.state as Partial<Values> | undefined}
            onValuesChange={() => setDirty(true)}
            onFinish={submit}
            disabled={busy}
            scrollToFirstError={{ focus: true }}
          >
            <section className="guided-section">
              <Form.Item
                name="role_code"
                label="1. Pilih tugas utama"
                rules={[
                  {
                    required: true,
                    message: "Pilih tugas yang ingin Anda kerjakan",
                  },
                ]}
              >
                <Radio.Group className="guided-choices">
                  {data?.roles.map((role) => (
                    <Radio key={role.code} value={role.code}>
                      {showNames ? role.name : (tasks[role.code] ?? role.name)}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
              <Button type="link" onClick={() => setShowNames(!showNames)}>
                {showNames
                  ? "Pilih berdasarkan tugas"
                  : "Lihat berdasarkan nama peran"}
              </Button>
              {selected && <RoleSummary role={selected} />}
            </section>
            {duplicate ? (
              <Alert
                type="info"
                showIcon
                title="Pengajuan peran ini masih menunggu"
                description={
                  <Link to={`/my-requests/${duplicate.id}`}>
                    Lihat status pengajuan Anda
                  </Link>
                }
              />
            ) : (
              <>
                <section className="guided-section">
                  <Form.Item
                    name="reason"
                    label="2. Untuk tugas apa akses ini digunakan?"
                    extra="Sebutkan tim atau kegiatan yang Anda tangani. Minimal 10 karakter."
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "Jelaskan kebutuhan akses Anda",
                      },
                      {
                        min: 10,
                        transform: (value: string) => value?.trim(),
                        message: "Tuliskan setidaknya 10 karakter",
                      },
                      { max: 4000 },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      maxLength={4000}
                      showCount
                      placeholder="Contoh: Saya panitia kegiatan pembinaan Oktober. Saya perlu menyiapkan informasi kegiatan dan memeriksa data peserta."
                    />
                  </Form.Item>
                  <p>
                    {currentRole
                      ? `Peran baru yang disetujui akan menggantikan ${currentRole.name}.`
                      : "Akses baru aktif setelah pengajuan disetujui."}{" "}
                    Status dapat dilihat di Akses Saya.
                  </p>
                </section>
                <div className="guided-actions">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={busy}
                    disabled={!selected || !!error}
                  >
                    Kirim pengajuan akses
                  </Button>
                  <Link to="/my-requests">Batal</Link>
                </div>
              </>
            )}
          </Form>
        </Skeleton>
      </div>
      <UnsavedChangesGuard dirty={dirty} />
    </main>
  );
}
