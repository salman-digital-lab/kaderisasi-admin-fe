import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  QRCode,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, LeftOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { getIssuedCertificate } from "../../api/services/certificateTemplate";
import type { CertificatePayload } from "../../types/services/certificateTemplate";
import type { CertificateElement } from "../DigitalCertificate/types";
import {
  getCertificateAssetUrl,
  getCertificateVerificationUrl,
  resolveCertificateText,
} from "../DigitalCertificate/utils/certificate-content";
import { saveCertificatePdf } from "../DigitalCertificate/utils/certificatePdf";

const { Text, Title } = Typography;

const getJustifyContent = (
  align?: CertificateElement["textAlign"],
): React.CSSProperties["justifyContent"] => {
  if (align === "left") return "flex-start";
  if (align === "right") return "flex-end";
  return "center";
};

const getAlignItems = (
  align?: CertificateElement["verticalAlign"],
): React.CSSProperties["alignItems"] => {
  if (align === "top") return "flex-start";
  if (align === "bottom") return "flex-end";
  return "center";
};

const CertificateElementView: React.FC<{
  element: CertificateElement;
  data: CertificatePayload;
  verificationUrl: string | null;
}> = ({ element, data, verificationUrl }) => {
  if (element.visible === false) return null;

  const isText =
    element.type === "static-text" || element.type === "variable-text";
  const textStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: getAlignItems(element.verticalAlign),
    justifyContent: getJustifyContent(element.textAlign),
    fontSize: element.fontSize || 16,
    fontFamily: element.fontFamily || "sans-serif",
    fontWeight: element.fontWeight || "normal",
    fontStyle: element.fontStyle || "normal",
    textDecoration: element.textDecoration || "none",
    lineHeight: element.lineHeight || 1.2,
    letterSpacing: element.letterSpacing || 0,
    color: element.color || "#000000",
    textAlign: element.textAlign || "center",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  };

  const renderContent = (): React.ReactNode => {
    if (isText) {
      return (
        <div style={textStyle}>
          {resolveCertificateText(
            element,
            data.participant,
            data.certificate?.certificate_code,
          )}
        </div>
      );
    }

    if (element.type === "qr-code") {
      return verificationUrl ? (
        <QRCode
          type="svg"
          bordered={false}
          value={verificationUrl}
          size={Math.max(24, Math.min(element.width, element.height) - 8)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div style={{ fontSize: 12, color: "#cf1322", textAlign: "center" }}>
          URL verifikasi belum dikonfigurasi
        </div>
      );
    }

    const imageUrl = getCertificateAssetUrl(element.imageUrl);
    return imageUrl ? (
      <img
        src={imageUrl}
        alt={element.type === "signature" ? "Tanda tangan" : "Aset sertifikat"}
        crossOrigin="anonymous"
        style={{
          width: "100%",
          height: "100%",
          objectFit: element.objectFit || "contain",
          borderRadius: element.borderRadius || 0,
        }}
      />
    ) : null;
  };

  return (
    <div
      data-certificate-text-element={isText ? "true" : undefined}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        ...(isText
          ? { minHeight: element.height }
          : { height: element.height }),
        padding: 4,
        boxSizing: "border-box",
        opacity: (element.opacity ?? 100) / 100,
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: "center center",
        overflow: "hidden",
      }}
    >
      {renderContent()}
    </div>
  );
};

const CertificatePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const certificateId = Number(id);
  const [data, setData] = useState<CertificatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [scale, setScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !templateData) return;

    const updateScale = (): void => {
      setScale(Math.min(1, viewport.clientWidth / templateData.canvasWidth));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [templateData]);

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
      !data ||
      !templateData ||
      !certificateRef.current ||
      (hasVerificationQr && !verificationUrl) ||
      revoked
    ) {
      return;
    }

    setDownloading(true);
    const source = certificateRef.current.cloneNode(true) as HTMLDivElement;
    source.style.transform = "none";
    source.style.position = "fixed";
    source.style.left = "-99999px";
    source.style.top = "0";
    document.body.appendChild(source);

    try {
      const participantName =
        data.participant.guest_name || data.participant.name;
      const safeName = participantName
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      await saveCertificatePdf({
        template: templateData,
        sourceElement: source,
        filename: `sertifikat-${safeName || data.certificate?.certificate_code || "peserta"}.pdf`,
        resolveText: (element) =>
          resolveCertificateText(
            element,
            data.participant,
            data.certificate?.certificate_code,
          ),
      });
    } catch {
      message.error("PDF sertifikat tidak dapat diunduh.");
    } finally {
      document.body.removeChild(source);
      setDownloading(false);
    }
  }, [data, hasVerificationQr, revoked, templateData, verificationUrl]);

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
            onClick={() => window.close()}
          >
            Tutup
          </Button>,
        ]}
      />
    );
  }

  const participantName = data.participant.guest_name || data.participant.name;
  const backgroundUrl =
    getCertificateAssetUrl(data.template.background_image) ||
    getCertificateAssetUrl(templateData.backgroundUrl);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "clamp(12px, 3vw, 24px)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 960, margin: "0 auto" }}>
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
              <div>
                <Title level={1} style={{ margin: 0, fontSize: 28 }}>
                  {participantName}
                </Title>
                <Text type="secondary">
                  {data.activity.name} · {data.participant.activity_date}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={revoked ? "red" : "green"}>
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
                title="URL verifikasi publik belum dikonfigurasi"
                description="Tetapkan VITE_PUBLIC_WEB_URL sebelum menampilkan QR atau mengunduh PDF."
              />
            )}
          </Space>
        </Card>

        <div
          ref={viewportRef}
          style={{ width: "100%", overflow: "hidden" }}
          aria-label="Preview visual sertifikat"
        >
          <div
            style={{
              position: "relative",
              width: templateData.canvasWidth * scale,
              height: templateData.canvasHeight * scale,
              margin: "0 auto",
            }}
          >
            <div
              ref={certificateRef}
              data-certificate-canvas="true"
              style={{
                position: "absolute",
                inset: 0,
                width: templateData.canvasWidth,
                height: templateData.canvasHeight,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
                backgroundColor: "#ffffff",
                backgroundImage: backgroundUrl
                  ? `url(${backgroundUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.18)",
                overflow: "hidden",
              }}
            >
              {templateData.elements.map((element) => (
                <CertificateElementView
                  key={element.id}
                  element={element}
                  data={data}
                  verificationUrl={verificationUrl}
                />
              ))}
              {revoked && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(207, 19, 34, 0.28)",
                    fontSize: Math.max(64, templateData.canvasWidth / 8),
                    fontWeight: 800,
                    transform: "rotate(-24deg)",
                    pointerEvents: "none",
                  }}
                >
                  DICABUT
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CertificatePreview;
