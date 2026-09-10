import { ResponsiveDescriptions as Descriptions } from "../../../components/common/Responsive/ResponsiveDescriptions";
import { Alert, Typography } from "antd";
import dayjs from "dayjs";
import type { ReactElement } from "react";
import type { AccessTicket } from "../../../types/model/access";
import TicketStatus from "./TicketStatus";

export default function TicketDetails({
  ticket,
}: {
  ticket: AccessTicket;
}): ReactElement {
  return (
    <section style={{ minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Detail Permintaan: {ticket.role_name}
        </Typography.Title>
        <TicketStatus ticket={ticket} />
      </div>
      <Descriptions size="small" bordered column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Pemohon">
          <div style={{ overflowWrap: "anywhere" }}>
            <Typography.Text strong>
              {ticket.requester_name || "Nama tidak tersedia"}
            </Typography.Text>
            <div>
              <Typography.Text type="secondary">
                {ticket.requester_email || "Email tidak tersedia"}
              </Typography.Text>
            </div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Tanggal Pengajuan">
          {dayjs(ticket.created_at).format("DD MMM YYYY, HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Nomor Tiket" span={2}>
          <Typography.Text copyable>{ticket.number}</Typography.Text>
        </Descriptions.Item>
        {ticket.resolved_at && (
          <Descriptions.Item label="Ditinjau pada" span={2}>
            {dayjs(ticket.resolved_at).format("DD MMM YYYY, HH:mm")}
            {ticket.reviewer_name ? ` oleh ${ticket.reviewer_name}` : ""}
          </Descriptions.Item>
        )}
        {ticket.cancelled_at && (
          <Descriptions.Item label="Dibatalkan pada" span={2}>
            {dayjs(ticket.cancelled_at).format("DD MMM YYYY, HH:mm")}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Alasan Pengajuan" span={2}>
          <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {ticket.reason}
          </span>
        </Descriptions.Item>
      </Descriptions>
      {ticket.rejection_reason ? (
        <Alert
          type="error"
          showIcon
          title="Alasan Penolakan"
          description={
            <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {ticket.rejection_reason}
            </span>
          }
          style={{ marginTop: 20 }}
        />
      ) : null}
    </section>
  );
}
