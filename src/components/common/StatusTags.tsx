import { Tag } from "antd";
import type { ReactElement } from "react";

/** API flags arrive as booleans, 0/1 numbers, or are missing. */
type Flag = boolean | number | null | undefined;

/**
 * Shared status vocabulary. Use these instead of ad-hoc tags so the same
 * state always has the same label and color across the admin.
 */
export const STATUS_LABELS = {
  published: "Tayang",
  draft: "Draf",
  archived: "Diarsipkan",
  active: "Aktif",
  inactive: "Nonaktif",
  registrationOpen: "Pendaftaran dibuka",
  registrationClosed: "Pendaftaran ditutup",
  required: "Wajib",
} as const;

export function PublicationTag({
  published,
}: {
  published: Flag;
}): ReactElement {
  return (
    <Tag color={published ? "success" : "default"}>
      {published ? STATUS_LABELS.published : STATUS_LABELS.draft}
    </Tag>
  );
}

export function RegistrationTag({ open }: { open: Flag }): ReactElement {
  return (
    <Tag color={open ? "processing" : "default"}>
      {open ? STATUS_LABELS.registrationOpen : STATUS_LABELS.registrationClosed}
    </Tag>
  );
}

export function ActiveTag({ active }: { active: Flag }): ReactElement {
  return (
    <Tag color={active ? "success" : "default"}>
      {active ? STATUS_LABELS.active : STATUS_LABELS.inactive}
    </Tag>
  );
}

export function RequiredTag(): ReactElement {
  return <Tag color="blue">{STATUS_LABELS.required}</Tag>;
}

const REGISTRATION_STATUS_COLORS: Record<string, string> = {
  DITERIMA: "green",
  "LULUS KEGIATAN": "purple",
  TERDAFTAR: "blue",
  MENUNGGU: "gold",
  DITOLAK: "red",
  "TIDAK DITERIMA": "red",
  "TIDAK LULUS": "red",
};

/** Activity registration status, as returned by the API (e.g. "Diterima"). */
export function RegistrationStatusTag({
  status,
}: {
  status: string;
}): ReactElement {
  const color = REGISTRATION_STATUS_COLORS[status?.toUpperCase()] ?? "default";
  return <Tag color={color}>{status}</Tag>;
}
