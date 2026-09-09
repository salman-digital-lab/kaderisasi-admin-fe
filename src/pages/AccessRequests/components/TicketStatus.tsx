import { Tag } from "antd";
import type { AccessTicket } from "../../../types/model/access";

const colors: Record<AccessTicket["status"], string> = {
  open: "blue",
  resolved: "green",
  cancelled: "default",
};

export default function TicketStatus({ ticket }: { ticket: AccessTicket }) {
  const labels = {
    open: "Menunggu",
    resolved: "Selesai",
    cancelled: "Dibatalkan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  const label = labels[ticket.resolution ?? ticket.status];
  const color =
    ticket.resolution === "rejected" ? "red" : colors[ticket.status];
  return <Tag color={color}>{label}</Tag>;
}
