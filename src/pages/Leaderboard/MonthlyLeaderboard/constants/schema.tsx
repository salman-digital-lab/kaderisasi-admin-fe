import { TableProps, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { MonthlyLeaderboardType } from "../../../../types/services/leaderboard";
import { MONTH_FORMAT } from "../../../../utils/date-format";

export const TABLE_SCHEMA: TableProps<
  MonthlyLeaderboardType & { rank: number }
>["columns"] = [
  {
    title: "Peringkat",
    dataIndex: "rank",
    width: 80,
    render: (value) => (
      <Tag
        color={
          value <= 3
            ? value === 1
              ? "gold"
              : value === 2
                ? "silver"
                : "orange"
            : "default"
        }
      >
        #{value}
      </Tag>
    ),
  },
  {
    title: "Nama",
    dataIndex: ["user", "profile", "name"],
    render: (value) => value || "-",
  },
  {
    title: "Email",
    dataIndex: ["user", "email"],
  },
  {
    title: "WhatsApp",
    dataIndex: ["user", "profile", "whatsapp"],
    render: (value) => value || "-",
  },
  {
    title: "Universitas",
    dataIndex: ["user", "profile", "university", "name"],
    render: (value) => value || "-",
  },
  {
    title: "Bulan",
    dataIndex: "month",
    render: (value) => dayjs(value).format(MONTH_FORMAT),
  },
  {
    title: "Total Skor",
    dataIndex: "score",
    align: "right",
    render: (value) => <Typography.Text strong>{value}</Typography.Text>,
  },
  {
    title: "Skor Akademik",
    dataIndex: "score_academic",
    align: "right",
  },
  {
    title: "Skor Kompetisi",
    dataIndex: "score_competition",
    align: "right",
  },
  {
    title: "Skor Organisasi",
    dataIndex: "score_organizational",
    align: "right",
  },
];
