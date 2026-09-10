import { ResponsiveTable as Table } from "../../../components/common/Responsive/ResponsiveTable";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Alert,
  Button,
  Card,
  Input,
  List,
  Pagination,
  Progress,
  Radio,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useBeforeUnload, useBlocker, useParams } from "react-router-dom";
import { getCertificateTemplate } from "../../../api/services/certificateTemplate";
import {
  assignCertificateTemplate,
  getCertificateRecipients,
  getTemplateSummaries,
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
  TemplateSummary,
} from "../../../types/services/certificateWorkflow";
import {
  canIssueCertificates,
  canManageCertificateTemplates,
} from "../../../utils/certificate-permissions";
import { CertificateArtwork } from "../../DigitalCertificate/components/CertificateArtwork";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateVerificationUrl,
  resolveCertificateSampleText,
  resolveCertificateText,
} from "../../DigitalCertificate/utils/certificate-content";
import { runCertificateBatches } from "./batch-runner";
import { formatRegistrationTime } from "../../../utils/registration-time";
import styles from "./index.module.css";
import { ApprovalRequestForm } from "./ApprovalRequestForm";
import { CertificateApprovals } from "../../DigitalCertificate/components/CertificateApprovals";

const LABELS = {
  eligible_not_issued: "Siap diterbitkan",
  not_eligible: "Belum lulus",
  issued_active: "Sudah terbit",
  issued_revoked: "Dicabut",
};
const RESULT_LABELS = {
  created: "Diterbitkan",
  already_issued: "Sudah terbit",
  skipped: "Dilewati",
  failed: "Gagal",
};
const REASONS: Record<string, string> = {
  REGISTRATION_NOT_ELIGIBLE: "Status peserta belum lulus.",
  REGISTRATION_NOT_FOUND: "Peserta tidak ditemukan.",
  CERTIFICATE_ALREADY_REVOKED: "Sertifikat sudah dicabut.",
  GENERAL_ERROR: "Gagal diproses. Silakan coba lagi.",
};

