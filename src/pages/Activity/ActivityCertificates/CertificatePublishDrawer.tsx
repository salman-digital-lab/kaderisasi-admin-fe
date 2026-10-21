import { ResponsiveTable as Table } from "../../../components/common/Responsive/ResponsiveTable";
import { ResponsiveDialog } from "../../../components/common/Responsive/ResponsiveDialog";
import { LockOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Alert,
  Button,
  Drawer,
  Flex,
  Progress,
  Skeleton,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useBeforeUnload, useBlocker } from "react-router-dom";
import { getCertificateTemplate } from "../../../api/services/certificateTemplate";
import {
  getCertificateRecipients,
  getTemplateLock,
  issueCertificateBatch,
  prepareIssuance,
} from "../../../api/services/certificateWorkflow";
import { usePermissions } from "../../../stores/authStore";
import type { CertificateTemplate } from "../../../types/services/certificateTemplate";
import type {
  CertificateRecipient,
  IssuancePlan,
  IssuanceResult,
  RecipientPage,
  RecipientState,
  TemplateLockState,
} from "../../../types/services/certificateWorkflow";
import {
  canIssueCertificates,
  canManageCertificateTemplates,
} from "../../../utils/certificate-permissions";
import { CertificatePreviewPages } from "../../DigitalCertificate/components/CertificatePreviewPages";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateVerificationUrl,
  resolveCertificateText,
} from "../../DigitalCertificate/utils/certificate-content";
import { runCertificateBatches } from "./batch-runner";
import { CertificateSettingsForm } from "./CertificateSettingsForm";
import { preflightSalmanRecipients } from "./preflightSalman";

export const RECIPIENT_LABELS: Record<RecipientState, string> = {
  eligible_not_issued: "Siap diterbitkan",
  not_eligible: "Belum lulus",
  issued_active: "Sudah terbit",
  issued_revoked: "Dicabut",
};
const RECIPIENT_COLORS: Record<RecipientState, string> = {
  eligible_not_issued: "blue",
  not_eligible: "default",
  issued_active: "green",
  issued_revoked: "red",
};
const RESULT_LABELS = {
  created: "Diterbitkan",
  already_issued: "Sudah terbit",
  skipped: "Dilewati",
  failed: "Gagal",
};
const REASONS: Record<string, string> = {
  CERTIFICATE_SETTINGS_REQUIRED:
    "Simpan pengaturan isi sertifikat sebelum meninjau peserta.",
  CERTIFICATE_TEMPLATE_NOT_LOCKED:
    "Kunci template di halaman kegiatan sebelum menerbitkan sertifikat.",
  CERTIFICATE_SCORE_NOT_PUBLISHED:
    "Daftar nilai aktif, tetapi nilai peserta belum diterbitkan.",
  REGISTRATION_NOT_ELIGIBLE: "Status peserta belum lulus.",
  REGISTRATION_NOT_FOUND: "Peserta tidak ditemukan.",
  CERTIFICATE_ALREADY_REVOKED: "Sertifikat sudah dicabut.",
  GENERAL_ERROR: "Gagal diproses. Silakan coba lagi.",
};
const RECIPIENTS_PER_PAGE = 20;

export interface CertificatePublishDrawerProps {
  activityId: number;
  open: boolean;
  /** Participants to publish for; undefined publishes for every eligible participant. */
  registrationIds?: number[];
  /** Called after closing; `published` is true when any certificate was issued. */
  onClose: (published: boolean) => void;
}

export function CertificatePublishDrawer(
  props: CertificatePublishDrawerProps,
): React.ReactElement {
  // Remount on every open so each publication starts from a fresh review.
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) setSession((value) => value + 1);
  }
  return <PublishFlow key={session} {...props} />;
}

