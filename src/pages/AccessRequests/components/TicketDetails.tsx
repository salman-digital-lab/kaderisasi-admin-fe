import { ResponsiveDescriptions as Descriptions } from "../../../components/common/Responsive/ResponsiveDescriptions";
import { Alert, Typography } from "antd";
import dayjs from "dayjs";
import type { ReactElement } from "react";
import type { AccessTicket } from "../../../types/model/access";
import TicketStatus from "./TicketStatus";
import { DATE_TIME_FORMAT } from "../../../utils/date-format";

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
      <Descriptions
        size="small"
        bordered
        column={{ xs: 1, sm: 2 }}
        items={[
          {
            key: "requester",
            label: "Pemohon",
            children: (
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
            ),
          },
          {
            key: "created",
            label: "Tanggal Pengajuan",
            children: dayjs(ticket.created_at).format(DATE_TIME_FORMAT),
          },
          {
            key: "number",
            label: "Nomor Tiket",
            span: 2,
            children: (
              <Typography.Text copyable>{ticket.number}</Typography.Text>
            ),
          },
          ...(ticket.resolved_at
            ? [
                {
                  key: "resolved",
                  label: "Ditinjau pada",
                  span: 2,
                  children: `${dayjs(ticket.resolved_at).format(DATE_TIME_FORMAT)}${ticket.reviewer_name ? ` oleh ${ticket.reviewer_name}` : ""}`,
                },
              ]
            : []),
          ...(ticket.cancelled_at
            ? [
                {
                  key: "cancelled",
                  label: "Dibatalkan pada",
                  span: 2,
                  children: dayjs(ticket.cancelled_at).format(DATE_TIME_FORMAT),
                },
              ]
            : []),
          {
            key: "reason",
            label: "Alasan Pengajuan",
            span: 2,
            children: (
              <span
                style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {ticket.reason}
              </span>
            ),
          },
        ]}
      />
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
