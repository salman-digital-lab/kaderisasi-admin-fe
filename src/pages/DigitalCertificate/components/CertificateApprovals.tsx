import {
  Alert,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Input,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveTable } from "../../../components/common/Responsive/ResponsiveTable";
import { ResponsiveDialog } from "../../../components/common/Responsive/ResponsiveDialog";
import {
  APPROVAL_ERRORS,
  decideCertificateApprovals,
  getCertificateApproval,
  getCertificateApprovals,
} from "../../../api/services/certificateApproval";
import type {
  ApprovalDetail,
  ApprovalStatus,
  ApprovalSummary,
} from "../../../api/services/certificateApproval";
import { usePermissions, useUser } from "../../../stores/authStore";
import { CertificateArtwork } from "./CertificateArtwork";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateVerificationUrl,
  resolveCertificateText,
} from "../utils/certificate-content";
import { formatRegistrationTime } from "../../../utils/registration-time";
import { CERTIFICATE_APPROVAL_THEME } from "../constants/approval-theme";
import "./certificate-approval.css";

const LABELS: Record<ApprovalStatus, string> = {
  pending: "Menunggu persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

export function CertificateApprovals({
  activityId,
  refreshKey = 0,
  onChanged,
}: {
  activityId?: number;
  refreshKey?: number;
  onChanged?: () => void;
}): React.ReactElement {
  const user = useUser();
  const permissions = usePermissions();
  const canApprove = permissions.includes("certificate.approve");
  const canRequest = permissions.includes("certificate.issue");
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ApprovalSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [review, setReview] = useState<ApprovalDetail[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [consent, setConsent] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const reviewVersion = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSelected([]);
    getCertificateApprovals(
      { activity_id: activityId, page, status },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setRows(data.data);
          setTotal(data.meta.total);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Permintaan persetujuan gagal dimuat. Muat ulang untuk mencoba lagi.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [activityId, page, status, refresh, refreshKey]);
  function closeReview(): void {
    if (busy) return;
    reviewVersion.current += 1;
    setOpen(false);
    setReview([]);
  }
  async function openReview(ids: number[]): Promise<void> {
    const version = ++reviewVersion.current;
    setOpen(true);
    setReview([]);
    setReviewIndex(0);
    setReviewError("");
    setReviewLoading(true);
    setConsent(false);
    setReason("");
    try {
      const data = await Promise.all(ids.map(getCertificateApproval));
      if (version === reviewVersion.current) setReview(data);
    } catch {
      if (version === reviewVersion.current)
        setReviewError(
          "Pratinjau gagal dimuat. Tutup dan coba tinjau kembali.",
        );
    } finally {
      if (version === reviewVersion.current) setReviewLoading(false);
    }
  }
  async function decide(
    action: "approve" | "reject" | "cancel",
  ): Promise<void> {
    if (busy || !review.length) return;
    setBusy(true);
    setReviewError("");
    try {
      const results = await decideCertificateApprovals(
        review,
        action,
        consent,
        reason.trim() || undefined,
      );
      const failures = results.filter((item) => item.status === "failed");
      if (failures.length) {
        setReviewError(
          `${failures.length} permintaan belum diproses. ${[...new Set(failures.map((item) => APPROVAL_ERRORS[item.reason ?? ""] ?? "Gagal diproses. Muat ulang dan coba lagi."))].join(" ")}`,
        );
        setReview((current) =>
          current.filter((item) =>
            failures.some((failed) => failed.id === item.id),
          ),
        );
        setReviewIndex(0);
        setConsent(false);
      } else {
        setOpen(false);
        setReview([]);
        setNotice(
          `${results.length} permintaan ${action === "approve" ? "disetujui dan sertifikat diterbitkan" : action === "reject" ? "ditolak" : "dibatalkan"}.`,
        );
      }
      setRefresh((value) => value + 1);
      onChanged?.();
    } catch {
      setReviewError(
        "Hasil belum dapat dikonfirmasi. Muat ulang daftar sebelum mencoba kembali.",
      );
    } finally {
      setBusy(false);
    }
  }
  const current = review[reviewIndex];
  const canDecide =
    review.length > 0 &&
    review.every(
      (item) => item.status === "pending" && item.signer_id === user?.id,
    ) &&
    canApprove;
  const canCancel =
    review.length > 0 &&
    review.every(
      (item) => item.status === "pending" && item.requested_by === user?.id,
    ) &&
    canRequest;
  return (
    <ConfigProvider theme={CERTIFICATE_APPROVAL_THEME}>
      <Card
        className="certificate-approval"
        title="Persetujuan sertifikat"
        style={{ marginTop: 16 }}
      >
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Permintaan yang ditujukan kepada Anda atau diajukan oleh Anda.
            Sertifikat menunggu persetujuan belum diterbitkan.
          </Typography.Text>
          <Space wrap>
            <Select
              aria-label="Status persetujuan"
              value={status}
              style={{ width: 230 }}
              options={Object.entries(LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
            <Button
              disabled={loading || busy}
              onClick={() => setRefresh((value) => value + 1)}
            >
              Muat ulang
            </Button>
            {canApprove && (
              <Button
                type="primary"
                disabled={!selected.length || loading}
                onClick={() => void openReview(selected)}
              >
                Tinjau {selected.length} permintaan
              </Button>
            )}
          </Space>
          {error && <Alert type="error" title={error} showIcon />}
          {notice && <Alert type="success" title={notice} showIcon closable />}
          <ResponsiveTable<ApprovalSummary>
            listId={`certificate-approvals-${activityId ?? "all"}`}
            rowKey="id"
            loading={loading}
            dataSource={error ? [] : rows}
            locale={{
              emptyText: (
                <Typography.Text type="secondary">
                  Tidak ada permintaan persetujuan pada status ini.
                </Typography.Text>
              ),
            }}
            rowSelection={
              canApprove && status === "pending"
                ? {
                    selectedRowKeys: selected,
                    onChange: (keys) => setSelected(keys.map(Number)),
                    getCheckboxProps: (item) => ({
                      disabled: item.signer_id !== user?.id,
                      "aria-label": `Pilih permintaan ${item.participant_name}`,
                    }),
                  }
                : undefined
            }
            pagination={{
              current: page,
              pageSize: 20,
              total,
              showSizeChanger: false,
              onChange: setPage,
            }}
            scroll={{ x: 760 }}
            columns={[
              { title: "Peserta", dataIndex: "participant_name" },
              { title: "Kegiatan", dataIndex: "activity_name" },
              { title: "Penandatangan", dataIndex: "signer_name" },
              {
                title: "Status",
                dataIndex: "status",
                render: (value: ApprovalStatus) => <Tag>{LABELS[value]}</Tag>,
              },
              {
                title: "Tindakan",
                render: (_, item) => (
                  <Space wrap>
                    <Button onClick={() => void openReview([item.id])}>
                      Tinjau
                    </Button>
                    {item.certificate_id && (
                      <Link to={`/certificate-preview/${item.certificate_id}`}>
                        Lihat sertifikat
                      </Link>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Space>
        <ResponsiveDialog
          className="certificate-approval"
          open={open}
          title="Tinjau persetujuan sertifikat"
          width={920}
          onCancel={closeReview}
          closable={!busy}
          maskClosable={!busy}
          keyboard={!busy}
          footer={
            <Space wrap>
              <Button disabled={busy} onClick={closeReview}>
                Tutup
              </Button>
              {canCancel && (
                <Button
                  danger
                  disabled={busy}
                  onClick={() => void decide("cancel")}
                >
                  Batalkan permintaan
                </Button>
              )}
              {canDecide && (
                <Button
                  danger
                  disabled={busy || !reason.trim()}
                  onClick={() => void decide("reject")}
                >
                  Tolak {review.length} permintaan
                </Button>
              )}
              {canDecide && (
                <Button
                  type="primary"
                  loading={busy}
                  disabled={!consent}
                  onClick={() => void decide("approve")}
                >
                  Setujui & terbitkan {review.length} sertifikat
                </Button>
              )}
            </Space>
          }
        >
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            {reviewLoading && (
              <Typography.Text role="status">
                Memuat isi sertifikat…
              </Typography.Text>
            )}
            {reviewError && <Alert type="error" showIcon title={reviewError} />}
            {current && (
              <>
                <Select
                  aria-label="Sertifikat yang ditinjau"
                  value={reviewIndex}
                  style={{ width: "100%" }}
                  options={review.map((item, index) => ({
                    value: index,
                    label: `${index + 1}. ${item.snapshot.participant.name} · ${item.snapshot.activity.name}`,
                  }))}
                  onChange={setReviewIndex}
                />
                <Typography.Paragraph>
                  Penandatangan: <strong>{current.signer_name}</strong>
                  <br />
                  Jabatan: {current.signer_title}
                  <br />
                  Diajukan: {formatRegistrationTime(current.created_at)}
                </Typography.Paragraph>
                <Tag>{LABELS[current.status]}</Tag>
                {current.reason && <Alert type="info" title={current.reason} />}
                <CertificateArtwork
                  template={current.snapshot.template.template_data}
                  backgroundImage={current.snapshot.template.background_image}
                  resolveText={(element) =>
                    element.variable === "{{approval}}"
                      ? `${current.status === "approved" ? "Disetujui secara elektronik oleh" : LABELS[current.status]}\n${current.signer_name}\n${current.signer_title}\n${current.decided_at ? formatRegistrationTime(current.decided_at) : "[Tanggal setelah disetujui]"}`
                      : resolveCertificateText(
                          element,
                          current.snapshot.participant,
                        )
                  }
                  verificationUrl={getCertificateVerificationUrl(
                    CERTIFICATE_SAMPLE_CODE,
                  )}
                />
                <Typography.Text type="secondary">
                  Pratinjau permintaan. Kode dan waktu penerbitan ditetapkan
                  setelah persetujuan.
                </Typography.Text>
                {(canDecide || canCancel) && (
                  <div>
                    <label htmlFor="certificate-approval-reason">
                      Catatan (wajib untuk penolakan)
                    </label>
                    <Input.TextArea
                      id="certificate-approval-reason"
                      value={reason}
                      maxLength={500}
                      onChange={(event) => setReason(event.target.value)}
                      disabled={busy}
                    />
                  </div>
                )}
                {canDecide && (
                  <Checkbox
                    checked={consent}
                    disabled={busy}
                    onChange={(event) => setConsent(event.target.checked)}
                  >
                    Saya telah meninjau isi dan daftar {review.length} penerima
                    di atas, menyetujui jabatan yang dicantumkan, dan menyetujui
                    penerbitan sertifikat ini atas nama saya.
                  </Checkbox>
                )}
              </>
            )}
          </Space>
        </ResponsiveDialog>
      </Card>
    </ConfigProvider>
  );
}
