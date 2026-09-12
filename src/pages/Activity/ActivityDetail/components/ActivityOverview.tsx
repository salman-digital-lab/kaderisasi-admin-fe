import { useState, type ReactElement } from "react";
import { Alert, Button, Card, Col, Row, Space, Typography } from "antd";
import { useRequest } from "ahooks";
import {
  getActivityReadiness,
  saveSetupActivity,
} from "../../../../api/services/activity-setup";
import type { Activity } from "../../../../types/model/activity";
import { actionError } from "../../../../utils/action-error";
import PublicationHelp from "../../ActivitySetup/PublicationHelp";

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
        <Typography.Paragraph type="secondary">
          Periksa kelengkapan kegiatan sebelum menayangkan informasi atau
          membuka pendaftaran.
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
          const issues =
            readiness?.issues.filter((issue) => issue.scope === scope) ?? [];
          return (
            <Col xs={24} lg={12} key={scope}>
              <Card
                title={
                  publication ? "Penayangan Kegiatan" : "Pendaftaran Online"
                }
                loading={loading}
                style={{ height: "100%" }}
              >
                <Typography.Paragraph>
                  {publication
                    ? "Informasi kegiatan dapat ditayangkan tanpa membuka pendaftaran."
                    : "Lengkapi tanggal dan formulir sebelum menerima pendaftar."}
                </Typography.Paragraph>
                {readiness &&
                  (issues.length ? (
                    <ul style={{ paddingInlineStart: 20 }}>
                      {issues.map((issue) => (
                        <li key={issue.code}>{issue.message}</li>
                      ))}
                    </ul>
                  ) : (
                    <Typography.Paragraph>
                      {publication
                        ? "Informasi wajib sudah lengkap."
                        : "Tanggal dan formulir siap untuk membuka pendaftaran."}
                    </Typography.Paragraph>
                  ))}
                <Space wrap>
                  {allowed && (
                    <Button
                      type={active ? "default" : "primary"}
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
                  <Button onClick={() => onNavigate("1")}>
                    {publication
                      ? "Edit Detail Kegiatan"
                      : "Atur Tanggal Pendaftaran"}
                  </Button>
                  <Button onClick={() => onNavigate(publication ? "3" : "7")}>
                    {publication ? "Kelola Poster" : "Kelola Form Pendaftaran"}
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
    </Space>
  );
}
