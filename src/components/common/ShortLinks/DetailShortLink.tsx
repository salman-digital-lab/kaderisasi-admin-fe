import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { usePermissions } from "../../../stores/authStore";
import {
  createShortLink,
  findDetailShortLink,
} from "../../../api/services/short-link";
import type { ShortLink } from "../../../types/model/short-link";
import ShortLinkQRCode from "../../../pages/ShortLinks/ShortLinkQRCode";
import { getCertificatePublicBaseUrl } from "../../../pages/DigitalCertificate/utils/certificate-content";

interface Props {
  path: string | null;
  published: boolean;
}

export default function DetailShortLink({
  path,
  published,
}: Props): ReactElement | null {
  const permissions = usePermissions();
  const base = getCertificatePublicBaseUrl();
  const destination = base && path ? `${base}${path}` : null;
  if (!permissions.includes("short_links.read")) return null;
  return (
    <Card title="Tautan Pendek & QR">
      {destination ? (
        <DetailShortLinkContent
          key={destination}
          destination={destination}
          published={published}
          canManage={permissions.includes("short_links.manage")}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          title="Alamat halaman publik belum tersedia"
          description="Pastikan alamat situs publik dan alamat halaman sudah dikonfigurasi."
        />
      )}
    </Card>
  );
}

function DetailShortLinkContent({
  destination,
  published,
  canManage,
}: {
  destination: string;
  published: boolean;
  canManage: boolean;
}): ReactElement {
  const [qr, setQR] = useState<ShortLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(
    null,
  );
  const {
    data: link,
    loading,
    error,
    refresh,
    mutate,
  } = useRequest(() => findDetailShortLink(destination));
  const generate = async (): Promise<void> => {
    setSaving(true);
    setFailed(false);
    try {
      const existing = await findDetailShortLink(destination);
      const saved =
        existing ?? (await createShortLink({ original_url: destination }));
      mutate(saved);
      setQR(saved);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };
  const copy = async (): Promise<void> => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.short_url);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };
  return (
    <Space orientation="vertical" size="middle" style={{ display: "flex" }}>
      <Typography.Paragraph style={{ margin: 0, overflowWrap: "anywhere" }}>
        Alamat tujuan: {destination}
      </Typography.Paragraph>
      {!published && (
        <Alert
          type="info"
          showIcon
          title="Halaman belum tayang"
          description="Tautan dan QR dapat disiapkan sekarang. Tayangkan halaman sebelum membagikannya."
        />
      )}
      {error ? (
        <Alert
          type="error"
          showIcon
          title="Tautan pendek tidak dapat dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : loading ? (
        <Typography.Text role="status">Memuat tautan pendek…</Typography.Text>
      ) : link ? (
        <>
          <Input
            readOnly
            aria-label="Tautan pendek halaman"
            value={link.short_url}
            onFocus={(event) => event.target.select()}
          />
          <Space wrap>
            <Button onClick={() => void copy()}>Salin tautan</Button>
            <Button onClick={() => setQR(link)}>Kode QR</Button>
          </Space>
        </>
      ) : (
        <>
          <Typography.Text>
            Belum ada tautan pendek untuk halaman ini.
          </Typography.Text>
          {canManage && (
            <Button loading={saving} onClick={() => void generate()}>
              Buat tautan pendek & QR
            </Button>
          )}
        </>
      )}
      {failed && (
        <Alert
          type="error"
          showIcon
          title="Tautan belum berhasil dibuat. Silakan coba lagi."
        />
      )}
      {copyStatus === "copied" && (
        <Typography.Text role="status">Tautan disalin.</Typography.Text>
      )}
      {copyStatus === "failed" && (
        <Alert
          type="warning"
          showIcon
          title="Tidak dapat menyalin otomatis"
          description="Pilih dan salin alamat tautan pada kolom di atas."
        />
      )}
      {qr && <ShortLinkQRCode link={qr} onClose={() => setQR(null)} />}
    </Space>
  );
}
