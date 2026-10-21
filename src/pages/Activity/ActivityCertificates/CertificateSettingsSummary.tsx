import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Flex, Skeleton, Space, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { getCertificateSettings } from "../../../api/services/certificateWorkflow";
import { CertificateSettingsDrawer } from "./CertificateSettingsDrawer";

/** Save status and activity number of the activity's certificate content, with its editor. */
export function CertificateSettingsSummary({
  activityId,
  canManage,
  onStatusChange,
}: {
  activityId: number;
  canManage: boolean;
  onStatusChange?: (saved: boolean) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState<{ saved: boolean; number: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    getCertificateSettings(activityId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({
          saved: data.saved,
          number: data.certificate_activity_number ?? "",
        });
        onStatusChange?.(data.saved);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
    // onStatusChange is a notification only; it is not a fetch dependency.
  }, [activityId, refresh]);

  return (
    <Flex vertical gap={8} align="flex-start">
      <Space wrap size={8}>
        <Typography.Text strong>Isi sertifikat</Typography.Text>
        {state && (
          <Tag color={state.saved ? "green" : "gold"}>
            {state.saved ? "Tersimpan" : "Belum disimpan"}
          </Tag>
        )}
      </Space>
      {error ? (
        <Typography.Text type="danger">
          Isi sertifikat tidak dapat dimuat.{" "}
          <Button
            type="link"
            size="small"
            onClick={() => setRefresh((v) => v + 1)}
          >
            Coba lagi
          </Button>
        </Typography.Text>
      ) : !state ? (
        <Skeleton active title={false} paragraph={{ rows: 1, width: 240 }} />
      ) : (
        <Typography.Text type="secondary">
          {state.number ? (
            <>
              Nomor sertifikat kegiatan{" "}
              <Typography.Text code>{state.number}</Typography.Text>
            </>
          ) : (
            "Nomor sertifikat kegiatan belum diisi."
          )}
          {!state.saved && " Simpan isi sertifikat sebelum menerbitkan."}
        </Typography.Text>
      )}
      <Button
        icon={canManage ? <EditOutlined /> : <EyeOutlined />}
        onClick={() => setOpen(true)}
      >
        {canManage ? "Atur isi sertifikat" : "Lihat isi sertifikat"}
      </Button>
      <CertificateSettingsDrawer
        activityId={activityId}
        open={open}
        disabled={!canManage}
        onClose={() => setOpen(false)}
        onSaved={() => {
          message.success("Isi sertifikat disimpan.");
          setOpen(false);
          setRefresh((v) => v + 1);
        }}
      />
    </Flex>
  );
}
