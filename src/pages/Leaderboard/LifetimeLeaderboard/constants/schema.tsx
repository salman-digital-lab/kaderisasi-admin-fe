import { TableProps, Tag, Typography } from "antd";
import { LifetimeLeaderboardType } from "../../../../types/services/leaderboard";

export const TABLE_SCHEMA: TableProps<
  LifetimeLeaderboardType & { rank: number }
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
