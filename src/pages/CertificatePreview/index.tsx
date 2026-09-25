import { DownloadOutlined, LeftOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getIssuedCertificate } from "../../api/services/certificateTemplate";
import type { CertificatePayload } from "../../types/services/certificateTemplate";
import { CertificatePreviewPages } from "../DigitalCertificate/components/CertificatePreviewPages";
import {
  getCertificateVerificationUrl,
  resolveCertificateText,
} from "../DigitalCertificate/utils/certificate-content";
import {
  certificatePdfErrorMessage,
  saveCertificatePdf,
} from "../DigitalCertificate/utils/certificatePdf";
import { CERTIFICATE_APPROVAL_THEME } from "../DigitalCertificate/constants/approval-theme";
import "../DigitalCertificate/components/certificate-approval.css";

const { Text, Title } = Typography;

const CertificatePreview: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const certificateId = Number(id);
  const [data, setData] = useState<CertificatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const certificateRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const downloadingRef = useRef(false);
  const [downloadStage, setDownloadStage] = useState("");
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let active = true;

    const loadCertificate = async (): Promise<void> => {
      if (!Number.isInteger(certificateId) || certificateId <= 0) {
        setError("ID sertifikat tidak valid.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await getIssuedCertificate(certificateId);
        if (active) setData(result);
      } catch {
        if (active) setError("Sertifikat tidak dapat dimuat.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCertificate();
    return () => {
      active = false;
    };
  }, [certificateId, reloadToken]);

  const templateData = data?.template.template_data;
  const verificationUrl = useMemo(
    () => getCertificateVerificationUrl(data?.certificate?.certificate_code),
    [data?.certificate?.certificate_code],
  );
  const revoked = Boolean(data?.certificate?.revoked_at);
  const hasVerificationQr = Boolean(
    templateData?.elements.some(
      (element) => element.visible !== false && element.type === "qr-code",
    ),
  );

  const handleDownload = useCallback(async (): Promise<void> => {
    if (
      downloadingRef.current ||
      !data ||
      !templateData ||
      !certificateRef.current ||
      (hasVerificationQr && !verificationUrl) ||
      revoked
    ) {
      return;
    }

    downloadingRef.current = true;
    setDownloading(true);
    setDownloadError("");
    setDownloadStage("Memeriksa sertifikat…");

    try {
      const authorized = await getIssuedCertificate(certificateId);
      if (authorized.certificate?.revoked_at) {
        setData(authorized);
        return;
      }
      const participantName =
        data.participant.guest_name || data.participant.name;
      const safeName = participantName
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      await saveCertificatePdf({
        template: authorized.template.template_data,
        onProgress: setDownloadStage,
        sourceElement: certificateRef.current,
        scoreSourceElement: scoreRef.current,
        filename: `sertifikat-${safeName || data.certificate?.certificate_code || "peserta"}.pdf`,
        resolveText: (element) =>
          resolveCertificateText(
            element,
            authorized.participant,
            authorized.certificate?.certificate_code,
            authorized.certificate?.approval,
            authorized.activity.certificate_settings,
          ),
      });
    } catch (error) {
      setDownloadError(
        certificatePdfErrorMessage(error) ??
          "PDF belum dapat diunduh. Periksa koneksi, lalu coba lagi.",
      );
    } finally {
      downloadingRef.current = false;
      setDownloading(false);
      setDownloadStage("");
    }
  }, [
    certificateId,
    data,
    hasVerificationQr,
    revoked,
    templateData,
    verificationUrl,
  ]);

  if (loading) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </main>
    );
  }

  if (error || !data || !templateData) {
    return (
      <Result
        status="error"
        title="Preview sertifikat tidak tersedia"
        subTitle={error || "Snapshot template sertifikat tidak ditemukan."}
        extra={[
          <Button
            key="retry"
            type="primary"
            onClick={() => setReloadToken((v) => v + 1)}
          >
            Coba lagi
          </Button>,
          <Button
            key="close"
            icon={<LeftOutlined />}
            onClick={() =>
              navigate(
                data?.activity.id
                  ? `/activity/${data.activity.id}/certificates`
                  : "/activity",
              )
            }
          >
            Kembali
          </Button>,
        ]}
      />
    );
  }

  const participantName = data.participant.guest_name || data.participant.name;

  return (
    <ConfigProvider theme={CERTIFICATE_APPROVAL_THEME}>
      <main
        className="certificate-workflow"
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
          padding: "clamp(12px, 3vw, 24px)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 960, margin: "0 auto" }}>
          <Button
            icon={<LeftOutlined />}
            onClick={() =>
              navigate(`/activity/${data.activity.id}/certificates`)
            }
            style={{ minHeight: 44, marginBottom: 16 }}
          >
            Kembali ke sertifikat kegiatan
          </Button>
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <Title level={1} style={{ margin: 0, fontSize: 28 }}>
                    {participantName}
                  </Title>
                  <Text type="secondary">
                    {data.activity.name} · {data.participant.activity_date}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag
                      color={revoked ? "red" : "green"}
                      style={{ color: revoked ? "#a8071a" : "#237804" }}
                    >
                      {revoked ? "Dicabut" : "Valid"}
                    </Tag>
                    {data.certificate?.certificate_code && (
                      <Text code>{data.certificate.certificate_code}</Text>
                    )}
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  loading={downloading}
                  disabled={(hasVerificationQr && !verificationUrl) || revoked}
                  style={{ minHeight: 44 }}
                >
                  Unduh PDF
                </Button>
              </div>

              <Text>
                {data.participant.scoring_result
                  ? "PDF berisi 2 halaman: sertifikat dan hasil penilaian. Nilai disimpan saat sertifikat diterbitkan."
                  : "PDF berisi 1 halaman. Sertifikat ini diterbitkan tanpa hasil penilaian."}
              </Text>
              <span role="status" aria-live="polite">
                {downloadStage}
              </span>
              {downloadError && (
                <Alert
                  type="error"
                  showIcon
                  title="Unduhan belum berhasil"
                  role="alert"
                  description={
                    <Space direction="vertical">
                      <Text>{downloadError}</Text>
                      <Button
                        onClick={handleDownload}
                        loading={downloading}
                        style={{ minHeight: 44 }}
                      >
                        Coba unduh lagi
                      </Button>
                    </Space>
                  }
                />
              )}

              {revoked && (
                <Alert
                  type="error"
                  showIcon
                  title="Sertifikat ini telah dicabut"
                  description={
                    data.certificate?.revoked_reason ||
                    "Sertifikat tidak lagi berlaku."
                  }
                />
              )}
              {hasVerificationQr && !verificationUrl && (
                <Alert
                  type="error"
                  showIcon
                  title="Tautan verifikasi belum tersedia"
                  description="Hubungi pengelola platform untuk mengaktifkan tautan verifikasi sebelum mengunduh sertifikat."
                />
              )}
            </Space>
          </Card>

          <CertificatePreviewPages
            artworkRef={certificateRef}
            scoreRef={scoreRef}
            participant={data.participant}
            settings={data.activity.certificate_settings}
            approval={data.certificate?.approval}
            certificateCode={data.certificate?.certificate_code}
            template={templateData}
            backgroundImage={data.template.background_image}
            resolveText={(element) =>
              resolveCertificateText(
                element,
                data.participant,
                data.certificate?.certificate_code,
                data.certificate?.approval,
                data.activity.certificate_settings,
              )
            }
            verificationUrl={verificationUrl}
            revoked={revoked}
          />
        </div>
      </main>
    </ConfigProvider>
  );
};

export default CertificatePreview;
