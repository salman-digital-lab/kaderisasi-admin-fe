import { useEffect, useRef, useState, type ReactElement } from "react";
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
import { isAxiosError } from "axios";
import type { InputRef } from "antd";

interface Props {
  path: string | null;
  published: boolean;
  allowCustomCode?: boolean;
}

export default function DetailShortLink({
  path,
  published,
  allowCustomCode = false,
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
          allowCustomCode={allowCustomCode}
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
  allowCustomCode,
}: {
  destination: string;
  published: boolean;
  canManage: boolean;
  allowCustomCode: boolean;
}): ReactElement {
  const [qr, setQR] = useState<ShortLink | null>(null);
  const linkInput = useRef<InputRef>(null);
  const openedQR = useRef(false);
  useEffect(() => {
    if (qr) openedQR.current = true;
    else if (openedQR.current) {
      const frame = requestAnimationFrame(() => linkInput.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [qr]);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");
  const [code, setCode] = useState("");
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
    setFailure("");
    try {
      const existing = await findDetailShortLink(destination);
      const saved =
        existing ??
        (await createShortLink({
          original_url: destination,
          ...(allowCustomCode && code.trim() ? { code: code.trim() } : {}),
        }));
      mutate(saved);
      setQR(saved);
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data.message
        : undefined;
      setFailure(
        message === "SHORT_CODE_TAKEN"
          ? "Kode sudah digunakan. Pilih kode lain."
          : message === "INVALID_SHORT_CODE"
            ? "Gunakan 3–10 huruf, angka, tanda hubung, atau garis bawah. Kode health tidak tersedia."
            : message === "INVALID_DESTINATION_URL"
              ? "Alamat tujuan tidak diizinkan. Pastikan alamat situs publik menggunakan HTTP/HTTPS dan nama domainnya berbeda dari layanan tautan pendek."
              : "Tautan belum berhasil dibuat. Periksa koneksi dan akses Anda, lalu coba lagi.",
      );
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
            ref={linkInput}
            readOnly
            aria-label="Tautan pendek halaman"
            value={link.short_url}
            onFocus={(event) => event.target.select()}
          />
          <Space wrap>
            <Button onClick={() => void copy()}>Salin tautan</Button>
            <Button onClick={() => setQR(link)}>Kode QR</Button>
            {allowCustomCode && (
              <Button
                href={link.short_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka tautan pendek
              </Button>
            )}
          </Space>
        </>
      ) : (
        <>
          <Typography.Text>
            Belum ada tautan pendek untuk halaman ini.
          </Typography.Text>
          {canManage && (
            <>
              {allowCustomCode && (
                <label>
                  Kode khusus (opsional)
                  <Input
                    aria-label="Kode khusus"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    maxLength={10}
                    placeholder="Kosongkan untuk kode otomatis"
                  />
                  <Typography.Text type="secondary">
                    3–10 huruf, angka, tanda hubung, atau garis bawah.
                  </Typography.Text>
                </label>
              )}
              <Button loading={saving} onClick={() => void generate()}>
                Buat tautan pendek & QR
              </Button>
            </>
          )}
        </>
      )}
      {failure && <Alert type="error" showIcon title={failure} />}
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