function PublishFlow({
  activityId,
  open,
  registrationIds,
  onClose,
}: CertificatePublishDrawerProps): React.ReactElement {
  const [running, setRunning] = useState(false);
  const [published, setPublished] = useState(false);
  const onPublished = (): void => setPublished(true);
  const onDone = (): void => {
    if (!running) onClose(published);
  };
  const permissions = usePermissions();
  const canManage = canManageCertificateTemplates(permissions);
  const canIssue = canIssueCertificates(permissions);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [templateLock, setTemplateLock] = useState<TemplateLockState>();
  const [template, setTemplate] = useState<CertificateTemplate>();
  const [templateLoading, setTemplateLoading] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState<boolean>();
  const [recipients, setRecipients] = useState<RecipientPage>();
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<IssuancePlan>();
  const [results, setResults] = useState<IssuanceResult[]>([]);
  const [remaining, setRemaining] = useState<number[]>([]);
  const [runMessage, setRunMessage] = useState("");
  const [reviewRequired, setReviewRequired] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const stopRef = useRef(false);
  const interruptionVersion = useRef(0);
  const aliveRef = useRef(true);
  const runningRef = useRef(false);
  const blocker = useBlocker(running);
  const topRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(step);
  // Start each step from its top instead of the previous step's scroll position.
  useEffect(() => {
    if (previousStep.current !== step)
      topRef.current?.scrollIntoView({ block: "start" });
    previousStep.current = step;
  }, [step]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopRef.current = true;
    };
  }, []);
  // A hidden tab may be throttled mid-batch: stop and require a fresh review.
  useEffect(() => {
    const interrupt = (): void => {
      stopRef.current = true;
      interruptionVersion.current += 1;
      setReviewRequired(true);
    };
    const handleVisibility = (): void => {
      if (document.hidden) interrupt();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", interrupt);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", interrupt);
    };
  }, []);
  useBeforeUnload(
    useCallback((event) => {
      if (runningRef.current) event.preventDefault();
    }, []),
  );
  useEffect(() => {
    if (blocker.state === "blocked") {
      message.info(
        "Hentikan penerbitan setelah batch ini sebelum meninggalkan halaman.",
      );
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    getTemplateLock(activityId, controller.signal)
      .then(async (lock) => {
        if (controller.signal.aborted) return;
        setTemplateLock(lock);
        // Keep the loaded template while refreshing so the settings form keeps its input.
        if (lock.template?.id)
          setTemplate(
            await getCertificateTemplate(lock.template.id, controller.signal),
          );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Template kegiatan tidak dapat dimuat. Coba lagi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTemplateLoading(false);
      });
    return () => controller.abort();
  }, [activityId, open, refresh]);

  const idsKey = registrationIds?.join(",");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setRecipientsLoading(true);
    getCertificateRecipients(
      activityId,
      {
        page,
        per_page: RECIPIENTS_PER_PAGE,
        sort_order: "asc",
        ...(idsKey
          ? { registration_ids: idsKey.split(",").map(Number) }
          : { state: "eligible_not_issued" as const }),
      },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) setRecipients(data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Daftar penerima tidak dapat dimuat. Coba lagi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setRecipientsLoading(false);
      });
    return () => controller.abort();
  }, [activityId, idsKey, open, page, refresh]);

  const isSalman = template?.template_data.scoreSheetLayout === "salman-v1";
  const locked = templateLock?.locked === true;
  const ready =
    template?.status === "published" && template.readiness?.ready === true;
  const canReview =
    canIssue &&
    locked &&
    ready &&
    !templateLoading &&
    (!isSalman || settingsSaved === true);

  async function review(ids?: number[], retry = false): Promise<void> {
    const versionAtReview = interruptionVersion.current;
    setBusy(true);
    setError("");
    try {
      const next = await prepareIssuance(activityId, ids ?? registrationIds);
      setReviewRequired(
        document.hidden || versionAtReview !== interruptionVersion.current,
      );
      setPlan(next);
      setRemaining([]);
      setHasRun(false);
      setRunMessage("");
      if (!retry) setResults([]);
      setStep(1);
    } catch (cause) {
      const code = isAxiosError(cause)
        ? (cause.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(
        REASONS[code ?? ""] ??
          (isAxiosError(cause) && cause.response?.status === 409
            ? "Template berubah. Tinjau penerima kembali."
            : "Penerbitan belum siap. Periksa template dan peserta, lalu coba lagi."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function issue(): Promise<void> {
    if (
      !plan?.registration_ids.length ||
      runningRef.current ||
      reviewRequired ||
      document.hidden
    )
      return;
    runningRef.current = true;
    stopRef.current = false;
    setRunning(true);
    setRunMessage("");
    try {
      const signer = plan.preview?.document_signer;
      if (!signer) {
        setError("Penandatangan belum tersedia. Tinjau ulang sertifikat.");
        setConfirmPublish(false);
        return;
      }
      if (
        plan.preview?.template.template_data.scoreSheetLayout === "salman-v1"
      ) {
        const errors = await preflightSalmanRecipients(
          plan.registration_ids,
          signer.name,
          signer.title,
          setRunMessage,
        );
        if (errors.length) {
          setError(
            `Perbaiki tata letak sebelum diterbitkan: ${errors.join("; ")}`,
          );
          setConfirmPublish(false);
          return;
        }
      }
      if (reviewRequired || document.hidden || stopRef.current) {
        setConfirmPublish(false);
        return;
      }
      setConfirmPublish(false);
      setHasRun(true);
      const outcome = await runCertificateBatches(plan, {
        issue: (ids) => issueCertificateBatch(plan, ids),
        shouldStop: () => stopRef.current || document.hidden,
        onResult: (items) => {
          if (items.some((item) => item.state === "created")) onPublished();
          if (aliveRef.current)
            setResults((current) => [
              ...new Map(
                [...current, ...items].map((item) => [
                  item.registration_id,
                  item,
                ]),
              ).values(),
            ]);
        },
      });
      if (!aliveRef.current) return;
      setRemaining(outcome.remaining);
      setRunMessage(
        outcome.contextChanged
          ? "Template atau pengaturan kegiatan berubah. Tinjau sisa peserta sebelum melanjutkan."
          : outcome.remaining.length
            ? "Penerbitan dijeda. Hasil yang sudah selesai tetap tersimpan. Tinjau sisa peserta untuk melanjutkan."
            : "Penerbitan selesai.",
      );
    } catch {
      setConfirmPublish(false);
      setError(
        "Penerbitan belum selesai. Tinjau kembali sebelum mencoba lagi.",
      );
    } finally {
      runningRef.current = false;
      if (aliveRef.current) setRunning(false);
    }
  }

  const retryIds = [
    ...new Set([
      ...remaining,
      ...results
        .filter((item) => item.state === "failed" || item.state === "skipped")
        .map((item) => item.registration_id),
    ]),
  ];
  const plannedIds = useMemo(() => new Set(plan?.registration_ids), [plan]);
  const completed = results.filter((item) =>
    plannedIds.has(item.registration_id),
  ).length;

  const recipientColumns: TableColumnsType<CertificateRecipient> = [
    { title: "Nama peserta", dataIndex: "name" },
    {
      title: "Status",
      dataIndex: "state",
      width: 150,
      render: (value: RecipientState) => (
        <Tag color={RECIPIENT_COLORS[value]}>{RECIPIENT_LABELS[value]}</Tag>
      ),
    },
  ];

  const recipientTotal = recipients?.meta.total ?? 0;
  const prepare = (
    <Flex vertical gap={24}>
      <section aria-labelledby="certificate-template-heading">
        <Typography.Title level={5} id="certificate-template-heading">
          Template
        </Typography.Title>
        {templateLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
        ) : !templateLock?.template ? (
          <Alert
            type="warning"
            showIcon
            title="Template belum dipilih"
            description="Pilih dan kunci template sertifikat di halaman kegiatan."
            action={
              <Link to={`/activity/${activityId}`}>
                <Button size="small">Buka kegiatan</Button>
              </Link>
            }
          />
        ) : (
          <Flex vertical gap={8}>
            <Space wrap size={8}>
              <Typography.Text strong>
                {templateLock.template.name}
              </Typography.Text>
              {locked && (
                <Tag icon={<LockOutlined />} color="blue">
                  Terkunci
                </Tag>
              )}
            </Space>
            {!locked && (
              <Alert
                type="warning"
                showIcon
                title="Template belum dikunci"
                description="Kunci template di halaman kegiatan sebelum menerbitkan sertifikat."
                action={
                  <Link to={`/activity/${activityId}`}>
                    <Button size="small">Buka kegiatan</Button>
                  </Link>
                }
              />
            )}
            {template && !ready && (
              <Alert
                type="warning"
                showIcon
                title="Desain belum siap digunakan"
                description="Publikasikan desain yang lolos pemeriksaan terlebih dahulu."
              />
            )}
          </Flex>
        )}
      </section>

      {isSalman && (
        <CertificateSettingsForm
          activityId={activityId}
          disabled={!canManage}
          onStatusChange={setSettingsSaved}
          onSaved={() => {
            message.success("Pengaturan sertifikat disimpan.");
            setRefresh((value) => value + 1);
          }}
        />
      )}

      <section aria-labelledby="certificate-recipients-heading">
        <Typography.Title level={5} id="certificate-recipients-heading">
          Penerima ({recipientTotal})
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          {registrationIds
            ? "Hanya peserta LULUS KEGIATAN tanpa sertifikat aktif yang akan diterbitkan; status lain dilewati."
            : "Semua peserta LULUS KEGIATAN yang belum memiliki sertifikat. Untuk menerbitkan ulang sertifikat yang dicabut, pilih pesertanya di tabel."}
        </Typography.Paragraph>
        <Table
          listId="pages/Activity/ActivityCertificates/CertificatePublishDrawer:recipients"
          rowKey="registration_id"
          size="small"
          columns={recipientColumns}
          dataSource={recipients?.data}
          loading={recipientsLoading}
          locale={{ emptyText: "Tidak ada peserta yang siap diterbitkan." }}
          pagination={
            recipientTotal > RECIPIENTS_PER_PAGE && {
              current: page,
              pageSize: RECIPIENTS_PER_PAGE,
              total: recipientTotal,
              showSizeChanger: false,
              onChange: setPage,
            }
          }
        />
      </section>

      <Alert
        type="info"
        showIcon
        title="Ingin menyertakan nilai pada halaman kedua?"
        description={
          <>
            {isSalman
              ? "Jika daftar nilai diaktifkan, nilai setiap peserta harus lengkap dan terbit sebelum diterbitkan. "
              : "Nilai terbit akan disertakan pada halaman kedua bila tersedia. "}
            <Link to={`/activity/${activityId}?tab=scoring`}>
              Buka penilaian kegiatan
            </Link>
          </>
        }
      />
    </Flex>
  );

  const reviewStep = plan && (
    <Flex vertical gap={16}>
      <div>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          {hasRun
            ? "Hasil penerbitan"
            : `${plan.registration_ids.length} sertifikat siap diterbitkan`}
        </Typography.Title>
        <Typography.Text type="secondary">
          {plan.excluded.already_issued} sudah terbit · {plan.excluded.revoked}{" "}
          dicabut (tidak dipilih) ·{" "}
          {plan.excluded.not_eligible + plan.excluded.missing} tidak memenuhi
          syarat.
        </Typography.Text>
      </div>
      {plan.preview && !hasRun && (
        <>
          <Alert
            type="info"
            showIcon
            title={`Contoh: ${plan.preview.participant.name} · ${(plan.preview.activity.certificate_settings?.include_scores ?? Boolean(plan.preview.participant.scoring_result)) ? "2 halaman" : "1 halaman"}`}
            description="Data dan desain ini akan disimpan sebagai sertifikat resmi. Nomor unik dibuat saat diterbitkan."
          />
          <CertificatePreviewPages
            signerName={plan.preview.document_signer?.name}
            signerTitle={plan.preview.document_signer?.title}
            participant={plan.preview.participant}
            settings={plan.preview.activity.certificate_settings}
            template={plan.preview.template.template_data}
            backgroundImage={plan.preview.template.background_image}
            resolveText={(element) =>
              element.variable === "{{approval}}" &&
              plan.preview?.document_signer
                ? `Ditandatangani secara elektronik oleh\n${plan.preview.document_signer.name}\n${plan.preview.document_signer.title}\n[Tanggal penerbitan]`
                : resolveCertificateText(
                    element,
                    plan.preview!.participant,
                    CERTIFICATE_SAMPLE_CODE,
                    undefined,
                    plan.preview!.activity.certificate_settings,
                  )
            }
            verificationUrl={getCertificateVerificationUrl(
              CERTIFICATE_SAMPLE_CODE,
            )}
          />
        </>
      )}
      {Boolean(plan.blocked?.length) && (
        <Alert
          type="error"
          showIcon
          title={`${plan.blocked?.length} peserta belum memiliki nilai terbit`}
          description={
            <>
              {plan.blocked?.map((item) => (
                <div key={item.registration_id}>
                  {item.name || `Pendaftaran ${item.registration_id}`}: nilai
                  belum lengkap atau belum diterbitkan.
                </div>
              ))}
              <div>
                Terbitkan nilainya atau matikan halaman daftar nilai, lalu
                tinjau ulang.
              </div>
            </>
          }
        />
      )}
      {!plan.registration_ids.length && (
        <Alert
          type="info"
          showIcon
          title="Tidak ada sertifikat baru untuk diterbitkan"
          description="Peserta mungkin sudah menerima sertifikat atau belum memenuhi syarat."
        />
      )}
      {hasRun && (
        <>
          <Progress
            percent={Math.round(
              (completed / Math.max(1, plan.registration_ids.length)) * 100,
            )}
            status={
              running
                ? "active"
                : remaining.length ||
                    results.some((item) => item.state === "failed")
                  ? "normal"
                  : "success"
            }
          />
          <Typography.Text role="status">
            {running
              ? `${completed} dari ${plan.registration_ids.length} peserta diproses. Tetap buka halaman ini.`
              : runMessage}{" "}
            {Object.entries(RESULT_LABELS)
              .map(
                ([state, label]) =>
                  `${results.filter((item) => item.state === state).length} ${label.toLowerCase()}`,
              )
              .join(" · ")}
          </Typography.Text>
          <Table
            listId="pages/Activity/ActivityCertificates/CertificatePublishDrawer:results"
            rowKey="registration_id"
            size="small"
            dataSource={results}
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            columns={[
              { title: "Nama peserta", dataIndex: "name" },
              {
                title: "Hasil",
                dataIndex: "state",
                width: 130,
                render: (state: IssuanceResult["state"]) =>
                  RESULT_LABELS[state],
              },
              {
                title: "Keterangan",
                render: (_, item: IssuanceResult) =>
                  item.certificate_id ? (
                    <Link
                      to={`/certificate-preview/${item.certificate_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lihat sertifikat
                    </Link>
                  ) : item.reason ? (
                    REASONS[item.reason] || "Silakan periksa status peserta."
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        </>
      )}
    </Flex>
  );

  const footer = (
    <Flex justify="space-between" gap={8} wrap>
      {step === 0 ? (
        <Button onClick={onDone}>Batal</Button>
      ) : (
        <Button
          disabled={running || busy}
          onClick={() => {
            setStep(0);
            setHasRun(false);
          }}
        >
          Kembali
        </Button>
      )}
      <Space wrap size={8}>
        {step === 0 && (
          <Button
            type="primary"
            disabled={!canReview}
            loading={busy}
            onClick={() => review()}
          >
            Tinjau sertifikat
          </Button>
        )}
        {step === 1 && !hasRun && reviewRequired && (
          <Button loading={busy} onClick={() => review(plan?.registration_ids)}>
            Tinjau ulang
          </Button>
        )}
        {step === 1 && !hasRun && (
          <Button
            type="primary"
            disabled={
              !canIssue ||
              !plan?.registration_ids.length ||
              reviewRequired ||
              Boolean(plan.blocked?.length)
            }
            onClick={() => setConfirmPublish(true)}
          >
            Terbitkan {plan?.registration_ids.length} sertifikat
          </Button>
        )}
        {running && (
          <Button
            onClick={() => {
              stopRef.current = true;
              setRunMessage("Akan berhenti setelah batch ini.");
            }}
          >
            Hentikan setelah batch ini
          </Button>
        )}
        {step === 1 && hasRun && !running && retryIds.length > 0 && (
          <Button loading={busy} onClick={() => review(retryIds, true)}>
            Tinjau {retryIds.length} peserta tersisa / gagal
          </Button>
        )}
        {step === 1 && hasRun && !running && (
          <Button type="primary" onClick={onDone}>
            Selesai
          </Button>
        )}
      </Space>
    </Flex>
  );

  return (
    <Drawer
      title={
        registrationIds?.length === 1
          ? "Terbitkan sertifikat peserta"
          : registrationIds
            ? `Terbitkan sertifikat ${registrationIds.length} peserta`
            : "Terbitkan sertifikat"
      }
      open={open}
      onClose={onDone}
      size={760}
      maskClosable={false}
      keyboard={!running}
      closable={{ "aria-label": "Tutup", disabled: running }}
      styles={{ wrapper: { maxWidth: "100vw" } }}
      footer={footer}
    >
      <Flex vertical gap={24} ref={topRef}>
        <Steps
          size="small"
          current={step}
          items={[{ title: "Siapkan" }, { title: "Tinjau & terbitkan" }]}
        />
        {error && (
          <Alert
            type="error"
            showIcon
            title={error}
            closable={{ onClose: () => setError("") }}
            action={
              step === 0 ? (
                <Button size="small" onClick={() => setRefresh((v) => v + 1)}>
                  Muat ulang
                </Button>
              ) : undefined
            }
          />
        )}
        {step === 0 ? prepare : reviewStep}

        <ResponsiveDialog
          title="Terbitkan sertifikat?"
          open={confirmPublish}
          okText="Terbitkan dan tanda tangani"
          cancelText="Batal"
          confirmLoading={running}
          onCancel={() => {
            if (!running) setConfirmPublish(false);
          }}
          onOk={issue}
          okButtonProps={{
            disabled:
              !canIssue || reviewRequired || Boolean(plan?.blocked?.length),
          }}
        >
          <Typography.Paragraph>
            {plan?.registration_ids.length} sertifikat akan langsung diterbitkan
            dan ditandatangani secara elektronik atas nama{" "}
            <strong>{plan?.preview?.document_signer?.name}</strong> (
            {plan?.preview?.document_signer?.title}).
          </Typography.Paragraph>
          <Typography.Paragraph>
            Dengan menerbitkan, Anda menyatakan berwenang bertindak atas nama
            penandatangan. Identitas admin Anda dicatat. Sertifikat dapat
            dibatalkan penerbitannya untuk diperbaiki.
          </Typography.Paragraph>
          {running && (
            <span role="status">{runMessage || "Memeriksa sertifikat…"}</span>
          )}
        </ResponsiveDialog>
      </Flex>
    </Drawer>
  );
}
