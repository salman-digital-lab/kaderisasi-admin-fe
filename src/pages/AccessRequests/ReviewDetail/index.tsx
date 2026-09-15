import { validateFieldsAndFocus } from "../../../components/common/Responsive/validate-fields";
import { ResponsiveDialog as Modal } from "../../../components/common/Responsive/ResponsiveDialog";
import { useState } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Collapse,
  Button,
  Form,
  Input,
  Skeleton,
  Space,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { ReactElement } from "react";
import {
  approveReviewTicket,
  getReviewTicket,
  rejectReviewTicket,
  getRequestableTargets,
} from "../../../api/services/access";
import { useUser } from "../../../stores/authStore";
import TicketDetails from "../components/TicketDetails";
import RoleCapabilitiesTable from "../components/RoleCapabilitiesTable";
import RoleTags from "../../../components/common/RoleTags";
import { getAdminUser } from "../../../api/services/adminuser";
import { assignedRoles } from "../../../utils/admin-roles";

export default function ReviewDetailPage(): ReactElement {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ reason: string }>();
  const { data, loading, error, refresh, mutate } = useRequest(
    () => getReviewTicket(id),
    { refreshDeps: [id] },
  );
  const {
    data: targets,
    loading: rolesLoading,
    error: rolesError,
    refresh: retryRoles,
  } = useRequest(getRequestableTargets);
  const role = targets?.roles.find(
    (item) => item.code === data?.requested_role_code,
  );
  const selfReview = data?.requester_admin_user_id === user?.id;
  const {
    data: requester,
    loading: requesterLoading,
    error: requesterError,
    refresh: retryRequester,
    refreshAsync: refreshRequester,
  } = useRequest(
    async () => {
      const account = await getAdminUser({
        id: String(data?.requester_admin_user_id),
      });
      if (!account) throw new Error("REQUESTER_NOT_LOADED");
      return account;
    },
    { ready: !!data, refreshDeps: [data?.requester_admin_user_id] },
  );
  const requesterRoles = requester ? assignedRoles(requester) : [];
  const alreadyAssigned = requesterRoles.some(
    (assigned) => assigned.code === data?.requested_role_code,
  );
  const combinedPermissions = [
    ...new Set([
      ...(requester?.effective_permissions ?? []),
      ...(role?.permissions ?? []),
    ]),
  ];

  const resolve = async (): Promise<void> => {
    if (
      !data ||
      !decision ||
      saving ||
      selfReview ||
      (decision === "approved" &&
        (!requester || requesterLoading || requesterError))
    )
      return;
    let reason = "";
    if (decision === "rejected") {
      try {
        reason = (await validateFieldsAndFocus(form)).reason.trim();
      } catch {
        return;
      }
    }
    setSaving(true);
    try {
      const updated =
        decision === "approved"
          ? await approveReviewTicket(data.id)
          : await rejectReviewTicket(data.id, reason);
      mutate(updated);
      void refreshRequester().catch(() => undefined);
      setDecision(null);
      form.resetFields();
      message.success(
        decision === "approved" ? "Permintaan disetujui" : "Permintaan ditolak",
      );
    } catch {
      message.error(
        "Keputusan belum tersimpan. Muat ulang untuk memeriksa status terbaru, lalu coba lagi.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="access-ticket-page" style={{ padding: 12 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/ticket-review")}
        style={{ marginBottom: 12 }}
      >
        Kembali ke Daftar
      </Button>
      {loading && !data ? (
        <Skeleton active />
      ) : error || !data ? (
        <Alert
          type="error"
          showIcon
          title="Permintaan gagal dimuat"
          action={<Button onClick={refresh}>Coba Lagi</Button>}
        />
      ) : (
        <div>
          <div>
            <TicketDetails ticket={data} />
            <section style={{ marginTop: 20 }}>
              <Typography.Title level={5}>
                Peran pemohon saat ini
              </Typography.Title>
              {requesterLoading ? (
                <Skeleton paragraph={{ rows: 1 }} />
              ) : requesterError || !requester ? (
                <Alert
                  type="error"
                  title="Akses pemohon belum berhasil dimuat"
                  action={<Button onClick={retryRequester}>Coba lagi</Button>}
                />
              ) : (
                <>
                  <RoleTags roles={requesterRoles} />
                  {!requester.is_active && (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="warning"
                      title="Akun pemohon nonaktif"
                      description="Persetujuan menambahkan peran, tetapi akses baru dapat digunakan setelah akun diaktifkan melalui Akun Admin."
                    />
                  )}
                  {alreadyAssigned && data.status === "open" && (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="info"
                      title="Peran yang diminta sudah dimiliki"
                      description="Persetujuan akan menutup pengajuan ini tanpa menggandakan peran atau menghapus peran lain."
                    />
                  )}
                </>
              )}
            </section>
            <section style={{ marginTop: 20 }}>
              <Typography.Title level={5}>
                Cakupan Peran yang Diminta
              </Typography.Title>
              {rolesLoading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : rolesError ? (
                <Alert
                  type="warning"
                  title="Cakupan akses belum dapat dimuat"
                  action={<Button onClick={retryRoles}>Coba Lagi</Button>}
                />
              ) : role ? (
                <>
                  <Typography.Paragraph type="secondary">
                    {role.description}
                  </Typography.Paragraph>
                  <RoleCapabilitiesTable permissions={role.permissions} />
                  {requester?.is_active && !requesterError && (
                    <Collapse
                      style={{ marginTop: 16 }}
                      items={[
                        {
                          key: "combined",
                          label: `Hak akses gabungan setelah persetujuan (${combinedPermissions.length})`,
                          children: (
                            <RoleCapabilitiesTable
                              permissions={combinedPermissions}
                            />
                          ),
                        },
                      ]}
                    />
                  )}
                </>
              ) : (
                <Typography.Text type="secondary">
                  Peran ini tidak tersedia dalam daftar peran yang dapat
                  diajukan saat ini.
                </Typography.Text>
              )}
            </section>
          </div>
          <div style={{ marginTop: 20 }}>
            <section>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                Keputusan Peninjau
              </Typography.Title>
              {data.status !== "open" ? (
                <Alert
                  showIcon
                  type="info"
                  title="Permintaan telah ditutup"
                  description="Tidak ada tindakan lanjutan yang diperlukan."
                />
              ) : selfReview ? (
                <Alert
                  showIcon
                  type="info"
                  title="Permintaan Anda harus ditinjau oleh admin lain yang memiliki hak peninjauan akses."
                />
              ) : (
                <>
                  <Typography.Paragraph>
                    Jika disetujui, peran <strong>{data.role_name}</strong> akan
                    ditambahkan ke akun pemohon. Peran yang sudah dimiliki tetap
                    tersimpan, dan seluruh hak aksesnya digabungkan.
                  </Typography.Paragraph>
                  <Space wrap>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      disabled={
                        rolesLoading ||
                        !!rolesError ||
                        !role ||
                        requesterLoading ||
                        !!requesterError ||
                        !requester
                      }
                      onClick={() => setDecision("approved")}
                    >
                      Setujui Permintaan
                    </Button>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => setDecision("rejected")}
                    >
                      Tolak Permintaan
                    </Button>
                  </Space>
                </>
              )}
            </section>
          </div>
        </div>
      )}
      <Modal
        title={
          decision === "approved"
            ? "Setujui Permintaan Akses?"
            : "Tolak Permintaan Akses"
        }
        open={decision !== null}
        onCancel={() => {
          if (!saving) setDecision(null);
        }}
        onOk={() => void resolve()}
        confirmLoading={saving}
        okText={decision === "approved" ? "Ya, Setujui" : "Tolak Permintaan"}
        cancelText="Batal"
        okButtonProps={{ danger: decision === "rejected" }}
        cancelButtonProps={{ disabled: saving }}
      >
        {decision === "approved" ? (
          <Typography.Paragraph>
            Peran <strong>{data?.role_name}</strong> akan diberikan kepada{" "}
            <strong>{data?.requester_name || data?.requester_email}</strong> dan
            digabungkan dengan peran yang sudah dimiliki. Persetujuan ini tidak
            melepas peran lain.
          </Typography.Paragraph>
        ) : (
          <Form
            scrollToFirstError={{ focus: true }}
            form={form}
            layout="vertical"
            disabled={saving}
          >
            <Form.Item
              name="reason"
              label="Alasan Penolakan"
              extra="Alasan ini akan ditampilkan kepada pemohon."
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Alasan penolakan wajib diisi",
                },
                {
                  min: 3,
                  transform: (value) => value?.trim(),
                  message: "Alasan minimal 3 karakter",
                },
              ]}
            >
              <Input.TextArea
                rows={4}
                maxLength={4000}
                showCount
                placeholder="Jelaskan mengapa akses belum dapat diberikan dan apa yang perlu dilengkapi."
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
