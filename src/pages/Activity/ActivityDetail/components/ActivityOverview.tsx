import { useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  List,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import {
  getActivityReadiness,
  saveSetupActivity,
} from "../../../../api/services/activity-setup";
import type { Activity } from "../../../../types/model/activity";
import { actionError } from "../../../../utils/action-error";
import PublicationHelp from "../../ActivitySetup/PublicationHelp";
import { activityChecklist } from "./activity-checklist";
import DeleteFeatureButton from "../../../../components/common/DeleteFeatureButton";
import { useRole } from "../../../../stores/authStore";

type Props = {
  activity: Activity;
  onUpdated: () => void;
  onNavigate: (tab: string) => void;
};

export default function ActivityOverview({
  activity,
  onUpdated,
  onNavigate,
}: Props): ReactElement {
  const role = useRole();
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    data: readiness,
    loading,
    error,
    refreshAsync,
  } = useRequest(() => getActivityReadiness(activity.id), {
    refreshDeps: [activity.id],
  });
  const transition = async (changes: Partial<Activity>): Promise<void> => {
    setBusy(true);
    setFailure("");
    try {
      await saveSetupActivity(activity.id, changes);
      onUpdated();
      await refreshAsync();
    } catch (cause) {
      setFailure(actionError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Space orientation="vertical" size="large" style={{ display: "flex" }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Ringkasan Pengaturan
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Gunakan daftar berikut untuk melihat apa yang sudah siap dan tindakan
          berikutnya.
        </Typography.Paragraph>
      </div>
      {failure && <Alert type="error" showIcon title={failure} />}
      {error && (
        <Alert
          type="error"
          showIcon
          title="Kesiapan kegiatan gagal dimuat"
          action={
            <Button onClick={() => void refreshAsync().catch(() => undefined)}>
              Coba Lagi
            </Button>
          }
        />
      )}
      <Row gutter={[16, 16]}>
        {(["publication", "registration"] as const).map((scope) => {
          const publication = scope === "publication";
          const active = publication
            ? Boolean(activity.is_published)
            : activity.is_registration_open;
          const ready = publication
            ? readiness?.can_publish
            : readiness?.can_open_registration;
          const allowed = publication
            ? readiness?.actions.can_publish
            : readiness?.actions.can_manage_registration;
          const checklist = readiness
            ? activityChecklist(readiness, publication)
            : [];
          const completed = checklist.filter((item) => item.complete).length;
          const progress = checklist.length
            ? Math.round((completed / checklist.length) * 100)
            : 0;
          return (
            <Col xs={24} lg={12} key={scope}>
              <Card
                title={
                  publication
                    ? "Jalur 1 · Publikasikan Kegiatan"
                    : "Jalur 2 · Pendaftaran Online"
                }
                extra={
                  <Tag
                    color={
                      active ? "success" : ready ? "processing" : "default"
                    }
                  >
                    {publication
                      ? active
                        ? "Sudah tayang"
                        : "Masih draf"
                      : active
                        ? "Pendaftaran dibuka"
                        : ready && activity.is_published
                          ? "Siap dibuka"
                          : "Belum siap dibuka"}
                  </Tag>
                }
                loading={loading}
                style={{ height: "100%" }}
              >
                <Typography.Paragraph>
                  {publication
                    ? "Cocok untuk kegiatan yang hanya membutuhkan halaman informasi publik tanpa pendaftaran online."
                    : "Pilih jalur ini jika peserta perlu mengisi formulir dan ditinjau oleh admin."}
                </Typography.Paragraph>
                {readiness && (
                  <>
                    {publication && (
                      <Progress
                        percent={progress}
                        aria-label={`${completed} dari ${checklist.length} item kegiatan selesai`}
                      />
                    )}
                    <List
                      dataSource={checklist}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button
                              key={item.key}
                              type="link"
                              onClick={() => onNavigate(item.tab)}
                            >
                              {item.complete ? "Lihat" : "Lengkapi"}
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              item.complete ? (
                                <CheckCircleFilled
                                  style={{ color: "#52c41a" }}
                                  aria-label="Selesai"
                                />
                              ) : (
                                <ClockCircleOutlined
                                  style={{ color: "#8c8c8c" }}
                                  aria-label="Belum selesai"
                                />
                              )
                            }
                            title={
                              <Space size="small" wrap>
                                <Typography.Text>{item.label}</Typography.Text>
                                {item.required && <Tag color="blue">Wajib</Tag>}
                              </Space>
                            }
                            description={item.description}
                          />
                        </List.Item>
                      )}
                    />
                    {!publication && !activity.is_published && (
                      <Typography.Paragraph type="secondary">
                        Tayangkan kegiatan melalui Jalur 1 sebelum membuka
                        pendaftaran.
                      </Typography.Paragraph>
                    )}
                  </>
                )}
                <Space wrap>
                  {allowed && (
                    <Button
                      type={active ? "default" : "primary"}
                      danger={active}
                      icon={
                        publication ? (
                          active ? (
                            <EyeInvisibleOutlined />
                          ) : (
                            <EyeOutlined />
                          )
                        ) : (
                          <FormOutlined />
                        )
                      }
                      loading={busy}
                      disabled={
                        busy ||
                        loading ||
                        !!error ||
                        (!active &&
                          (!ready || (!publication && !activity.is_published)))
                      }
                      onClick={() =>
                        void transition(
                          publication
                            ? { is_published: active ? 0 : 1 }
                            : { is_registration_open: !active },
                        )
                      }
                    >
                      {publication
                        ? active
                          ? "Sembunyikan Kegiatan"
                          : "Tayangkan Kegiatan"
                        : active
                          ? "Tutup Pendaftaran"
                          : "Buka Pendaftaran"}
                    </Button>
                  )}
                  <Button
                    icon={
                      publication ? <ArrowRightOutlined /> : <FormOutlined />
                    }
                    onClick={() => onNavigate(publication ? "1" : "7")}
                  >
                    {publication
                      ? "Edit Detail Kegiatan"
                      : "Kelola Form Pendaftaran"}
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
      {readiness?.actions.can_edit && !readiness.actions.can_publish && (
        <PublicationHelp id={activity.id} name={activity.name} />
      )}
      {(role?.code === "super_admin" || role?.code === "admin") && (
        <Card title="Hapus Kegiatan">
          <Alert
            type="warning"
            showIcon
            title="Penghapusan kegiatan bersifat permanen"
            description="Data pendaftaran dan jawaban peserta ikut dihapus. Kegiatan dengan riwayat sertifikat tidak dapat dihapus."
            style={{ marginBottom: 16 }}
          />
          <DeleteFeatureButton
            kind="activity"
            id={activity.id}
            name={activity.name}
            disabled={busy || loading}
          />
        </Card>
      )}
    </Space>
  );
}
