import { useRequest } from "ahooks";
import { Card, Segmented, Table, Typography } from "antd";
import { Link } from "react-router-dom";
import { useState } from "react";
import dayjs from "dayjs";
import { getReviewTickets } from "../../../api/services/access";
import type { AccessTicket } from "../../../types/model/access";
import TicketStatus from "../components/TicketStatus";

export default function ReviewInboxPage() {
  const [status, setStatus] = useState<string>("open");
  const { data = [], loading } = useRequest(
    () => getReviewTickets(status || undefined),
    { refreshDeps: [status] },
  );
  return (
    <div className="access-ticket-page" style={{ padding: 12 }}>
      <Card
        className="access-ticket-list-header"
        size="small"
        title={
          <Typography.Title level={4} style={{ margin: 0 }}>
            Tinjau Permintaan
          </Typography.Title>
        }
        extra={
          <Segmented
            value={status}
            onChange={(value) => setStatus(String(value))}
            options={[
              { label: "Menunggu", value: "open" },
              { label: "Dibatalkan", value: "cancelled" },
              { label: "Selesai", value: "resolved" },
              { label: "Semua", value: "" },
            ]}
          />
        }
        styles={{
          header: { padding: 0, minHeight: 32 },
          body: { display: "none" },
        }}
      />
      <div style={{ marginTop: 12 }}>
        <Table<AccessTicket>
          rowKey="id"
          size="small"
          bordered
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `Menampilkan ${range[0]}-${range[1]} dari ${total} permintaan`,
          }}
          loading={loading}
          dataSource={data}
          scroll={{ x: 900 }}
          columns={[
            {
              title: "Nomor",
              dataIndex: "number",
              render: (value, row) => (
                <Link to={`/ticket-review/${row.id}`}>{value}</Link>
              ),
            },
            {
              title: "Pemohon",
              render: (_, row) =>
                `${row.requester_name} (${row.requester_email})`,
            },
            {
              title: "Peran yang Diminta",
              render: (_, row) => row.role_name,
            },
            {
              title: "Status",
              render: (_, row) => <TicketStatus ticket={row} />,
            },
            {
              title: "Dibuat",
              dataIndex: "created_at",
              render: (value: string) =>
                dayjs(value).format("DD MMM YYYY HH:mm"),
            },
          ]}
        />
      </div>
    </div>
  );
}
