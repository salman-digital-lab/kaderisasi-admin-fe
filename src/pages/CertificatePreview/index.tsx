import { useEffect, useRef, useState } from "react";
import { Card, Spin, Button, message } from "antd";
import { DownloadOutlined, LeftOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { CertificateElement } from "../DigitalCertificate/types";

interface CertificateData {
  activity: {
    id: number;
    name: string;
    activity_start: string;
  };
  template: {
    id: number;
    name: string;
    background_image: string | null;
    template_data: {
      backgroundUrl: string | null;
      elements: CertificateElement[];
      canvasWidth: number;
      canvasHeight: number;
    };
  };
  participant: {
    registration_id: number;
    user_id: number;
    name: string;
    email: string;
    university: string;
    activity_name: string;
    activity_date: string;
  };
  certificate?: {
    id: number;
    certificate_code: string;
    registration_id: number;
    activity_id: number;
    template_id: number;
    issued_at: string;
    revoked_at: string | null;
    revoked_reason: string | null;
  };
}

const PLACEHOLDER_LABELS: Record<string, string> = {
  image: "Gambar",
  "qr-code": "QR Code",
  signature: "Tanda Tangan",
};

const VariableTextContent: React.FC<{
  variable: string;
  style: React.CSSProperties;
}> = ({ variable, style }) => <div style={style}>{variable}</div>;

const ImageContent: React.FC<{
  imageUrl?: string;
  alt: string;
  placeholderLabel: string;
}> = ({ imageUrl, alt, placeholderLabel }) =>
  imageUrl ? (
    <img
      src={imageUrl}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
      draggable={false}
    />
  ) : (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        border: "1px dashed #d9d9d9",
        borderRadius: 4,
        fontSize: 12,
        color: "#999",
      }}
    >
      {placeholderLabel}
    </div>
  );

const CertificateElementComponent: React.FC<{
  element: CertificateElement;
  participantData: CertificateData["participant"];
  certificateData?: CertificateData["certificate"];
}> = ({ element, participantData, certificateData }) => {
  const textStyle: React.CSSProperties = {
    fontSize: element.fontSize || 16,
    fontFamily: element.fontFamily || "sans-serif",
    color: element.color || "#000000",
    textAlign: element.textAlign || "center",
    margin: 0,
    wordBreak: "break-word",
  };

  const renderContent = () => {
    switch (element.type) {
      case "static-text":
        return <div style={textStyle}>{element.content || ""}</div>;
      case "variable-text": {
        let text = "";
        // Handle both {{variable}} and variable formats
        const varValue = element.variable?.replace(/{{|}}/g, "").trim() || "";

        switch (varValue) {
          case "name":
            text = participantData.name;
            break;
          case "email":
            text = participantData.email;
            break;
          case "university":
            text = participantData.university;
            break;
          case "activity_name":
            text = participantData.activity_name;
            break;
          case "activity_date":
          case "date":
            text = participantData.activity_date;
            break;
          case "registration_id":
            text = String(participantData.registration_id);
            break;
          case "user_id":
            text = String(participantData.user_id);
            break;
          case "certificate_id":
          case "certificate_code":
            text = certificateData?.certificate_code || "";
            break;
          default:
            text = element.content || "";
        }
        return <VariableTextContent variable={text} style={textStyle} />;
      }
      case "image":
      case "qr-code":
      case "signature":
        return (
          <ImageContent
            imageUrl={element.imageUrl}
            alt={element.type}
            placeholderLabel={PLACEHOLDER_LABELS[element.type] || element.type}
          />
        );
      default:
        return null;
    }
  };

  const isTextType =
    element.type === "static-text" || element.type === "variable-text";

  return (
    <div
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        ...(isTextType
          ? { minHeight: element.height }
          : { height: element.height }),
        cursor: "default",
        borderRadius: 4,
        padding: 4,
        boxSizing: "border-box",
      }}
    >
      {renderContent()}
    </div>
  );
};

const CertificatePreview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [data, setData] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCertificate = () => {
      try {
        const stored = sessionStorage.getItem("certificatePreview");
        if (stored) {
          const parsed = JSON.parse(stored) as CertificateData;
          setData(parsed);
        } else {
          setError("Data sertifikat tidak ditemukan");
        }
      } catch {
        setError("Gagal memuat data sertifikat");
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, []);

  const handleDownload = async () => {
    if (!data || !certificateRef.current) return;

    setDownloading(true);
    try {
      const renderedCanvas = await html2canvas(certificateRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const { template_data } = data.template;
      const pdf = new jsPDF({
        orientation:
          template_data.canvasWidth > template_data.canvasHeight
            ? "landscape"
            : "portrait",
        unit: "px",
        format: [template_data.canvasWidth, template_data.canvasHeight],
        hotfixes: ["px_scaling"],
      });

      pdf.addImage(
        renderedCanvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        0,
        template_data.canvasWidth,
        template_data.canvasHeight,
        undefined,
        "FAST",
      );

      pdf.save(`sertifikat-${data.participant.name.replace(/\s+/g, "-")}.pdf`);
    } catch {
      message.error("Gagal mengunduh sertifikat");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Card>
          <p>{error || "Terjadi kesalahan"}</p>
          <Button icon={<LeftOutlined />} onClick={() => window.close()}>
            Tutup
          </Button>
        </Card>
      </div>
    );
  }

  const { template, participant } = data;
  const { template_data, background_image } = template;

  if (!template_data || !template_data.elements) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Card>
          <p>Template sertifikat tidak tersedia</p>
          <Button icon={<LeftOutlined />} onClick={() => window.close()}>
            Tutup
          </Button>
        </Card>
      </div>
    );
  }

  // Get full URL for background image
  const backgroundImageUrl = background_image
    ? `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL || ""}/${background_image}`
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e8e8e8",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: 900,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{participant.name}</h2>
          <p style={{ margin: "4px 0 0", color: "#666" }}>
            {data.activity.name} - {participant.activity_date}
          </p>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={downloading}
        >
          Unduh PDF
        </Button>
      </div>

      {/* Certificate */}
      <div
        ref={certificateRef}
        style={{
          position: "relative",
          width: template_data.canvasWidth,
          height: template_data.canvasHeight,
          backgroundColor: "#ffffff",
          backgroundImage: backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
        }}
      >
        {template_data.elements.map((element) => (
          <CertificateElementComponent
            key={element.id}
            element={element}
            participantData={participant}
            certificateData={data.certificate}
          />
        ))}
      </div>
    </div>
  );
};

export default CertificatePreview;
