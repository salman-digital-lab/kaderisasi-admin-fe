import { ResponsiveTable as Table } from "../../../components/common/Responsive/ResponsiveTable";
import { useRequest } from "ahooks";
import { Segmented } from "antd";
import { Link } from "react-router-dom";
import { useState } from "react";
import dayjs from "dayjs";
import { getReviewTickets } from "../../../api/services/access";
import type { AccessTicket } from "../../../types/model/access";
import TicketStatus from "../components/TicketStatus";
import PageHeader from "../../../components/common/PageHeader";
import { NAV_LABELS } from "../../../constants/navigation";
import { DATE_TIME_FORMAT } from "../../../utils/date-format";

export default function ReviewInboxPage() {
  const [status, setStatus] = useState<string>("open");
  const { data = [], loading } = useRequest(
    () => getReviewTickets(status || undefined),
    { refreshDeps: [status] },
  );
  return (
    <div className="access-ticket-page page-container">
      <PageHeader
        title={NAV_LABELS.ticketReview}
        description="Tinjau pengajuan akses dari admin lain."
        extra={
          <Segmented
            aria-label="Filter status permintaan"
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
      />
      <div>
        <Table<AccessTicket>
          listId="pages/AccessRequests/ReviewInbox/index:1"
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
              render: (value: string) => dayjs(value).format(DATE_TIME_FORMAT),
            },
          ]}
        />
      </div>
    </div>
  );
}
