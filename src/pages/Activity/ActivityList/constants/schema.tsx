import { Link } from "react-router-dom";
import { TableProps, Tag, Tooltip, Typography, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

import {
  renderActivityCategory,
  renderActivityType,
} from "../../../../constants/render";
import { Activity } from "../../../../types/model/activity";

const { Text } = Typography;

export const TABLE_SCHEMA: TableProps<Activity>["columns"] = [
  {
    title: "Judul Aktivitas/Kegiatan",
    dataIndex: "name",
    key: "name",
    render: (name) => (
      <Text
        ellipsis={{ tooltip: name }}
        style={{
          fontWeight: 500,
        }}
      >
        {name}
      </Text>
    ),
    width: 200,
  },
  {
    title: "Tipe Aktivitas",
    dataIndex: "activity_type",
    width: 150,
    render: (value) => (
      <Tooltip title={`Tipe: ${value}`}>{renderActivityType(value)}</Tooltip>
    ),
  },
  {
    title: "Kategori Aktivitas",
    dataIndex: "activity_category",
    width: 150,
    render: (value) => (
      <Tooltip title={`Kategori: ${value}`}>
        {renderActivityCategory(value)}
      </Tooltip>
    ),
  },
  {
    title: "Status Publikasi",
    dataIndex: "is_published",
    width: 140,
    render: (value) => {
      const isPublished = value === 1;
      return (
        <Tooltip
          title={
            isPublished
              ? "Kegiatan ditampilkan di website"
              : "Kegiatan tidak ditampilkan di website"
          }
        >
          <Tag
            color={isPublished ? "success" : "default"}
            style={{
              borderRadius: "6px",
              fontWeight: 500,
              border: "none",
              cursor: "help",
            }}
          >
            {isPublished ? "Dipublikasi" : "Draft"}
          </Tag>
        </Tooltip>
      );
    },
  },
  {
    title: "Aksi",
    key: "actions",
    width: 80,
    fixed: "right",
    render: (_, record) => (
      <Tooltip title="Edit aktivitas">
        <Link to={`/activity/${record.id}/edit`}>
          <Button icon={<EditOutlined />}>
            Ubah
          </Button>
        </Link>
      </Tooltip>
    ),
  },
];