export default function ActivityCertificates(): React.ReactElement {
  const activityId = Number(useParams<{ id: string }>().id);
  const permissions = usePermissions();
  const canManage = canManageCertificateTemplates(permissions);
  const canIssue = canIssueCertificates(permissions);
  const [step, setStep] = useState(0);
  const [recipients, setRecipients] = useState<RecipientPage>();
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templatePage, setTemplatePage] = useState(1);
  const [templateTotal, setTemplateTotal] = useState(0);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateSearchInput, setTemplateSearchInput] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>();
  const [template, setTemplate] = useState<CertificateTemplate>();
  const [templateLoading, setTemplateLoading] = useState(false);
  const [selection, setSelection] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<IssuancePlan>();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<IssuanceResult[]>([]);
  const [remaining, setRemaining] = useState<number[]>([]);
  const [runMessage, setRunMessage] = useState("");
  const [reviewRequired, setReviewRequired] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);
  const stopRef = useRef(false);
  const interruptionVersion = useRef(0);
  const aliveRef = useRef(true);
  const runningRef = useRef(false);
  const blocker = useBlocker(running);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopRef.current = true;
    };
  }, []);
  useEffect(() => {
    const handleVisibility = (): void => {
      if (document.hidden) {
        stopRef.current = true;
        interruptionVersion.current += 1;
        setReviewRequired(true);
      } else {
        setRefresh((value) => value + 1);
      }
    };
    const handlePageHide = (): void => {
      stopRef.current = true;
      interruptionVersion.current += 1;
      setReviewRequired(true);
    };
    const handlePageShow = (event: PageTransitionEvent): void => {
      if (event.persisted) setRefresh((value) => value + 1);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
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
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTemplateSearch(templateSearchInput.trim());
      setTemplatePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [templateSearchInput]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getCertificateRecipients(
      activityId,
      {
        page,
        per_page: 50,
        search: search || undefined,
        sort_order: sortOrder,
      },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setRecipients(data);
          setSelectedTemplateId((current) =>
            current === undefined ? (data.template?.id ?? null) : current,
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Peserta tidak dapat dimuat. Coba lagi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [activityId, page, search, refresh, sortOrder]);
  useEffect(() => {
    if (step !== 0) return;
    const controller = new AbortController();
    setTemplatesLoading(true);
    setTemplateError("");
    getTemplateSummaries(
      { page: templatePage, search: templateSearch || undefined },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setTemplates(data.data);
          setTemplateTotal(data.meta.total);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setTemplateError("Daftar template tidak dapat dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTemplatesLoading(false);
      });
    return () => controller.abort();
  }, [step, templatePage, templateSearch, refresh]);
  useEffect(() => {
    const controller = new AbortController();
    setTemplate(undefined);
    setTemplateLoading(false);
    if (!selectedTemplateId) return;
    setTemplateLoading(true);
    getCertificateTemplate(selectedTemplateId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setTemplate(data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setTemplateError("Pratinjau template tidak dapat dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTemplateLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [selectedTemplateId, refresh]);

  const ready =
    template?.status === "published" && template.readiness?.ready === true;
  const requiresApproval = plan?.preview?.template.template_data.elements.some(
    (element) =>
      element.type === "variable-text" && element.variable === "{{approval}}",
  );
  async function saveTemplate(): Promise<void> {
    if (!ready || !selectedTemplateId) return;
    setBusy(true);
    try {
      if (selectedTemplateId !== recipients?.template?.id)
        await assignCertificateTemplate(activityId, selectedTemplateId);
      setRefresh((value) => value + 1);
      setStep(1);
    } catch {
      setError(
        "Template belum berhasil disimpan. Periksa akses dan coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function review(ids?: number[], retry = false): Promise<void> {
    const versionAtReview = interruptionVersion.current;
    setBusy(true);
    setError("");
    try {
      const next = await prepareIssuance(
        activityId,
        ids ?? (selection === "selected" ? selectedIds : undefined),
      );
      setReviewRequired(
        document.hidden || versionAtReview !== interruptionVersion.current,
      );
      setPlan(next);
      setRemaining([]);
      setHasRun(false);
      setRunMessage("");
      if (!retry) setResults([]);
      setStep(2);
    } catch (cause) {
      setError(
        isAxiosError(cause) && cause.response?.status === 409
          ? "Template berubah. Pilih ulang dan tinjau penerima kembali."
          : "Penerbitan belum siap. Periksa template dan peserta, lalu coba lagi.",
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
    setHasRun(true);
    setRunMessage("");
    try {
      const outcome = await runCertificateBatches(plan, {
        issue: (ids) => issueCertificateBatch(plan, ids),
        shouldStop: () => stopRef.current || document.hidden,
        onResult: (items) => {
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
            : "Penerbitan selesai. Periksa hasil di bawah.",
      );
      setRefresh((value) => value + 1);
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
  const columns: TableColumnsType<CertificateRecipient> = [
    { title: "Nama peserta", dataIndex: "name" },
    {
      title: "Waktu Pendaftaran",
      dataIndex: "created_at",
      key: "created_at",
      width: 210,
      sorter: true,
      sortOrder: sortOrder === "asc" ? "ascend" : "descend",
      sortDirections: ["descend", "ascend", "descend"],
      render: formatRegistrationTime,
    },
    {
      title: "Status",
      dataIndex: "state",
      render: (value: CertificateRecipient["state"]) => (
        <Tag
          color={
            value === "eligible_not_issued"
              ? "blue"
              : value === "issued_active"
                ? "green"
                : value === "issued_revoked"
                  ? "red"
                  : "default"
          }
        >
          {LABELS[value]}
        </Tag>
      ),
    },
    {
      title: "Sertifikat",
      render: (_, row) =>
        row.certificate_id ? (
          <Link to={`/certificate-preview/${row.certificate_id}`}>
            Lihat sertifikat
          </Link>
        ) : (
          "—"
        ),
    },
  ];
  const count =
    selection === "all"
      ? (recipients?.counts.eligible_not_issued ?? 0)
      : selectedIds.length;
  const plannedIds = useMemo(() => new Set(plan?.registration_ids), [plan]);
  const completed = results.filter((item) =>
    plannedIds.has(item.registration_id),
  ).length;
  const returnPath = `/activity/${activityId}/certificates`;
  return (
    <main className={styles.page}>
      <Card>
        <div className={styles.header}>
          <div>
            <Link to={`/activity/${activityId}`}>
              <ArrowLeftOutlined /> Kembali ke kegiatan
            </Link>
            <Typography.Title
              ref={headingRef}
              tabIndex={-1}
              level={1}
              style={{ fontSize: 24, margin: "8px 0" }}
            >
              Sertifikat kegiatan
            </Typography.Title>
            <Typography.Text type="secondary">
              {recipients?.activity.name}
            </Typography.Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            aria-label="Muat ulang sertifikat"
            disabled={running}
            onClick={() => setRefresh((value) => value + 1)}
          />
        </div>
      </Card>
      <Card className={styles.body}>
        <Steps
          current={step}
          items={[
            { title: "Template" },
            { title: "Penerima" },
            { title: "Tinjau & Terbitkan" },
          ]}
        />
        {error && (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            title={error}
          />
        )}
        {step === 0 && (
          <div className={`${styles.templateGrid} ${styles.body}`}>
            <div className={styles.stack}>
              <div className={styles.actions}>
                <Typography.Title level={2} style={{ fontSize: 18, margin: 0 }}>
                  Pilih desain
                </Typography.Title>
                {canManage && (
                  <Link
                    to={`/digital-certificate?create=1&returnTo=${encodeURIComponent(returnPath)}`}
                  >
                    <Button icon={<PlusOutlined />}>Buat desain</Button>
                  </Link>
                )}
              </div>
              <Input.Search
                allowClear
                aria-label="Cari template"
                placeholder="Cari template yang dipublikasikan"
                value={templateSearchInput}
                onChange={(event) => setTemplateSearchInput(event.target.value)}
              />
              {templateError && (
                <Alert
                  type="error"
                  title={templateError}
                  action={
                    <Button onClick={() => setRefresh((value) => value + 1)}>
                      Coba lagi
                    </Button>
                  }
                />
              )}
              <Radio.Group
                aria-label="Template sertifikat"
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                <List
                  loading={templatesLoading}
                  dataSource={templates}
                  locale={{
                    emptyText:
                      "Belum ada desain yang dipublikasikan. Buat desain untuk memulai.",
                  }}
                  renderItem={(item) => (
                    <List.Item>
                      <Radio
                        value={item.id}
                        disabled={!canManage || !item.readiness?.ready}
                      >
                        {item.name}
                      </Radio>
                    </List.Item>
                  )}
                />
              </Radio.Group>
              <Pagination
                size="small"
                current={templatePage}
                total={templateTotal}
                pageSize={12}
                showSizeChanger={false}
                onChange={setTemplatePage}
              />
              {!canManage && (
                <Typography.Text type="secondary">
                  Anda dapat memakai desain yang dipilih admin. Perubahan desain
                  memerlukan akses pengelolaan template.
                </Typography.Text>
              )}
              {canManage && recipients?.template && (
                <Button
                  type="link"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await assignCertificateTemplate(activityId, null);
                      setSelectedTemplateId(null);
                      setRefresh((value) => value + 1);
                    } catch {
                      setError("Template tidak dapat dilepas.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Lepaskan template kegiatan
                </Button>
              )}
            </div>
            <Card
              loading={templateLoading}
              title={template?.name || "Pratinjau desain"}
            >
              {template ? (
                <>
                  <CertificateArtwork
                    template={template.template_data}
                    backgroundImage={template.background_image}
                    resolveText={resolveCertificateSampleText}
                    verificationUrl={getCertificateVerificationUrl(
                      CERTIFICATE_SAMPLE_CODE,
                    )}
                  />
                  {!ready && (
                    <Alert
                      type="warning"
                      title="Desain ini belum siap digunakan. Publikasikan desain yang siap terlebih dahulu."
                    />
                  )}
                </>
              ) : (
                <Typography.Text type="secondary">
                  Pilih desain untuk melihat contoh sertifikat.
                </Typography.Text>
              )}
            </Card>
          </div>
        )}
        {step === 1 && (
          <div className={`${styles.stack} ${styles.body}`}>
            <Radio.Group
              value={selection}
              onChange={(event) => setSelection(event.target.value)}
              options={[
                {
                  label: `Semua peserta yang memenuhi syarat (${recipients?.counts.eligible_not_issued ?? 0})`,
                  value: "all",
                },
                { label: "Pilih peserta tertentu", value: "selected" },
              ]}
            />
            <Typography.Text type="secondary">
              Hanya peserta LULUS KEGIATAN yang belum pernah mendapat
              sertifikat. Pilihan semua peserta mencakup seluruh kegiatan,
              termasuk halaman lain.
            </Typography.Text>
            <Input.Search
              allowClear
              aria-label="Cari peserta sertifikat"
              placeholder="Cari nama peserta"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Typography.Text>{count} peserta dipilih</Typography.Text>
            <Table
              listId="pages/Activity/ActivityCertificates/index:1"
              rowKey="registration_id"
              columns={columns}
              dataSource={recipients?.data}
              loading={loading && !recipients}
              scroll={{ x: 770 }}
              rowSelection={
                selection === "selected"
                  ? {
                      selectedRowKeys: selectedIds,
                      preserveSelectedRowKeys: true,
                      onChange: (keys) => setSelectedIds(keys.map(Number)),
                      getCheckboxProps: (row) => ({
                        disabled: row.state !== "eligible_not_issued",
                        "aria-label": `Pilih ${row.name}`,
                      }),
                    }
                  : undefined
              }
              pagination={{
                current: page,
                pageSize: 50,
                total: recipients?.meta.total,
                showSizeChanger: false,
              }}
              onChange={(pagination, _filters, sorter, extra) => {
                if (extra.action === "sort" && !Array.isArray(sorter)) {
                  setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
                }
                setPage(extra.action === "sort" ? 1 : pagination.current || 1);
              }}
            />
          </div>
        )}
        {step === 2 && plan && (
          <div className={`${styles.stack} ${styles.body}`}>
            <Typography.Title level={2} style={{ fontSize: 20, margin: 0 }}>
              {hasRun
                ? "Hasil penerbitan"
                : `${plan.registration_ids.length} sertifikat siap diterbitkan`}
            </Typography.Title>
            <Typography.Text type="secondary">
              {plan.excluded.already_issued} sudah terbit ·{" "}
              {plan.excluded.revoked} dicabut ·{" "}
              {plan.excluded.not_eligible + plan.excluded.missing} tidak
              memenuhi syarat. Data dan desain akan disimpan sebagai sertifikat
              resmi.
            </Typography.Text>
            {plan.preview && !hasRun && (
              <CertificateArtwork
                template={plan.preview.template.template_data}
                backgroundImage={plan.preview.template.background_image}
                resolveText={(element) =>
                  resolveCertificateText(
                    element,
                    plan.preview!.participant,
                    CERTIFICATE_SAMPLE_CODE,
                  )
                }
                verificationUrl={getCertificateVerificationUrl(
                  CERTIFICATE_SAMPLE_CODE,
                )}
              />
            )}
            {requiresApproval && !hasRun && canIssue && (
              <ApprovalRequestForm
                plan={plan}
                onSubmitted={() => {
                  message.success(
                    "Permintaan tersimpan. Menunggu persetujuan penandatangan.",
                  );
                  setStep(1);
                  setRefresh((value) => value + 1);
                }}
              />
            )}
            {hasRun && (
              <>
                <Typography.Text>
                  {Object.entries(RESULT_LABELS)
                    .map(
                      ([state, label]) =>
                        `${results.filter((item) => item.state === state).length} ${label.toLowerCase()}`,
                    )
                    .join(" · ")}
                </Typography.Text>
                <Progress
                  percent={Math.round(
                    (completed / Math.max(1, plan.registration_ids.length)) *
                      100,
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
                <span role="status">
                  {running
                    ? `${completed} dari ${plan.registration_ids.length} peserta diproses. Tetap buka halaman ini.`
                    : runMessage}
                </span>
                <Table
                  listId="pages/Activity/ActivityCertificates/index:2"
                  rowKey="registration_id"
                  dataSource={results}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: 560 }}
                  columns={[
                    { title: "Nama peserta", dataIndex: "name" },
                    {
                      title: "Hasil",
                      dataIndex: "state",
                      render: (state: IssuanceResult["state"]) =>
                        RESULT_LABELS[state],
                    },
                    {
                      title: "Keterangan",
                      render: (_, item: IssuanceResult) =>
                        item.certificate_id ? (
                          <Link
                            to={`/certificate-preview/${item.certificate_id}`}
                          >
                            Lihat sertifikat
                          </Link>
                        ) : item.reason ? (
                          REASONS[item.reason] ||
                          "Silakan periksa status peserta."
                        ) : (
                          "—"
                        ),
                    },
                  ]}
                />
              </>
            )}
            {!plan.registration_ids.length && (
              <Alert
                type="info"
                showIcon
                title="Tidak ada sertifikat baru untuk diterbitkan"
                description="Peserta mungkin sudah menerima sertifikat atau belum memenuhi syarat."
              />
            )}
          </div>
        )}
        <div className={styles.footer}>
          {step > 0 && (
            <Button
              disabled={running || busy}
              onClick={() => {
                setStep(step - 1);
                setHasRun(false);
              }}
            >
              Kembali
            </Button>
          )}
          {step === 0 && (
            <Button
              type="primary"
              disabled={
                !ready ||
                templateLoading ||
                (selectedTemplateId !== recipients?.template?.id && !canManage)
              }
              loading={busy}
              onClick={saveTemplate}
            >
              Lanjut ke penerima
            </Button>
          )}
          {step === 1 && (
            <Button
              type="primary"
              disabled={!canIssue || !count}
              loading={busy}
              onClick={() => review()}
            >
              Tinjau {count} sertifikat
            </Button>
          )}
          {step === 2 && !hasRun && !requiresApproval && (
            <Button
              type="primary"
              disabled={
                !canIssue || !plan?.registration_ids.length || reviewRequired
              }
              loading={running}
              onClick={issue}
            >
              Terbitkan {plan?.registration_ids.length} sertifikat
            </Button>
          )}
          {step === 2 && !hasRun && reviewRequired && (
            <Button
              loading={busy}
              onClick={() => review(plan?.registration_ids)}
            >
              Tinjau ulang setelah kembali
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
          {step === 2 && hasRun && !running && retryIds.length > 0 && (
            <Button
              type="primary"
              loading={busy}
              onClick={() => review(retryIds, true)}
            >
              Tinjau {retryIds.length} peserta tersisa / gagal
            </Button>
          )}
        </div>
      </Card>
      <CertificateApprovals
        activityId={activityId}
        refreshKey={refresh}
        onChanged={() => setRefresh((value) => value + 1)}
      />
    </main>
  );
}
