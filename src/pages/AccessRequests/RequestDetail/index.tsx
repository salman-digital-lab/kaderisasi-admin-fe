import { useEffect, useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Popconfirm, Skeleton, Typography } from "antd";
import { Link, useParams } from "react-router-dom";
import { cancelMyRequest, getMyRequest } from "../../../api/services/access";
import { refreshSessionProfile } from "../../../api/axios";
import { usePermissions, useRoles } from "../../../stores/authStore";
import RoleTags from "../../../components/common/RoleTags";
import { actionError } from "../../../utils/action-error";
import TicketDetails from "../components/TicketDetails";
import "../../../styles/guided-workflows.css";

const destinations: Record<string, [string, string, string]> = {
  activity_manager: ["activities.read", "/activity", "Buka kegiatan"],
  achievement_manager: ["achievements.read", "/achievement", "Buka prestasi"],
  club_manager: ["clubs.read", "/club", "Buka komunitas"],
  konselor: ["counseling.read", "/ruang-curhat", "Buka layanan konseling"],
  admin: ["activities.read", "/activity", "Buka kegiatan"],
};
export default function RequestDetailPage(): ReactElement {
  const { id = "" } = useParams();
  const roles = useRoles();
  const permissions = usePermissions();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const { data, loading, error, refresh } = useRequest(
    async () => {
      const [ticket] = await Promise.all([
        getMyRequest(id),
        refreshSessionProfile(),
      ]);
      return ticket;
    },
    {
      refreshDeps: [id],
      refreshOnWindowFocus: true,
    },
  );
  useEffect(() => {
    if (data?.status !== "open") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [data?.resolution, data?.status, refresh]);
  const alreadyAssigned = roles.some(
    (role) => role.code === data?.requested_role_code,
  );
  const destination = data ? destinations[data.requested_role_code] : undefined;
  return (
    <main className="guided-page">
      <Link to="/my-requests">← Akses Saya</Link>
      {error && (
        <Alert
          type="error"
          title="Pengajuan atau akses terbaru belum berhasil dimuat"
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
                    ? alreadyAssigned
                      ? `Peran ${data.role_name} sudah tersedia. Hak aksesnya digabungkan dengan peran lain yang Anda miliki.`
                      : "Pengajuan ini pernah disetujui, tetapi perannya tidak ada pada akses Anda saat ini. Hubungi Super Admin jika masih membutuhkannya."
                    : data.resolution === "rejected"
                      ? "Baca alasan penolakan di bawah. Anda dapat memperbaiki alasan dan mengajukan kembali."
                      : "Pengajuan ini tidak akan ditinjau. Anda dapat membuat pengajuan baru jika masih membutuhkan akses."}
              </p>
            </div>
            <section className="guided-section">
              <Typography.Title level={3}>Peran Anda saat ini</Typography.Title>
              <RoleTags roles={roles} />
            </section>
            <div className="guided-actions" style={{ marginBottom: 24 }}>
              {data.resolution === "approved" &&
                alreadyAssigned &&
                destination &&
                permissions.includes(destination[0]) &&
                !error && (
                  <Link to={destination[1]}>
                    <Button type="primary">{destination[2]}</Button>
                  </Link>
                )}
              {data.resolution === "rejected" && !alreadyAssigned && (
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
