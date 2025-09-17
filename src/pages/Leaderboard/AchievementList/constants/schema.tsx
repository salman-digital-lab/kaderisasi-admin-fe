import { TableProps } from "antd/es/table/InternalTable";
import dayjs from "dayjs";
import { Button, Tag } from "antd";
import { Link } from "react-router-dom";
import { ArrowRightOutlined } from "@ant-design/icons";
import {
  renderAchievementStatus,
  renderAchievementStatusColor,
  renderAchievementType,
} from "../../../../constants/render";
import { Achievement } from "../../../../types/model/achievements";

export const TABLE_SCHEMA: TableProps<Achievement>["columns"] = [
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
