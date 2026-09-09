import { useState } from "react";
import { useRequest } from "ahooks";
import { Button, Card, Table, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getMyRequests } from "../../../api/services/access";
import RequestAccessModal from "../components/RequestAccessModal";
import type { AccessTicket } from "../../../types/model/access";
import TicketStatus from "../components/TicketStatus";

export default function MyRequestsPage() {
  const [open, setOpen] = useState(false);
  const { data = [], loading, refresh } = useRequest(getMyRequests);

  return (
    <div className="access-ticket-page" style={{ padding: 12 }}>
      <Card
        className="access-ticket-list-header"
        size="small"
        title={
          <Typography.Title level={4} style={{ margin: 0 }}>
            Permintaan Saya
          </Typography.Title>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          >
            Ajukan Akses
          </Button>
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
          scroll={{ x: 760 }}
          columns={[
            {
              title: "Nomor",
              dataIndex: "number",
              render: (value, row) => (
                <Link to={`/my-requests/${row.id}`}>{value}</Link>
              ),
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

      <RequestAccessModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={refresh}
      />
    </div>
  );
}
