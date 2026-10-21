import { CheckCircleFilled } from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Flex,
  Input,
  Skeleton,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCertificateTemplate } from "../../../../api/services/certificateTemplate";
import { ResponsiveDialog as Modal } from "../../../../components/common/Responsive/ResponsiveDialog";
import type {
  CertificateTemplate,
  CertificateTemplateData,
} from "../../../../types/services/certificateTemplate";
import type { TemplateSummary } from "../../../../types/services/certificateWorkflow";
import { CertificateArtwork } from "../../../DigitalCertificate/components/CertificateArtwork";
import { VARIABLE_OPTIONS } from "../../../DigitalCertificate/constants";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateVerificationUrl,
  listTemplateVariables,
  resolveCertificateSampleText,
  type TemplateVariableUse,
} from "../../../DigitalCertificate/utils/certificate-content";
import styles from "./CertificateTemplateModal.module.css";

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

/** Scales the certificate to fit its pane by both width and height. */
function FittedPreview({
  template,
  backgroundImage,
}: {
  template: CertificateTemplateData;
  backgroundImage: string | null;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const update = (): void => {
      const style = getComputedStyle(node);
      const innerWidth =
        node.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const innerHeight =
        node.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const byHeight =
        (innerHeight * template.canvasWidth) / template.canvasHeight;
      setWidth(Math.max(120, Math.min(innerWidth, byHeight)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [template.canvasWidth, template.canvasHeight]);

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      style={
        {
          "--certificate-ratio": `${template.canvasWidth} / ${template.canvasHeight}`,
        } as React.CSSProperties
      }
    >
      {width !== undefined && (
        <div className={styles.paper} style={{ width }}>
          <CertificateArtwork
            template={template}
            backgroundImage={backgroundImage}
            resolveText={resolveCertificateSampleText}
            verificationUrl={getCertificateVerificationUrl(
              CERTIFICATE_SAMPLE_CODE,
            )}
          />
        </div>
      )}
    </div>
  );
}

function VariableGroup({
  title,
  items,
}: {
  title: string;
  items: TemplateVariableUse[];
}) {
  if (items.length === 0) return null;
  return (
    <>
      <Typography.Text type="secondary" className={styles.groupTitle}>
        {title}
      </Typography.Text>
      <ul className={styles.variables}>
        {items.map((use) => (
          <li key={use.variable}>
            <Flex vertical gap={2}>
              <Typography.Text>
                {VARIABLE_LABELS[use.variable] ?? use.variable}
              </Typography.Text>
              <Typography.Text code style={{ width: "fit-content" }}>
                {use.variable}
              </Typography.Text>
            </Flex>
          </li>
        ))}
      </ul>
    </>
  );
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

  let preview: React.ReactNode;
  if (!active) {
    preview = (
      <Flex flex={1} align="center" justify="center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Pilih template untuk melihat pratinjau."
        />
      </Flex>
    );
  } else if (detailError) {
    preview = (
      <div style={{ padding: 16 }}>
        <Alert type="error" showIcon title="Pratinjau tidak dapat dimuat." />
      </div>
    );
  } else if (!detail) {
    preview = (
      <Flex flex={1} align="center" justify="center" style={{ padding: 16 }}>
        <Skeleton.Node active style={{ width: 280, height: 360 }} />
      </Flex>
    );
  } else {
    preview = (
      <FittedPreview
        template={detail.template_data}
        backgroundImage={detail.background_image}
      />
    );
  }

  return (
    <Modal
      open={open}
      centered
      width="min(1120px, calc(100vw - 48px))"
      title="Pilih template sertifikat"
      onCancel={onCancel}
      destroyOnHidden
      footer={
        <Flex justify="space-between" align="center" gap="small" wrap>
          <Typography.Text type="secondary">
            {active ? `Dipilih: ${active.name}` : "Belum ada template dipilih"}
          </Typography.Text>
          <Flex gap="small">
            <Button onClick={onCancel}>Batal</Button>
            <Button
              type="primary"
              disabled={!active || activeBlockers.length > 0}
              onClick={() => active && onConfirm(active.id)}
            >
              Gunakan template ini
            </Button>
          </Flex>
        </Flex>
      }
    >
      <div className={styles.layout}>
        <section className={styles.column} aria-label="Daftar template">
          <div className={styles.columnHeader}>
            <Input.Search
              allowClear
              placeholder="Cari template"
              aria-label="Cari template sertifikat"
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
          <div className={styles.scroll}>
            <Spin spinning={loading}>
              {choices.length === 0 && !loading ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Belum ada desain yang dipublikasikan."
                />
              ) : (
                <ul className={styles.templates} role="listbox">
                  {choices.map((item) => {
                    const isActive = item.id === activeId;
                    const ready = templateBlockers(item).length === 0;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`${styles.template} ${isActive ? styles.templateActive : ""}`}
                          onClick={() => setActiveId(item.id)}
                        >
                          <Flex justify="space-between" gap="small">
                            <Typography.Text strong>
                              {item.name}
                            </Typography.Text>
                            {isActive && (
                              <CheckCircleFilled
                                style={{ color: "var(--app-color-primary)" }}
                              />
                            )}
                          </Flex>
                          {item.description && (
                            <Typography.Text
                              type="secondary"
                              ellipsis={{ tooltip: item.description }}
                            >
                              {item.description}
                            </Typography.Text>
                          )}
                          {!ready && (
                            <Tag color="gold" style={{ width: "fit-content" }}>
                              Belum siap
                            </Tag>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Spin>
          </div>
        </section>

        <section className={styles.column} aria-label="Pratinjau">
          <div className={styles.columnHeader}>
            <Flex justify="space-between" align="baseline" gap="small" wrap>
              <Typography.Text strong>Pratinjau</Typography.Text>
              <Typography.Text type="secondary">Data contoh</Typography.Text>
            </Flex>
          </div>
          {activeBlockers.length > 0 && (
            <Alert
              type="warning"
              banner
              title="Template ini belum dapat dipakai"
              description={activeBlockers.join(" ")}
            />
          )}
          {preview}
        </section>

        <section className={styles.column} aria-label="Variabel">
          <div className={styles.columnHeader}>
            <Typography.Text strong>
              Variabel{detail ? ` (${variables.length})` : ""}
            </Typography.Text>
          </div>
          <div className={styles.scroll}>
            {!detail ? (
              <Typography.Paragraph
                type="secondary"
                style={{ margin: 0, padding: 16 }}
              >
                {active ? "Memuat variabel…" : "Belum ada template dipilih."}
              </Typography.Paragraph>
            ) : variables.length === 0 ? (
              <Typography.Paragraph
                type="secondary"
                style={{ margin: 0, padding: 16 }}
              >
                Template ini tidak memakai variabel.
              </Typography.Paragraph>
            ) : (
              <>
                <VariableGroup
                  title="Diisi di “Atur isi sertifikat”"
                  items={variables.filter((use) => use.fromActivitySettings)}
                />
                <VariableGroup
                  title="Terisi otomatis"
                  items={variables.filter((use) => !use.fromActivitySettings)}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default CertificateTemplateModal;
