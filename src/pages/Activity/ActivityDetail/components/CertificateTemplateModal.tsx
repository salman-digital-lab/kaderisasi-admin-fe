import { CheckCircleFilled } from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Flex,
  Input,
  List,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";

import { getCertificateTemplate } from "../../../../api/services/certificateTemplate";
import { ResponsiveDialog as Modal } from "../../../../components/common/Responsive/ResponsiveDialog";
import { DIALOG_WIDTH } from "../../../../theme/tokens";
import type { CertificateTemplate } from "../../../../types/services/certificateTemplate";
import type { TemplateSummary } from "../../../../types/services/certificateWorkflow";
import { CertificateArtwork } from "../../../DigitalCertificate/components/CertificateArtwork";
import { VARIABLE_OPTIONS } from "../../../DigitalCertificate/constants";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateVerificationUrl,
  listTemplateVariables,
  resolveCertificateSampleText,
} from "../../../DigitalCertificate/utils/certificate-content";

const VARIABLE_LABELS: Record<string, string> = Object.fromEntries(
  VARIABLE_OPTIONS.map((option) => [option.value, option.label]),
);

export function templateBlockers(item: TemplateSummary): string[] {
  const errors = (item.readiness?.errors ?? []).map((error) =>
    typeof error === "string" ? error : error.message,
  );
  if (errors.length > 0) return errors;
  return item.status === "published" && item.readiness?.ready === true
    ? []
    : ["Desain belum dipublikasikan atau belum lengkap."];
}

type Props = {
  open: boolean;
  choices: TemplateSummary[];
  loading: boolean;
  initialId: number | null;
  onSearch: (value: string) => void;
  onCancel: () => void;
  onConfirm: (id: number) => void;
};

const CertificateTemplateModal = ({
  open,
  choices,
  loading,
  initialId,
  onSearch,
  onCancel,
  onConfirm,
}: Props) => {
  const [activeId, setActiveId] = useState<number | null>(initialId);
  const [detail, setDetail] = useState<CertificateTemplate>();
  const [detailError, setDetailError] = useState(false);

  useEffect(() => {
    if (open) setActiveId(initialId);
  }, [open, initialId]);

  useEffect(() => {
    if (!open || !activeId) {
      setDetail(undefined);
      return;
    }
    const controller = new AbortController();
    setDetail(undefined);
    setDetailError(false);
    getCertificateTemplate(activeId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDetail(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setDetailError(true);
      });
    return () => controller.abort();
  }, [open, activeId]);

  const active = choices.find((item) => item.id === activeId);
  const activeBlockers = active ? templateBlockers(active) : [];
  const variables = useMemo(
    () => (detail ? listTemplateVariables(detail.template_data) : []),
    [detail],
  );

  return (
    <Modal
      open={open}
      width={DIALOG_WIDTH.large * 1.2}
      title="Pilih template sertifikat"
      onCancel={onCancel}
      destroyOnHidden
      footer={
        <Flex justify="end" gap="small">
          <Button onClick={onCancel}>Batal</Button>
          <Button
            type="primary"
            disabled={!active || activeBlockers.length > 0}
            onClick={() => active && onConfirm(active.id)}
          >
            Gunakan template ini
          </Button>
        </Flex>
      }
    >
      <Flex gap="large" wrap style={{ alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 240px", minWidth: 0, maxWidth: 320 }}>
          <Input.Search
            allowClear
            placeholder="Cari template"
            aria-label="Cari template sertifikat"
            onChange={(event) => onSearch(event.target.value)}
            style={{ marginBottom: 12 }}
          />
          <List
            loading={loading}
            dataSource={choices}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Belum ada desain yang dipublikasikan."
                />
              ),
            }}
            style={{ maxHeight: 460, overflowY: "auto" }}
            renderItem={(item) => {
              const blockers = templateBlockers(item);
              const isActive = item.id === activeId;
              return (
                <List.Item
                  key={item.id}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={0}
                  onClick={() => setActiveId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveId(item.id);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    padding: 12,
                    border: `1px solid ${
                      isActive
                        ? "var(--ant-color-primary)"
                        : "var(--app-color-border-secondary)"
                    }`,
                    marginBottom: 8,
                  }}
                >
                  <Flex vertical gap={4} style={{ width: "100%" }}>
                    <Flex justify="space-between" gap="small">
                      <Typography.Text strong>{item.name}</Typography.Text>
                      {isActive && (
                        <CheckCircleFilled
                          style={{ color: "var(--ant-color-primary)" }}
                        />
                      )}
                    </Flex>
                    {blockers.length > 0 ? (
                      <Tag color="warning" style={{ width: "fit-content" }}>
                        Belum siap
                      </Tag>
                    ) : (
                      item.description && (
                        <Typography.Text type="secondary" ellipsis>
                          {item.description}
                        </Typography.Text>
                      )
                    )}
                  </Flex>
                </List.Item>
              );
            }}
          />
        </div>
        <div style={{ flex: "2 1 360px", minWidth: 0 }}>
          {!active ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Pilih template untuk melihat pratinjau dan variabelnya."
            />
          ) : (
            <Flex vertical gap="middle">
              {activeBlockers.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  title="Template ini belum dapat dipakai"
                  description={activeBlockers.join(" ")}
                />
              )}
              {detailError ? (
                <Alert
                  type="error"
                  showIcon
                  title="Pratinjau tidak dapat dimuat."
                />
              ) : !detail ? (
                <Skeleton.Image active style={{ width: "100%", height: 260 }} />
              ) : (
                <>
                  <div>
                    <Typography.Text strong>Pratinjau</Typography.Text>
                    <div
                      style={{
                        marginTop: 8,
                        border: "1px solid var(--app-color-border-secondary)",
                      }}
                    >
                      <CertificateArtwork
                        template={detail.template_data}
                        backgroundImage={detail.background_image}
                        resolveText={resolveCertificateSampleText}
                        verificationUrl={getCertificateVerificationUrl(
                          CERTIFICATE_SAMPLE_CODE,
                        )}
                      />
                    </div>
                    <Typography.Text type="secondary">
                      Menggunakan data contoh. Nilai asli dipakai saat
                      penerbitan.
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text strong>
                      Variabel pada template ({variables.length})
                    </Typography.Text>
                    {variables.length === 0 ? (
                      <Typography.Paragraph
                        type="secondary"
                        style={{ margin: "8px 0 0" }}
                      >
                        Template ini tidak memakai variabel.
                      </Typography.Paragraph>
                    ) : (
                      <List
                        size="small"
                        style={{
                          marginTop: 8,
                          maxHeight: 220,
                          overflowY: "auto",
                        }}
                        dataSource={variables}
                        renderItem={(use) => (
                          <List.Item key={use.variable}>
                            <Flex vertical gap={2} style={{ minWidth: 0 }}>
                              <Flex gap="small" wrap align="center">
                                <Typography.Text>
                                  {VARIABLE_LABELS[use.variable] ??
                                    use.variable}
                                </Typography.Text>
                                <Typography.Text code>
                                  {use.variable}
                                </Typography.Text>
                              </Flex>
                              <Typography.Text type="secondary">
                                {use.fromActivitySettings
                                  ? "Diisi pada “Atur isi sertifikat”"
                                  : "Terisi otomatis dari data peserta dan kegiatan"}
                              </Typography.Text>
                            </Flex>
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                </>
              )}
            </Flex>
          )}
        </div>
      </Flex>
    </Modal>
  );
};

export default CertificateTemplateModal;
