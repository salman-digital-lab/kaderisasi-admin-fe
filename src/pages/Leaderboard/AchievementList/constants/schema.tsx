import type { TableProps } from "antd";
import dayjs from "dayjs";
import { Button, Tag } from "antd";
import { Link } from "react-router-dom";
import { ArrowRightOutlined } from "@ant-design/icons";
import {
  renderAchievementStatus,
  renderAchievementStatusColor,
  renderAchievementType,
} from "../../../../constants/render";
import type { Achievement } from "../../../../types/model/achievements";
import type {
  AchievementSortBy,
  SortOrder,
} from "../../../../types/services/achievement";

const getSortOrder = (
  columnKey: AchievementSortBy,
  sortBy?: AchievementSortBy,
  sortOrder?: SortOrder,
) => {
  if (columnKey !== sortBy) {
    return null;
  }

  return sortOrder === "asc" ? "ascend" : "descend";
};

export const TABLE_SCHEMA = (
  sortBy?: AchievementSortBy,
  sortOrder?: SortOrder,
): TableProps<Achievement>["columns"] => [
  {
    title: "Nama Prestasi",
    dataIndex: "name",
  },
  {
    title: "Nama",
    dataIndex: ["user", "profile", "name"],
    render: (_, record) => record.user?.profile?.name || "-",
  },
  {
    title: "Email",
    dataIndex: ["user", "email"],
    render: (_, record) => record.user?.email || "-",
  },
  {
    title: "Kategori",
    dataIndex: "type",
    render: (value) => renderAchievementType(value),
  },
  {
    title: "Tanggal Dibuat",
    dataIndex: "created_at",
    key: "created_at",
    sorter: true,
    sortDirections: ["ascend", "descend"],
    sortOrder: getSortOrder("created_at", sortBy, sortOrder),
    render: (value) => dayjs(value).locale("id").format("DD MMMM YYYY"),
  },
  {
    title: "Tanggal Prestasi",
    dataIndex: "achievement_date",
    key: "achievement_date",
    sorter: true,
    sortDirections: ["ascend", "descend"],
    sortOrder: getSortOrder("achievement_date", sortBy, sortOrder),
    render: (value) => dayjs(value).locale("id").format("DD MMMM YYYY"),
  },
  {
    title: "Status",
    dataIndex: "status",
    render: (value) => (
      <Tag color={renderAchievementStatusColor(value)}>
        {renderAchievementStatus(value)}
      </Tag>
    ),
  },
  {
    title: "Aksi",
    key: "action",
    render: (_, record) => (
      <Button>
        <Link to={`/achievement/${record.id}`}>
          <ArrowRightOutlined /> Detail
        </Link>
      </Button>
    ),
  },
];
