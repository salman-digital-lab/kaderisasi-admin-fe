import { TableProps, Tag } from "antd";
import dayjs from "dayjs";
import { MonthlyLeaderboardType } from "../../../../types/services/leaderboard";

export const TABLE_SCHEMA: TableProps<MonthlyLeaderboardType & { rank: number }>["columns"] = [
  {
    title: "Peringkat",
    dataIndex: "rank",
    width: 80,
    render: (value) => (
      <Tag color={value <= 3 ? (value === 1 ? "gold" : value === 2 ? "silver" : "orange") : "default"}>
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
    title: "Universitas",
    dataIndex: ["user", "profile", "university", "name"],
    render: (value) => value || "-",
  },
  {
    title: "Bulan",
    dataIndex: "month",
    render: (value) => dayjs(value).locale("id").format("MMMM YYYY"),
  },
  {
    title: "Total Skor",
    dataIndex: "score",
    render: (value) => (
      <Tag color="blue" style={{ fontSize: "14px", fontWeight: "bold" }}>
        {value}
      </Tag>
    ),
  },
  {
    title: "Skor Akademik",
    dataIndex: "score_academic",
    render: (value) => <span style={{ color: "#52c41a" }}>{value}</span>,
  },
  {
    title: "Skor Kompetisi",
    dataIndex: "score_competition",
    render: (value) => <span style={{ color: "#1890ff" }}>{value}</span>,
  },
  {
    title: "Skor Organisasi",
    dataIndex: "score_organizational",
    render: (value) => <span style={{ color: "#fa8c16" }}>{value}</span>,
  },
];
