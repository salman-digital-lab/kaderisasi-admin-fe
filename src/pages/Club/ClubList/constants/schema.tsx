import { Link } from "react-router-dom";
import { Button, Space, Tag } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { TableProps } from "antd";

import {
  CLUB_TYPE_LABELS,
  type Club,
  type ClubType,
} from "../../../../types/model/club";

const CLUB_TYPE_COLORS: Record<ClubType, string> = {
  UNIT: "blue",
  CLUB_KEPROFESIAN: "magenta",
  CLUB_BAHASA: "cyan",
  AVISMAN_REGIONAL: "purple",
};

const getNextAction = (
  club: Club,
): { label: string; section: "overview" | "people" } => {
  if (!club.is_show) {
    return { label: "Lanjutkan Pengaturan", section: "overview" };
  }

  if (club.is_registration_open) {
    return { label: "Kelola Pendaftar", section: "people" };
  }

  return { label: "Kelola Klub", section: "overview" };
};

export const createTableSchema = (): TableProps<Club>["columns"] => [
  {
    title: "Klub",
    dataIndex: "name",
    key: "name",
    render: (name, record) => (
      <Space direction="vertical" size={2}>
        <Link to={`/club/${record.id}?section=overview`}>{name}</Link>
        <Tag color={CLUB_TYPE_COLORS[record.club_type]}>
          {CLUB_TYPE_LABELS[record.club_type]}
        </Tag>
      </Space>
    ),
    width: 240,
  },
  {
    title: "Periode",
    key: "period",
    width: 180,
    render: (_, record) => {
      if (!record.start_period && !record.end_period) return "Belum ditentukan";
      const start = record.start_period
        ? dayjs(record.start_period).format("MMM YYYY")
        : "-";
      const end = record.end_period
        ? dayjs(record.end_period).format("MMM YYYY")
        : "-";
      return `${start} – ${end}`;
    },
  },
  {
    title: "Status Publik",
    dataIndex: "is_show",
    key: "is_show",
    width: 130,
    render: (isShow) => (
      <Tag color={isShow ? "success" : "default"}>
        {isShow ? "Tayang" : "Draf"}
      </Tag>
    ),
  },
  {
    title: "Pendaftaran",
    dataIndex: "is_registration_open",
    key: "is_registration_open",
    width: 160,
    render: (isOpen) => (
      <Tag color={isOpen ? "processing" : "default"}>
        {isOpen ? "Dibuka" : "Ditutup"}
      </Tag>
    ),
  },
  {
    title: "Langkah Berikutnya",
    key: "next-action",
    width: 210,
    render: (_, record) => {
      const action = getNextAction(record);
      return (
        <Link to={`/club/${record.id}?section=${action.section}`}>
          <Button icon={<ArrowRightOutlined />} size="small">
            {action.label}
          </Button>
        </Link>
      );
    },
  },
];
