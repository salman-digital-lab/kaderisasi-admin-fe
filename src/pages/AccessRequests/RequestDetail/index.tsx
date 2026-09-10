import { useEffect, useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Popconfirm, Skeleton, Typography } from "antd";
import { Link, useParams } from "react-router-dom";
import { cancelMyRequest, getMyRequest } from "../../../api/services/access";
import { refreshSessionProfile } from "../../../api/axios";
import { usePermissions, useRole } from "../../../stores/authStore";
import { actionError } from "../../../utils/action-error";
import TicketDetails from "../components/TicketDetails";
import "../../../styles/guided-workflows.css";

const destinations = [
  ["activities.read", "/activity", "Buka kegiatan"],
  ["clubs.read", "/club", "Buka komunitas"],
  ["members.read", "/member", "Buka anggota"],
  ["counseling.read", "/ruang-curhat", "Buka layanan konseling"],
  ["dashboard.read", "/dashboard", "Buka dasbor"],
];
export default function RequestDetailPage(): ReactElement {
  const { id = "" } = useParams();
  const role = useRole();
  const permissions = usePermissions();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const { data, loading, error, refresh } = useRequest(() => getMyRequest(id), {
    refreshDeps: [id],
    refreshOnWindowFocus: true,
  });
  useEffect(() => {
    if (data?.resolution === "approved")
      void refreshSessionProfile().catch(() =>
        setFailure(
          "Akses terbaru belum berhasil dimuat. Tekan Perbarui status untuk mencoba lagi.",
        ),
      );
    if (data?.status !== "open") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [data?.resolution, data?.status, refresh]);
  const destination = destinations.find(([permission]) =>
    permissions.includes(permission),
  );
  return (
    <main className="guided-page">
      <Link to="/my-requests">← Akses Saya</Link>
      {error && (
        <Alert
          type="error"
          title="Pengajuan belum berhasil dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      )}
      {failure && (
        <Alert
          role="alert"
          type="error"
          title={failure}
          style={{ marginBlock: 16 }}
        />
      )}
      <Skeleton loading={loading && !data}>
        {data && (
          <>
            <div className="guided-intro">
              <Typography.Title level={2}>
                {data.status === "open"
                  ? "Pengajuan terkirim, menunggu tinjauan"
                  : data.resolution === "approved"
                    ? "Pengajuan disetujui"
                    : data.resolution === "rejected"
                      ? "Pengajuan belum disetujui"
                      : "Pengajuan dibatalkan"}
              </Typography.Title>
              <p>
                {data.status === "open"
                  ? "Super Admin akan meninjau kebutuhan akses Anda. Status di halaman ini diperbarui secara berkala."
                  : data.resolution === "approved"
                    ? `Peran aktif Anda saat ini: ${role?.name ?? "sedang diperbarui"}.`
                    : data.resolution === "rejected"
                      ? "Baca alasan penolakan di bawah. Anda dapat memperbaiki alasan dan mengajukan kembali."
                      : "Pengajuan ini tidak akan ditinjau. Anda dapat membuat pengajuan baru jika masih membutuhkan akses."}
              </p>
            </div>
            <div className="guided-actions" style={{ marginBottom: 24 }}>
              {data.resolution === "approved" && destination && (
                <Link to={destination[1]}>
                  <Button type="primary">{destination[2]}</Button>
                </Link>
              )}
              {data.resolution === "rejected" && (
                <Link
                  to="/my-requests/new"
                  state={{
                    role_code: data.requested_role_code,
                    reason: data.reason,
                  }}
                >
                  <Button type="primary">Perbaiki & ajukan kembali</Button>
                </Link>
              )}
              {data.status === "cancelled" && (
                <Link to="/my-requests/new">Buat pengajuan baru</Link>
              )}
              <Button
                loading={loading}
                onClick={() => {
                  setFailure("");
                  refresh();
                  void refreshSessionProfile().catch(() =>
                    setFailure(
                      "Akses terbaru belum berhasil dimuat. Coba lagi.",
                    ),
                  );
                }}
              >
                Perbarui status
              </Button>
            </div>
            <section className="guided-section">
              <TicketDetails ticket={data} />
            </section>
            {data.status === "open" && (
              <Popconfirm
                title="Batalkan pengajuan ini?"
                description="Anda dapat mengajukan kembali nanti."
                okText="Batalkan pengajuan"
                cancelText="Tetap menunggu"
                onConfirm={async () => {
                  setBusy(true);
                  setFailure("");
                  try {
                    await cancelMyRequest(data.id);
                    refresh();
                  } catch (cause) {
                    setFailure(actionError(cause));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Button danger loading={busy}>
                  Batalkan pengajuan
                </Button>
              </Popconfirm>
            )}
          </>
        )}
      </Skeleton>
    </main>
  );
}
