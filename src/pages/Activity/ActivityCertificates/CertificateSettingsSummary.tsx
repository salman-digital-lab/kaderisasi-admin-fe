import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Flex, Skeleton, Space, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { getCertificateTemplate } from "../../../api/services/certificateTemplate";
import { getCertificateSettings } from "../../../api/services/certificateWorkflow";
import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";
import {
  getTemplateVariables,
  templateNeedsActivitySettings,
} from "../../DigitalCertificate/utils/certificate-content";
import { CertificateSettingsDrawer } from "./CertificateSettingsDrawer";

/**
 * Save status of the activity's certificate content for its template, with the
 * editor. Reports `ready` when nothing must be saved before publishing.
 */
export function CertificateSettingsSummary({
  activityId,
  templateId,
  canManage,
  onReadyChange,
}: {
  activityId: number;
  templateId?: number | null;
  canManage: boolean;
  onReadyChange?: (ready: boolean) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [template, setTemplate] = useState<CertificateTemplateData>();
  const [state, setState] = useState<{ saved: boolean; number: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    const controller = new AbortController();
    setError(false);
    Promise.all([
      getCertificateTemplate(templateId, controller.signal),
      getCertificateSettings(activityId, controller.signal),
    ])
      .then(([loadedTemplate, settings]) => {
        if (controller.signal.aborted) return;
        setTemplate(loadedTemplate.template_data);
        setState({
          saved: settings.saved,
          number: settings.certificate_activity_number ?? "",
        });
        onReadyChange?.(
          settings.saved ||
            !templateNeedsActivitySettings(loadedTemplate.template_data),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
    // onReadyChange is a notification only; it is not a fetch dependency.
  }, [activityId, templateId, refresh]);

  const heading = <Typography.Text strong>Isi sertifikat</Typography.Text>;
  if (!templateId)
    return (
      <Flex vertical gap={4}>
        {heading}
        <Typography.Text type="secondary">
          Pilih template terlebih dahulu. Isian mengikuti template yang dipilih.
        </Typography.Text>
      </Flex>
    );
  if (error)
    return (
      <Flex vertical gap={4} align="flex-start">
        {heading}
        <Typography.Text type="danger">
          Isi sertifikat tidak dapat dimuat.
        </Typography.Text>
        <Button size="small" onClick={() => setRefresh((v) => v + 1)}>
          Coba lagi
        </Button>
      </Flex>
    );
  if (!template || !state)
    return (
      <Flex vertical gap={4}>
        {heading}
        <Skeleton active title={false} paragraph={{ rows: 1, width: 240 }} />
      </Flex>
    );

  const needsSettings = templateNeedsActivitySettings(template);
  const showsNumber = getTemplateVariables(template).fields.has(
    "certificate_activity_number",
  );
  return (
    <Flex vertical gap={8} align="flex-start">
      <Space wrap size={8}>
        {heading}
        {needsSettings && (
          <Tag color={state.saved ? "green" : "gold"}>
            {state.saved ? "Tersimpan" : "Belum disimpan"}
          </Tag>
        )}
      </Space>
      <Typography.Text type="secondary">
        {!needsSettings ? (
          "Template ini tidak memakai isian kegiatan; semua isi diambil otomatis dari data peserta."
        ) : (
          <>
            {showsNumber &&
              (state.number ? (
                <>
                  Nomor sertifikat kegiatan{" "}
                  <Typography.Text code>{state.number}</Typography.Text>.{" "}
                </>
              ) : (
                "Nomor sertifikat kegiatan belum diisi. "
              ))}
            {!state.saved && "Simpan isi sertifikat sebelum menerbitkan."}
          </>
        )}
      </Typography.Text>
      <Button
        icon={canManage && needsSettings ? <EditOutlined /> : <EyeOutlined />}
        onClick={() => setOpen(true)}
      >
        {canManage && needsSettings
          ? "Atur isi sertifikat"
          : "Lihat isi sertifikat"}
      </Button>
      <CertificateSettingsDrawer
        activityId={activityId}
        template={template}
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
