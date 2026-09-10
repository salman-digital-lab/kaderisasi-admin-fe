import { ResponsiveDialog as Modal } from "../../../components/common/Responsive/ResponsiveDialog";
import { Alert, Button, Input, Space, Typography, message } from "antd";
import { useEffect, useRef, useState } from "react";
import type { CertificateElement, CertificateTemplate } from "../types";
import {
  CERTIFICATE_SAMPLE_CODE,
  CERTIFICATE_SAMPLE_PARTICIPANT,
  getCertificateVerificationUrl,
  resolveCertificateText,
} from "../utils/certificate-content";
import { CertificateArtwork } from "./CertificateArtwork";

export default function CertificatePreviewModal({
  template,
  backgroundImage,
  onClose,
}: {
  template: CertificateTemplate;
  backgroundImage?: string | null;
  onClose: () => void;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(CERTIFICATE_SAMPLE_PARTICIPANT.name);
  const [stage, setStage] = useState("");
  const downloading = useRef(false);
  const [overflow, setOverflow] = useState<string[]>([]);
  const resolveText = (element: CertificateElement): string =>
    resolveCertificateText(
      element,
      { ...CERTIFICATE_SAMPLE_PARTICIPANT, name },
      CERTIFICATE_SAMPLE_CODE,
    );
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const overflowing: string[] = [];
      ref.current
        ?.querySelectorAll<HTMLElement>("[data-certificate-text-element]")
        .forEach((node) => {
          const inner = node.firstElementChild;
          if (!inner) return;
          const range = document.createRange();
          range.selectNodeContents(inner);
          const textRect = range.getBoundingClientRect();
          const box = inner.getBoundingClientRect();
          if (
            textRect.height > box.height + 1 ||
            textRect.width > box.width + 1
          )
            overflowing.push(
              template.elements.find(
                (element) => element.id === node.dataset.certificateElementId,
              )?.name || "Teks",
            );
        });
      setOverflow(overflowing);
    });
    return () => cancelAnimationFrame(frame);
  }, [template, name]);
  async function download(): Promise<void> {
    if (!ref.current || downloading.current) return;
    downloading.current = true;
    setStage("Menyiapkan PDF…");
    try {
      const { saveCertificatePdf } = await import("../utils/certificatePdf");
      await saveCertificatePdf({
        template,
        sourceElement: ref.current,
        resolveText,
        filename: "pratinjau-sertifikat.pdf",
        onProgress: setStage,
      });
    } catch {
      message.error("PDF gagal dibuat. Periksa gambar dan coba lagi.");
    } finally {
      downloading.current = false;
      setStage("");
    }
  }
  return (
    <Modal
      open
      width={1000}
      title="Pratinjau desain"
      onCancel={onClose}
      footer={
        <Button type="primary" loading={Boolean(stage)} onClick={download}>
          {stage || "Unduh contoh PDF"}
        </Button>
      }
    >
      <Space orientation="vertical" style={{ width: "100%" }} size="middle">
        <Typography.Text type="secondary">
          Contoh tampilan. Sertifikat resmi diterbitkan dari kegiatan.
        </Typography.Text>
        <Input
          aria-label="Nama contoh peserta"
          value={name}
          onChange={(event) => setName(event.target.value)}
          suffix={
            <Button
              type="link"
              onClick={() =>
                setName("Muhammad Abdurrahman Pratama Wiranegara Putra")
              }
            >
              Coba nama panjang
            </Button>
          }
        />
        {overflow.length > 0 && (
          <Alert
            type="warning"
            showIcon
            title="Teks melebihi ruang yang tersedia"
            description={`${overflow.join(", ")}. Perbesar kotak teks atau kecilkan ukuran huruf di editor.`}
          />
        )}
        <CertificateArtwork
          ref={ref}
          template={template}
          backgroundImage={backgroundImage}
          resolveText={resolveText}
          verificationUrl={getCertificateVerificationUrl(
            CERTIFICATE_SAMPLE_CODE,
          )}
        />
        <span role="status">{stage}</span>
      </Space>
    </Modal>
  );
}
