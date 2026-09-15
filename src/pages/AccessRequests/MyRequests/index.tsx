import { useEffect, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Collapse, Skeleton, Typography } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getMyRequests } from "../../../api/services/access";
import { refreshSessionProfile } from "../../../api/axios";
import { useRoles, usePermissions } from "../../../stores/authStore";
import RoleTags from "../../../components/common/RoleTags";
import RoleCapabilitiesTable from "../components/RoleCapabilitiesTable";
import { ResponsiveTable } from "../../../components/common/Responsive/ResponsiveTable";
import TicketStatus from "../components/TicketStatus";
import type { AccessTicket } from "../../../types/model/access";
import "../../../styles/guided-workflows.css";

export default function MyRequestsPage(): ReactElement {
  const roles = useRoles();
  const permissions = usePermissions();
  const {
    data = [],
    loading,
    error,
    refresh,
  } = useRequest(
    async () => {
      const [tickets] = await Promise.all([
        getMyRequests(),
        refreshSessionProfile(),
      ]);
      return tickets;
    },
    {
      refreshOnWindowFocus: true,
    },
  );
  const pending = data.filter((ticket) => ticket.status === "open");
  useEffect(() => {
    if (!pending.length) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [pending.length, refresh]);
  return (
    <main className="guided-page">
      <div className="guided-intro">
        <Typography.Title level={2}>Akses Saya</Typography.Title>
        <p>
          {roles.length
            ? "Hak akses Anda merupakan gabungan dari seluruh peran yang dimiliki. Ajukan peran tambahan jika tugas Anda memerlukan akses lain."
            : "Akun Anda sudah siap. Ajukan akses sesuai tugas agar Anda dapat mulai bekerja."}
        </p>
      </div>
      <section className="guided-section">
        <Typography.Title level={3}>Peran Anda saat ini</Typography.Title>
        <RoleTags roles={roles} />
        {!!permissions.length && (
          <Collapse
            style={{ marginTop: 16 }}
            items={[
              {
                key: "permissions",
                label: `Hak akses gabungan (${permissions.length})`,
                children: <RoleCapabilitiesTable permissions={permissions} />,
              },
            ]}
          />
        )}
      </section>
      <div className="guided-actions" style={{ marginBottom: 24 }}>
        <Link to="/my-requests/new">
          <Button type="primary">
            {roles.length ? "Ajukan peran tambahan" : "Ajukan akses"}
          </Button>
        </Link>
        <Button onClick={refresh} loading={loading}>
          Perbarui status
        </Button>
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          title="Status pengajuan belum berhasil dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      )}
      <Skeleton loading={loading && !data.length}>
        {pending.map((ticket) => (
          <section className="guided-section" key={ticket.id}>
            <Typography.Title level={3}>{ticket.role_name}</Typography.Title>
            <TicketStatus ticket={ticket} />
            <p>
              Pengajuan terkirim. Super Admin akan meninjaunya. Anda dapat
              kembali ke halaman ini untuk memeriksa hasilnya.
            </p>
            <Link to={`/my-requests/${ticket.id}`}>Lihat pengajuan</Link>
          </section>
        ))}
        {!data.length && !error && (
          <section className="guided-section">
            <Typography.Title level={3}>Belum ada pengajuan</Typography.Title>
            <p>
              Pilih tugas yang ingin Anda kerjakan. Kami akan menunjukkan peran
              dan kemampuan yang sesuai sebelum Anda mengirim pengajuan.
            </p>
          </section>
        )}
        {!!data.length && (
          <>
            <Typography.Title level={3}>Riwayat pengajuan</Typography.Title>
            <ResponsiveTable<AccessTicket>
              listId="pages/AccessRequests/MyRequests/index:1"
              rowKey="id"
              dataSource={data}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: "Peran",
                  render: (_, ticket) => (
                    <Link to={`/my-requests/${ticket.id}`}>
                      {ticket.role_name}
                    </Link>
                  ),
                },
                {
                  title: "Status",
                  render: (_, ticket) => <TicketStatus ticket={ticket} />,
                },
                {
                  title: "Diajukan",
                  render: (_, ticket) =>
                    dayjs(ticket.created_at).format("DD MMM YYYY, HH:mm"),
                },
              ]}
            />
          </>
        )}
      </Skeleton>
    </main>
  );
}
