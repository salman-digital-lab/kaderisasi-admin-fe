import { useRef, useState, type ReactElement } from "react";
import { Alert, Button, Modal, QRCode, Typography } from "antd";
import type { ShortLink } from "../../types/model/short-link";
import styles from "./ShortLinks.module.css";

interface Props {
  link: ShortLink;
  onClose: () => void;
}

export default function ShortLinkQRCode({
  link,
  onClose,
}: Props): ReactElement {
  const preview = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const download = (): void => {
    try {
      const source = preview.current?.querySelector("canvas");
      if (!source) throw new Error("QR unavailable");
      const output = document.createElement("canvas");
      output.width = 1024;
      output.height = 1024;
      const context = output.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, 1024, 1024);
      context.imageSmoothingEnabled = false;
      // Keep a white quiet zone in the downloaded image, outside the QR matrix.
      context.drawImage(source, 128, 128, 768, 768);
      const anchor = document.createElement("a");
      anchor.href = output.toDataURL("image/png");
      anchor.download = `short-link-${link.code}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setError(false);
    } catch {
      setError(true);
    }
  };

  return (
    <Modal
      open
      title="Kode QR tautan"
      rootClassName={styles.dialog}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
        <Button key="download" type="primary" onClick={download}>
          Unduh PNG
        </Button>,
      ]}
    >
      <Typography.Paragraph style={{ overflowWrap: "anywhere" }}>
        {link.short_url}
      </Typography.Paragraph>
      <div
        ref={preview}
        style={{
          width: 256,
          maxWidth: "100%",
          margin: "16px auto",
          padding: 32,
          background: "#fff",
        }}
      >
        <QRCode
          value={link.short_url}
          size={192}
          color="#000"
          bgColor="#fff"
          bordered={false}
          style={{ padding: 0, width: "100%", height: "auto" }}
          aria-label={`Kode QR untuk ${link.short_url}`}
        />
      </div>
      <Typography.Paragraph type="secondary" style={{ color: "#595959" }}>
        Pindai untuk membuka tautan pendek. Kode QR tetap sama saat alamat
        tujuan diubah.
      </Typography.Paragraph>
      {error && (
        <Alert
          type="error"
          showIcon
          title="Kode QR belum dapat diunduh. Silakan coba lagi."
        />
      )}
    </Modal>
  );
}
